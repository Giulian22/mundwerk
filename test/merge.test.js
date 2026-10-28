/* Prüft das Zusammenführen zweier Spielstände (Handy und Laptop). Start: npm test */
import test from 'node:test';
import assert from 'node:assert/strict';
import {blank,clean,merge,syncPart,dayStats,bump,dateKey} from '../js/core.js';

function st(o){return clean(Object.assign(blank(),o));}

test('Pro Eintrag gewinnt der neueste Versuch', function(){
  const handy=st({ts:300,items:{'th1:think':{s:3,a:5,h:4,t:300},'sz:sip':{s:0,a:2,h:0,t:100}}});
  const laptop=st({ts:250,items:{'th1:think':{s:1,a:3,h:2,t:200},'sz:sip':{s:2,a:4,h:2,t:250},'wv:west':{s:1,a:1,h:1,t:50}}});
  const m=merge(handy,laptop);
  assert.deepEqual(m.items['th1:think'],{s:3,a:5,h:4,t:300});
  assert.deepEqual(m.items['sz:sip'],{s:2,a:4,h:2,t:250});
  assert.deepEqual(m.items['wv:west'],{s:1,a:1,h:1,t:50});
  assert.equal(m.ts,300);
});

test('Beide Richtungen ergeben dasselbe, auch bei gleicher Zeit', function(){
  const a=st({ts:10,items:{x:{s:1,a:2,h:1,t:5},y:{s:0,a:1,h:0,t:7}},stamps:{accent:3,text:1},accent:'us'});
  const b=st({ts:20,items:{x:{s:2,a:3,h:2,t:5},z:{s:3,a:3,h:3,t:9}},stamps:{accent:4,text:2},accent:'gb',custom:{text:'Hello there.'}});
  assert.deepEqual(syncPart(merge(a,b)),syncPart(merge(b,a)));
  assert.deepEqual(merge(a,b).items.x,{s:2,a:3,h:2,t:5});
});

test('Zurücksetzen gilt auf allen Geräten für alles, was davor geübt wurde', function(){
  const handy=st({ts:500,resetAt:500,items:{}});
  const laptop=st({ts:400,items:{alt:{s:3,a:3,h:3,t:400},neu:{s:1,a:1,h:1,t:600}}});
  const m=merge(laptop,handy);
  assert.equal(m.resetAt,500);
  assert.deepEqual(Object.keys(m.items),['neu']);
});

test('Akzent und eigener Text kommen vom zuletzt geänderten Stand, Prüfart und Vorsprechen bleiben', function(){
  const handy=st({ts:100,accent:'us',check:'dict',auto:false,stamps:{accent:100,text:10},custom:{text:'Alt.'}});
  const laptop=st({ts:90,accent:'gb',check:'auto',auto:true,stamps:{accent:20,text:90},custom:{text:'Neu.'}});
  const m=merge(handy,laptop);
  assert.equal(m.accent,'us');
  assert.equal(m.custom.text,'Neu.');
  assert.equal(m.check,'dict');
  assert.equal(m.auto,false);
  const p=syncPart(m);
  assert.ok(!('check' in p)&&!('auto' in p)&&!('theme' in p)&&!('sound' in p),'Prüfart, Vorsprechen, Aussehen und Töne werden nicht übertragen');
});

test('Alte Spielstände ohne Zeitstempel werden übernommen', function(){
  const alt=clean({v:1,accent:'us',auto:true,check:'auto',items:{a:{s:2,a:2,h:2,t:70}},custom:{text:'Old text.'},ts:80});
  assert.deepEqual(alt.stamps,{accent:80,text:80,goal:0});
  assert.equal(alt.goal,20);
  assert.deepEqual(alt.days,{});
  const m=merge(st({}),alt);
  assert.equal(m.accent,'us');
  assert.equal(m.custom.text,'Old text.');
  assert.deepEqual(m.items.a,{s:2,a:2,h:2,t:70});
});

test('Mehrfaches Zusammenführen ändert nichts mehr', function(){
  const a=st({ts:5,items:{x:{s:1,a:1,h:1,t:5}}}),b=st({ts:6,items:{y:{s:2,a:2,h:2,t:6}}});
  const m=merge(a,b);
  assert.deepEqual(merge(m,m),m);
  assert.deepEqual(merge(a,m),m);
  assert.deepEqual(JSON.stringify(syncPart(merge(m,b))),JSON.stringify(syncPart(m)));
});

test('Kaputte Daten aus dem Netz richten nichts an', function(){
  const m=merge(st({items:{x:{s:1,a:1,h:1,t:5}}}),{items:{x:'kaputt',y:{s:'3',a:-4,h:null,t:'9'}},accent:'fr',custom:7});
  assert.deepEqual(m.items.x,{s:1,a:1,h:1,t:5});
  assert.deepEqual(m.items.y,{s:3,a:0,h:0,t:9});
  assert.equal(m.accent,'gb');
});

/* ---------- Tagesziel und Serie ---------- */
const DAY=86400000;
function at(y,m,d,h){return new Date(y,m-1,d,h||12).getTime();}

test('Versuche pro Tag: jedes Gerät zählt für sich, zusammen ergibt es die Summe', function(){
  const now=at(2026,10,28);
  const handy=st({}),laptop=st({});
  for(let i=0;i<7;i++) bump(handy,'handy',now);
  for(let i=0;i<5;i++) bump(laptop,'laptop',now+1000);
  const m=merge(handy,laptop);
  assert.equal(dayStats(m,now).today,12);
  /* Nochmal zusammenführen zählt nichts doppelt */
  assert.equal(dayStats(merge(m,laptop),now).today,12);
  assert.equal(dayStats(merge(laptop,merge(m,handy)),now).today,12);
  /* Das Handy übt weiter: sein neuester Stand gewinnt */
  bump(handy,'handy',now+5000);
  assert.equal(dayStats(merge(m,handy),now).today,13);
  assert.deepEqual(syncPart(merge(m,handy)),syncPart(merge(handy,m)));
});

test('Serie: Tage am Stück mit geschafftem Tagesziel, heute darf noch offen sein', function(){
  const s=st({goal:10});
  const today=at(2026,10,28);
  for(const back of [1,2,3]) for(let i=0;i<10;i++) bump(s,'a',today-back*DAY);
  for(let i=0;i<9;i++) bump(s,'a',today-5*DAY);
  let d=dayStats(s,today);
  assert.deepEqual(d,{today:0,goal:10,done:false,streak:3});
  for(let i=0;i<9;i++) bump(s,'a',today);
  assert.equal(dayStats(s,today).done,false);
  bump(s,'a',today);
  d=dayStats(s,today);
  assert.deepEqual(d,{today:10,goal:10,done:true,streak:4});
  /* Ein ausgefallener Tag beendet die Serie */
  assert.equal(dayStats(s,today+2*DAY).streak,0);
});

test('Serie über einen Monatswechsel und die Zeitumstellung hinweg', function(){
  const s=st({goal:10});
  /* 25.10.2026: Ende der Sommerzeit in Deutschland */
  for(const day of [[2026,10,30],[2026,10,31],[2026,11,1]]) for(let i=0;i<10;i++) bump(s,'a',at(day[0],day[1],day[2],0)+60000);
  for(const day of [[2026,10,24],[2026,10,25],[2026,10,26]]) for(let i=0;i<10;i++) bump(s,'b',at(day[0],day[1],day[2],23));
  assert.equal(dayStats(s,at(2026,11,1,23)).streak,3);
  assert.equal(dayStats(s,at(2026,10,26,23,59)).streak,3);
  assert.equal(dateKey(at(2026,11,1,0)+60000),'2026-11-01');
});

test('Ein geschafftes Tagesziel bleibt geschafft, auch wenn das Ziel später steigt', function(){
  const s=st({goal:10});
  const y=at(2026,10,27);
  for(let i=0;i<12;i++) bump(s,'a',y);
  s.goal=40;
  assert.equal(dayStats(s,at(2026,10,28)).streak,1);
});

test('Das Tagesziel kommt vom zuletzt geänderten Stand', function(){
  const handy=st({goal:40,stamps:{goal:500}}),laptop=st({goal:10,stamps:{goal:300}});
  assert.equal(merge(handy,laptop).goal,40);
  assert.equal(merge(laptop,handy).goal,40);
  assert.equal(merge(st({}),st({goal:10,stamps:{goal:1}})).goal,10);
  assert.equal(clean({goal:15}).goal,20,'nur 10, 20 oder 40');
});

test('Zurücksetzen löscht auch die Tage von vorher', function(){
  const now=at(2026,10,28);
  const laptop=st({});
  for(let i=0;i<20;i++) bump(laptop,'laptop',now-DAY);
  const handy=st({resetAt:now-1000});
  const m=merge(laptop,handy);
  assert.deepEqual(m.days,{});
  assert.equal(dayStats(m,now).streak,0);
});

test('Kaputte oder zu viele Tage-Einträge richten nichts an', function(){
  const days={'2026-10-28~ok':{n:'4',t:'9',r:true},'kaputt':{n:5,t:5},'2026-10-28~BÖSE':{n:5,t:5},'2026-10-27~x':'nein'};
  const c=clean({days:days});
  assert.deepEqual(c.days,{'2026-10-28~ok':{n:4,t:9,r:1}});
  const many={};
  for(let i=0;i<1200;i++){const d=new Date(2020,0,1+i);many[dateKey(d.getTime())+'~a']={n:1,t:i+1,r:0};}
  const k=Object.keys(clean({days:many}).days);
  assert.equal(k.length,1000);
  assert.equal(k[k.length-1],dateKey(new Date(2020,0,1200).getTime())+'~a','die neuesten bleiben');
  assert.equal(Object.keys(merge({days:many},{days:{}}).days).length,1000);
});
