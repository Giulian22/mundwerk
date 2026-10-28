/* Mundwerk: Bildschirm, Mikrofon, Vorlesen und Speichern. Inhalte stehen in data.js, die Vergleichslogik in core.js. */
import {GROUPS} from './data.js';
import {PACKS,mkSent,compare,judge,splitSentences,blank,clean,merge,GOALS,dayStats,bump} from './core.js';
import {calm,morph,swap,inTransition,confetti,unlock,sound,buzz,toast,countTo} from './fx.js';
import {FIREBASE} from './firebase-config.js';

/* ---------- Helfer ---------- */
const $=function(s,el){return (el||document).querySelector(s);};
const esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
function hl(raw){return esc(raw).replace(/\[([^\]]*)\]/g,'<b class="hl">$1</b>');}

const ICON={
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
  stop:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/></svg>',
  spk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4H4z"/><path class="w1" d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path class="w2" d="M18 6.5a7.8 7.8 0 0 1 0 11"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
  right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>',
  check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  slow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  kbd:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17.5 10h.01M8 14h8"/></svg>',
  flame:'<svg class="flame" viewBox="0 0 24 24" aria-hidden="true"><path class="f-out" d="M12.6 2c.4 3-1 4.8-2.6 6.5C8.4 10.2 7 12 7 14.8 7 18.3 9.4 21 12.4 21s5.6-2.5 5.6-6c0-2.5-1.1-4.4-2.5-5.9-.2 1.4-.9 2.4-1.9 2.9.5-3.8-.3-7.3-1-10Z"/><path class="f-in" d="M12.5 12.2c.2 1.5-.6 2.4-1.3 3.2-.5.6-.9 1.2-.9 2.1 0 1.4 1 2.4 2.2 2.4s2.3-1 2.3-2.5c0-1.4-.9-2.4-1.6-3-.1.5-.3.9-.7 1.1.1-1.3-.1-2.4 0-3.3Z"/></svg>'
};
/* Das kleine Zeichen neben dem Namen: Schallwelle in Mundform wie im App-Icon */
const LOGO=(function(){
  const b=[[2.4,7.8],[14.4,10],[18,10.9],[15.9,12.7],[18,10.9],[14.4,10],[2.4,7.8]];
  return '<svg class="logo" viewBox="0 0 29 22" aria-hidden="true"><defs><linearGradient id="logo-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--acc)"/><stop offset="1" style="stop-color:var(--acc2)"/></linearGradient></defs>'+
    b.map(function(x,i){return '<rect style="--b:'+i+'" x="'+(1.3+i*4.2).toFixed(1)+'" y="'+(x[1]-x[0]/2+.6).toFixed(1)+'" width="2.6" height="'+x[0]+'" rx="1.3"/>';}).join('')+'</svg>';
})();
function ic(n){return '<span class="ic" data-key="'+n+'">'+ICON[n]+'</span>';}

/* ---------- Zustand und Speichern ---------- */
const LS='mundwerk.v1';
let state=blank();
function loadLocal(){try{const s=localStorage.getItem(LS);if(s)state=clean(JSON.parse(s));}catch(e){}}
function saveLocal(){try{localStorage.setItem(LS,JSON.stringify(state));}catch(e){}}
/* Kennung dieses Geräts für den Tageszähler. Zufällig, sie sagt nichts über dich. */
const DEV=(function(){
  const K='mundwerk.dev';
  let d='';
  try{d=localStorage.getItem(K)||'';}catch(e){}
  if(!/^[a-z0-9]{4,16}$/.test(d)){
    try{d=Array.from(crypto.getRandomValues(new Uint8Array(8)),function(b){return (b%36).toString(36);}).join('');}catch(e){d='g'+Date.now().toString(36);}
    try{localStorage.setItem(K,d);}catch(e){}
  }
  return d;
})();
/* kind: 'accent' oder 'text', damit beim Abgleich klar ist, welches Gerät sie zuletzt geändert hat */
function persist(kind){
  const t=Date.now();
  state.ts=t;
  if(kind==='accent') state.stamps.accent=t;
  else if(kind==='text') state.stamps.text=t;
  else if(kind==='goal') state.stamps.goal=t;
  saveLocal();
  if(sync) sync.changed();
}

/* ---------- Was kann dieses Gerät ---------- */
const UA=navigator.userAgent||'';
const mq=function(q){try{return window.matchMedia(q).matches;}catch(e){return false;}};
const env={
  SR:window.SpeechRecognition||window.webkitSpeechRecognition||null,
  canRec:!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder),
  tts:('speechSynthesis' in window)&&(typeof window.SpeechSynthesisUtterance!=='undefined'),
  micBlocked:false,srBroken:false,denied:0,noSpeech:0,framed:false,lang:'',
  offline:navigator.onLine===false,offMode:'',
  ios:/iP(hone|od|ad)/.test(UA)||(/Macintosh/.test(UA)&&navigator.maxTouchPoints>1),
  app:navigator.standalone===true||mq('(display-mode: standalone)')||mq('(display-mode: fullscreen)'),
  fine:mq('(hover: hover) and (pointer: fine)'),
  buzz:/Android/i.test(UA)&&('vibrate' in navigator)
};
try{env.framed=window.self!==window.top;}catch(e){env.framed=true;}
try{
  const fp=document.featurePolicy||document.permissionsPolicy;
  if(fp&&typeof fp.allowsFeature==='function'&&!fp.allowsFeature('microphone')) env.micBlocked=true;
}catch(e){}
/* iPhone: Die Spracherkennung gibt es nur direkt in Safari. In der Homescreen-App, in anderen Browsern und in
   App-internen Browsern ist sie zwar vorhanden, bleibt aber stumm oder meldet einen Fehler. Klappt sie dort doch
   einmal (Mikrofon-Test), merkt sich die App das bis zum nächsten iOS-Update. */
const PROVEN='mundwerk.srProven';
env.inApp=/FBAN|FBAV|Instagram|Snapchat|Line\/|Twitter|BytedanceWebview|musical_ly|Pinterest|GSA\//.test(UA);
env.iosOther=env.ios&&/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|YaBrowser|FBAN|FBAV|Instagram|Snapchat|Line\/|Twitter|BytedanceWebview|musical_ly|Pinterest/.test(UA);
env.iosNoSR=env.ios&&(env.app||env.iosOther);
try{if(env.iosNoSR&&localStorage.getItem(PROVEN)===UA) env.iosNoSR=false;}catch(e){}
/* auto = Mikrofon-Knopf mit Spracherkennung, dict = Diktat über die Tastatur, rec = aufnehmen und selbst vergleichen, self = vorhören und selbst bewerten */
function srOk(){return !!env.SR&&!env.srBroken&&!env.micBlocked&&!env.iosNoSR;}
/* Ohne Internet läuft die Spracherkennung meist nicht. Dann prüft die App vorübergehend anders:
   am Handy über das Diktat der Tastatur (geht oft auch offline), am Laptop im Selbst-Modus. */
function offline(){return env.offline&&state.check==='auto'&&srOk();}
function mode(){
  let c=state.check;
  if(offline()) c=env.offMode||((env.ios||/Android/i.test(UA))?'dict':'self');
  if(c==='self') return (env.canRec&&!env.micBlocked)?'rec':'self';
  if(c==='auto'&&srOk()) return 'auto';
  return 'dict';
}
function srLang(){return env.lang||(state.accent==='us'?'en-US':'en-GB');}

/* ---------- Pakete ---------- */
let customCache={key:null,packs:[]};
function customPacks(){
  const key=state.custom.text;
  if(customCache.key===key) return customCache.packs;
  const out=[],sents=splitSentences(state.custom.text);
  if(sents.length) out.push({id:'my-s',g:'own',sym:'„“',name:'Meine Sätze',sub:sents.length+(sents.length===1?' Satz':' Sätze')+' aus deinem Text',fix:'Hör den Satz erst an und sprich ihn dann in einem Zug.',tip:'',items:sents.map(function(t){return mkSent('my-s',t);})});
  customCache={key:key,packs:out};
  return out;
}
function allPacks(){return PACKS.concat(customPacks());}
function packById(id){const a=allPacks();for(let i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null;}
function recOf(id){return state.items[id]||{s:0,a:0,h:0,t:0};}
function isDone(it){return (recOf(it.id).s||0)>=it.need;}
function weakItems(){
  const out=[];
  allPacks().forEach(function(p){p.items.forEach(function(it){
    const r=state.items[it.id];
    if(r&&r.a>0&&(r.s||0)<it.need) out.push({it:it,bad:r.a-r.h,t:r.t||0});
  });});
  out.sort(function(a,b){return b.bad-a.bad||b.t-a.t;});
  return out.slice(0,15).map(function(x){return x.it;});
}
function ipaOf(it){const p=String(it.ipa||'').split('~');return (state.accent==='us'&&p[1])?p[1]:p[0];}
function sayOf(it){const p=String(it.say||'').split('~');return (state.accent==='us'&&p[1])?p[1]:p[0];}

/* ---------- Ablauf einer Übungsrunde ---------- */
let view='home',sess=null,draft='',ownMsg='',confirmReset=false,dictTimer=null,diag=null,diagBusy=false,copied=0;
/* fx: was beim nächsten Zeichnen zusätzlich passiert (Ton, Vibration, Konfetti). firstUntil: Einblenden beim Start. */
let fx={},firstUntil=0;
function cur(){return (sess&&sess.queue[sess.i])||null;}
function startSession(title,items){
  if(!items.length) return;
  stopAll();
  sess={title:title,queue:items,i:0,last:null,log:{},miss:{},take:null,howOpen:true,howUser:false,helpOpen:false,interim:'',n:0,enter:'',hot:false};
  view='practice';
  swap(function(){render();window.scrollTo(0,0);},'fwd');
  autoSpeak();
}
function openPack(id){
  const p=packById(id);
  if(!p) return;
  const open=p.items.filter(function(it){return !isDone(it);});
  startSession(p.name,open.length?open:p.items);
}
function go(d){
  if(!sess||view!=='practice') return;
  const n=sess.i+d;
  if(n<0) return;
  stopAll();
  sess.i=n;sess.last=null;sess.take=null;sess.interim='';sess.hot=false;
  if(!sess.howUser) sess.howOpen=false;
  if(n>=sess.queue.length){
    view='done';
    if(sess.queue.every(isDone)) fx.all=true;
    swap(function(){render();window.scrollTo(0,0);},'fwd');
    return;
  }
  /* Die neue Karte kommt aus der Richtung, in die du blätterst */
  sess.enter=d>0?'in-r':'in-l';
  render();window.scrollTo(0,0);autoSpeak();
}
function apply(it,v){
  const r=state.items[it.id]||(state.items[it.id]={s:0,a:0,h:0,t:0}),now=Date.now();
  r.a++;r.t=now;
  if(v==='hit'){r.h++;r.s=Math.min(it.need,(r.s||0)+1);}
  else if(v==='miss'){r.s=0;}
  /* Tagesziel: Jeder Versuch zählt, egal wie er ausgeht */
  const was=dayStats(state,now).done;
  bump(state,DEV,now);
  if(!was&&dayStats(state,now).done) fx.goal=true;
  persist();
}
/* Ton, Vibration und Konfetti fürs nächste Zeichnen vormerken */
function feel(it,v,before){
  const after=recOf(it.id).s||0;
  fx.v=v;
  if(v==='hit'){fx.tick=after-1;if(after>=it.need&&before<it.need)fx.sat=true;}
}
function onHeard(it,alts){
  if(!sess) return;
  const j=judge(it,alts);
  if(j.v==='none'){srFail('no-speech');return;}
  env.noSpeech=0;
  const before=recOf(it.id).s||0;
  (sess.log[it.id]=sess.log[it.id]||[]).push(j.top.heard);
  apply(it,j.v);
  if(j.v==='miss') sess.miss[it.id]=(sess.miss[it.id]||0)+1;
  sess.last={id:it.id,v:j.v,heard:j.top.heard,wordOk:j.top.wordOk,conf:j.top.conf,swap:!!j.swap,why:j.why||'',lost:j.v==='miss'&&before>0,n:++sess.n};
  feel(it,j.v,before);
  render();
}
function rate(ok){
  const it=cur();
  if(!it) return;
  const before=recOf(it.id).s||0;
  apply(it,ok?'hit':'miss');
  if(!ok) sess.miss[it.id]=(sess.miss[it.id]||0)+1;
  sess.last={id:it.id,v:ok?'hit':'miss',self:true,lost:!ok&&before>0,n:++sess.n};
  feel(it,ok?'hit':'miss',before);
  sess.take=null;render();
}

/* ---------- Vorlesen ---------- */
function pickVoice(){
  if(!env.tts) return null;
  let all=[];
  try{all=window.speechSynthesis.getVoices()||[];}catch(e){}
  const want=state.accent==='us'?'en-us':'en-gb';
  const en=all.filter(function(v){return /^en([-_]|$)/i.test(v.lang||'');});
  if(!en.length) return null;
  const exact=en.filter(function(v){return String(v.lang).replace('_','-').toLowerCase()===want;});
  let pool=exact.length?exact:en;
  /* Offline klingen nur die Stimmen, die auf dem Gerät liegen */
  if(env.offline){const local=pool.filter(function(v){return v.localService;});if(local.length)pool=local;}
  const bad=/eloquence|albert|bad news|bahh|bells|boing|bubbles|cellos|wobble|good news|jester|organ|superstar|trinoids|whisper|zarvox|fred|junior|kathy|ralph|eddy|flo\b|grandma|grandpa|reed|rocko|sandy|shelley/i;
  const good=/natural|neural|premium|enhanced|siri|google|daniel|kate|serena|arthur|martha|samantha|ava|allison|susan|karen|sonia|libby|ryan|aria|jenny|guy/i;
  let best=pool[0],bs=-99;
  pool.forEach(function(v){let s=0;if(good.test(v.name))s+=2;if(bad.test(v.name))s-=5;if(v.default)s+=1;if(s>bs){bs=s;best=v;}});
  return best;
}
/* Während vorgelesen wird, bewegt sich das Symbol am passenden Knopf */
let talking='',talkU=null,talkTimer=0;
function setTalk(a){
  clearTimeout(talkTimer);
  if(talking===a) return;
  talking=a;
  document.querySelectorAll('[data-talk]').forEach(function(b){b.classList.toggle('talking',!!a&&b.getAttribute('data-talk')===a);});
}
function speak(text,slow){
  if(!env.tts||!text) return;
  const tag=slow?'slow':'say';
  const run=function(){
    try{
      const u=new window.SpeechSynthesisUtterance(text),v=pickVoice();
      if(v){u.voice=v;u.lang=v.lang;}else u.lang=state.accent==='us'?'en-US':'en-GB';
      u.rate=slow?0.6:0.92;
      /* Manche Browser melden das Ende nicht zuverlässig: spätestens dann ist Schluss */
      u.onstart=function(){talkU=u;setTalk(tag);talkTimer=setTimeout(function(){setTalk('');},2000+text.length*(slow?180:110));};
      u.onend=u.onerror=function(){if(talkU===u)setTalk('');};
      window.speechSynthesis.speak(u);
    }catch(e){}
  };
  try{
    if(window.speechSynthesis.speaking||window.speechSynthesis.pending){window.speechSynthesis.cancel();setTimeout(run,80);}
    else run();
  }catch(e){}
}
function hush(){try{if(env.tts)window.speechSynthesis.cancel();}catch(e){}setTalk('');}
function autoSpeak(){const it=cur();if(it&&state.auto&&view==='practice')speak(it.text,false);}

/* ---------- Spracherkennung ---------- */
let sr=null,listening=false,srTimer=null,token=0;
function srFail(code,dt){
  let h='Nichts gehört.',b='Direkt nach dem Tippen sprechen, etwas lauter und näher am Mikro.',offer=false,safari=false;
  const viaKeys=' Die Prüfung läuft ab jetzt über das Diktat deiner Tastatur: Feld antippen, Mikrofon-Taste der Tastatur drücken, sprechen.';
  if(code==='not-allowed'){
    env.denied++;
    if((dt!==undefined&&dt<500)||env.denied>=2){
      env.micBlocked=true;h='Kein Mikrofon.';
      b='Mundwerk bekommt hier kein Mikrofon. '+(env.ios?'Erlauben kannst du es unter Einstellungen, Apps, Safari, Mikrofon.':'Erlauben kannst du es über das Symbol links neben der Adresse.')+viaKeys;
    }else{h='Mikrofon nicht erlaubt.';b='Erlaube das Mikrofon für diese Seite und tipp nochmal.';}
  }else if(code==='service-not-allowed'||code==='broken'){
    env.srBroken=true;h='Spracherkennung nicht verfügbar.';
    if(env.ios){safari=true;b='Auf dem iPhone geht sie nur direkt in Safari, nicht als Homescreen-App und nicht in anderen Apps. Außerdem muss die Diktierfunktion an sein: Einstellungen, Allgemein, Tastatur.'+viaKeys;}
    else b='Die eingebaute Spracherkennung läuft auf diesem Gerät nicht.'+viaKeys;
  }else if(code==='language-not-supported'){
    if(!env.lang&&state.accent!=='us'){env.lang='en-US';h='Britisch wird hier nicht erkannt.';b='Die Erkennung hört ab jetzt auf amerikanisches Englisch. Tipp nochmal.';}
    else{env.srBroken=true;h='Englisch wird hier nicht erkannt.';b='Die eingebaute Spracherkennung kann auf diesem Gerät kein Englisch.'+viaKeys;}
  }else if(code==='network'){h='Keine Verbindung zur Spracherkennung.';b='Sie braucht Internet. Verbindung prüfen und nochmal tippen. Ohne Internet geht das Diktat deiner Tastatur oder der Selbst-Modus.';offer=true;}
  else if(code==='audio-capture'){h='Kein Mikrofon gefunden.';b='Prüf, ob ein Mikrofon angeschlossen und nicht stummgeschaltet ist.';offer=true;}
  else{
    env.noSpeech++;
    if(env.noSpeech>=2){
      offer=true;b='Wieder kam nichts an. Wenn das Mikrofon hier nicht mitspielt, stell auf Diktat um. Dann sprichst du über das Mikrofon deiner Tastatur.';
      if(env.ios){safari=true;b+=' Auf dem iPhone klappt der Mikrofon-Knopf nur direkt in Safari.';}
    }
  }
  const it=cur();
  if(sess&&it) sess.last={id:it.id,v:'info',h:h,b:b,offer:offer,safari:safari,n:++sess.n};
  render();
}
function startListen(){
  const it=cur();
  if(!it) return;
  if(listening){clearTimeout(srTimer);try{if(sr)sr.stop();}catch(e){}return;}
  hush();
  const my=++token,t0=Date.now();
  let alts=[],judged=false,err='',r;
  try{r=new env.SR();}catch(e){srFail('broken');return;}
  sr=r;
  r.lang=srLang();
  r.interimResults=true;r.continuous=false;
  try{r.maxAlternatives=5;}catch(e){}
  const finish=function(){if(judged||my!==token)return;judged=true;listening=false;onHeard(it,alts);};
  r.onresult=function(e){
    if(my!==token) return;
    const n=e.results.length;let fin=true;
    if(n===1){const R=e.results[0];alts=[];for(let k=0;k<R.length;k++)alts.push({t:R[k].transcript,c:R[k].confidence});fin=R.isFinal;}
    else{let t='';for(let i=0;i<n;i++){t+=e.results[i][0].transcript+' ';if(!e.results[i].isFinal)fin=false;}alts=[{t:t,c:0}];}
    sess.interim=alts.length?alts[0].t:'';
    setHot();
    const el=$('#mic-label');
    if(el&&sess.interim) el.textContent='„'+sess.interim.trim()+'“';
    if(fin) finish();
  };
  r.onerror=function(e){err=(e&&e.error)||'unknown';};
  r.onsoundstart=r.onspeechstart=function(){if(my===token)setHot();};
  r.onend=function(){
    if(my!==token) return;
    listening=false;clearTimeout(srTimer);sr=null;
    if(judged){render();return;}
    if(alts.length&&(!err||err==='no-speech'||err==='aborted')) finish();
    else srFail(err||'no-speech',Date.now()-t0);
  };
  try{r.start();}catch(e){sr=null;srFail('broken');return;}
  listening=true;sess.last=null;sess.interim='';sess.hot=false;render();
  srTimer=setTimeout(function(){
    try{if(sr)sr.stop();}catch(e){}
    /* Falls der Browser nie ein Ende meldet: nicht ewig auf Zuhören stehen bleiben */
    setTimeout(function(){
      if(my!==token||!listening||judged) return;
      try{if(sr)sr.abort();}catch(e){}
      sr=null;listening=false;token++;
      if(alts.length){judged=true;onHeard(it,alts);}else srFail('no-speech');
    },1500);
  },it.kind==='s'?16000:8000);
}

/* Sobald etwas ankommt, schlagen die Balken unter dem Mikrofon stärker aus */
function setHot(){
  if(!sess||sess.hot) return;
  sess.hot=true;
  const w=$('.wave');
  if(w) w.classList.add('hot');
}

/* ---------- Aufnehmen und selbst vergleichen ---------- */
let mr=null,recOn=false,recTimer=null,actx=null;
function stopRecord(){clearTimeout(recTimer);try{if(mr&&mr.state!=='inactive')mr.stop();}catch(e){}}
async function startRecord(){
  const it=cur();
  if(!it) return;
  if(recOn){stopRecord();return;}
  hush();
  try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){actx=actx||new AC();if(actx.state==='suspended')actx.resume();}}catch(e){}
  const my=++token;
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}
  catch(e){
    env.micBlocked=true;
    if(sess) sess.last={id:it.id,v:'info',h:'Kein Mikrofon.',b:'Mundwerk bekommt hier kein Mikrofon. Stell auf Diktat um. Dann sprichst du über das Mikrofon deiner Tastatur.',offer:true,n:++sess.n};
    render();return;
  }
  const off=function(){stream.getTracks().forEach(function(t){t.stop();});};
  if(my!==token){off();return;}
  const chunks=[];
  let rec;
  try{rec=new window.MediaRecorder(stream);}catch(e){off();env.canRec=false;render();return;}
  mr=rec;
  rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data);};
  rec.onstop=function(){
    off();recOn=false;clearTimeout(recTimer);
    if(my!==token||!sess){return;}
    sess.take={id:it.id,blob:new Blob(chunks,{type:rec.mimeType||'audio/webm'}),buf:null};
    sess.last=null;render();playMine();
  };
  rec.start();recOn=true;sess.take=null;sess.last=null;render();
  recTimer=setTimeout(stopRecord,it.kind==='s'?16000:6000);
}
async function playMine(){
  const tk=sess&&sess.take;
  if(!tk) return;
  hush();
  try{
    if(!actx) throw new Error('no ctx');
    if(actx.state==='suspended') await actx.resume();
    if(!tk.buf){
      const ab=await tk.blob.arrayBuffer();
      tk.buf=await new Promise(function(res,rej){const p=actx.decodeAudioData(ab,res,rej);if(p&&p.then)p.then(res,rej);});
    }
    const src=actx.createBufferSource();
    src.buffer=tk.buf;src.connect(actx.destination);src.start();
  }catch(e){
    try{const a=new Audio(URL.createObjectURL(tk.blob));a.play().catch(function(){});}catch(e2){}
  }
}
function stopAll(){
  token++;clearTimeout(srTimer);clearTimeout(dictTimer);
  if(sr){try{sr.abort();}catch(e){}sr=null;}
  listening=false;stopRecord();recOn=false;hush();
}
function micAct(){
  const m=mode();
  if(m==='auto') startListen();
  else if(m==='rec') startRecord();
  else if(m==='dict'){const el=$('#dict');if(el){hush();el.value='';el.focus();}}
  else{const it=cur();if(it)speak(it.text,false);}
}

/* ---------- Eigener Text ---------- */
function saveOwn(){
  state.custom.text=draft.slice(0,8000);persist('text');
  const n=splitSentences(state.custom.text).length;
  ownMsg=n?(n===1?'1 Satz übernommen.':n+' Sätze übernommen.')+' Du findest sie oben unter „Meine Sätze“.':'Kein englischer Satz gefunden.';
  render();
}

/* ---------- Mundbilder ---------- */
let mouthN=0;
function mouth(kind){
  const id='mth'+(++mouthN),cx=60,cy=38;
  const S={s:[37,16],th:[40,22],w:[19,17],v:[38,15],ae:[41,30],er:[38,16],uh:[36,22],round:[25,20]}[kind]||[38,16];
  const W=S[0],H=S[1],iw=W-9,ih=Math.max(H-9,2.5);
  const lips='M'+(cx-W)+' '+cy+' C'+(cx-W*0.6)+' '+(cy-H*1.25)+' '+(cx-7)+' '+(cy-H*1.12)+' '+cx+' '+(cy-H*0.86)+' C'+(cx+7)+' '+(cy-H*1.12)+' '+(cx+W*0.6)+' '+(cy-H*1.25)+' '+(cx+W)+' '+cy+' C'+(cx+W*0.55)+' '+(cy+H*1.3)+' '+(cx-W*0.55)+' '+(cy+H*1.3)+' '+(cx-W)+' '+cy+'Z';
  const teeth=function(y,h){
    let s='<rect x="'+(cx-iw)+'" y="'+y+'" width="'+(iw*2)+'" height="'+h+'" fill="var(--tooth)"/>';
    for(let x=cx-5;x>cx-iw;x-=10) s+='<line x1="'+x+'" y1="'+y+'" x2="'+x+'" y2="'+(y+h)+'" stroke="var(--toothline)" stroke-width="1"/>';
    for(let x=cx+5;x<cx+iw;x+=10) s+='<line x1="'+x+'" y1="'+y+'" x2="'+x+'" y2="'+(y+h)+'" stroke="var(--toothline)" stroke-width="1"/>';
    return s;
  };
  let inner='';
  if(kind==='th') inner=teeth(cy-ih,9)+teeth(cy+ih-7,7)+'<ellipse cx="'+cx+'" cy="'+(cy+1.5)+'" rx="15" ry="5.5" fill="var(--tongue)" stroke="var(--lip)" stroke-width="1"/>';
  else if(kind==='ae') inner=teeth(cy-ih,7)+'<ellipse cx="'+cx+'" cy="'+(cy+ih*0.78)+'" rx="'+(iw*0.72)+'" ry="'+(ih*0.45)+'" fill="var(--tongue)"/>';
  else if(kind==='uh') inner=teeth(cy-ih,5.5)+'<ellipse cx="'+cx+'" cy="'+(cy+ih*0.78)+'" rx="'+(iw*0.7)+'" ry="'+(ih*0.42)+'" fill="var(--tongue)"/>';
  else if(kind==='er') inner=teeth(cy-ih,4)+teeth(cy+ih-3,3);
  else if(kind==='s') inner=teeth(cy-ih,ih-1)+teeth(cy+1,ih-1);
  let s='<svg class="mouth" viewBox="14 0 92 78" aria-hidden="true"><defs><clipPath id="'+id+'"><ellipse cx="'+cx+'" cy="'+cy+'" rx="'+iw+'" ry="'+ih+'"/></clipPath></defs>'+
    '<path d="'+lips+'" fill="var(--lip)"/><ellipse cx="'+cx+'" cy="'+cy+'" rx="'+iw+'" ry="'+ih+'" fill="var(--cavity)"/><g clip-path="url(#'+id+')">'+inner+'</g>';
  if(kind==='v'){
    s+='<rect x="'+(cx-20)+'" y="'+(cy-4)+'" width="40" height="11" rx="2.5" fill="var(--tooth)" stroke="var(--toothline)" stroke-width="1"/>';
    [-10,0,10].forEach(function(dx){s+='<line x1="'+(cx+dx)+'" y1="'+(cy-4)+'" x2="'+(cx+dx)+'" y2="'+(cy+7)+'" stroke="var(--toothline)" stroke-width="1"/>';});
  }
  return s+'</svg>';
}

/* ---------- Diktat über die Tastatur: braucht kein Mikrofon-Recht der Seite ---------- */
function dictJudge(){
  clearTimeout(dictTimer);
  const el=$('#dict'),it=cur();
  if(!el||!it||view!=='practice') return;
  const val=el.value;
  if(!val.trim()) return;
  try{el.blur();}catch(e){}
  onHeard(it,[{t:val,c:0}]);
}
function helpHTML(){
  return '<details class="help"'+(sess.helpOpen?' open':'')+'><summary>Diktat einrichten</summary>'+
    '<p><b>iPhone:</b> Einstellungen, Allgemein, Tastatur. Dort die Diktierfunktion einschalten und unter Tastaturen Englisch hinzufügen. Beim Üben mit der Weltkugel-Taste auf Englisch wechseln, dann die Mikrofon-Taste drücken.</p>'+
    '<p><b>Android:</b> In den Einstellungen der Tastatur unter Sprachen Englisch hinzufügen. Beim Üben die Leertaste gedrückt halten und Englisch wählen, dann auf das Mikrofon der Tastatur tippen.</p>'+
    '<p><b>Computer:</b> Windows-Taste und H, auf dem Mac die Diktier-Taste. Die Eingabesprache muss Englisch sein.</p></details>';
}

/* ---------- iPhone: Weg nach Safari ---------- */
function pageUrl(){return location.href.split('#')[0];}
function safariHTML(){
  return '<div class="btns"><a class="btn" href="x-safari-'+esc(pageUrl())+'">In Safari öffnen</a><button class="btn quiet" data-act="copy-url">'+(copied?'Kopiert':'Adresse kopieren')+'</button></div>'+
    '<p class="small">Klappt der erste Knopf nicht: Adresse kopieren, Safari öffnen, oben in die Adresszeile tippen und einfügen.</p>';
}
async function copyUrl(){
  const url=pageUrl();
  let ok=false;
  try{await navigator.clipboard.writeText(url);ok=true;}catch(e){}
  if(!ok){
    try{const ta=document.createElement('textarea');ta.value=url;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,url.length);ok=document.execCommand('copy');ta.remove();}catch(e){}
  }
  if(!ok){window.prompt('Adresse kopieren:',url);return;}
  copied=Date.now();render();
  setTimeout(function(){if(Date.now()-copied>=2400){copied=0;softRender();}},2500);
}

/* ---------- Mikrofon-Test: zeigt, was diese Ansicht erlaubt ---------- */
async function runDiag(){
  if(diagBusy) return;
  diagBusy=true;diag=null;stopAll();render();window.scrollTo(0,0);
  const d={sr:'none',gum:'none',sig:null,policy:'?',runs:false,strict:env.ios};
  let ac=null;
  try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){ac=new AC();if(ac.state==='suspended')ac.resume();}}catch(e){}
  try{const fp=document.featurePolicy||document.permissionsPolicy;if(fp&&typeof fp.allowsFeature==='function')d.policy=fp.allowsFeature('microphone')?'ok':'blocked';}catch(e){}
  if(env.SR){
    /* Auf dem iPhone beweist das Mikrofon-Lämpchen nichts: Dort zählt die Erkennung erst, wenn wirklich Text ankommt. */
    d.sr=await new Promise(function(res){
      let r,done=false,started=false,audio=false;
      const fin=function(x){if(done)return;done=true;try{r.abort();}catch(e){}res(x);};
      try{r=new env.SR();}catch(e){res('ctor');return;}
      r.lang='en-US';r.interimResults=true;
      r.onstart=function(){started=true;};
      r.onaudiostart=function(){audio=true;if(!d.strict)fin('ok');};
      r.onresult=function(){fin('ok');};
      r.onerror=function(e){fin('err:'+((e&&e.error)||'unknown'));};
      r.onend=function(){fin(d.strict?(audio?'mute':'silent'):started?'ok':'silent');};
      try{r.start();}catch(e){fin('throw');return;}
      setTimeout(function(){fin(d.strict?(audio?'mute':'timeout'):started?'ok':'timeout');},10000);
    });
  }
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
    try{
      const s=await navigator.mediaDevices.getUserMedia({audio:true});
      d.gum='ok';
      try{
        if(ac){
          const src=ac.createMediaStreamSource(s),an=ac.createAnalyser(),buf=new Uint8Array(1024),t0=Date.now();
          an.fftSize=1024;src.connect(an);
          let peak=0;
          await new Promise(function(res){(function tick(){
            an.getByteTimeDomainData(buf);
            for(let i=0;i<buf.length;i++){const v=Math.abs(buf[i]-128);if(v>peak)peak=v;}
            if(Date.now()-t0<1800)setTimeout(tick,60);else res();
          })();});
          d.sig=peak>4;
        }
      }catch(e){}
      s.getTracks().forEach(function(x){x.stop();});
    }catch(e){d.gum=(e&&e.name)||'error';}
  }
  try{if(ac)ac.close();}catch(e){}
  d.runs=d.strict?d.sr==='ok':(d.sr==='ok'||d.sr==='err:no-speech'||d.sr==='err:network');
  if(d.runs){
    env.micBlocked=false;env.srBroken=false;env.denied=0;env.noSpeech=0;
    if(env.iosNoSR){env.iosNoSR=false;try{localStorage.setItem(PROVEN,UA);}catch(e){}}
  }
  else if(d.sr==='err:not-allowed'||d.policy==='blocked'||d.gum==='NotAllowedError'||d.gum==='SecurityError') env.micBlocked=true;
  else if(env.SR&&!env.iosNoSR&&d.sr!=='timeout'&&d.sr!=='mute'&&d.sr!=='err:no-speech') env.srBroken=true;
  diag=d;diagBusy=false;render();window.scrollTo(0,0);
}
function diagHTML(){
  if(diagBusy) return '<div class="diag" data-key="diag"><p>Test läuft. Sag ein paar englische Wörter, zum Beispiel „hello, this is a test“. Falls eine Abfrage erscheint: Mikrofon erlauben.</p></div>';
  if(!diag) return '';
  const d=diag,sr=d.sr,g=d.gum;
  const a='Ansicht: '+(env.framed?'eingebettet':env.app?'Homescreen-App':env.iosOther?'anderer Browser oder App':'direkt im Browser');
  const b='Eingebaute Spracherkennung: '+(sr==='none'?'gibt es hier nicht':d.runs?'läuft':sr==='mute'?'Mikrofon an, aber es kam kein Text zurück':sr==='err:not-allowed'?'gesperrt':sr==='err:service-not-allowed'?'vom Gerät nicht freigegeben':sr==='err:no-speech'?'hat nichts gehört':sr==='timeout'?'keine Antwort':'Fehler ('+sr.replace('err:','')+')');
  const c='Mikrofon für Aufnahmen: '+(g==='ok'?(d.sig===false?'frei, aber es kam kein Ton an':d.sig?'frei, Ton kommt an':'frei'):g==='none'?'gibt es hier nicht':(g==='NotAllowedError'||g==='SecurityError')?'gesperrt':g==='NotFoundError'?'kein Mikrofon gefunden':'Fehler ('+g+')');
  let res;
  if(d.runs) res='Der Mikrofon-Knopf der App funktioniert hier.'+(state.check!=='auto'?' Stell die Prüfung unten auf Mikro.':'');
  else if(env.ios) res='Auf dem iPhone klappt der Mikrofon-Knopf nur direkt in Safari. Hier geht das Diktat über die Tastatur'+(g==='ok'?' oder Aufnehmen und selbst vergleichen (Prüfung unten auf Selbst).':'.');
  else if(g==='ok') res='Automatisch prüfen geht hier nur über das Diktat der Tastatur. Aufnehmen und selbst vergleichen geht auch: Prüfung unten auf Selbst stellen.';
  else res='Hier geht nur das Diktat über die Tastatur. Für den Mikrofon-Knopf Mundwerk in Chrome oder Edge (Windows, Android) oder Safari (iPhone, Mac) öffnen.';
  return '<div class="diag" data-key="diag"><p>'+esc(a)+'<br>'+esc(b)+'<br>'+esc(c)+'</p><p><b>'+esc(res)+'</b></p>'+(!d.runs&&env.ios?safariHTML():'')+
    '<p class="small">Code für Rückfragen: '+esc([env.framed?'E':env.app?'A':'D',env.ios?'i':'-',d.policy,sr,g,d.sig===null?'-':(d.sig?'1':'0')].join(' / '))+'</p></div>';
}

/* ---------- Aussehen: dunkel (Standard), hell oder wie das Gerät eingestellt ist. Gilt nur für dieses Gerät. ---------- */
function lightOf(t){return t==='light'||(t==='auto'&&mq('(prefers-color-scheme: light)'));}
function applyTheme(){
  const t=state.theme==='light'||state.theme==='auto'?state.theme:'dark';
  document.documentElement.dataset.theme=t;
  const light=lightOf(t);
  const m=document.querySelector('meta[name="theme-color"]');
  if(m) m.setAttribute('content',light?'#F3F4EE':'#09090B');
}
try{window.matchMedia('(prefers-color-scheme: light)').addEventListener('change',function(){if(state.theme==='auto')applyTheme();});}catch(e){}

/* ---------- Synchronisierung zwischen Geräten (nur nach Anmeldung mit Google) ---------- */
const SYNC='mundwerk.sync';
let sync=null,syncLoad=false,syncUser=null,syncStat='',syncCode='',syncAt=0,syncTap=false;
function syncOn(){return !!(FIREBASE.apiKey&&FIREBASE.projectId)&&!env.framed;}
function loadSync(){
  if(sync||syncLoad||!syncOn()) return Promise.resolve(sync);
  syncLoad=true;softRender();
  return import('./sync.js').then(function(m){
    sync=m.startSync({
      get:function(){return state;},
      take:function(other){const old=state.custom.text;state=merge(state,other);saveLocal();if(draft===old)draft=state.custom.text;softRender();},
      user:function(u){syncUser=u;try{if(u)localStorage.setItem(SYNC,'1');else localStorage.removeItem(SYNC);}catch(e){}if(u)syncTap=false;softRender();},
      status:function(st,code){syncStat=st;syncCode=code||'';if(st==='ok')syncAt=Date.now();softRender();}
    });
    syncLoad=false;softRender();return sync;
  }).catch(function(){syncLoad=false;syncStat='error';syncCode='load';softRender();return null;});
}
function signIn(){
  syncCode='';syncStat='';
  loadSync().then(function(s){
    if(!s) return;
    s.prepare().then(function(){
      /* Das Anmeldefenster darf nur direkt nach einem Tippen aufgehen. Hat die Vorbereitung zu lange gedauert: nochmal tippen lassen. */
      const ua=navigator.userActivation;
      if(!ua||ua.isActive){syncTap=false;s.signIn();}
      else{syncTap=true;softRender();}
    });
  });
}
function syncText(){
  if(syncLoad) return 'Einen Moment …';
  if(syncStat==='busy') return 'Wird abgeglichen …';
  if(syncStat==='offline') return 'Offline. Sobald du wieder online bist, wird abgeglichen.';
  if(syncStat==='ok'){const d=new Date(syncAt);return 'Abgeglichen um '+d.getHours()+':'+String(d.getMinutes()).padStart(2,'0')+' Uhr.';}
  if(syncStat!=='error') return '';
  const c=syncCode;
  if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request'||c==='auth/user-cancelled') return '';
  if(c==='auth/popup-blocked') return 'Das Anmeldefenster wurde blockiert. Tipp nochmal auf „Mit Google anmelden“.';
  if(c==='auth/unauthorized-domain') return 'Diese Adresse ist in Firebase noch nicht freigegeben (Authentication, Settings, Authorized domains).';
  if(c==='auth/operation-not-allowed') return 'Die Anmeldung mit Google ist in Firebase noch nicht eingeschaltet.';
  if(c==='auth/network-request-failed'||c==='unavailable'||c==='deadline-exceeded') return 'Keine Verbindung zum Server. Neuer Versuch, sobald du wieder online bist.';
  if(c==='permission-denied') return 'Kein Zugriff auf deine Daten. Prüf die Sicherheitsregeln in Firebase.';
  if(c==='auth/web-storage-unsupported'||c==='auth/operation-not-supported-in-this-environment') return 'In dieser Ansicht geht die Anmeldung nicht. Öffne Mundwerk in Safari oder Chrome.';
  if(c==='load') return 'Die Synchronisierung konnte nicht geladen werden. Prüf die Internetverbindung.';
  return 'Das hat nicht geklappt'+(c?' ('+c+')':'')+'. Versuch es nochmal.';
}
function syncHTML(){
  if(!syncOn()) return '';
  const msg=syncText();
  let h='<div class="set wide"><span class="set-label">Auf allen Geräten gleich<span class="set-help">';
  if(syncUser){
    const who=syncUser.name&&syncUser.email?syncUser.name+' ('+syncUser.email+')':(syncUser.name||syncUser.email);
    h+=esc('Angemeldet als '+who+'. Dein Fortschritt wird automatisch mit deinen anderen Geräten abgeglichen.'+(msg?' '+msg:''))+'</span></span>';
    h+='<div class="btns"><button class="btn quiet" data-act="sync-now"'+(syncStat==='busy'?' disabled':'')+'>Jetzt abgleichen</button><button class="btn quiet" data-act="sync-out">Abmelden</button></div></div>';
    return h;
  }
  let help='Melde dich mit deinem Google-Konto an, dann ist dein Fortschritt auf Handy und Laptop gleich. Ohne Anmeldung bleibt alles nur auf diesem Gerät.';
  if(env.ios&&env.app) help+=' Auf dem iPhone klappt die Anmeldung meist nur in Safari, nicht in der Homescreen-App.';
  else if(env.inApp) help+=' In App-Browsern lässt Google keine Anmeldung zu. Öffne Mundwerk in Safari oder Chrome.';
  if(syncTap) help+=' Fertig geladen: Tipp jetzt auf „Jetzt anmelden“.';
  if(msg&&!syncLoad) help+=' '+msg;
  h+=esc(help)+'</span></span><div class="btns"><button class="btn solid" data-act="sync-in"'+(syncLoad?' disabled':'')+'>'+(syncLoad?'Einen Moment …':syncTap?'Jetzt anmelden':'Mit Google anmelden')+'</button></div></div>';
  return h;
}

/* ---------- Offline und Updates ---------- */
let waiting=null,updLater=false,reloading=false,skipping=false,version='';
const UPD='mundwerk.updReload';
function swSetup(){
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol)) return;
  const sw=navigator.serviceWorker;
  let had=!!sw.controller;
  sw.addEventListener('controllerchange',function(){
    if(!had){had=true;readVersion();return;}
    try{sessionStorage.removeItem(UPD);}catch(e){}
    if(!reloading){reloading=true;location.reload();}
  });
  sw.register('sw.js',{updateViaCache:'none'}).then(function(reg){
    const check=function(){reg.update().catch(function(){});};
    if(reg.waiting&&sw.controller) ready(reg.waiting);
    reg.addEventListener('updatefound',function(){
      const w=reg.installing;
      if(w) w.addEventListener('statechange',function(){if(w.state==='installed'&&sw.controller) ready(w);});
    });
    /* Kommt die App aus dem Hintergrund zurück, nach einer neuen Version schauen */
    document.addEventListener('visibilitychange',function(){if(!document.hidden) check();});
    setInterval(check,3600000);
  }).catch(function(){});
  readVersion();
  try{if(navigator.storage&&navigator.storage.persist&&!/Firefox\//.test(UA)) navigator.storage.persist().catch(function(){});}catch(e){}
}
/* Neue Version liegt bereit: auf der Übersicht sofort starten. Mitten im Üben oder mit ungespeichertem Text erst beim Weg zur Übersicht. */
function ready(w){waiting=w;applyUpdate(false);}
function applyUpdate(force){
  if(!waiting||reloading||skipping) return;
  const a=document.activeElement,typing=!!a&&(a.tagName==='TEXTAREA'||a.tagName==='INPUT');
  if(!force&&(view!=='home'||listening||recOn||diagBusy||typing||draft!==state.custom.text)){if(!updLater){updLater=true;softRender();}return;}
  skipping=true;
  const w=waiting,fonts=(document.fonts&&document.fonts.ready)||Promise.resolve();
  /* Erst umschalten, wenn nachgeladene Schriften da sind: Ist beim Umschalten gerade eine Datei unterwegs, bleibt Chrome hängen. */
  fonts.then(function(){
    setTimeout(function(){
      w.postMessage('skip');
      /* Hängt es trotzdem, löst einmal Neuladen den Knoten. Höchstens zweimal pro Sitzung, damit nichts im Kreis lädt. */
      setTimeout(function(){
        if(reloading) return;
        let n=0;
        try{n=+sessionStorage.getItem(UPD)||0;sessionStorage.setItem(UPD,String(n+1));}catch(e){n=9;}
        if(n<2){reloading=true;location.reload();}
        else{skipping=false;updLater=true;softRender();}
      },4000);
    },150);
  });
}
function readVersion(){
  const c=navigator.serviceWorker&&navigator.serviceWorker.controller;
  if(!c||!window.MessageChannel) return;
  const ch=new MessageChannel();
  ch.port1.onmessage=function(e){version=String(e.data||'');softRender();};
  c.postMessage('version',[ch.port2]);
}
/* Auf den Home-Bildschirm: Anleitung passend zum Gerät. iPhone: als Lesezeichen, denn in der Web-App fehlt die Spracherkennung. */
function installHelp(){
  if(env.ios) return env.iosOther?'Das geht nur in Safari. Öffne Mundwerk dort.':'Teilen (bei neueren iPhones erst auf „…“ tippen), dann „Zum Home-Bildschirm“. Schalte dort „Als Web-App öffnen“ aus, sonst geht das Mikrofon nicht.';
  if(/Android/i.test(UA)) return 'Chrome-Menü ⋮ oben rechts, dann „Zum Startbildschirm hinzufügen“ oder „App installieren“.';
  if(/Edg\//.test(UA)) return 'Menü … oben rechts, dann „Apps“ und „Diese Website als App installieren“.';
  if(/Safari\//.test(UA)&&!/Chrome\//.test(UA)) return 'In Safari: Menü „Ablage“, dann „Zum Dock hinzufügen“.';
  return 'Rechts in der Adressleiste auf das Symbol „Installieren“ klicken. Dann startet Mundwerk wie ein eigenes Programm.';
}
function versionText(){
  const v=/^(\d{4})-(\d\d)-(\d\d)-(\w+)$/.exec(version);
  return v?'Version vom '+v[3]+'.'+v[2]+'.'+v[1]+' ('+v[4].slice(0,4)+'), startet auch ohne Internet.':'';
}
window.addEventListener('online',function(){env.offline=false;env.offMode='';softRender();});
window.addEventListener('offline',function(){env.offline=true;softRender();});
function updateHTML(){
  if(!updLater||!waiting) return '';
  return '<div class="note" data-key="upd"><p><b>Neue Version bereit.</b> '+(draft!==state.custom.text?'Übernimm erst deinen Text, dann neu laden.':'Klappt das Neuladen nicht, schließ Mundwerk einmal ganz und öffne es neu.')+'</p><div class="btns"><button class="btn" data-act="update">Jetzt neu laden</button></div></div>';
}
function offlineHTML(full){
  if(!offline()) return '';
  const m=mode(),cm=m==='auto'?'auto':m==='dict'?'dict':'self';
  const seg=segHTML('Prüfung ohne Internet','offmode',[['dict','Diktat'],['self','Selbst'],['auto','Mikro']],cm);
  if(!full) return '<div class="note" data-key="off"><p><b>Offline.</b> '+(cm==='auto'?'Ohne Internet hört das Mikro nur auf manchen Geräten.':cm==='dict'?'Geprüft wird über das Diktat deiner Tastatur.':'Anhören, nachsprechen, selbst vergleichen.')+'</p><div class="btns">'+seg+'</div></div>';
  return '<div class="note" data-key="off"><p><b>Du bist offline.</b> Die Spracherkennung braucht meist Internet. Bis du wieder online bist, prüft die App anders: über das Diktat deiner Tastatur (klappt auf vielen Handys auch ohne Internet) oder im Selbst-Modus (anhören, nachsprechen, selbst vergleichen). Danach ist der Mikrofon-Knopf von allein zurück.</p><div class="btns">'+seg+'</div></div>';
}

/* ---------- Ansichten ---------- */
function modeNote(){
  let h='';
  if(!srOk()){
    let why,more,tip='',safari=false;
    const dict='Bis dahin prüft die App über das Diktat deiner Tastatur: Feld antippen, Tastatur auf Englisch stellen, Mikrofon-Taste der Tastatur drücken, sprechen.';
    if(env.iosNoSR&&env.app){
      why='Als Homescreen-App bekommt Mundwerk auf dem iPhone keine Spracherkennung.';
      more='Das liegt an Apple: Sie läuft nur direkt in Safari. Öffne Mundwerk deshalb in Safari.';
      tip='Dauerhafte Lösung: Lösch dieses Icon. Öffne Mundwerk in Safari und füg es neu zum Home-Bildschirm hinzu. Schalte dabei „Als Web-App öffnen“ aus. Dann startet das Icon in Safari, mit Mikrofon.';
      safari=true;
    }else if(env.iosNoSR){
      why='Auf dem iPhone gibt es die Spracherkennung nur direkt in Safari.';
      more='Du bist gerade in einem anderen Browser oder in einer App. Öffne Mundwerk in Safari.';
      safari=true;
    }else if(env.micBlocked){
      why='Mundwerk bekommt hier kein Mikrofon.';
      more=env.ios?'Erlauben kannst du es unter Einstellungen, Apps, Safari, Mikrofon. Danach die Seite neu laden.':'Erlauben kannst du es über das Symbol links neben der Adresse: Mikrofon auf Zulassen. Danach die Seite neu laden.';
    }else if(!env.SR){
      why='Dieser Browser hat keine eingebaute Spracherkennung.';
      more='Nimm Chrome oder Edge (Windows, Android) oder Safari (iPhone, Mac).';
    }else{
      why='Die eingebaute Spracherkennung läuft hier nicht.';
      more=env.ios?'Auf dem iPhone braucht sie Safari und die eingeschaltete Diktierfunktion (Einstellungen, Allgemein, Tastatur).':'Prüf die Internetverbindung und teste das Mikrofon.';
      safari=env.ios;
    }
    const link=(env.framed&&/^https:/.test(location.href))?' <a href="'+esc(location.href)+'" target="_blank" rel="noopener">Seite direkt im Browser öffnen</a>':'';
    h+='<div class="note" data-key="mode"><p><b>'+why+'</b> '+esc(more)+link+'</p>'+(safari?safariHTML():'')+(tip?'<p>'+esc(tip)+'</p>':'')+'<p>'+esc(dict)+'</p>'+
      '<div class="btns"><button class="btn quiet" data-act="diag"'+(diagBusy?' disabled':'')+'>Mikrofon testen</button></div></div>';
  }
  return h+diagHTML();
}
function ownHTML(){
  return '<div class="own"><p>Füg dein Referat oder einen anderen englischen Text ein. Du übst ihn dann Satz für Satz.</p>'+
    '<textarea id="own" lang="en" spellcheck="false" aria-label="Eigener englischer Text" placeholder="Today we are going to talk about …"></textarea><div class="btns">'+
    '<button class="btn solid" data-act="own-save">Sätze übernehmen</button></div><p class="own-msg" aria-live="polite">'+esc(ownMsg)+'</p></div>';
}
/* Wo es weitergeht: das Paket, in dem zuletzt geübt wurde und noch etwas offen ist, sonst das erste offene */
function nextPack(){
  let best=null,bt=-1;
  allPacks().forEach(function(p){
    const open=p.items.filter(function(it){return !isDone(it);}).length;
    if(!open) return;
    let t=0;
    p.items.forEach(function(it){const r=state.items[it.id];if(r&&r.t>t)t=r.t;});
    if(t>bt){bt=t;best={p:p,open:open};}
  });
  return best;
}
function rowHTML(act,id,sym,name,sub,count,share,cls){
  return '<button class="row'+(cls?' '+cls:'')+'" data-act="'+act+'"'+(id?' data-id="'+esc(id)+'"':'')+'><span class="sym" lang="en" aria-hidden="true">'+esc(sym)+'</span>'+
    '<span class="row-txt"><span class="row-name">'+esc(name)+'</span><span class="row-sub">'+esc(sub)+'</span></span>'+
    (count?'<span class="row-count">'+count+'</span>':'')+(share>0?'<i class="row-line" style="width:'+Math.round(share*1000)/10+'%"></i>':'')+'</button>';
}
const two=function(n,tot){return tot>=10&&n<10?'0'+n:String(n);};
/* Umschalter mit gleitender Markierung: --n Knöpfe, --i ist der gewählte */
function segHTML(label,act,opts,cur){
  let i=-1;
  const b=opts.map(function(o,k){const on=o[0]===cur;if(on)i=k;return '<button data-act="'+act+'" data-v="'+o[0]+'" aria-pressed="'+on+'">'+o[1]+'</button>';}).join('');
  return '<span class="seg" role="group" aria-label="'+label+'" style="--n:'+opts.length+';--i:'+Math.max(0,i)+'"'+(i<0?' data-none=""':'')+'>'+b+'</span>';
}
/* Fortschrittsring: p von 0 bis 1 */
function ringHTML(r,p){
  const w=2*r+10,c=r+5;
  return '<svg class="ring'+(p>0?'':' zero')+'" viewBox="0 0 '+w+' '+w+'" aria-hidden="true" style="--c:'+(2*Math.PI*r).toFixed(1)+'px;--p:'+Math.min(1,p).toFixed(4)+'">'+
    '<circle class="ring-bg" cx="'+c+'" cy="'+c+'" r="'+r+'"/><circle class="ring-fg" cx="'+c+'" cy="'+c+'" r="'+r+'"/></svg>';
}
function goalHTML(st,small){
  const lab='Heute '+st.today+' von '+st.goal+' Versuchen'+(st.done?', Tagesziel geschafft':'');
  if(small) return '<div class="top-goal'+(st.done?' done':'')+'" role="img" aria-label="'+lab+'">'+ringHTML(9,st.today/st.goal)+'<span>'+st.today+'</span></div>';
  return '<div class="goal'+(st.done?' done':'')+'" role="img" aria-label="'+lab+'"><span class="goal-ring">'+ringHTML(30,st.today/st.goal)+'<b>'+st.today+'</b></span>'+
    '<span class="goal-txt">'+(st.done?'Ziel geschafft':'von '+st.goal+' heute')+'</span></div>';
}
function streakHTML(st){
  if(!st.streak) return '';
  return '<span class="streak'+(st.done?' lit':'')+'" role="img" aria-label="Serie: '+st.streak+(st.streak===1?' Tag':' Tage')+' am Stück'+(st.done?'':', heute noch offen')+'">'+ICON.flame+'<b>'+st.streak+'</b></span>';
}
/* Die große Zahl zählt hoch, wenn mehr sitzt als beim letzten Blick auf die Übersicht */
let shown=null,numNow=null,homeOk=0;
function countHome(){
  const ok=homeOk;
  if(ok===shown) return;
  const from=shown===null?0:shown,el=$('.num');
  shown=ok;
  if(el) countTo(el,from,ok,from===0?1000:650,function(v){numNow=v===ok?null:v;});
}
function homeHTML(){
  const packs=allPacks(),weak=weakItems(),m=mode(),next=nextPack(),st=dayStats(state,Date.now());
  let tot=0,ok=0;
  packs.forEach(function(p){p.items.forEach(function(it){tot++;if(isDone(it))ok++;});});
  homeOk=ok;
  const how=m==='auto'?'Du sprichst, die Spracherkennung schreibt mit.':m==='dict'?'Du sprichst über das Mikrofon deiner Tastatur.':m==='rec'?'Du nimmst dich auf und vergleichst.':'Du sprichst nach und bewertest dich selbst.';
  const on=ok?Math.max(1,Math.round(ok/tot*30)):0,num=calm()?ok:numNow!==null?numNow:shown===null?0:shown;
  let segs='';
  for(let k=0;k<30;k++) segs+='<i style="--k:'+k+'"'+(k<on?' class="on"':'')+'></i>';
  let h='<header class="mast" data-key="mast"><div class="brand-row"><h1 class="brand">'+LOGO+'<span>Mundwerk</span></h1><div class="tools">'+streakHTML(st)+
    '<button class="icon-btn" data-act="settings" aria-label="Einstellungen">'+ICON.gear+'</button></div></div>'+
    '<div class="stat-row"><div class="stat" role="img" aria-label="'+ok+' von '+tot+' sitzen"><span class="num">'+num+'</span><span class="of">/ '+tot+'</span></div>'+goalHTML(st,false)+'</div>'+
    '<p class="cap">Wörter und Sätze sitzen. '+how+' Drei Treffer am Stück, dann ist es deins.</p>'+
    '<div class="segs" aria-hidden="true">'+segs+'</div>'+
    '<div class="acc-row">'+segHTML('Akzent','acc',[['gb','Britisch'],['us','Amerikanisch']],state.accent)+'</div></header>';
  h+=updateHTML()+offlineHTML(true)+modeNote();
  if(next) h+='<button class="cta" data-key="cta" data-act="open" data-id="'+esc(next.p.id)+'"><span>Weiter üben<small>'+esc(next.p.name)+' · '+next.open+' offen</small></span>'+ICON.right+'</button>';
  if(weak.length) h+='<section class="group" data-key="weak"><h2>Offen vom letzten Mal</h2><div class="list">'+rowHTML('weak','','!','Schwächen',weak.length+(weak.length===1?' Eintrag, der':' Einträge, die')+' zuletzt daneben '+(weak.length===1?'ging':'gingen'),'',0,'weak')+'</div></section>';
  let gi=0;
  GROUPS.forEach(function(g){
    const ps=packs.filter(function(p){return p.g===g[0];});
    if(!ps.length&&g[0]!=='own') return;
    h+='<section class="group" data-key="g-'+g[0]+'" style="--gi:'+Math.min(gi++,8)+'"><h2>'+esc(g[1])+'</h2>';
    if(ps.length) h+='<div class="list">'+ps.map(function(p){
      const n=p.items.length,d=p.items.filter(isDone).length;
      return rowHTML('open',p.id,p.sym,p.name,p.sub,two(d,n)+'/'+n,n?d/n:0,d===n?'full':'');
    }).join('')+'</div>';
    if(g[0]==='own') h+=ownHTML();
    h+='</section>';
  });
  h+='<section class="group" id="einstellungen" data-key="set"><h2>Einstellungen</h2><div class="settings">';
  const cm=m==='auto'?'auto':m==='dict'?'dict':'self';
  h+='<div class="set stack"><span class="set-label">Prüfung<span class="set-help">Mikrofon der App, Diktat über die Tastatur oder selbst vergleichen.</span></span>'+
    segHTML('Prüfung','check',(srOk()?[['auto','Mikro']]:[]).concat([['dict','Diktat'],['self','Selbst']]),cm)+'</div>';
  h+='<div class="set"><span class="set-label">Mikrofon-Test<span class="set-help">Zeigt, ob und wie die App dich hören kann.</span></span><button class="btn quiet" data-act="diag"'+(diagBusy?' disabled':'')+'>Testen</button></div>';
  h+='<div class="set stack"><span class="set-label">Tagesziel<span class="set-help">So viele Versuche nimmst du dir pro Tag vor. Schaffst du das mehrere Tage hintereinander, wächst deine Serie.</span></span>'+
    segHTML('Tagesziel','goal',GOALS.map(function(g){return [String(g),String(g)];}),String(state.goal))+'</div>';
  h+='<div class="set stack"><span class="set-label">'+(env.buzz?'Töne und Vibration':'Töne')+'<span class="set-help">'+(env.buzz?'Leise Töne und eine kurze Vibration bei Treffern.':'Leise Töne bei Treffern.')+(env.ios?' Im Lautlos-Modus bleibt das iPhone still.':'')+'</span></span>'+
    segHTML('Töne','sound',[['on','An'],['off','Aus']],state.sound?'on':'off')+'</div>';
  h+='<div class="set stack"><span class="set-label">Aussehen<span class="set-help">Dunkel, hell oder wie dein Gerät eingestellt ist.</span></span>'+
    segHTML('Aussehen','theme',[['dark','Dunkel'],['light','Hell'],['auto','Auto']],state.theme)+'</div>';
  if(env.tts) h+='<div class="set stack"><span class="set-label">Vorsprechen<span class="set-help">Jedes neue Wort wird einmal vorgelesen.</span></span>'+segHTML('Vorsprechen','auto',[['on','An'],['off','Aus']],state.auto?'on':'off')+'</div>';
  if(!env.app&&!env.framed) h+='<div class="set"><span class="set-label">Auf den Home-Bildschirm<span class="set-help">'+esc(installHelp())+'</span></span></div>';
  h+=syncHTML();
  h+='<div class="set"><span class="set-label">Fortschritt<span class="set-help">'+(confirmReset?'Wirklich alle Haken und die Serie löschen?'+(syncUser?' Auch auf deinen anderen Geräten.':''):'Alle Haken und die Serie löschen und von vorn anfangen.')+'</span></span>'+
    (confirmReset?'<span class="btns" style="margin:0;flex-wrap:nowrap"><button class="btn danger" data-act="reset-yes">Löschen</button><button class="btn quiet" data-act="reset-no">Behalten</button></span>':'<button class="btn quiet" data-act="reset">Zurücksetzen</button>')+'</div>';
  h+='</div></section>';
  h+='<footer class="foot" data-key="foot">'+(m==='auto'||m==='dict'?'<p>Die Spracherkennung ist streng, aber kein perfekter Richter. Verwechslungen wie think und sink hört sie gut, feine Klangunterschiede nicht. Versteht sie ein Wort dauerhaft falsch, obwohl es für dich wie die Vorlage klingt, geh weiter.</p>':'<p>Bei der Selbstbewertung gilt: lieber einmal zu streng.</p>')+
    '<p>'+(syncUser?'Dein Fortschritt liegt auf diesem Gerät und in deinem privaten Firebase-Speicher. Nur du kannst ihn lesen.':'Dein Fortschritt bleibt auf diesem Gerät.')+' Keine Werbung, kein Tracking.</p>'+(version?'<p>'+esc(versionText())+'</p>':'')+'</footer>';
  return h;
}
function sentHTML(it,marks){
  /* Jedes Wort lässt sich antippen und einzeln anhören */
  return it.raw.split(/\s+/).filter(Boolean).map(function(w,i){return '<span class="w'+(marks&&marks[i]===false?' bad':'')+'" data-act="hear" data-v="'+esc(w.replace(/[\[\]]/g,''))+'">'+hl(w)+'</span>';}).join(' ');
}
function verdictHTML(it,last,pk){
  if(!last) return '';
  const s=recOf(it.id).s||0,left=it.need-s;
  const heard=last.heard?'„<span class="heard" lang="en">'+esc(last.heard)+'</span>“':'';
  let cls=last.v,h='',b='';
  if(last.v==='hit'){
    if(s>=it.need){h='Sitzt.';b='<p>'+(it.need===3?'Drei':'Zwei')+' saubere Treffer am Stück.</p>';}
    else{h='Treffer.';b='<p>Noch '+(left===1?'einer':'zwei')+' am Stück, dann sitzt es.</p>';}
    if(last.conf>0) b+='<p class="small">Die Erkennung war sich zu '+Math.round(last.conf*100)+' % sicher.</p>';
  }else if(last.v==='near'){
    h='Knapp.';
    b=last.why==='alt'?'<p>Gehört: '+heard+'. Die Erkennung hat zwischen mehreren Wörtern geschwankt. Das gibt keinen Haken, kostet aber auch keinen. Nochmal, deutlicher.</p>':'<p>Gehört: '+heard+'. Die rot unterringelten Wörter kamen nicht sauber an. Kein Haken, aber auch keiner weg.</p>';
  }else if(last.v==='miss'){
    h='Daneben.';
    if(last.self) b='<p>Hör die Vorlage langsam an und vergleich nochmal.</p>';
    else b='<p>Gehört: '+heard+(last.swap?'. Genau die typische Verwechslung.':'.')+(it.kind==='s'?' Rot unterringelt ist, was nicht ankam.':'')+'</p>';
    if(pk&&pk.fix) b+='<p>'+esc(pk.fix)+'</p>';
    if(last.lost) b+='<p>Die Haken sind wieder weg.</p>';
    if(mode()==='dict'&&(sess.miss[it.id]||0)<=2) b+='<p class="small">Steht deine Tastatur auf Englisch? Mit deutscher Tastatur versteht das Diktat nur Deutsch.</p>';
    if(!last.self&&(sess.miss[it.id]||0)>=3) b+='<p class="small">Die Erkennung irrt sich auch mal. Hörst du nach dem langsamen Anhören keinen Unterschied mehr, geh weiter.</p>';
  }else{
    cls='info';h=esc(last.h||'');b='<p>'+esc(last.b||'')+'</p>';
    if(last.safari) b+=safariHTML();
    if(last.offer&&mode()!=='dict') b+='<div class="btns"><button class="btn" data-act="check" data-v="dict">Auf Diktat umstellen</button></div>';
  }
  /* Jeder Versuch bekommt eine neue Box, damit sie mit Schwung erscheint */
  return '<div class="verdict '+cls+(last.v==='hit'&&s>=it.need?' sat':'')+'" data-key="v'+(last.n||0)+'"><h2>'+h+'</h2>'+b+'</div>';
}
function practiceHTML(){
  const it=cur(),pk=packById(it.pid)||{},s=Math.min(recOf(it.id).s||0,it.need),done=s>=it.need,m=mode(),st=dayStats(state,Date.now());
  const last=(sess.last&&sess.last.id===it.id)?sess.last:null,n=sess.queue.length;
  const pos=n>=10?two(sess.i+1,n):String(sess.i+1);
  let h='<div class="top"><button class="back" data-act="home">'+ICON.left+'Übersicht</button>'+goalHTML(st,true)+
    '<div class="top-pos" aria-label="'+(sess.i+1)+' von '+n+'">'+pos+' / '+n+'</div><i class="qbar" style="--q:'+((sess.i+1)/n).toFixed(4)+'"></i></div>';
  /* Jede Karte ist ein neues Element: So gleitet sie beim Blättern herein, bleibt aber beim Üben stehen */
  h+='<main class="card'+(sess.enter?' '+sess.enter:'')+'" data-key="c'+sess.i+'">';
  h+='<div class="kind">'+esc(pk.name&&pk.name!==sess.title?sess.title+' · '+pk.name:(pk.name||sess.title))+'</div>';
  if(it.kind==='w'){
    const nn=Math.max(5,Math.max.apply(null,it.text.split(/\s+/).map(function(w){return w.length;})));
    h+='<h1 class="head" lang="en" style="--n:'+nn+'" data-act="hear" title="Antippen zum Anhören">'+hl(it.raw)+'</h1>';
  }else h+='<h1 class="head sent" lang="en">'+sentHTML(it,last&&last.wordOk)+'</h1>';
  const ipa=ipaOf(it),say=sayOf(it);
  if(ipa||it.de) h+='<div class="meta">'+(ipa?'<span class="ipa" lang="en">/'+esc(ipa)+'/</span>':'')+(it.de?'<span class="de">'+esc(it.de)+'</span>':'')+'</div>';
  if(it.vs) h+='<p class="hint">Nicht verwechseln mit <i lang="en">'+esc(it.vs)+'</i>.</p>';
  if(say) h+='<p class="hint">'+esc(say)+'</p>';
  if(env.tts) h+='<div class="listen"><button class="lbtn'+(talking==='say'?' talking':'')+'" data-act="say" data-talk="say">'+ICON.spk+'Anhören</button>'+
    '<button class="lbtn'+(talking==='slow'?' talking':'')+(last&&last.v==='miss'?' nudge':'')+'" data-act="slow" data-talk="slow">'+ICON.slow+'Langsam</button></div>';
  else h+='<p class="hint">Dieser Browser kann nicht vorlesen. Halte dich an die Lautschrift.</p>';
  h+='<div class="ticks" role="img" aria-label="'+s+' von '+it.need+' Treffern am Stück">';
  for(let k=0;k<it.need;k++) h+='<span class="tick'+(k<s?' on':'')+'"><i></i></span>';
  h+='</div><div class="ticks-label'+(done?' done':'')+'">'+(done?'Sitzt':s+' von '+it.need+' Treffern am Stück')+'</div>';
  h+=offlineHTML(false);
  if(m==='rec'){
    if(sess.take&&sess.take.id===it.id) h+='<div class="rate" data-key="take"><div class="listen" style="margin-top:0"><button class="lbtn" data-act="mine">'+ICON.spk+'Aufnahme</button><button class="lbtn" data-act="say">'+ICON.spk+'Vorlage</button></div><p style="margin-top:12px">Klingt deine Aufnahme wie die Vorlage?</p><div class="btns"><button class="btn solid" data-act="yes">Klingt gleich</button><button class="btn quiet" data-act="no">Klingt anders</button></div></div>';
    else if(!last) h+='<div class="rate"><p>Nimm dich auf. Danach hörst du dich neben der Vorlage und entscheidest.</p></div>';
  }else if(m==='self'){
    h+='<div class="rate"><p>Vorlage anhören, laut nachsprechen, ehrlich bewerten.</p><div class="btns"><button class="btn solid" data-act="yes">Getroffen</button><button class="btn quiet" data-act="no">Noch nicht</button></div></div>';
  }
  if(m==='dict') h+='<div class="dict"><input id="dict" type="text" lang="en" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" aria-label="Diktierfeld" placeholder="Hier tippen, dann Tastatur-Mikrofon"><p class="small">Feld antippen, Mikrofon-Taste deiner Tastatur drücken, sprechen. Die Tastatur muss auf Englisch stehen. Nicht tippen: sprechen.</p></div>';
  h+='<div aria-live="polite">'+verdictHTML(it,last,pk)+'</div>';
  if(m==='dict') h+=helpHTML();
  if(pk.tip){
    h+='<details class="how"'+(sess.howOpen?' open':'')+'><summary>So geht es</summary>';
    if(pk.mouths) h+='<div class="mouths">'+pk.mouths.map(function(x){return '<figure>'+mouth(x[0])+'<figcaption>'+esc(x[1])+'</figcaption></figure>';}).join('')+'</div>';
    h+='<p>'+esc(pk.tip)+'</p></details>';
  }
  if(env.fine) h+='<p class="keys"><span><kbd>Leertaste</kbd> '+(m==='auto'?'sprechen':m==='rec'?'aufnehmen':m==='dict'?'Diktierfeld':'anhören')+'</span>'+
    '<span><kbd>←</kbd><kbd>→</kbd> blättern</span>'+(env.tts?'<span><kbd>A</kbd> anhören</span><span><kbd>L</kbd> langsam</span>':'')+'</p>';
  h+='</main>';
  let mid,label;
  if(m==='auto'){
    mid='<button class="mic'+(listening?' live':'')+'" data-act="mic" aria-label="'+(listening?'Stoppen':'Sprechen')+'">'+ic(listening?'stop':'mic')+'</button>';
    label=listening?(sess.interim?'„'+sess.interim.trim()+'“':'Ich höre zu. Sprich jetzt.'):'Tippen und sprechen';
  }else if(m==='rec'){
    mid='<button class="mic'+(recOn?' live':'')+'" data-act="mic" aria-label="'+(recOn?'Aufnahme stoppen':'Aufnehmen')+'">'+ic(recOn?'stop':'mic')+'</button>';
    label=recOn?'Aufnahme läuft. Tippen zum Stoppen.':'Tippen und aufnehmen';
  }else if(m==='dict'){
    mid='<button class="mic" data-act="mic" aria-label="Diktierfeld öffnen">'+ic('kbd')+'</button>';
    label='Tippen, dann Tastatur-Mikrofon';
  }else{
    mid='<button class="mic'+(talking==='say'?' talking':'')+'" data-act="say" data-talk="say" aria-label="Vorlage anhören">'+ic('spk')+'</button>';
    label='Vorlage anhören';
  }
  const lastOne=sess.i>=n-1;
  h+='<div class="bar"><div class="bar-in"><button class="nav prev" data-act="prev"'+(sess.i===0?' disabled':'')+'>'+ICON.left+'Zurück</button>'+mid+
    '<button class="nav next'+(done?' go':'')+'" data-act="next">'+(lastOne?'Fertig':'Weiter')+ICON.right+'</button><div class="mic-label" id="mic-label">'+esc(label)+'</div>'+
    (listening||recOn?'<div class="wave'+(sess.hot||recOn?' hot':'')+'" aria-hidden="true">'+'<i></i>'.repeat(9)+'</div>':'')+'</div></div>';
  return h;
}
function doneHTML(){
  const q=sess.queue,open=q.filter(function(it){return !isDone(it);}),ok=q.length-open.length,st=dayStats(state,Date.now());
  let h='<main class="done'+(open.length?'':' all')+'" data-key="done"><div class="done-ring" role="img" aria-label="'+ok+' von '+q.length+' sitzen">'+ringHTML(54,q.length?ok/q.length:0)+
    '<span><b>'+ok+'</b>/ '+q.length+'</span></div>';
  h+='<h1>'+(open.length?'Durch.':'Alles sitzt.')+'</h1><p>'+(open.length?ok+' von '+q.length+' sitzen. Bleib dran, der Rest kommt.':'Alle '+q.length+' sitzen. Stark.')+'</p>';
  h+='<p class="done-day'+(st.done?' lit':'')+'">'+ICON.flame+'<span>Heute '+st.today+(st.today===1?' Versuch':' Versuche')+(st.streak?' · Serie: '+st.streak+(st.streak===1?' Tag':' Tage'):'')+'</span></p>';
  if(open.length) h+='<p>Noch offen:</p><ul class="open-list" lang="en">'+open.slice(0,40).map(function(it){return '<li>'+esc(it.text)+'</li>';}).join('')+'</ul>';
  h+='<div class="btns" style="margin-top:22px">'+(open.length?'<button class="btn solid" data-act="again">Offene nochmal üben</button>':'<button class="btn" data-act="again-all">Alles nochmal prüfen</button>')+
    '<button class="btn '+(open.length?'quiet':'solid')+'" data-act="home">Zur Übersicht</button></div></main>';
  return h;
}
function render(){
  const app=$('#app');
  if((view==='practice'||view==='done')&&!sess) view='home';
  if(view==='practice'&&!cur()) view='done';
  const act=document.activeElement,key=act&&act.dataset&&act.dataset.act?'[data-act="'+act.dataset.act+'"]'+(act.dataset.v?'[data-v="'+act.dataset.v+'"]':'')+(act.dataset.id?'[data-id="'+act.dataset.id+'"]':''):'';
  const first=view==='home'&&Date.now()<firstUntil;
  morph(app,'<div class="view v-'+view+(first?' first':'')+'" data-key="'+view+'">'+(view==='home'?homeHTML():view==='practice'?practiceHTML():doneHTML())+'</div>');
  if(view==='home'){const ta=$('#own');if(ta&&ta.value!==draft)ta.value=draft;countHome();}
  if(key){const el=$(key);if(el&&!el.disabled&&el!==document.activeElement){try{el.focus({preventScroll:true});}catch(e){}}}
  const f=fx;
  fx={};
  if(f.v||f.goal||f.all) runFx(f);
}
/* Ton, Vibration und Konfetti nach dem Zeichnen. Läuft gerade ein Übergang, kurz warten. */
function runFx(f){
  const go=function(){
    const snd=state.sound;
    if(f.goal){
      const st=dayStats(state,Date.now());
      toast(ICON.flame+'<span><b>Tagesziel geschafft!</b> '+(st.streak>1?st.streak+' Tage am Stück.':'Deine Serie beginnt.')+'</span>');
      confetti(innerWidth/2,innerHeight*.2,130,2.3);
      if(snd){sound('goal');buzz([20,60,20,60,40]);}
      return;
    }
    if(f.all){confetti(innerWidth/2,innerHeight*.3,150,2.6);if(snd){sound('goal');buzz([20,60,40]);}return;}
    if(f.sat){if(snd){sound('sat');buzz([15,50,25]);}later(function(){burstAt('.ticks',80,1.6,1);},280);return;}
    if(f.v==='hit'){if(snd){sound('hit');buzz(12);}later(function(){burstAt('.ticks .tick:nth-child('+(f.tick+1)+')',18,1.4,.6);},240);}
    else if(f.v==='near'){if(snd)sound('near');}
    else if(f.v==='miss'){if(snd){sound('miss');buzz([10,50,10]);}}
  };
  if(inTransition()) setTimeout(go,340);
  else go();
}
function later(f,ms){setTimeout(f,calm()?0:ms);}
function burstAt(sel,n,spread,size){
  const el=$(sel);
  if(!el) return;
  const r=el.getBoundingClientRect();
  confetti(r.left+r.width/2,r.top+r.height/2,n,spread,size);
}
function softRender(){
  const a=document.activeElement;
  if(a&&(a.tagName==='TEXTAREA'||a.tagName==='INPUT')) return;
  if(listening||recOn) return;
  render();
}

/* ---------- Bedienung ---------- */
document.addEventListener('click',function(e){
  const hs=e.target.closest('.help summary');
  if(hs&&sess){sess.helpOpen=!hs.parentNode.open;return;}
  const sm=e.target.closest('.how summary');
  if(sm&&sess){sess.howUser=true;sess.howOpen=!sm.parentNode.open;return;}
  const b=e.target.closest('[data-act]');
  if(!b||b.disabled) return;
  const a=b.dataset.act,v=b.dataset.v,it=cur();
  if(a==='open') openPack(b.dataset.id);
  else if(a==='weak') startSession('Schwächen',weakItems());
  else if(a==='home'){stopAll();view='home';sess=null;swap(function(){render();window.scrollTo(0,0);},'back');applyUpdate(false);}
  else if(a==='say'){if(it)speak(it.text,false);}
  else if(a==='hear'){if(it)speak(v||it.text,false);}
  else if(a==='slow'){if(it)speak(it.text,true);}
  else if(a==='mic') micAct();
  else if(a==='mine') playMine();
  else if(a==='yes') rate(true);
  else if(a==='no') rate(false);
  else if(a==='next') go(1);
  else if(a==='prev') go(-1);
  else if(a==='again'){startSession(sess.title,sess.queue.filter(function(x){return !isDone(x);}));}
  else if(a==='again-all'){startSession(sess.title,sess.queue.slice());}
  else if(a==='acc'){state.accent=v==='us'?'us':'gb';persist('accent');render();}
  else if(a==='check'){stopAll();state.check=(v==='self'||v==='dict')?v:'auto';env.offMode=state.check==='auto'?'auto':'';persist();render();}
  else if(a==='offmode'){stopAll();env.offMode=(v==='self'||v==='dict')?v:'auto';render();}
  else if(a==='update') applyUpdate(true);
  else if(a==='diag') runDiag();
  else if(a==='auto'){state.auto=v==='on';persist();render();}
  else if(a==='theme'){
    const t=(v==='light'||v==='auto')?v:'dark',r=b.getBoundingClientRect();
    const set=function(){state.theme=t;saveLocal();applyTheme();render();};
    /* Ändert sich das Aussehen wirklich, breitet es sich als Kreis vom Knopf aus */
    if(lightOf(t)!==lightOf(state.theme)) swap(set,'theme',e.clientX||r.left+r.width/2,e.clientY||r.top+r.height/2);
    else set();
  }
  else if(a==='goal'){const g=+v;if(GOALS.indexOf(g)>=0&&g!==state.goal){state.goal=g;persist('goal');render();}}
  else if(a==='sound'){state.sound=v==='on';saveLocal();render();if(state.sound){unlock(true);setTimeout(function(){sound('hit');},80);}}
  else if(a==='settings'){const el=$('#einstellungen');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
  else if(a==='reset'){confirmReset=true;render();}
  else if(a==='reset-no'){confirmReset=false;render();}
  else if(a==='reset-yes'){confirmReset=false;state.items={};state.days={};state.resetAt=Date.now();persist();render();}
  else if(a==='sync-in') signIn();
  else if(a==='sync-now'){if(sync)sync.now();}
  else if(a==='sync-out'){if(sync)sync.signOut();}
  else if(a==='retry-mic'){env.micBlocked=false;env.denied=0;render();}
  else if(a==='own-save') saveOwn();
  else if(a==='copy-url') copyUrl();
});
document.addEventListener('input',function(e){
  const el=e.target;
  if(!el) return;
  if(el.id==='own'){draft=el.value;return;}
  if(el.id==='dict'){
    /* Diktat tröpfelt ein: erst urteilen, wenn kurz nichts mehr kommt. Stimmt es schon, geht es schneller. */
    clearTimeout(dictTimer);
    const it=cur();
    if(!it||!el.value.trim()) return;
    dictTimer=setTimeout(dictJudge,compare(it,el.value).exact?450:(it.kind==='s'?2200:1300));
  }
});
document.addEventListener('keydown',function(e){
  if(view!=='practice'||e.metaKey||e.ctrlKey||e.altKey) return;
  const tag=e.target&&e.target.tagName;
  if(tag==='INPUT'&&e.key==='Enter'&&e.target.id==='dict'){e.preventDefault();dictJudge();return;}
  if(tag==='TEXTAREA'||tag==='INPUT') return;
  if(e.key==='ArrowRight'){e.preventDefault();go(1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();go(-1);}
  else if((e.key==='a'||e.key==='A')&&env.tts){e.preventDefault();const it=cur();if(it)speak(it.text,false);}
  else if((e.key==='l'||e.key==='L')&&env.tts){e.preventDefault();const it=cur();if(it)speak(it.text,true);}
  else if(e.key===' '&&tag!=='BUTTON'&&tag!=='SUMMARY'&&tag!=='A'){e.preventDefault();micAct();}
});
/* Töne dürfen erst nach einem Tippen klingen. Der Mikrofon-Knopf bleibt außen vor: Dort startet gleich die Spracherkennung,
   und die soll das Mikrofon für sich allein haben. */
document.addEventListener('click',function(e){
  if(state.sound&&!(e.target.closest&&e.target.closest('[data-act="mic"]'))) unlock(true);
},true);
/* Wischen auf der Karte: nach links weiter, nach rechts zurück. Nur mit dem Finger, die Karte folgt ihm ein Stück. */
let swipe=null;
document.addEventListener('pointerdown',function(e){
  if(view!=='practice'||e.pointerType!=='touch'||!e.isPrimary) return;
  const c=e.target.closest('.card');
  if(!c||e.target.closest('input,textarea,summary,.btn,a,.mouths')) return;
  swipe={x:e.clientX,y:e.clientY,id:e.pointerId,c:c,on:false};
},{passive:true});
document.addEventListener('pointermove',function(e){
  const w=swipe;
  if(!w||e.pointerId!==w.id) return;
  const dx=e.clientX-w.x,dy=e.clientY-w.y;
  if(!w.on){
    if(Math.abs(dy)>14&&Math.abs(dy)>Math.abs(dx)){swipe=null;return;}
    if(Math.abs(dx)<14||Math.abs(dx)<Math.abs(dy)*1.5) return;
    w.on=true;
  }
  /* Am ersten Wort gibt es kein Zurück: dort federt die Karte nur leicht */
  const f=(dx>0&&sess&&sess.i===0)?.15:.55;
  w.c.style.transform='translateX('+Math.round(dx*f)+'px)';
  w.c.style.opacity=String(Math.max(.4,1-Math.abs(dx)/700));
},{passive:true});
function swipeEnd(e){
  const w=swipe;
  if(!w||e.pointerId!==w.id) return;
  swipe=null;
  if(!w.on) return;
  const dx=e.clientX-w.x;
  w.c.style.transition='transform .28s cubic-bezier(.2,.8,.2,1),opacity .28s';
  w.c.style.transform='';w.c.style.opacity='';
  setTimeout(function(){w.c.style.transition='';},300);
  if(e.type!=='pointerup'||Math.abs(dx)<70) return;
  if(dx<0) go(1);
  else if(sess&&sess.i>0) go(-1);
}
document.addEventListener('pointerup',swipeEnd);
document.addEventListener('pointercancel',swipeEnd);
document.addEventListener('visibilitychange',function(){
  if(!document.hidden) return;
  const busy=listening||recOn;
  stopAll();
  if(busy&&view==='practice') render();
});
/* Zweiter Tab mit Mundwerk offen: dessen Fortschritt übernehmen statt ihn beim nächsten Speichern zu überschreiben */
window.addEventListener('storage',function(e){
  if(e.key!==LS||!e.newValue) return;
  try{state=merge(state,clean(JSON.parse(e.newValue)));}catch(err){return;}
  softRender();
});

loadLocal();
draft=state.custom.text;
applyTheme();
firstUntil=Date.now()+1800;
render();
swSetup();
try{if(syncOn()&&localStorage.getItem(SYNC)==='1') loadSync();}catch(e){}
if(/mwtest/.test(location.hash)) window.__mw={mouth:mouth,compare:compare,judge:judge,PACKS:PACKS,allPacks:allPacks,env:env,splitSentences:splitSentences,getState:function(){return state;},day:function(){return dayStats(state,Date.now());},dev:DEV,upd:function(){return {waiting:!!waiting,later:updLater,reloading:reloading,view:view,draftSaved:draft===state.custom.text};},sync:function(){return {user:syncUser,stat:syncStat,code:syncCode,loaded:!!sync};}};
