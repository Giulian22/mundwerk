/* Reine Logik ohne Bildschirm: Pakete bauen, Gesprochenes mit dem Ziel vergleichen, Spielstand prüfen und zusammenführen.
   Läuft im Browser und in Node, damit die Tests sie direkt prüfen können. */
import {DATA,HOMO} from './data.js';

/* ---------- Helfer ---------- */
const CANON={};
HOMO.forEach(function(c){c.forEach(function(w){CANON[w]=c[0];});});
export const canon=function(t){return Object.prototype.hasOwnProperty.call(CANON,t)?CANON[t]:t;};
export const plain=function(raw){return String(raw).replace(/[\[\]]/g,'');};
export function hash(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(36);}

export function mkWord(pid,a){const text=plain(a[0]);return {id:pid+':'+text.toLowerCase(),pid:pid,kind:'w',raw:a[0],text:text,vs:a[1]||'',de:a[2]||'',ipa:a[3]||'',say:a[4]||'',need:3};}
export function mkSent(pid,raw){const text=plain(raw);return {id:pid+':s'+hash(text),pid:pid,kind:'s',raw:raw,text:text,vs:'',de:'',ipa:'',say:'',need:2};}
export const PACKS=DATA.map(function(p){return Object.assign({},p,{items:p.w.map(function(a){return mkWord(p.id,a);}).concat(p.s.map(function(r){return mkSent(p.id,r);}))});});

/* ---------- Gesprochenes mit dem Ziel vergleichen ---------- */
const ONES=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
export function numWords(x){
  const n=Math.floor(Number(x));
  if(!isFinite(n)||n<0||n>999999) return String(x).split('').map(function(d){return ONES[+d]||'';}).join(' ');
  if(n<20) return ONES[n];
  if(n<100) return TENS[Math.floor(n/10)]+(n%10?' '+ONES[n%10]:'');
  if(n<1000) return ONES[Math.floor(n/100)]+' hundred'+(n%100?' '+numWords(n%100):'');
  return numWords(Math.floor(n/1000))+' thousand'+(n%1000?' '+numWords(n%1000):'');
}
function ordWords(x){
  const w=numWords(x).split(' '), last=w.pop();
  const M={one:'first',two:'second',three:'third',five:'fifth',eight:'eighth',nine:'ninth',twelve:'twelfth'};
  w.push(M[last]||(/y$/.test(last)?last.slice(0,-1)+'ieth':last+'th'));
  return w.join(' ');
}
export function tokenize(str){
  let s=String(str).toLowerCase();
  s=s.replace(/[‘’ʼ`´]/g,"'").replace(/%/g,' percent ').replace(/&/g,' and ').replace(/\bper cent\b/g,'percent');
  s=s.replace(/(\d+)(st|nd|rd|th)\b/g,function(m,n){return ' '+ordWords(n)+' ';});
  s=s.replace(/\d+/g,function(n){return ' '+numWords(n)+' ';});
  s=s.replace(/[^a-z' ]+/g,' ').replace(/'/g,'');
  return s.split(/\s+/).filter(Boolean);
}
function targetOf(item){
  if(item._t) return item._t;
  const words=item.text.split(/\s+/).filter(Boolean), toks=[], raws=[], map=[];
  words.forEach(function(w,i){tokenize(w).forEach(function(t){raws.push(t);toks.push(canon(t));map.push(i);});});
  const T={toks:toks,map:map,n:words.length,set:Object.create(null),rawSet:Object.create(null),bi:Object.create(null),join:Object.create(null)};
  toks.forEach(function(t,i){
    T.set[t]=1; T.rawSet[raws[i]]=1;
    if(i<toks.length-1){T.bi[t+' '+toks[i+1]]=1; T.join[t+toks[i+1]]=[t,toks[i+1]]; T.join[raws[i]+raws[i+1]]=[t,toks[i+1]];}
  });
  item._t=T; return T;
}
/* "sea shells" und "seashells", "worldwide" und "world wide" sollen als gleich gelten */
function reconcile(h,T){
  const out=[];
  for(let i=0;i<h.length;i++){
    const a=h[i], b=h[i+1];
    if(b&&!T.bi[a.c+' '+b.c]&&(T.rawSet[a.r+b.r]||T.set[a.c+b.c])){out.push({c:T.rawSet[a.r+b.r]?canon(a.r+b.r):a.c+b.c,r:a.r+b.r});i++;continue;}
    if(!T.set[a.c]&&(T.join[a.r]||T.join[a.c])){const p=T.join[a.r]||T.join[a.c];out.push({c:p[0],r:a.r});out.push({c:p[1],r:''});continue;}
    out.push(a);
  }
  return out;
}
function align(t,h){
  const n=t.length,m=h.length,d=[];
  for(let i=0;i<=n;i++){d.push(new Array(m+1).fill(0));d[i][0]=i;}
  for(let j=0;j<=m;j++)d[0][j]=j;
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(t[i-1]===h[j-1]?0:1));
  const marks=new Array(n).fill(false);let i=n,j=m;
  while(i>0&&j>0){
    const same=t[i-1]===h[j-1];
    if(d[i][j]===d[i-1][j-1]+(same?0:1)){marks[i-1]=same;i--;j--;}
    else if(d[i][j]===d[i-1][j]+1){i--;}
    else{j--;}
  }
  return {marks:marks,dist:d[n][m]};
}
export function compare(item,heardStr){
  const T=targetOf(item);
  let h=tokenize(heardStr).map(function(r){return {c:canon(r),r:r};});
  h=reconcile(h,T);
  const al=align(T.toks,h.map(function(x){return x.c;}));
  const wordOk=[];for(let i=0;i<T.n;i++)wordOk.push(true);
  let ok=0;
  al.marks.forEach(function(m,i){if(m)ok++;else wordOk[T.map[i]]=false;});
  return {exact:al.dist===0&&T.toks.length>0,ratio:T.toks.length?ok/T.toks.length:0,wordOk:wordOk,heard:String(heardStr).trim(),key:h.map(function(x){return x.c;}).join(' ')};
}
/* Urteil: hit = erste Deutung stimmt, near = nur eine Nebendeutung stimmt oder fast alle Wörter, miss = daneben */
export function judge(item,alts){
  const res=[];
  (alts||[]).forEach(function(a){if(a&&a.t&&String(a.t).trim()){const r=compare(item,a.t);r.conf=a.c||0;res.push(r);}});
  if(!res.length) return {v:'none'};
  const top=res[0];
  if(top.exact) return {v:'hit',top:top};
  for(let k=1;k<res.length;k++) if(res[k].exact) return {v:'near',top:top,why:'alt'};
  if(item.kind==='s'&&top.ratio>=0.8) return {v:'near',top:top,why:'most'};
  let swap=false;
  if(item.vs) swap=(top.key===tokenize(item.vs).map(canon).join(' '));
  return {v:'miss',top:top,swap:swap};
}

/* ---------- Eigener Text: in Sätze zerlegen, lange Sätze an Kommas teilen ---------- */
export function splitSentences(text){
  const c=String(text||'').replace(/[\[\]]/g,' ').replace(/\s+/g,' ').trim();
  if(!c) return [];
  const parts=c.match(/[^.!?]+[.!?]*["'”’)]*/g)||[],out=[],seen={};
  const push=function(s){s=s.trim();if(!s||!tokenize(s).length||seen[s])return;seen[s]=1;out.push(s);};
  parts.forEach(function(p){
    const words=p.trim().split(' ').filter(Boolean);
    if(words.length<=14){push(words.join(' '));return;}
    let chunk=[];
    words.forEach(function(w,i){
      chunk.push(w);
      const rest=words.length-1-i;
      if(rest>=3&&((/[,;:]$/.test(w)&&chunk.length>=5)||chunk.length>=14)){push(chunk.join(' '));chunk=[];}
    });
    if(chunk.length) push(chunk.join(' '));
  });
  return out.slice(0,80);
}

/* ---------- Spielstand ----------
   items: pro Wort oder Satz s = Treffer am Stück, a = Versuche, h = Treffer, t = Zeitpunkt des letzten Versuchs.
   Für den Abgleich zwischen Geräten: stamps sagt, wann Akzent und eigener Text zuletzt geändert wurden,
   resetAt, wann zuletzt alles zurückgesetzt wurde. */
export function blank(){return {v:2,accent:'gb',auto:true,check:'auto',theme:'dark',items:{},custom:{text:''},ts:0,resetAt:0,stamps:{accent:0,text:0}};}
export function clean(o){
  const out=blank();
  if(!o||typeof o!=='object') return out;
  out.accent=o.accent==='us'?'us':'gb';
  out.auto=o.auto!==false;
  out.check=(o.check==='self'||o.check==='dict')?o.check:'auto';
  out.theme=(o.theme==='light'||o.theme==='auto')?o.theme:'dark';
  out.ts=Number(o.ts)||0;
  out.resetAt=Number(o.resetAt)||0;
  if(o.items&&typeof o.items==='object'){
    Object.keys(o.items).forEach(function(k){
      const r=o.items[k];
      if(r&&typeof r==='object'&&(Number(r.t)||0)>out.resetAt) out.items[k]={s:Math.max(0,r.s|0),a:Math.max(0,r.a|0),h:Math.max(0,r.h|0),t:Number(r.t)||0};
    });
  }
  if(o.custom&&typeof o.custom==='object') out.custom.text=String(o.custom.text||'').slice(0,8000);
  /* Ältere Spielstände ohne stamps: Zeitpunkt der letzten Änderung überhaupt */
  const st=(o.stamps&&typeof o.stamps==='object')?o.stamps:{};
  out.stamps={accent:Number(st.accent)||out.ts,text:Number(st.text)||out.ts};
  return out;
}
/* Gleich alt: der Eintrag mit mehr Versuchen gewinnt, damit beide Geräte dasselbe Ergebnis bekommen */
function newer(x,y){
  if(y.t!==x.t) return y.t>x.t?y:x;
  if(y.a!==x.a) return y.a>x.a?y:x;
  return y.s>x.s?y:x;
}
/* Zwei Spielstände zusammenführen (zum Beispiel Handy und Laptop): pro Eintrag gewinnt der neueste Versuch.
   Akzent und eigener Text kommen von dem Stand, der sie zuletzt geändert hat. Zurücksetzen löscht alles, was davor geübt wurde.
   Prüfart, Vorsprechen und Aussehen passen nur zum jeweiligen Gerät und bleiben wie in a. */
export function merge(a,b){
  a=clean(a);b=clean(b);
  const out=clean(a),ids={};
  out.ts=Math.max(a.ts,b.ts);
  out.resetAt=Math.max(a.resetAt,b.resetAt);
  if(b.stamps.accent>a.stamps.accent){out.accent=b.accent;out.stamps.accent=b.stamps.accent;}
  if(b.stamps.text>a.stamps.text){out.custom.text=b.custom.text;out.stamps.text=b.stamps.text;}
  Object.keys(a.items).forEach(function(k){ids[k]=1;});
  Object.keys(b.items).forEach(function(k){ids[k]=1;});
  out.items={};
  Object.keys(ids).sort().forEach(function(k){
    const x=a.items[k],y=b.items[k],r=!x?y:!y?x:newer(x,y);
    if(r.t>out.resetAt) out.items[k]=Object.assign({},r);
  });
  return out;
}
/* Was auf andere Geräte übertragen wird: alles außer Prüfart, Vorsprechen und Aussehen */
export function syncPart(s){
  s=clean(s);
  return {v:s.v,accent:s.accent,items:s.items,custom:{text:s.custom.text},ts:s.ts,resetAt:s.resetAt,stamps:s.stamps};
}
