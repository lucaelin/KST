export default class Map {
  get orbit() {
    return this._orbit;
  }
  set orbit(o) {
    // TODO: this._orbit remove streams (currently unsupported by library)
    this._orbit = o;
    o.stream('semiMajorAxis');
    o.stream('semiMinorAxis');
    o.stream('eccentricity');
    o.stream('trueAnomaly');
  }
  get body() {
    return this._body;
  }
  set body(b) {
    // TODO: this._body remove streams (currently unsupported by library)
    this._body = b;
    b.stream('equatorialRadius');
    b.stream('name');
  }

  constructor() {
    this.dom = document.createElement('canvas');
    this.ctx = this.dom.getContext('2d');

    this.resize();
    window.addEventListener('resize', ()=>this.resize());

    this.rotation = -45*Math.PI/180;

    this._orbit = {
      semiMajorAxis: Promise.resolve(700000),
      semiMinorAxis: Promise.resolve(700000),
      eccentricity: Promise.resolve(0),
      trueAnomaly: Promise.resolve(Math.PI / 2),
    };
    this._body = {
      equatorialRadius: Promise.resolve(600000),
      name: Promise.resolve('Kerbin'),
    };
    this.update();
  }

  resize() {
    this.dom.style.width = window.innerWidth * 0.4 + 'px';
    this.dom.style.height = window.innerWidth * 0.4 + 'px';
    this.dom.width = window.innerWidth * 0.4 * window.devicePixelRatio;
    this.dom.height = window.innerWidth * 0.4 * window.devicePixelRatio;
  }

  async vesselRadius() {
    let n = 1 - Math.pow(await this.orbit.eccentricity, 2);
    let d = 1 + await this.orbit.eccentricity * Math.cos(await this.orbit.trueAnomaly);
    return await this.orbit.semiMajorAxis * n / d;
  }

  async getHeight(h) {
    let scale = Math.max(await this.body.equatorialRadius, await this.orbit.semiMajorAxis) * 2;
    return (this.dom.height - 12) / scale * await h;
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

    this.ctx.clearRect(0, 0, this.dom.width, this.dom.height);
    this.ctx.save();
    this.ctx.translate(this.dom.width/2, this.dom.height/2);
    this.ctx.rotate(this.rotation);

    [this.drawOrbit, this.drawBody, this.drawVessel].forEach((f)=>{
      this.ctx.save();
      f.call(this, data);
      this.ctx.restore();
    });

    this.ctx.restore();
    window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>this.update()));
  }
  drawBody({sMa, e, r, body}) {
    this.ctx.beginPath();
    this.ctx.arc(0, sMa * e, r, 0, 2*Math.PI);
    this.ctx.closePath();
    this.ctx.fillStyle = '#003e56';
    this.ctx.fill();
    // Shade Body
    var gradient = this.ctx.createRadialGradient(0, 0, 0, 0, sMa * e, r);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

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
}
