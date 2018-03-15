import './Value.js';
import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';

const style = document.createElement('style');
style.textContent = `
  :host {
    display: block;
  }

  table {
    margin: 1em auto;
    max-width: 400px;
    position: relative;
    width: 70vw;
  }
  table caption {
    /* border-bottom: 1px solid #04e0e1; */
    color: #04e0e1;
    font-size: 105%;
    font-style: italic;
    font-weight: bold;
    margin-left: 0.2em;
    text-align: left;
  }
  td:last-child {
    text-align: right;
  }
`;

/*export default class Table extends HTMLElement{
  constructor() {
    super();
    this.shadow = this.attachShadow({mode: 'open'});

    this.shadow.appendChild(style.cloneNode(true));

    this.table = document.createElement('table');
    this.shadow.appendChild(this.table);

    this.data = [];
    this.streams = {};
  }
  get client() {
    return this._client.obj;
  }
  set client(c) {
    // this._client.streams.map((s)=>s.remove());

    this._client = {
      obj: c,
      streams: [],
    };
    let d = this.data;
    this.data = [];
    d.forEach((e)=>this.set(e.n, e.p, e.u));
  }
  async set(n, path, u) {
    if(!this.client.services) throw new Error('Unable to set property: client needed');
    if (!u) u='';
    this.data.push({p: path, n, u});

    if (typeof path !== 'function') {
      let p = path.split('.');
      await p.reduce(async (acc, prop, i)=>{
        acc = await acc;
        let v = await acc[prop];
        if (typeof acc.stream === 'function')
          this.streams[path] = await acc.stream(prop,(nv)=>{
            if (v!==nv) this.invalidate(p, i);
          });
        return v;
      }, this.client.services);
    }
  }
  invalidate(p, i) {
    if(i < p.length - 1) { // not a top lvl property
      let path = p.slice(0, i + 1).join('.');
      this.data.forEach((d, i)=>{
        if (d.p.indexOf(path) === 0) {
          let v = d;
          delete this.data[i];
          this.set(v.n, v.p, v.u);
        }
      });
      for(let i in this.streams) {
        if(i.indexOf(path) === 0) {
          this.streams[i].remove();
        }
      }
    }
  }
  async process(p) {
    let v;
    if (typeof p === 'function') {
      v = await p(this.client.services);
    } else {
      p = p.split('.');
      v = await p.reduce(async (acc, prop)=>await (await acc)[prop], this.client.services);
    }

    if (typeof v === 'number') return v.toFixed(2);
    return v;
  }
  update() {
    let lit = html`
      <caption>${this.textContent}</caption>
      ${this.data.map(({p, n, u})=>html`
        <tr>
          <td>${n}</td>
          <td>${this.process(p)}${u}</td>
        </tr>
      `)}
    `;

    render(lit, this.table);
    window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>this.update()));
  }
}*/

export default class Table extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({mode: 'open'});

    this.shadow.appendChild(style.cloneNode(true));

    this.table = document.createElement('table');
    this.shadow.appendChild(this.table);

    this._name = 'Table';
    this._data = [];
  }
  get name() {
    return this._name;
  }
  set name(v) {
    this._name = v;
    this.update();
  }
  get data() {
    return this._data;
  }
  set data(v) {
    this._data = v;
    this.update();
  }

  update() {
    let lit = html`
      <caption>${this.name}</caption>
      ${this.data.map(({name, target, path, processor, unit})=>html`
        <tr>
          <td>${name}</td>
          <td>
            <kst-value target=${target} processor=${processor} rawPath=${path}></kst-value>${unit}
          </td>
        </tr>
      `)}
    `;

    render(lit, this.table);
  }
}

customElements.define('kst-table', Table);
