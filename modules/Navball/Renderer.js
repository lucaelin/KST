import * as THREE from '/node_modules/three/build/three.module.js';

export default class Renderer {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.setupRenderer();
    this.needsUpdate = true;

    this.camera = new THREE.PerspectiveCamera(16, 1, 200, 500);
    this.setupCamera();

    this.backgroundScene = new THREE.Scene();
    this.background = new THREE.Object3D();
    this.sliders = [];
    this.setupBackground();
    this.sphere = new THREE.Object3D();
    this.sphereScene = new THREE.Scene();
    this.sphere = new THREE.Object3D();
    this.setupSphere();
    this.indicatorScene = new THREE.Scene();
    this.indicatorRot = new THREE.Object3D();
    this.indicators = new THREE.Object3D();
    this.setupIndicators();
    this.guiScene = new THREE.Scene();
    this.gui = new THREE.Object3D();
    this.setupGui();
  }
  setupGui() {
    this.guiScene.add(this.gui);
  }
  setupIndicators() {
    this.indicatorRot.add(this.indicators);
    this.indicatorScene.add(this.indicatorRot);

    let spriteHideGeo = new THREE.CircleGeometry(50, 48);
    let spriteHideMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    let spriteHide = new THREE.Mesh(spriteHideGeo, spriteHideMat);
    this.indicatorScene.add(spriteHide);
  }

  setupSphere() {
    this.sphereScene.add(new THREE.AmbientLight(0xffffff));
    let light1 = new THREE.DirectionalLight(0xffffff, .2);
    light1.position.set(0, 0, 6000);
    this.sphereScene.add(light1);

    let navballGeometry = new THREE.SphereGeometry(50, 48, 48);
    let navballTexture = new THREE.TextureLoader().load('img/textures/navball.png');

    //navballTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    let navballMaterial = new THREE.MeshPhongMaterial({
      map: navballTexture,
      bumpMap: new THREE.TextureLoader().load('img/textures/navball-normal.png'),
      bumpScale: 0.25,
      shininess: 80,
    });
    let navballMesh = new THREE.Mesh(navballGeometry, navballMaterial);
    this.sphere.add(navballMesh);

    this.sphereScene.add(this.sphere);
  }

  setupBackground() {
    let sliderGeo = new THREE.CircleGeometry(56, 48, -Math.PI/2, 0);
    let sliderMat = new THREE.MeshBasicMaterial({
      color: 0xe8c300,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1,
    });
    this.sliders[0] = new THREE.Mesh(sliderGeo, sliderMat);
    this.backgroundScene.add(this.sliders[0]);

    sliderGeo = new THREE.CircleGeometry(56, 48, -Math.PI/2, 0);
    sliderMat = new THREE.MeshBasicMaterial({
      color: 0x04e0e1,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1,
    });
    this.sliders[1] = new THREE.Mesh(sliderGeo, sliderMat);
    this.backgroundScene.add(this.sliders[1]);

    let backgroundGeo = new THREE.CircleGeometry(55, 48);
    let backgroundMat = new THREE.MeshBasicMaterial({
      color: 0x555555,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1,
    });
    let backgroundMesh = new THREE.Mesh(backgroundGeo, backgroundMat);
    this.backgroundScene.add(backgroundMesh);
  }

  setupCamera() {
    this.camera.position.z = 410;
  }

  setupRenderer() {
    this.renderer.autoClear = false; // to allow overlay

    let resize = ()=>{
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth * 0.4, window.innerWidth * 0.4);
    };
    window.addEventListener('resize', resize);
    resize();
  }

  setRotation(quat) {
    this.sphere.matrix.makeRotationFromQuaternion(quat);
    this.sphere.matrixAutoUpdate = false;
    this.indicatorRot.matrix.makeRotationFromQuaternion(quat);
    this.indicatorRot.matrixAutoUpdate = false;
  }

  setSlider(n, v) {
    let s = this.sliders[n];
    s.geometry.dispose();
    if(n%2) {
      s.geometry = new THREE.CircleGeometry(56, 48, -Math.PI/2, v * Math.PI);
    } else {
      s.geometry = new THREE.CircleGeometry(56, 48, -Math.PI/2 - v * Math.PI, v * Math.PI);
    }
  }

  addGuiElement(texture, w, h) {
    let map = new THREE.TextureLoader().load(texture);
    let mat = new THREE.SpriteMaterial({map: map});
    this.sprite = new THREE.Sprite(mat);
    this.sprite.position.set(0, 0, 50);
    this.sprite.scale.set(w, h, 1);
    this.gui.add(this.sprite);
  }

  update() {
    if(this.needsUpdate) {
      this.renderer.clear();
      this.renderer.render(this.backgroundScene, this.camera);
      this.renderer.clearDepth();
      this.renderer.render(this.sphereScene, this.camera);
      this.renderer.clearDepth();
      this.renderer.render(this.indicatorScene, this.camera);
      this.renderer.clearDepth();
      this.renderer.render(this.guiScene, this.camera);

      this.needsUpdate = false;
    }

    window.requestAnimationFrame(()=>this.update());
  }
}
