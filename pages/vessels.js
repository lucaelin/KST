import '/modules/Vessel.js';
import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';
import {Path} from '/modules/Path.js';

class Vessels {
  constructor(dom, krpc) {
    this.dom = dom;
    this.krpc = krpc;
    this.promise = new Promise((res)=>{
      this.resolve = (v)=>{
        this.path.remove();
        res(v);
      };
    });

    this.path = new Path(krpc.services.spaceCenter, 'vessels');
    this.stream = this.path.stream('value', (v)=>this.view(v));

    this.lastVessels = [];
    this.view();
  }
  view(vessels) {
    let same = true;
    for(let i in vessels) {
      if(!this.lastVessels) {same = false; break;}
      if(this.lastVessels.length != vessels.length) {same = false; break;}
      if(!this.lastVessels[i] || this.lastVessels[i] !== vessels[i]) {same = false; break;}
    }
    if(same) return;
    this.lastVessels = vessels;

    render(html`
      ${vessels.map((v)=>html`
        <kst-vessel vessel=${v} on-click=${()=>this.resolve(v)}></kst-vessel>
      `)}
    `, this.dom);
  }
}

export default function(dom, krpc) {
  return (new Vessels(dom, krpc)).promise;
}
