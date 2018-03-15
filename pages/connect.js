import Page from './Page.js';
import KRPC from '/modules/KRPC.js';
import '/modules/Connection.js';
import loading from '/pages/loading.js';
import Vessels from '/pages/vessels.js';
import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';

class Connect extends Page {
  constructor() {
    super();

    this.hosts = JSON.parse(window.localStorage.getItem('hosts')) || [{
      name: 'Kerbal Space Tracking',
      host: 'localhost',
      rpcPort: 50000,
      streamPort: 50001,
    }];

    this.vesselPage = new Vessels();

    this.render();
    loading.hide();
  }
  render() {
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

  viewVessels(client) {
    client.rpcSocket.addEventListener('close', ()=>window.location.reload()); // TODO: cleaner
    this.vesselPage.client = client;
    this.vesselPage.show(this);
  }

  async connect(options) {
    loading.show();
    let krpc = new KRPC(options);
    console.log(krpc);
    krpc.load().then((c)=>this.viewVessels(c),(e)=>{
      console.error(e);
      this.error = 'Not Connected!';
      this.render();
      loading.hide();
    }).catch((e)=>{
      console.error(e);
      this.error = 'Error!';
      this.render();
      loading.hide();
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
    this.render();
  }
}

export default Connect;
