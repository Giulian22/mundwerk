/* Abgleich zwischen Handy und Laptop über Firebase. Wird erst geladen, wenn du dich anmelden willst oder schon angemeldet bist.
   Anmeldung mit Google, ein privates Dokument pro Konto (users/{Nutzer-ID}). Ohne Anmeldung oder offline läuft alles lokal weiter.
   Sobald wieder Internet da ist, wird zusammengeführt: pro Eintrag gewinnt der neueste Versuch (merge in core.js). */
import {FIREBASE} from './firebase-config.js';
import {initializeApp,initializeAuth,indexedDBLocalPersistence,browserLocalPersistence,browserPopupRedirectResolver,
  GoogleAuthProvider,signInWithPopup,signInWithCredential,getRedirectResult,signOut,onAuthStateChanged,connectAuthEmulator,
  getFirestore,doc,runTransaction,connectFirestoreEmulator} from '../vendor/firebase.js';
import {clean,merge,syncPart} from './core.js';

/* app.get() liefert den lokalen Stand, app.take() übernimmt den zusammengeführten, app.user() und app.status() melden sich beim Bildschirm */
export function startSync(app){
  const fb=initializeApp(FIREBASE);
  /* Ohne Popup-Helfer beim Start: Googles Anmelde-Skript wird erst geladen, wenn du auf Anmelden tippst */
  const auth=initializeAuth(fb,{persistence:[indexedDBLocalPersistence,browserLocalPersistence]});
  const db=getFirestore(fb);
  /* Nur zum Testen auf dem eigenen Rechner: Firebase-Emulator, Anmeldung ohne Google-Fenster */
  if(FIREBASE.emulator){
    connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);
    globalThis.__mwEmuSignIn=function(sub,email){return signInWithCredential(auth,GoogleAuthProvider.credential(JSON.stringify({sub:sub,email:email,email_verified:true})));};
  }
  let user=null,busy=false,again=false,timer=null,warm=null;

  /* Lesen, zusammenführen und zurückschreiben in einem Schritt, damit sich zwei Geräte nicht gegenseitig überschreiben */
  async function now(){
    clearTimeout(timer);
    if(!user) return;
    if(busy){again=true;return;}
    if(navigator.onLine===false){app.status('offline');return;}
    busy=true;app.status('busy');
    try{
      const ref=doc(db,'users',user.uid);
      const merged=await runTransaction(db,async function(tx){
        const snap=await tx.get(ref);
        let remote=null;
        if(snap.exists()){try{remote=clean(JSON.parse(snap.data().state));}catch(e){remote=null;}}
        const m=merge(app.get(),remote||clean(null));
        const out=JSON.stringify(syncPart(m));
        if(!remote||out!==JSON.stringify(syncPart(remote))) tx.set(ref,{state:out,updated:Date.now()});
        return m;
      });
      app.take(merged);
      app.status('ok');
    }catch(e){
      app.status(navigator.onLine===false?'offline':'error',e&&e.code);
    }
    busy=false;
    if(again){again=false;now();}
  }
  onAuthStateChanged(auth,function(u){
    user=u;
    app.user(u?{name:u.displayName||'',email:u.email||''}:null);
    if(u) now();
  });
  window.addEventListener('online',now);
  document.addEventListener('visibilitychange',function(){if(!document.hidden) now();});
  return {
    /* Anmeldefenster vorbereiten. Ist es fertig, kann es direkt beim Tippen aufgehen und wird nicht blockiert. */
    prepare:function(){if(!warm)warm=getRedirectResult(auth,browserPopupRedirectResolver).catch(function(){});return warm;},
    signIn:function(){
      const p=new GoogleAuthProvider();
      p.setCustomParameters({prompt:'select_account'});
      return signInWithPopup(auth,p,browserPopupRedirectResolver).catch(function(e){app.status('error',e&&e.code);});
    },
    signOut:function(){return signOut(auth).catch(function(){});},
    now:now,
    /* Lokale Änderung: kurz sammeln, dann abgleichen */
    changed:function(){if(!user)return;clearTimeout(timer);timer=setTimeout(now,2000);}
  };
}
