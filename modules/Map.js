const style = document.createElement('style');
style.textContent = `
  :host {
    display: block;
  }
`;

export default class Map extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({mode: 'open'});

    this.shadow.appendChild(style.cloneNode(true));

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.shadow.appendChild(this.canvas);

    this.resize();
    window.addEventListener('resize', ()=>this.resize());

    this.rotation = -45*Math.PI/180;

    this._body = {
      obj: {
        equatorialRadius: Promise.resolve(600000),
        name: Promise.resolve('Kerbin'),
      },
      streams: [],
    };
    this._orbit = {
      obj: {
        body: Promise.resolve(this.body),
        semiMajorAxis: Promise.resolve(700000),
        semiMinorAxis: Promise.resolve(700000),
        eccentricity: Promise.resolve(0),
        trueAnomaly: Promise.resolve(Math.PI / 2),
      },
      streams: [],
    };
    this._vessel = {
      obj: {
        orbit: Promise.resolve(this.orbit),
      },
      streams: [],
    };
    this.update();
  }

  get client() {
    return this._client.obj;
  }
  set client(c) {
    this.removeStreams(this._client);

    this._client = {
      obj: c,
      streams: [
        c.services.spaceCenter.stream('activeVessel', (v)=>this.vessel = v), // TODO: catch gamescene error
      ],
    };
  }

  get vessel() {
    return this._vessel.obj;
  }
  set vessel(v) {
    this.removeStreams(this._vessel);

    this._vessel = {
      obj: v,
      streams: [
        v.stream('orbit', (o)=>this.orbit = o),
      ],
    };
  }

  get orbit() {
    return this._orbit.obj;
  }
  set orbit(o) {
    this.removeStreams(this._orbit);

    this._orbit = {
      obj: o,
      streams: [
        o.stream('body', (b)=>this.body = b),
        o.stream('semiMajorAxis'),
        o.stream('semiMinorAxis'),
        o.stream('eccentricity'),
        o.stream('trueAnomaly'),
      ],
    };
  }

  get body() {
    return this._body.obj;
  }
  set body(b) {
    this.removeStreams(this._body);

    this._body = {
      obj: b,
      streams: [
        b.stream('equatorialRadius'),
        b.stream('name'),
      ],
    };
  }

  async removeStreams(obj) {
    if(obj && obj.streams) {
      let streams = obj.streams;
      obj.streams = [];
      await Promise.all(streams.map(async (s)=>{
        await (await s).remove();
      }));
    }
  }

  resize() {
    this.canvas.style.width = window.innerWidth * 0.4 + 'px';
    this.canvas.style.height = window.innerWidth * 0.4 + 'px';
    this.canvas.width = window.innerWidth * 0.4 * window.devicePixelRatio;
    this.canvas.height = window.innerWidth * 0.4 * window.devicePixelRatio;
  }

  async vesselRadius() {
    let n = 1 - Math.pow(await this.orbit.eccentricity, 2);
    let d = 1 + await this.orbit.eccentricity * Math.cos(await this.orbit.trueAnomaly);
    return await this.orbit.semiMajorAxis * n / d;
  }

  async getHeight(h) {
    let scale = Math.max(await this.body.equatorialRadius, await this.orbit.semiMajorAxis) * 2;
    return (this.canvas.height - 12) / scale * await h;
  }

  async update() {
    let [sMa, sma, e, r, va, vr, body] = await Promise.all([
      this.getHeight(this.orbit.semiMajorAxis),
      this.getHeight(this.orbit.semiMinorAxis),
      this.orbit.eccentricity,
      this.getHeight(this.body.equatorialRadius),
      this.orbit.trueAnomaly,
      this.getHeight(this.vesselRadius()),
      this.body.name,
    ]);
    let data = {sMa, sma, e, r, va, vr, body};

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
    this.ctx.rotate(this.rotation);

    [this.drawOrbit, this.drawBody, this.drawVessel].forEach((f)=>{
      this.ctx.save();
      try {
        f.call(this, data);
      } catch(e) {
        console.error(e);
      }
      this.ctx.restore();
    });

    this.ctx.restore();

    window.requestAnimationFrame(()=>this.update());
  }
  drawBody({sMa, e, r, body}) {
    this.ctx.beginPath();
    this.ctx.arc(0, sMa * e, r, 0, 2*Math.PI);
    this.ctx.closePath();
    this.ctx.fillStyle = '#003e56';
    this.ctx.fill();
    // Shade Body
    if(sMa * e) {
      var gradient = this.ctx.createRadialGradient(0, 0, 0, 0, sMa * e, r);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }

    this.ctx.save();
    this.ctx.translate(0, sMa * e);
    this.ctx.rotate(-this.rotation);
    this.ctx.font = (r / body.length) + 'px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(body, 0, 0);
    this.ctx.restore();
  }
  drawOrbit({sma, sMa}) {
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, sma, sMa, 0, 0, 2*Math.PI);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(80,80,80,.2)';
    this.ctx.fill();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#04e0e1';
    this.ctx.stroke();
  }
  drawVessel({sMa, e, va, vr}) {
    this.ctx.translate(0, sMa * e);
    this.ctx.rotate(-va);
    this.ctx.beginPath();
    this.ctx.arc(0, vr, 5, 0, 2*Math.PI);
    this.ctx.closePath();
    this.ctx.fillStyle = '#fff';
    this.ctx.fill();
  }

  disconnectedCallback() {
    this.removeStreams(this._client);
    this.removeStreams(this._vessel);
    this.removeStreams(this._orbit);
    this.removeStreams(this._body);
  }
  connectedCallback() {
    if(this._client) this.client = this._client.obj;
    if(this._vessel) this.vessel = this._vessel.obj;
  }
}

customElements.define('kst-map', Map);
