import KRPC from '/modules/KRPC.js';
import '/modules/Connection.js';
import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';

class Connect {
  constructor(dom) {
    this.dom = dom;
    this.promise = new Promise((res)=>{
      this.resolve = res;
    });

    this.hosts = JSON.parse(window.localStorage.getItem('hosts')) || [{
      name: 'Kerbal Space Tracking',
      host: 'localhost',
      rpcPort: 50000,
      streamPort: 50001,
    }];

    this.view();
  }
  view() {
    render(html`
      <h2 style="color: ${this.error?'#a00':'#fff'}">${this.error||'Connect'}</h2>
      ${this.hosts.map((h)=>html`
        <kst-connection options=${h} on-click=${()=>this.connect(h)}></kst-connection>
      `)}
      <div>
        <input placeholder='localhost:50000:50001' on-input=${(e)=>this.input = e.srcElement.value} type='text'/>
        <button on-click=${()=>this.addHost(this.input)}>add</button>
      </div>
    `, this.dom);
  }

  async connect(options) {
    let krpc = new KRPC(options);
    console.log(krpc);
    krpc.load().then(this.resolve,(e)=>{
      console.error(e);
      this.error = 'Not Connected!';
      this.view();
    }).catch((e)=>{
      console.error(e);
      this.error = 'Error!';
      this.view();
    });
  }

  addHost(v) {
    v = v.split(':');
    this.hosts.push({
      name: 'Kerbal Space Tracking',
      host: v[0],
      rpcPort: v[1]||50000,
      streamPort: v[2]||50001,
    });

    window.localStorage.setItem('hosts', JSON.stringify(this.hosts));
    this.view();
  }
}

export default function(dom) {
  return (new Connect(dom)).promise;
}
