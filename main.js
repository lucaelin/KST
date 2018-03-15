import loading from '/pages/loading.js';
import Connect from '/pages/connect.js';

/*
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(function() { console.log('Service Worker Registered'); });
}
*/

loading.show();
let c = new Connect();
c.show();
