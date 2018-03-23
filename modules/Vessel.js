import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';
import Convert from '/modules/Convert.js';


const style = document.createElement('style');
style.textContent = `
  @import '/grid.css';
  :host {
    display: block;
    margin: 10px;
    border-left: 1px solid #fff;
    background: rgba(0,0,0,.6);
  }
  h3 {
    color: var(--primary);
    font-style: italic;
    font-weight: bold;
    margin-left: 0.2em;
  }
  .info {
    padding: 1px 20px 1px 20px;
  }
  .actions {
    min-height: 35px;
  }
  .actions button {
    border: 1px solid var(--primary);
    background-color: black;
    color: inherit;
  }
  .actions button:focus {
    outline:0;
  }
  .actions button:disabled {
    border: 1px solid #000;
    background-color: black;
    color: #888;
  }
`;

class Vessel extends HTMLElement {
  constructor() {
    super();

    this.shadow = this.attachShadow({mode: 'open'});

    this.shadow.appendChild(style.cloneNode(true));

    this.dom = document.createElement('div');
    this.dom.classList.add('row');
    this.shadow.appendChild(this.dom);
  }
  selected() {
    this.dispatchEvent(new CustomEvent('select', {
      detail: {
        vessel: this.vessel,
      },
      bubbles: true,
    }));
  }
  get vessel() {
    return this._vessel;
  }
  set vessel(v) {
    this._vessel = v;

    render(html`
      <div on-click=${(e)=>this.selected(e)} class="info col s12 m8 l8">
        <h3>
          <kst-value target=${v} rawPath=${'name'}></kst-value>
        </h3>
        <p>
          Type: <kst-value target=${v} rawPath=${'type'}></kst-value><br />
          MET: <kst-value target=${v} rawPath=${'met'} processor=${Convert.time}></kst-value><br />
          Situation: <kst-value target=${v} rawPath=${'situation'}></kst-value>
        </p>
      </div>
      <div class='actions row col s12 m4 l4'>
        <button disabled class="col s4 m12 l12" on-click=${
          (e)=>{
            this._vessel.terminate();
          }
        }>
          Terminate
        </button>
        <button class="col s4 m12 l12" on-click=${
          (e)=>{
            v.recover();
          }
        }>
          Recover
        </button>
        <button class="col s4 m12 l12" on-click=${
          (e)=>{
            this.client.services.spaceCenter.activeVessel = this._vessel;
          }
        }>
          Switch to
        </button>
      </div>
    `, this.dom);
  }
}

customElements.define('kst-vessel', Vessel);
