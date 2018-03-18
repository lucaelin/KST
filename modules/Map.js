const style = document.createElement('style');
style.textContent = `
  :host {
    display: block;
    width: 100%;
  }
  canvas {
    width: 100% !important;
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

    //this.resize();
    window.addEventListener('resize', ()=>this.resize());

    this.rotation = -45*Math.PI/180;

    this._body = {
      obj: {
        equatorialRadius: Promise.resolve(600000),
        name: Promise.resolve('Kerbin'),
        sphereOfInfluence: Promise.resolve(84159271),
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
    if(!(this.canvas.parentNode && this.canvas.clientWidth > 0)) return window.requestAnimationFrame(()=>this.resize());
    this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.clientWidth * window.devicePixelRatio;
  }

  async vesselRadius(anomaly) {
    if(typeof anomaly === 'undefined') anomaly = await this.orbit.trueAnomaly;
    let n = 1 - Math.pow(await this.orbit.eccentricity, 2);
    let d = 1 + await this.orbit.eccentricity * Math.cos(anomaly);
    return await this.orbit.semiMajorAxis * n / d;
  }

  async getHeight(h) {
    let apoapsis = (1 + await this.orbit.eccentricity) * await this.orbit.semiMajorAxis;
    if(apoapsis < 0) apoapsis = Infinity;
    let scale = Math.min(await this.body.sphereOfInfluence, Math.max(await this.body.equatorialRadius, apoapsis)) * 2;
    return (this.canvas.height - 12) / scale * await h;
  }

  async update() {
    let [one, sMa, sma, e, r, va, vr, body, soi] = await Promise.all([
      this.getHeight(1),
      this.getHeight(this.orbit.semiMajorAxis),
      this.getHeight(this.orbit.semiMinorAxis),
      this.orbit.eccentricity,
      this.getHeight(this.body.equatorialRadius),
      this.orbit.trueAnomaly,
      this.getHeight(this.vesselRadius()),
      this.body.name,
      this.getHeight(this.body.sphereOfInfluence),
    ]);
    let data = {one, sMa, sma, e, r, va, vr, body, soi};

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
    this.ctx.rotate(this.rotation);

    [this.drawOrbit, this.drawHyperbola, this.drawBody, this.drawSOI, this.drawVessel].forEach((f)=>{
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
    this.ctx.arc(0, 0, r, 0, 2*Math.PI);
    this.ctx.closePath();
    this.ctx.fillStyle = this.getCSS('--primary-background');
    this.ctx.fill();
    // Shade Body
    if(sMa * e) {
      let gradient = this.ctx.createRadialGradient(0, -r/2, 0, 0, 0, r);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }

    this.ctx.save();
    this.ctx.rotate(-this.rotation);
    this.ctx.font = (r / body.length) + 'px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(body, 0, 0);
    this.ctx.restore();
  }
  drawOrbit({sma, sMa, e}) {
    if(e >= 1) return;
    this.ctx.beginPath();
    this.ctx.ellipse(0, -sMa * e, sma, sMa, 0, 0, 2*Math.PI);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(80,80,80,.2)';
    this.ctx.fill();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = this.getCSS('--primary');
    this.ctx.stroke();
  }
  drawHyperbola({soi, sMa, e}) {
    if(e < 1) return;

    let a = Math.abs(sMa);
    let c = Math.abs(e*sMa);
    let b = Math.sqrt(Math.pow(c,2)-Math.pow(a,2));

    this.ctx.moveTo(0, -Math.sqrt((1 + (Math.pow(0,2)/Math.pow(b,2))) * Math.pow(a,2)) - c);
    this.ctx.beginPath();
    for(let x = -soi; x<=soi; x++) {
      let y = Math.sqrt((1 + (Math.pow(x,2)/Math.pow(b,2))) * Math.pow(a,2)) - c;
      this.ctx.lineTo(x, -y);
    }
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = this.getCSS('--primary');
    this.ctx.stroke();
  }
  drawVessel({va, vr}) {
    this.ctx.translate(0, 0);
    this.ctx.rotate(-va);
    this.ctx.beginPath();
    this.ctx.arc(0, vr, 5, 0, 2*Math.PI);
    this.ctx.closePath();
    this.ctx.fillStyle = '#fff';
    this.ctx.fill();
  }
  drawSOI({sMa, soi}) {
    if(!Number.isFinite(soi)) return;

    this.ctx.beginPath();

    this.ctx.arc(0, 0, this.canvas.width, 0, 2*Math.PI);
    this.ctx.arc(0, 0, soi, 0, 2*Math.PI, true);
    this.ctx.clip();
    this.ctx.clearRect(-sMa*2, -sMa*2, sMa*4, sMa*4);
    this.ctx.closePath();
  }

  getCSS(prop) {
    return getComputedStyle(this).getPropertyValue(prop);
  }

  disconnectedCallback() {
    this.removeStreams(this._client);
    this.removeStreams(this._vessel);
    this.removeStreams(this._orbit);
    this.removeStreams(this._body);
  }
  connectedCallback() {
    this.resize();
    if(this._client) this.client = this._client.obj;
    if(this._vessel) this.vessel = this._vessel.obj;
  }
  adoptedCallback() {
    this.resize();
  }
}

customElements.define('kst-map', Map);
