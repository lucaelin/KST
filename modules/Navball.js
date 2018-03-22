import * as THREE from '/node_modules/three/build/three.module.js';
import Renderer from './Navball/Renderer.js';
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

class NavIndicator {
  constructor(texture, renderer) {
    let map = new THREE.TextureLoader().load(texture);
    let mat = new THREE.SpriteMaterial({map: map});
    this.sprite = new THREE.Sprite(mat);
    this.sprite.scale.set(15, 15, 1);
    this.sprite.position.set(0, 0, -50);
    renderer.indicators.add(this.sprite);
  }
  get position() {
    return this.sprite.position;
  }
  set position(position) {
    let length = Math.sqrt(position.map((e)=>Math.pow(e, 2)).reduce((a, b)=>a+b));
    let [x, y, z] = position.map((e)=>(e/length)*50);
    this.sprite.position.set(y, x, -z);
  }
  get visible() {
    return this.sprite.visible;
  }
  set visible(v) {
    this.sprite.visible = v;
  }
}

export default class Navball extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({mode: 'open'});

    this.shadow.appendChild(style.cloneNode(true));

    this.renderer = new Renderer();

    this.shadow.appendChild(this.renderer.renderer.domElement);

    this.indicators = {
      surfacePrograde: new NavIndicator('/img/indicators/surfacepro.png', this.renderer),
      surfaceRetrograde: new NavIndicator('/img/indicators/surfaceretro.png', this.renderer),
      prograde: new NavIndicator('/img/indicators/prograde.png', this.renderer),
      radial: new NavIndicator('/img/indicators/radial.png', this.renderer),
      normal: new NavIndicator('/img/indicators/normal.png', this.renderer),
      retrograde: new NavIndicator('/img/indicators/retrograde.png', this.renderer),
      radialout: new NavIndicator('/img/indicators/radialout.png', this.renderer),
      antinormal: new NavIndicator('/img/indicators/antinormal.png', this.renderer),
      target: new NavIndicator('/img/indicators/target.png', this.renderer),
      antitarget: new NavIndicator('/img/indicators/antitarget.png', this.renderer),
      targetPrograde: new NavIndicator('/img/indicators/prograde.png', this.renderer),
      targetRetrograde: new NavIndicator('/img/indicators/retrograde.png', this.renderer),
      maneuver: new NavIndicator('/img/indicators/maneuver.png', this.renderer),
    };

    this.renderer.addGuiElement('/img/indicators/level.png', 512/10, 256/10);

    this.paths = [];

    this.setManeuverIndicator(false);
    this.setTargetIndicators(false);
    this.renderer.update();
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

    this.addPath(v, 'control.throttle', (t)=>this.setThrottle(t));
    this.addPath(v, 'control.speedMode', (m)=>this.setMode(m));
    this.addPath(new Path(v, 'control.nodes.0', (n)=>n?n:{}), ['value.deltaV','value.remainingDeltaV'], ([dv, rdv])=>this.setDeltaV(rdv / dv));
    this.addPath(new MultiPath(v, [
      'surfaceReferenceFrame',
      'orbit.body.referenceFrame',
      'orbit'
    ], async ([sRF, bRF])=>{
      if(!(sRF && bRF)) return;
      return await v.flight(await bRF.constructor.CreateHybrid(bRF, sRF));
    }), ['value.rotation', 'value.velocity', 'value.prograde', 'value.normal'], ([r, v, p, n])=>{
      if(r) this.setRotation(r);
      if(v) this.setSurfaceIndicators(v);
      if(p && n) this.setOrbitalIndicators(p, n);
    });

    // TODO: node remaining burn vector indication
    // TODO: target detection and rf creation for prograde and retrograde
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

  setThrottle(throttle) {
    if(!Number.isFinite(throttle)) return;
    throttle = Math.min(1, Math.max(throttle, 0));
    this.renderer.setSlider(0,throttle);
    this.renderer.needsUpdate = true;
  }
  setDeltaV(dV) {
    if(!Number.isFinite(dV)) return;
    dV = Math.min(1, Math.max(dV, 0));
    this.renderer.setSlider(1,dV);
    this.renderer.needsUpdate = true;
  }
  setRotation(rotation) {
    let [x, z, y, w] = rotation;
    let quat = new THREE.Quaternion(x, -y, z, -w);
    quat.multiply(new THREE.Quaternion(0, 0.000, -.707, .707));
    quat.multiply(new THREE.Quaternion(0, -.707, 0.000, .707));
    this.renderer.setRotation(quat);

    this.renderer.needsUpdate = true;
  }
  setOrbitalIndicators(prograde, normal) {
    function crossProduct(a, b) {
      return [
        a[1]*b[2]-a[2]*b[1],
        a[2]*b[0]-a[0]*b[2],
        a[0]*b[1]-a[1]*b[0],
      ];
    }

    let retrograde = prograde.map((e)=>-e);
    let antinormal = normal.map((e)=>-e);
    let radial = crossProduct(prograde, normal);
    let radialout = radial.map((e)=>-e);

    this.indicators.prograde.position = prograde;
    this.indicators.normal.position = normal;
    this.indicators.radial.position = radial;

    this.indicators.retrograde.position = retrograde;
    this.indicators.antinormal.position = antinormal;
    this.indicators.radialout.position = radialout;

    this.renderer.needsUpdate = true;
  }
  setSurfaceIndicators(prograde) {
    this.indicators.surfacePrograde.position = prograde;
    this.indicators.surfaceRetrograde.position = prograde.map((e)=>-e);

    this.renderer.needsUpdate = true;
  }
  setTargetIndicators(target, prograde, orientation) {
    this.indicators.target.visible = !!target;
    this.indicators.antitarget.visible = !!target;
    if (target) {
      let antitarget = target.map((e)=>-e);
      let retrograde = prograde.map((e)=>-e);

      this.indicators.target.position = target;
      this.indicators.antitarget.position = antitarget;
      this.indicators.targetPrograde.position = prograde;
      this.indicators.targetRetrograde.position = retrograde;

      // TODO: docking alignment orientation
      orientation;
    }

    this.renderer.needsUpdate = true;
  }
  setManeuverIndicator(direction) {
    this.indicators.maneuver.visible = !!direction;
    if (direction) this.indicators.maneuver.position = direction;

    this.renderer.needsUpdate = true;
  }
  setMode(mode) {
    this.indicators.surfacePrograde.visible = false;
    this.indicators.surfaceRetrograde.visible = false;

    this.indicators.prograde.visible = false;
    this.indicators.normal.visible = false;
    this.indicators.radial.visible = false;

    this.indicators.retrograde.visible = false;
    this.indicators.antinormal.visible = false;
    this.indicators.radialout.visible = false;

    this.indicators.targetPrograde.visible = false;
    this.indicators.targetRetrograde.visible = false;

    switch(mode) {
    case 'Surface':
      this.indicators.surfacePrograde.visible = true;
      this.indicators.surfaceRetrograde.visible = true;
      break;
    case 'Orbit':
      this.indicators.prograde.visible = true;
      this.indicators.normal.visible = true;
      this.indicators.radial.visible = true;

      this.indicators.retrograde.visible = true;
      this.indicators.antinormal.visible = true;
      this.indicators.radialout.visible = true;
      break;
    case 'Target':
      this.indicators.targetPrograde.visible = true;
      this.indicators.targetRetrograde.visible = true;
      break;
    }

    this.renderer.needsUpdate = true;
  }

  disconnectedCallback() {
    this.connected = false;
    this.removePaths();
  }
  connectedCallback() {
    this.connected = true;
    this.renderer.resize();
    if(this.vessel) this.setupPaths(this.vessel);
  }
  adoptedCallback() {
    this.renderer.resize();
  }
}

customElements.define('kst-navball', Navball);
