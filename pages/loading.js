import Page from './Page.js';
import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';


class Loading extends Page {
  constructor() {
    super();
    this.render();
  }
  render() {
    render(html`
      <div class="loading">
        <div class="orbit o1">
          <div class="planet"></div>
          <div class="orbit o2">
            <div class="planet"></div>
            <div class="orbit o3">
              <div class="planet"></div>
            </div>
          </div>
        </div>
      </div>
    `, this.dom);
  }
}

const Singleton = new Loading();
export default Singleton;
