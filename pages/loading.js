import Page from './Page.js';
import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';

const style = document.createElement('style');
style.textContent = `
  .loading {
    background-color: rgba(0, 0, 0, 0.8);
    height: 100vh;
    left: 0;
    position: absolute;
    top: 0;
    width: 100vw;
  }
  .loading .orbit {
    animation: rotation infinite 5s linear;
    border: 2px solid white;
    border-radius:50%;
    left: 50%;
    margin: 1px;
    position: relative;
    top: 50%;
    transform: translate(-50%, -50%) rotate(0);
  }
  .loading .planet {
    background: white;
    border-radius: 50%;
    height: 3vw;
    left: 50%;
    position: relative;
    top: -1.5vw;
    width: 3vw;
  }

  @keyframes rotation {
  	0% {
  		transform: translate(-50%, -50%) rotate(0);
  	}
  	100% {
  		transform: translate(-50%, -50%) rotate(360deg);
  	}
  }
  .loading .orbit.o1 {
    height: 50vw;
    width: 50vw;
  }
  .loading .orbit.o2 {
    height: 35vw;
    width: 35vw;
  }
  .loading .orbit.o3 {
    height: 20vw;
    width: 20vw;
  }
`;

class Loading extends Page {
  constructor() {
    super();
    this.shadow.appendChild(style.cloneNode(true));
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

customElements.define('kst-page-loading', Loading);
const Singleton = document.createElement('kst-page-loading');
export default Singleton;
