import {Path, MultiPath} from './Path.js';

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

    this.paths = [];

    this.values = {
      semiMajorAxis: 700000,
      semiMinorAxis: 700000,
      eccentricity: 0,
      trueAnomaly: Math.PI / 2,
      equatorialRadius: 600000,
      name: '...loading...',
      sphereOfInfluence: 84159271
    };

    this.update();
  }

  get vessel() {
    return this._vessel;
  }
  set vessel(v) {
    this._vessel = v;
    if(this.connected) this.setupPaths(v);
  }

  removePaths() {
    this.paths.forEach((p)=>p.remove());
    this.paths = [];
  }

  setupPaths(v) {
    this.removePaths();

    this.addPath(v, 'orbit.semiMajorAxis', (v)=>this.values.semiMajorAxis=v);
    this.addPath(v, 'orbit.semiMinorAxis', (v)=>this.values.semiMinorAxis=v);
    this.addPath(v, 'orbit.eccentricity', (v)=>this.values.eccentricity=v);
    this.addPath(v, 'orbit.trueAnomaly', (v)=>this.values.trueAnomaly=v);
    this.addPath(v, 'orbit.body.equatorialRadius', (v)=>this.values.equatorialRadius=v);
    this.addPath(v, 'orbit.body.name', (v)=>this.values.name=v);
    this.addPath(v, 'orbit.body.sphereOfInfluence', (v)=>this.values.sphereOfInfluence=v);
  }

  addPath(target, path, callback) {
    let p;
    if(path instanceof Array) {
      p = new MultiPath(target, path);
    } else {
      p = new Path(target, path);
    }
    this.paths.push(p);
    p.stream('v', callback);
  }

  resize() {
    if(!(this.canvas.parentNode && this.canvas.clientWidth > 0))
      return window.requestAnimationFrame(()=>this.resize());
    this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.clientWidth * window.devicePixelRatio;
  }

  vesselRadius(anomaly) {
    if(typeof anomaly === 'undefined') anomaly = this.values.trueAnomaly;
    let n = 1 - Math.pow(this.values.eccentricity, 2);
    let d = 1 + this.values.eccentricity * Math.cos(anomaly);
    return this.values.semiMajorAxis * n / d;
  }

  getHeight(h) {
    let apoapsis = (1 + this.values.eccentricity) * this.values.semiMajorAxis;
    if(apoapsis < 0) apoapsis = Infinity;
    let scale = Math.min(this.values.sphereOfInfluence, Math.max(this.values.equatorialRadius, apoapsis)) * 2;
    return (this.canvas.height - 12) / scale * h;
  }

  async update() {
    let data = {
      one: this.getHeight(1),
      sMa: this.getHeight(this.values.semiMajorAxis),
      sma: this.getHeight(this.values.semiMinorAxis),
      e: this.values.eccentricity,
      r: this.getHeight(this.values.equatorialRadius),
      va: this.values.trueAnomaly,
      vr: this.getHeight(this.vesselRadius()),
      body: this.values.name,
      soi: this.getHeight(this.values.sphereOfInfluence),
    };

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
    this.connected = false;
    this.removePaths();
  }
  connectedCallback() {
    this.connected = true;
    this.resize();
    if(this.vessel) this.setupPaths(this.vessel);
  }
  adoptedCallback() {
    this.resize();
  }
}

customElements.define('kst-map', Map);
