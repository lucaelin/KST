import '/modules/Navball.js';
import '/modules/Map.js';
import '/modules/Table.js';
import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';
import {Path, MultiPath} from '/modules/Path.js';
import Convert from '/modules/Convert.js';

export default (dom, vessel)=>{
  let tables = [
    {name: 'Status', data: [
      {name: 'MET', target: vessel, path: 'met', unit: ' s'},
      {name: 'Situation', target: vessel, path: 'situation'},
      {name: 'Mass', target: vessel, path: 'mass', unit: ' kg'},
      {name: 'Max Acceleration', target: new MultiPath(vessel, [
        'mass',
        'availableThrust'
      ], ([mass, thrust])=>{
        return thrust/mass;
      }), path: 'value', unit: ' m/s²'},
    ]},
    {name: 'Surface', data: [
      {name: 'Altitude', target: new Path(vessel, '', async (v)=>{
        return await v.flight();
      }), path: 'value.surfaceAltitude', unit: ' m'},
      {name: 'Speed', target: new MultiPath(vessel, [
        'surfaceReferenceFrame',
        'orbit.body.referenceFrame'
      ], async ([sRF, bRF])=>{
        if(!(sRF && bRF)) return;
        return await vessel.flight(await bRF.createHybrid(sRF));
      }), path: 'value.speed', unit: ' m/s'},
      {name: 'Biome', target: vessel, path: 'biome'},
    ]},
    {name: 'Orbit', data: [
      {name: 'Periapsis', target: vessel, path: 'orbit.periapsisAltitude', unit: ' m'},
      {name: 'Apoapsis', target: vessel, path: 'orbit.apoapsisAltitude', unit: ' m'},
      {name: 'Period', target: vessel, path: 'orbit.period', unit: ' s'},
      {name: 'Inclination', target: vessel, path: 'orbit.inclination', processor: Convert.radToDeg, unit: '°'},
      {name: 'Eccentricity', target: vessel, path: 'orbit.eccentricity'},
      {name: 'True Anomaly', target: vessel, path: 'orbit.trueAnomaly', processor: Convert.radToDeg, unit: '°'},
      {name: 'Mean Anomaly', target: vessel, path: 'orbit.meanAnomaly', processor: Convert.radToDeg, unit: '°'},
    ]},
  ];

  return new Promise((resolve)=>{
    render(html`
      <h2><kst-value on-click=${resolve} target=${vessel} rawPath=${'name'}></kst-value></h2>
      <div class='graphics'>
        <kst-navball vessel=${vessel}></kst-navball>
        <kst-map vessel=${vessel}></kst-map>
      </div>
      ${tables.map(({name, data})=>html`
      <kst-table name=${name} data=${data}></kst-Table>
      `)}
      `, dom);
  });
};
