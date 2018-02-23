import * as THREE from '/node_modules/three/build/three.module.js';
import Renderer from './Navball/Renderer.js';

const renderer = new Renderer();

class GuiElement {
  constructor(texture) {
    let map = new THREE.TextureLoader().load(texture);
    let mat = new THREE.SpriteMaterial({map: map});
    this.sprite = new THREE.Sprite(mat);
    this.sprite.position.set(0, 0, 50);
    this.sprite.scale.set(512/10, 256/10, 1);
    renderer.gui.add(this.sprite);
  }
}

class NavIndicator {
  constructor(texture) {
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

export default class Navball {
  constructor() {
    this.dom = renderer.renderer.domElement;
    this.indicators = {
      surfacePrograde: new NavIndicator('/img/indicators/surfacepro.png'),
      surfaceRetrograde: new NavIndicator('/img/indicators/surfaceretro.png'),
      prograde: new NavIndicator('/img/indicators/prograde.png'),
      radial: new NavIndicator('/img/indicators/radial.png'),
      normal: new NavIndicator('/img/indicators/normal.png'),
      retrograde: new NavIndicator('/img/indicators/retrograde.png'),
      radialout: new NavIndicator('/img/indicators/radialout.png'),
      antinormal: new NavIndicator('/img/indicators/antinormal.png'),
      target: new NavIndicator('/img/indicators/target.png'),
      antitarget: new NavIndicator('/img/indicators/antitarget.png'),
      targetPrograde: new NavIndicator('/img/indicators/prograde.png'),
      targetRetrograde: new NavIndicator('/img/indicators/retrograde.png'),
      maneuver: new NavIndicator('/img/indicators/maneuver.png'),
    };

    this.gui = {
      level: new GuiElement('/img/indicators/level.png'),
    };

    this.setManeuverIndicator(false);
    this.setTargetIndicator(false);
    this.setSurfaceMode(false);
    this.dom.addEventListener('click', ()=>{
      this.setSurfaceMode(!this.surfaceMode);
    });

    renderer.update();
  }
  setRotation(rotation) {
    let [x, z, y, w] = rotation;
    let quat = new THREE.Quaternion(x, -y, z, -w);
    quat.multiply(new THREE.Quaternion(0, 0.000, -.707, .707));
    quat.multiply(new THREE.Quaternion(0, -.707, 0.000, .707));
    renderer.setRotation(quat);
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
  }
  setSurfaceIndicators(prograde) {
    this.indicators.surfacePrograde.position = prograde;
    this.indicators.surfaceRetrograde.position = prograde.map((e)=>-e);
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
  }
  setManeuverIndicator(direction) {
    this.indicators.maneuver.visible = !!direction;
    if (direction) this.indicators.maneuver.position = direction;
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
  }
}
