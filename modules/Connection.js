import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';

const style = document.createElement('style');
style.textContent = `
  :host {
    display: block;
    margin: 10px;
    padding: 1px 20px 1px 20px;
    padding-left: 20px;
    border-left: 1px solid #fff;
    background: rgba(0,0,0,.6);
  }
  h3 {
    color: #04e0e1;
    font-style: italic;
    font-weight: bold;
    margin-left: 0.2em;
  }
`;

class Connection extends HTMLElement {
  constructor() {
    super();

    this.shadow = this.attachShadow({mode: 'open'});

    this.shadow.appendChild(style.cloneNode(true));

    this.dom = document.createElement('div');
    this.shadow.appendChild(this.dom);
  }
  set options(v) {
    this.data = v;
    render(html`
      <h3>${v.name}</h3>
      <p>
        Host: ${v.host} <br />
        RPC-Port: ${v.rpcPort}, Stream-Port: ${v.streamPort}
      </p>
    `, this.dom);
  }
}

customElements.define('kst-connection', Connection);
