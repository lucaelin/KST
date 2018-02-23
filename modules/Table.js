import {html, render} from '/node_modules/lit-html/lit-html.js';

export default class Table {
  constructor(headline) {
    this.dom = document.createElement('div');
    this.headline = headline;
    this.data = [];
  }
  set(n, t, p, u) {
    if (!u) u='';
    this.data.push({t, p, n, u});

    if (typeof p !== 'function' && t.stream) {
      t.stream(p);
    }
  }
  async process(t, p) {
    let v;
    if (typeof p === 'function') {
      v = await p(t);
    } else {
      v = await t[p];
    }

    if (typeof v === 'number') return v.toFixed(2);
    return v;
  }
  update() {
    let lit = html`
      <table>
        <caption>${this.headline}</caption>
        ${this.data.map(({t, p, n, u})=>html`
          <tr>
            <td>${n}</td>
            <td>${this.process(t, p)}${u}</td>
          </tr>
        `)}
      </table>
    `;

    render(lit, this.dom);
    window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>this.update()));
  }
}
