import Page from './Page.js';
import loading from '../pages/loading.js';
import '../modules/Navball.js';
import '../modules/Map.js';
import '../modules/Table.js';
import {html, render} from '../node_modules/lit-html/lit-html.js';
import {Path, MultiPath} from '../modules/Path.js';
import Convert from '../modules/Convert.js';

class Vessel extends Page {
  constructor() {
    super();
  }
  get client() {
    return this._client;
  }
  set client(v) {
    this._client = v;
    if(!this.vessel) return;
    this.render(this.vessel, this.client);
  }
  get vessel() {
    return this._vessel;
  }
  set vessel(v) {
    this._vessel = v;
    this.render(this.vessel, this.client);
    loading.hide();
  }
  render(vessel, client) {
    let tables = [
      {name: 'Status', data: [
        {name: 'MET', target: vessel, path: 'met', processor: Convert.time},
        {name: 'Situation', target: vessel, path: 'situation'},
        {name: 'Mass', target: vessel, path: 'mass', unit: ' kg'},
        {name: 'Max Acceleration', target: new MultiPath(vessel, [
          'mass',
          'availableThrust'
        ], ([mass, thrust])=>{
          return thrust/mass;
        }), path: 'value', processor: Convert.SI, unit: 'm/s²'},
      ]},
      {name: 'Surface', data: [
        {name: 'Altitude', target: new Path(vessel, '', async (v)=>{
          return await v.flight();
        }), path: 'value.surfaceAltitude', processor: Convert.SI, unit: 'm'},
        {name: 'Speed', target: new MultiPath(vessel, [
          'orbit.body.referenceFrame',
          'orbit'
        ], async ([bRF])=>{
          if(!bRF) return;
          return await vessel.flight(bRF);
        }), path: 'value.speed', processor: Convert.SI, unit: 'm/s'},
        {name: 'Biome', target: vessel, path: 'biome'},
      ]},
      {name: 'Orbit', data: [
        {name: 'Periapsis', target: vessel, path: 'orbit.periapsisAltitude', processor: Convert.SI, unit: 'm'},
        {name: 'ETA Periapsis', target: vessel, path: 'orbit.timeToPeriapsis', processor: Convert.time},
        {name: 'Apoapsis', target: vessel, path: 'orbit.apoapsisAltitude', processor: Convert.SI, unit: 'm'},
        {name: 'ETA Apoapsis', target: vessel, path: 'orbit.timeToApoapsis', processor: Convert.time},
        {name: 'Period', target: vessel, path: 'orbit.period', processor: Convert.time},
        {name: 'Inclination', target: vessel, path: 'orbit.inclination', processor: Convert.radToDeg, unit: '°'},
        {name: 'Eccentricity', target: vessel, path: 'orbit.eccentricity'},
        {name: 'True Anomaly', target: vessel, path: 'orbit.trueAnomaly', processor: Convert.radToDeg, unit: '°'},
        {name: 'Mean Anomaly', target: vessel, path: 'orbit.meanAnomaly', processor: Convert.radToDeg, unit: '°'},
      ]},
    ];

    render(html`
      <h2><kst-value @click=${()=>this.hide()} .target=${vessel} .rawPath=${'name'}></kst-value></h2>
      <div class="row valign">
        <div class="row col s12 m4 l4">
          <div class="col s0 m0 l2"></div>
          <kst-navball class="col s6 m12 l10" .client=${client} .vessel=${vessel}></kst-navball>
          <div class="col s0 m0 l2"></div>
          <kst-map class="col s6 m12 l10" .client=${client} .vessel=${vessel}></kst-map>
        </div>
        <div class="col s12 m8 l8">
          ${tables.map(({name, data})=>html`
          <kst-table .name=${name} .data=${data}></kst-Table>
          `)}
        </div>
      </div>
    `, this.dom);
  }
}

customElements.define('kst-page-vessel', Vessel);
