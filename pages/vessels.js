import Page from './Page.js';
import loading from '/pages/loading.js';
import './vessel.js';
import '/modules/Vessel.js';
import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';
import {Path} from '/modules/Path.js';

class Vessels extends Page {
  constructor() {
    super();
    this.vessel = document.createElement('kst-page-vessel');

    this.activeDom = document.createElement('div');
    this.allDom = document.createElement('div');
    this.dom.appendChild(this.activeDom);
    this.dom.appendChild(this.allDom);
  }
  get client() {
    return this._client;
  }
  set client(v) {
    this._client = v;
    if(this.gsPath) this.path.remove();
    if(this.gsStream) this.stream.remove();
    if(this.path) this.path.remove();
    if(this.stream) this.stream.remove();
    if(this.activePath) this.activePath.remove();
    if(this.activeStream) this.activeStream.remove();

    this.gsPath = new Path(this.client.services.krpc, 'currentGameScene');
    this.gsStream = this.gsPath.stream('value', (v)=>this.toggleGS(v));
  }
  toggleGS(v) {

    if(v==='Flight') {
      if(v===this.gameScene) return;
      this.gameScene = v;
      loading.show();

      render(html``, this.dom);
      this.dom.appendChild(this.activeDom);
      this.dom.appendChild(this.allDom);

      if(this.path) this.path.remove();
      if(this.stream) this.stream.remove();
      this.path = new Path(this.client.services.spaceCenter, 'vessels');
      this.stream = this.path.stream('value', (v)=>this.render(v));

      if(this.activePath) this.activePath.remove();
      if(this.activeStream) this.activeStream.remove();
      this.activePath = new Path(this.client.services.spaceCenter, 'activeVessel');
      this.activeStream = this.activePath.stream('value', (v)=>{
        this.renderActive(v);
      });

      this.lastVessels = [];
      loading.hide();
    } else {
      if(v===this.gameScene) return;
      this.gameScene = v;
      loading.show();
      // this.active.hide();
      render(html`
        <h2>No flight!</h2>
        <p>Waiting for the game to be in flight...</p>
      `, this.dom);
      loading.hide();
    }
  }
  viewVessel(v) {
    loading.show();
    this.vessel.vessel = v;
    this.vessel.show(this);
  }
  render(vessels) {
    let same = true;
    if(!this.lastVessels || this.lastVessels.length != vessels.length) {
      same = false;
    } else {
      for(let i in vessels) {
        if(!this.lastVessels[i] || this.lastVessels[i] !== vessels[i]) {same = false; break;}
      }
    }
    if(same) return;
    this.lastVessels = vessels;

    render(html`
      <h2>All Vessels</h2>
      ${vessels.slice().reverse().map((v)=>html`
        <kst-vessel client=${this.client} vessel=${v} on-select=${()=>this.viewVessel(v)}></kst-vessel>
      `)}
    `, this.allDom);
  }
  async renderActive(v) {
    render(html`
      <h2>Active Vessel</h2>
      <kst-vessel vessel=${v} on-select=${()=>this.viewVessel(v)}></kst-vessel>
    `, this.activeDom);
  }
}

customElements.define('kst-page-vessels', Vessels);
