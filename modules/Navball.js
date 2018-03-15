import * as THREE from '/node_modules/three/build/three.module.js';
import Renderer from './Navball/Renderer.js';

const style = document.createElement('style');
style.textContent = `
  :host {
    display: block;
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

    this.setManeuverIndicator(false);
    this.setTargetIndicator(false);
    this.setSurfaceMode(false);
    this.addEventListener('click', ()=>{
      this.setSurfaceMode(!this.surfaceMode);
    });
    this.addEventListener('touchstart', (e)=>{
      e.preventDefault();
      this.setSurfaceMode(!this.surfaceMode);
    });

    this.renderer.update();
  }

  get client() {
    return this._client.obj;
  }
  set client(c) {
    this.removeStreams(this._client);

    this._client = {
      obj: c,
      streams: [
        c.services.spaceCenter.stream('targetBody', (t)=>this.setTarget(t, 'Body')),
        c.services.spaceCenter.stream('targetVessel', (t)=>this.setTarget(t, 'Vessel')),
        c.services.spaceCenter.stream('targetDockingPort', (t)=>this.setTarget(t, 'DockingPort')),
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
        v.stream('control', (c)=>this.control = c),
        v.stream('orbit', (o)=>this.orbit = o),
      ],
    };
  }

  get control() {
    return this._control.obj;
  }
  set control(c) {
    this.removeStreams(this._control);

    this._control = {
      obj: c,
      streams: [
        c.stream('throttle', (t)=>this.setThrottle(t)),
        c.stream('nodes', (n)=>this.node = n[0]),
      ],
    };
  }

  get node() {
    return this._node.obj;
  }
  set node(n) {
    if(!this._node) {
      this._node = {
        obj: n,
        streams: [],
      };
    } else {
      this._node.obj = n;
    }

    if (n) {
      if (n !== this.currentNode) { // krpc streams nodes not only on change but on every tick
        this.currentNode = n;
        this.removeStreams(this._node);
        this._node.streams = [
          n.stream('deltaV', async (dV)=>this.setDeltaV(await n.remainingDeltaV / dV)),
          n.stream('remainingDeltaV', async (rDV)=>this.setDeltaV(rDV / await n.deltaV)),
          // n[0].stream('remainingBurnVector()', async (v)=>this.setManeuverIndicator(v)), // TODO: library need support for streamable functions
        ];
      }
    } else {
      this.removeStreams(this._node);
      this.setManeuverIndicator(false);
      this.setDeltaV(0);
    }
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
    return this._body;
  }
  set body(b) {
    this._body = b;

    (async ()=>{
      let rf = await b.referenceFrame;
      let h = await rf.createHybrid(await this.vessel.surfaceReferenceFrame);
      this.flight = await this.vessel.flight(h);
    })();
  }

  get flight() {
    return this._flight.obj;
  }
  set flight(f) {
    this.removeStreams(this._flight);

    this._flight = {
      obj: f,
      streams: [
        f.stream('rotation', (r)=>this.setRotation(r)),
        f.stream('velocity', (v)=>this.setSurfaceIndicators(v)),
        f.stream('prograde', async (p)=>this.setOrbitalIndicators(p, await f.normal)),
        f.stream('normal', async (n)=>this.setOrbitalIndicators(await f.prograde, n)),
      ],
    };
  }

  get target() {
    return this._target.obj;
  }
  set target(t) {
    this.removeStreams(this._target);

    this._target = {
      obj: t,
      streams: [],
    };
    if (t) {
      // t.stream('');
    }
  }
  setTarget(target, type) {
    if (this.taget && !target && this.target.className != type) return;
    this.target = target;
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

  setThrottle(throttle) {
    throttle = Math.min(1, Math.max(throttle, 0));
    this.renderer.setSlider(0,throttle);
    this.renderer.needsUpdate = true;
  }
  setDeltaV(dV) {
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
    let antitarget = target.map((e)=>-e);
    let retrograde = prograde.map((e)=>-e);

    this.indicators.target.position = target;
    this.indicators.antitarget.position = antitarget;
    this.indicators.targetPrograde.position = prograde;
    this.indicators.targetRetrograde.position = retrograde;

    // TODO: docking alignment orientation
    orientation;

    this.renderer.needsUpdate = true;
  }
  setManeuverIndicator(direction) {
    this.indicators.maneuver.visible = !!direction;
    if (direction) this.indicators.maneuver.position = direction;

    this.renderer.needsUpdate = true;
  }
  setTargetIndicator(direction) {
    this.indicators.target.visible = !!direction;
    this.indicators.antitarget.visible = !!direction;
    this.indicators.targetPrograde.visible = !!direction;
    this.indicators.targetRetrograde.visible = !!direction;
    if (direction) {
      this.indicators.target.position = direction;
      this.indicators.antitarget.position = direction;
      this.indicators.targetPrograde.position = direction;
      this.indicators.targetRetrograde.position = direction;
    }

    this.renderer.needsUpdate = true;
  }
  setSurfaceMode(active) {
    this.surfaceMode = active;
    this.indicators.surfacePrograde.visible = active;
    this.indicators.surfaceRetrograde.visible = active;

    this.indicators.prograde.visible = !active;
    this.indicators.normal.visible = !active;
    this.indicators.radial.visible = !active;

    this.indicators.retrograde.visible = !active;
    this.indicators.antinormal.visible = !active;
    this.indicators.radialout.visible = !active;

    this.renderer.needsUpdate = true;
  }

  disconnectedCallback() {
    this.removeStreams(this._client);
    this.removeStreams(this._vessel);
    this.removeStreams(this._control);
    this.removeStreams(this._node);
    this.removeStreams(this._orbit);
    this.removeStreams(this._body);
    this.removeStreams(this._flight);
    this.removeStreams(this._target);
  }
  connectedCallback() {
    if(this._client) this.client = this._client.obj;
    if(this._vessel) this.vessel = this._vessel.obj;
  }
}

customElements.define('kst-navball', Navball);
