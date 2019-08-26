import {html, render} from '../node_modules/lit-html/lit-html.js';
import Page from './Page.js';
import KRPC from '../node_modules/krpc.js/browser/KRPC.js';
import loading from '../pages/loading.js';
import '../modules/Connection.js';
import '../pages/vessels.js';

class Connect extends Page {
  constructor() {
    super();

    this.hosts = JSON.parse(window.localStorage.getItem('hosts')) || [{
      name: 'Kerbal Space Tracking',
      host: 'localhost',
      rpcPort: 50000,
      streamPort: 50001,
      streamRate: 0,
    }];

    this.vesselPage = document.createElement('kst-page-vessels');

    this.render();
    loading.hide();
  }
  render() {
    render(html`
      <h2 style="color: ${this.error?'#a00':'#fff'}">${this.error||'Connect'}</h2>
      ${this.hosts.map((h)=>html`
        <kst-connection .options=${h} @click=${()=>this.connect(h)}></kst-connection>
      `)}
      <div>
        <input placeholder='localhost:50000:50001' @input=${(e)=>this.input = e.srcElement.value} type='text'/>
        <button @click=${()=>this.addHost(this.input)}>add</button>
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
    window.krpcClient = krpc;
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
    console.log(v);
    v = v.split(':');
    this.hosts.push({
      name: 'Kerbal Space Tracking',
      host: v[0],
      rpcPort: v[1]||50000,
      streamPort: v[2]||50001,
      streamRate: 30,
    });

    window.localStorage.setItem('hosts', JSON.stringify(this.hosts));
    this.render();
  }
}

customElements.define('kst-page-connect', Connect);
