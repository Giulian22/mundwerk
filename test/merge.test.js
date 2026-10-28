/* Prüft das Zusammenführen zweier Spielstände (Handy und Laptop). Start: npm test */
import test from 'node:test';
import assert from 'node:assert/strict';
import {blank,clean,merge,syncPart} from '../js/core.js';

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
  assert.ok(!('check' in p)&&!('auto' in p),'Prüfart und Vorsprechen werden nicht übertragen');
});

test('Alte Spielstände ohne Zeitstempel werden übernommen', function(){
  const alt=clean({v:1,accent:'us',auto:true,check:'auto',items:{a:{s:2,a:2,h:2,t:70}},custom:{text:'Old text.'},ts:80});
  assert.deepEqual(alt.stamps,{accent:80,text:80});
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
