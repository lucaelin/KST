import loading from '/pages/loading.js';
import '/pages/connect.js';

/*
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(function() { console.log('Service Worker Registered'); });
}
*/

loading.show();
let c = document.createElement('kst-page-connect');
c.show();
