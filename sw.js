/* Service Worker von Mundwerk: speichert App, Inhalte und Schriften, damit alles ohne Internet startet.
   Jede Version bekommt einen eigenen Speicher. VERSION und FILES schreibt `npm run stamp` neu,
   der Test prüft, dass das nach jeder Änderung passiert ist. Nur so erkennt der Browser ein Update. */
const VERSION='2026-10-28-6a74ba89';
const FILES=['./','css/app.css','css/fonts.css','fonts/charis-sil-latin-400-italic.woff2','fonts/charis-sil-latin-400-normal.woff2','fonts/charis-sil-latin-ext-400-normal.woff2','fonts/inter-latin-400-normal.woff2','fonts/inter-latin-500-normal.woff2','fonts/inter-latin-600-normal.woff2','fonts/space-grotesk-latin-500-normal.woff2','fonts/space-grotesk-latin-700-normal.woff2','icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-32.png','icons/icon-512.png','icons/icon.svg','icons/maskable-512.png','index.html','js/app.js','js/core.js','js/data.js','js/firebase-config.js','js/fx.js','js/sync.js','manifest.webmanifest','vendor/firebase.js'];
const CACHE='mundwerk-'+VERSION;
const BASE=new URL('./',self.location).pathname;

/* Antworten nach einer Umleitung darf der Browser nicht für Seitenaufrufe verwenden: sauber neu verpacken */
function plainCopy(r){
  if(!r.redirected) return r;
  return r.blob().then(function(b){return new Response(b,{status:r.status,statusText:r.statusText,headers:r.headers});});
}

self.addEventListener('install',function(e){
  /* Alles frisch vom Server holen, am Zwischenspeicher des Browsers vorbei. Sonst landet eine alte Datei in der neuen Version. */
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(FILES.map(function(f){
      return fetch(new Request(f+'?v='+VERSION,{cache:'reload'})).then(function(r){
        if(!r.ok) throw new Error(f+': '+r.status);
        return plainCopy(r);
      }).then(function(r){return c.put(f,r);});
    }));
  }));
});

/* Die Seite sagt Bescheid, wann sie neu laden kann (nicht mitten im Üben) */
self.addEventListener('message',function(e){
  if(e.data==='skip') self.skipWaiting();
  else if(e.data==='version'&&e.ports&&e.ports[0]) e.ports[0].postMessage(VERSION);
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k.indexOf('mundwerk-')===0&&k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});

self.addEventListener('fetch',function(e){
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin||url.pathname.indexOf(BASE)!==0) return;
  /* Seitenaufruf: immer die gespeicherte Startseite dieser Version, damit HTML, Code und Inhalte zusammenpassen */
  const key=(req.mode==='navigate'&&(url.pathname===BASE||url.pathname===BASE+'index.html'))?'./':req;
  e.respondWith(caches.open(CACHE).then(function(c){return c.match(key,{ignoreSearch:true});}).then(function(r){return r||fetch(req);}));
});
