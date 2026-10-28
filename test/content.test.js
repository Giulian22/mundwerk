/* Prüft die Inhalte gegen die Vergleichslogik der App. Start: npm test */
import test from 'node:test';
import assert from 'node:assert/strict';
import {DATA} from '../js/data.js';
import {PACKS,judge,plain} from '../js/core.js';

const words=PACKS.flatMap(function(p){return p.items.filter(function(it){return it.kind==='w';});});
const sents=PACKS.flatMap(function(p){return p.items.filter(function(it){return it.kind==='s';});});

test('Jedes Wort und jeder Satz zählt gegen sich selbst als Treffer', function(){
  for(const it of words.concat(sents)){
    for(const said of [it.text,it.text.toUpperCase()+'.',' '+it.text.toLowerCase()+'!']){
      const j=judge(it,[{t:said,c:0.9}]);
      assert.equal(j.v,'hit',it.pid+': „'+it.text+'“ gegen „'+said+'“ ergibt '+j.v);
    }
  }
});

test('Jeder Verwechslungspartner zählt als Fehler und wird als typische Verwechslung erkannt', function(){
  let n=0;
  for(const it of words){
    if(!it.vs) continue;
    n++;
    const j=judge(it,[{t:it.vs,c:0.9}]);
    assert.equal(j.v,'miss',it.pid+': „'+it.text+'“ gegen Partner „'+it.vs+'“ ergibt '+j.v);
    assert.equal(j.swap,true,it.pid+': „'+it.text+'“ gegen „'+it.vs+'“ wird nicht als Verwechslung erkannt');
  }
  assert.ok(n>100,'zu wenige Verwechslungspartner: '+n);
});

test('Wort-Einträge haben das richtige Format', function(){
  const IPA=/^[a-z æðŋɑɒɔəɜɝɡɪʃʊʌʒˈˌːθ~]+$/;
  for(const p of DATA){
    for(const w of p.w){
      const where=p.id+': '+w[0];
      assert.ok(w.length===4||w.length===5,where+' hat '+w.length+' Felder');
      assert.ok(w.every(function(x){return typeof x==='string';}),where+': alle Felder müssen Text sein');
      assert.ok(w[2].trim(),where+': deutsche Bedeutung fehlt');
      assert.ok(IPA.test(w[3]),where+': Lautschrift „'+w[3]+'“ enthält falsche Zeichen (g muss ɡ sein, : muss ː sein)');
      assert.ok(w[3].split('~').length<=2,where+': höchstens britisch~amerikanisch');
      assert.ok((w[4]||'').split('~').length<=2,where+': Merkhilfe höchstens britisch~amerikanisch');
      assert.ok(!/\[\]/.test(w[0])&&(w[0].match(/\[/g)||[]).length===(w[0].match(/\]/g)||[]).length,where+': Klammern passen nicht');
      if(p.g==='s') assert.ok(/\[[^\]]+\]/.test(w[0]),where+': markierte Buchstaben fehlen');
    }
    for(const s of p.s){
      assert.ok((s.match(/\[/g)||[]).length===(s.match(/\]/g)||[]).length,p.id+': Klammern passen nicht in „'+s+'“');
      if(p.g==='s') assert.ok(/\[[^\]]+\]/.test(s),p.id+': Satz ohne markierte Buchstaben: '+s);
    }
  }
});

/* Diese Wörter stehen schon im Original absichtlich in zwei Paketen, jeweils mit anderem Schwerpunkt. */
const KNOWN_TWICE=['sink','price','face','zone','save','street','example','worse','months','bad'];

test('Keine doppelten Wörter und Sätze', function(){
  const seen={};
  for(const it of words){const k=it.text.toLowerCase();(seen[k]=seen[k]||[]).push(it.pid);}
  for(const k of Object.keys(seen)){
    const packs=seen[k];
    assert.equal(new Set(packs).size,packs.length,'„'+k+'“ steht doppelt im selben Paket '+packs[0]);
    if(packs.length>1) assert.ok(KNOWN_TWICE.includes(k),'„'+k+'“ steht doppelt: '+packs.join(', '));
  }
  const ss={};
  for(const it of sents){const k=plain(it.text).toLowerCase();assert.ok(!ss[k],'Satz doppelt: '+it.text);ss[k]=1;}
});
