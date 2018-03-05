import {html, render} from '/node_modules/lit-html/lib/lit-extended.js';
import loading from '/pages/loading.js';
import Connect from '/pages/connect.js';
import viewVessels from '/pages/vessels.js';
import viewVessel from '/pages/vessel.js';

/*
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(function() { console.log('Service Worker Registered'); });
}
*/

const mainview = document.querySelector('#mainview');

/*async function init() {
  render(html`
    ${viewConnect}
  `, mainview);
}
init().catch((e)=>{
  console.error(e);
  render(html`<h2 style="color: #a00">Error!</h2>`, mainview);
});*/
loading.show();
let c = new Connect();
c.show();

// window.onscroll = ()=>document.body.style.backgroundPosition = '50% '+(document.scrollingElement.scrollTop/document.scrollingElement.scrollHeight*100) +'%';
