/* Alles, was sich bewegt und klingt: sanftes Aktualisieren des Bildschirms, Übergänge, Konfetti, Töne, Vibration und Hinweise.
   Steht im System „Bewegung reduzieren“, bleibt der Bildschirm ruhig. */

export function calm(){try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}

/* ---------- Bildschirm sanft aktualisieren ----------
   Statt alles neu zu bauen, werden nur die Unterschiede übernommen. Gleiche Elemente bleiben stehen: Laufende Animationen
   laufen weiter, und CSS-Übergänge greifen, zum Beispiel wenn sich ein Haken füllt. Ein neuer data-key ersetzt das Element. */
const tpl=document.createElement('template');
export function morph(el,html){tpl.innerHTML=html;kids(el,tpl.content);}
function key(n){return n.nodeType===1?n.getAttribute('data-key'):null;}
function same(a,b){return a.nodeType===b.nodeType&&a.nodeName===b.nodeName&&key(a)===key(b);}
function kids(a,b){
  let x=a.firstChild,y=b.firstChild;
  while(y){
    const next=y.nextSibling;
    if(x&&same(x,y)){patch(x,y);x=x.nextSibling;}
    else{
      let m=null;
      if(key(y)!==null) for(let s=x;s;s=s.nextSibling) if(same(s,y)){m=s;break;}
      if(m){while(x!==m){const n=x.nextSibling;a.removeChild(x);x=n;}patch(x,y);x=x.nextSibling;}
      else a.insertBefore(y,x);
    }
    y=next;
  }
  while(x){const n=x.nextSibling;a.removeChild(x);x=n;}
}
function patch(a,b){
  if(a.nodeType!==1){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return;}
  const A=a.attributes,B=b.attributes;
  for(let i=A.length-1;i>=0;i--){const n=A[i].name;if(!b.hasAttribute(n))a.removeAttribute(n);}
  for(let i=0;i<B.length;i++){const n=B[i].name,v=B[i].value;if(a.getAttribute(n)!==v)a.setAttribute(n,v);}
  /* Im Textfeld steht, was du tippst. Das gehört nicht zum Bauplan. */
  if(a.nodeName!=='TEXTAREA') kids(a,b);
}

/* ---------- Übergänge zwischen Ansichten ----------
   kind: 'fwd' (tiefer hinein), 'back' (zurück) oder 'theme' (Kreis vom angetippten Knopf aus). Ohne View Transitions im Browser
   wird einfach umgeschaltet. */
let vtN=0;
export function swap(update,kind,x,y){
  const de=document.documentElement;
  if(calm()||typeof document.startViewTransition!=='function'||document.hidden){update();return false;}
  const my=++vtN;
  de.dataset.vt=kind;
  let t;
  try{t=document.startViewTransition(update);}
  catch(e){delete de.dataset.vt;update();return false;}
  const end=function(){if(vtN===my)delete de.dataset.vt;};
  t.finished.then(end,end);
  t.updateCallbackDone.catch(function(e){setTimeout(function(){throw e;});});
  t.ready.then(function(){
    if(kind!=='theme') return;
    const r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
    de.animate({clipPath:['circle(0px at '+x+'px '+y+'px)','circle('+r+'px at '+x+'px '+y+'px)']},
      {duration:620,easing:'cubic-bezier(.4,0,.2,1)',pseudoElement:'::view-transition-new(root)'});
  }).catch(function(){});
  return true;
}
export function inTransition(){return !!document.documentElement.dataset.vt;}

/* ---------- Konfetti ---------- */
let cv=null,ctx=null,parts=[],raf=0,last=0;
export function confetti(x,y,n,spread,size){
  if(calm()) return;
  if(!cv){
    cv=document.createElement('canvas');cv.className='confetti';cv.setAttribute('aria-hidden','true');
    document.body.appendChild(cv);ctx=cv.getContext('2d');
  }
  const dpr=Math.min(2,window.devicePixelRatio||1),W=innerWidth,H=innerHeight;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const cols=(getComputedStyle(document.documentElement).getPropertyValue('--confetti')||'#D4FF3A,#7CFFB2').split(',').map(function(c){return c.trim();});
  const sz=size||1;
  for(let i=0;i<n;i++){
    const a=-Math.PI/2+(Math.random()-.5)*spread,v=(sz<1?3.5:6)+Math.random()*(sz<1?4:8);
    parts.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,w:(4+Math.random()*5)*sz,h:(7+Math.random()*7)*sz,r:Math.random()*6.3,vr:(Math.random()-.5)*.35,
      c:cols[i%cols.length],age:0,max:(sz<1?38:70)+Math.random()*40,round:Math.random()<.3});
  }
  if(!raf){last=performance.now();raf=requestAnimationFrame(step);}
}
function step(now){
  /* Gleich schnell bei 60 und 120 Bildern pro Sekunde */
  const k=Math.min(3,(now-last)/16.67);
  last=now;
  ctx.clearRect(0,0,innerWidth,innerHeight);
  parts=parts.filter(function(p){return p.age<p.max&&p.y<innerHeight+40;});
  parts.forEach(function(p){
    p.age+=k;p.vy+=.28*k;p.vx*=Math.pow(.985,k);p.vy*=Math.pow(.985,k);p.x+=p.vx*k;p.y+=p.vy*k;p.r+=p.vr*k;
    ctx.globalAlpha=Math.max(0,Math.min(1,(p.max-p.age)/18));
    ctx.fillStyle=p.c;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);
    if(p.round){ctx.beginPath();ctx.arc(0,0,p.w/2,0,6.283);ctx.fill();}
    else ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h*Math.abs(Math.cos(p.age*.12+p.r)));
    ctx.restore();
  });
  if(parts.length) raf=requestAnimationFrame(step);
  else{raf=0;cv.remove();cv=null;ctx=null;}
}

/* ---------- Töne ----------
   Kleine Klänge, direkt im Browser erzeugt, keine Dateien. Am iPhone schweigen sie im Lautlos-Modus.
   Der Browser erlaubt Töne erst nach einem Tippen: unlock() wird bei jedem Tippen aufgerufen. */
let ac=null;
export function unlock(create){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    if(!ac){if(!create)return;ac=new AC();}
    if(ac.state!=='running') ac.resume().catch(function(){});
  }catch(e){}
}
/* [Frequenz, Start, Dauer] */
const SND={
  hit:[[880,0,.12],[1318.5,.075,.22]],
  sat:[[784,0,.13],[987.8,.07,.13],[1174.7,.14,.14],[1568,.21,.42]],
  near:[[740,0,.18]],
  miss:[[311.1,0,.15],[233.1,.1,.26]],
  goal:[[523.3,0,.13],[659.3,.09,.13],[784,.18,.13],[1046.5,.27,.55],[1318.5,.27,.55]]
};
export function sound(name){
  const seq=SND[name];
  if(!ac||ac.state!=='running'||!seq) return;
  try{
    const t0=ac.currentTime+.02,out=ac.createGain(),soft=name==='miss';
    out.gain.value=soft?.12:.075;
    out.connect(ac.destination);
    seq.forEach(function(s){
      const t=t0+s[1],g=ac.createGain();
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(1,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+s[2]);
      g.connect(out);
      /* Grundton plus leiser Oberton: klingt wie ein kleines Glöckchen */
      [[1,soft?'triangle':'sine',1],[2,'sine',soft?0:.22]].forEach(function(h){
        if(!h[2]) return;
        const o=ac.createOscillator(),hg=ac.createGain();
        o.type=h[1];o.frequency.setValueAtTime(s[0]*h[0],t);hg.gain.value=h[2];
        o.connect(hg);hg.connect(g);o.start(t);o.stop(t+s[2]+.03);
      });
    });
  }catch(e){}
}
export function buzz(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}

/* ---------- Hinweis oben, der von allein wieder verschwindet ---------- */
let tEl=null,tTimer=0;
export function toast(html,ms){
  if(!tEl){
    tEl=document.createElement('div');tEl.className='toast';tEl.setAttribute('role','status');tEl.setAttribute('aria-live','polite');
    document.body.appendChild(tEl);
  }
  tEl.innerHTML=html;
  tEl.classList.remove('show');
  void tEl.offsetWidth;
  tEl.classList.add('show');
  clearTimeout(tTimer);
  tTimer=setTimeout(function(){tEl.classList.remove('show');},ms||3200);
}

/* ---------- Zahl hochzählen ---------- */
let countN=0;
export function countTo(el,from,to,ms,each){
  const my=++countN;
  if(calm()||from===to){el.textContent=String(to);if(each)each(to);return;}
  const t0=performance.now();
  const f=function(now){
    if(my!==countN) return;
    const p=Math.min(1,(now-t0)/ms),v=Math.round(from+(to-from)*(1-Math.pow(1-p,3)));
    el.textContent=String(v);
    if(each) each(v);
    if(p<1) requestAnimationFrame(f);
  };
  f(t0);
}
