import KRPC from '/modules/KRPC.js';
import Navball from '/modules/Navball.js';
import Map from '/modules/Map.js';
import Table from '/modules/Table.js';
import Convert from '/modules/Convert.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(function() { console.log('Service Worker Registered'); });
}

const nav = new Navball();
document.querySelector('.navball').appendChild(nav.dom);
window.nav = nav;
const map = new Map();
document.querySelector('.map').appendChild(map.dom);
window.map = map;

const statusWindow = new Table('Status');
document.body.appendChild(statusWindow.dom);
window.statusWindow = statusWindow;
console.log(statusWindow);

const surfaceWindow = new Table('Surface');
document.body.appendChild(surfaceWindow.dom);
window.surfaceWindow = surfaceWindow;
console.log(surfaceWindow);

const orbitWindow = new Table('Orbit');
document.body.appendChild(orbitWindow.dom);
window.orbitWindow = orbitWindow;
console.log(orbitWindow);

const options = {
  name: 'krpc.js-browser',
  host: 'localhost',
  rpcPort: 50000,
  streamPort: 50001,
};

if (!window.location.hash) {
  window.location.hash = window.prompt('Please enter the servers IP-address or hostname:', 'localhost');
}

options.host = window.location.hash.slice(1);

let krpc = new KRPC(options);
console.log(krpc);
krpc.load().then(async ()=>{
  let sc = krpc.services.spaceCenter;
  sc.stream('ut');
  while (await krpc.services.krpc.currentGameScene != 'Flight') {
    document.querySelector('h2').textContent = 'Waiting...';
    await new Promise((res)=>window.setTimeout(res,1*1000));
  }


  let vessel = await sc.activeVessel;
  let name = await vessel.name;
  document.querySelector('h2').textContent = name;
  let vesselRF = await vessel.referenceFrame;
  let surfaceRF = await vessel.surfaceReferenceFrame;
  let orbit = await vessel.orbit;
  let body = await orbit.body;
  let bodyRF = await body.referenceFrame;
  let rf = await bodyRF.createHybrid(surfaceRF);
  let flight = await vessel.flight(rf);

  window.setInterval(async ()=>{
    if (await krpc.services.krpc.currentGameScene != 'Flight') window.location.reload();
    if (vessel != await sc.activeVessel) window.location.reload();
    if (orbit != await vessel.orbit) window.location.reload();
    if (body != await orbit.body) window.location.reload();
  },1000 * 10);

  flight.stream('rotation');
  flight.stream('prograde');
  flight.stream('velocity');
  flight.stream('normal');

  setInterval(async ()=>{
    nav.setRotation(await flight.rotation);
    let prograde = await flight.prograde;
    let surfacePrograde = await flight.velocity;
    let normal = await flight.normal;
    nav.setOrbitalIndicators(prograde, normal);
    nav.setSurfaceIndicators(surfacePrograde);
  }, 40);
  map.orbit = orbit;
  map.body = body;

  statusWindow.set('UT', sc, 'ut');
  statusWindow.set('MET', vessel, 'met');
  statusWindow.set('Situation', vessel, 'situation');
  statusWindow.set('Mass', vessel, 'mass', ' kg');
  vessel.stream('maxThrust');
  vessel.stream('mass');
  statusWindow.set('Max Accel.', vessel, async (vessel)=>await vessel.maxThrust / await vessel.mass, ' m/s²');
  statusWindow.update();

  /*surfaceWindow.set('Altitude (True)', [flight, vessel, vesselRF], async ([f, v, rf])=>{
    return await f.surfaceAltitude;// - (await v.boundingBox(rf))[0][1];
  }, ' m');*/
  surfaceWindow.set('Altitude (True)', flight, 'surfaceAltitude', ' m');
  surfaceWindow.set('Speed (Surface)', flight, 'speed', ' m/s');
  surfaceWindow.set('Biome', vessel, 'biome');
  surfaceWindow.update();

  orbitWindow.set('Speed', orbit, 'speed', ' m/s');
  orbitWindow.set('Altitude (ASL)', flight, 'meanAltitude', ' m');
  orbitWindow.set('Periapsis', orbit, 'periapsisAltitude', ' m');
  orbitWindow.set('Apoapsis', orbit, 'apoapsisAltitude', ' m');
  orbitWindow.set('Period', orbit, 'period', ' s');
  orbit.stream('inclination');
  orbitWindow.set('Inclination', orbit, (o)=>Convert.radToDeg(o.inclination), '°');
  orbitWindow.set('Eccentricity', orbit, 'eccentricity');
  orbit.stream('trueAnomaly');
  orbitWindow.set('True Anomaly', orbit, (o)=>Convert.radToDeg(o.trueAnomaly), '°');
  orbit.stream('meanAnomaly');
  orbitWindow.set('Mean Anomaly', orbit, (o)=>Convert.radToDeg(o.meanAnomaly), '°');
  orbitWindow.update();
}).catch((e)=>{
  console.error(e);
  document.querySelector('h2').textContent = 'No vessel!';
  document.querySelector('h2').style.color = '#a00';
});
