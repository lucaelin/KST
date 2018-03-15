import {Path} from './Path.js';

class Value extends HTMLElement {
  constructor() {
    super();
  }
  set target(v) {
    this._target = v;
    if (this.path) this.path.remove();
    delete this.path;
    this.textContent = '...loading...';
    this.createPath();
  }
  set rawPath(v) {
    this._rawPath = v;
    if (this.path) this.path.remove();
    delete this.path;
    this.textContent = '...loading...';
    this.createPath();
  }
  createPath() {
    if (this._rawPath && this._target && !this.path)
      this.path = new Path(this._target, this._rawPath, async (v)=>await this.process(v));
  }
  async process(v) {
    if (this.processor) v = await this.processor(v);
    if (typeof v === 'number') v = v.toFixed(2);
    this.update(v);
    return v;
  }
  async update(v) {
    if(this.textContent != v) this.textContent = v;
  }

  disconnectedCallback() {
    if (this.path) this.path.remove();
    delete this.path;
  }
  connectedCallback() {
    this.createPath();
  }
}

customElements.define('kst-value', Value);
