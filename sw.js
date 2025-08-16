const CACHE = 'renuar-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/styles.css',
  './assets/js/app.js'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE && caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const net = fetch(e.request).then(res=>{
        try{
          const url = new URL(e.request.url);
          if(url.origin===location.origin){
            caches.open(CACHE).then(c=>c.put(e.request, res.clone()));
          }
        }catch(_){}
        return res;
      }).catch(()=>cached || caches.match('./'));
      return cached || net;
    })
  );
});
