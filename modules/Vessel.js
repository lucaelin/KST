import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';
import {MultiPath} from './Path.js';


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

class Vessel extends HTMLElement {
  constructor() {
    super();

    this.shadow = this.attachShadow({mode: 'open'});

    this.shadow.appendChild(style.cloneNode(true));

    this.dom = document.createElement('div');
    this.shadow.appendChild(this.dom);
  }
  set vessel(v) {
    this._vessel = v;

    render(html`
      <h3>
        <kst-value target=${v} rawPath=${'name'}></kst-value>
      </h3>
      <p>
        MET: <kst-value target=${v} rawPath=${'met'}></kst-value><br />
        Situation: <kst-value target=${v} rawPath=${'situation'}></kst-value>
      </p>
    `, this.dom);
  }
}

customElements.define('kst-vessel', Vessel);
