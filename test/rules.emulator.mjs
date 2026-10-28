/* Prüft firestore.rules gegen den Firebase-Emulator: Nur das eigene Konto darf seine Daten lesen und schreiben.
   Start: npx firebase-tools emulators:exec --only auth,firestore --project demo-mundwerk "node test/rules.emulator.mjs" */
import assert from 'node:assert/strict';

const AUTH='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const DB='http://127.0.0.1:8080/v1/projects/demo-mundwerk/databases/(default)/documents';

async function user(email){
  const r=await fetch(AUTH+'/accounts:signUp?key=demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,password:'geheim123',returnSecureToken:true})});
  const j=await r.json();
  return {uid:j.localId,token:j.idToken};
}
async function call(method,path,who,body){
  const headers={'Content-Type':'application/json'};
  if(who) headers.Authorization='Bearer '+who.token;
  const r=await fetch(DB+path,{method:method,headers:headers,body:body?JSON.stringify(body):undefined});
  return r.status;
}
const doc=function(state,updated,extra){return {fields:Object.assign({state:{stringValue:state},updated:{integerValue:String(updated)}},extra||{})};};

const a=await user('a@test.de'),b=await user('b@test.de');
const results=[];
async function check(name,got,want){results.push(name);assert.equal(got,want,name+': HTTP '+got+' statt '+want);}

await check('A legt eigenes Dokument an',await call('PATCH','/users/'+a.uid,a,doc('{"v":2}',1)),200);
await check('A liest eigenes Dokument',await call('GET','/users/'+a.uid,a),200);
await check('A ändert eigenes Dokument',await call('PATCH','/users/'+a.uid,a,doc('{"v":2,"x":1}',2)),200);
await check('B liest A nicht',await call('GET','/users/'+a.uid,b),403);
await check('B schreibt A nicht',await call('PATCH','/users/'+a.uid,b,doc('{}',3)),403);
await check('B löscht A nicht',await call('DELETE','/users/'+a.uid,b),403);
await check('Ohne Anmeldung kein Lesen',await call('GET','/users/'+a.uid,null),403);
await check('Ohne Anmeldung kein Schreiben',await call('PATCH','/users/'+a.uid,null,doc('{}',4)),403);
await check('Zusätzliches Feld abgelehnt',await call('PATCH','/users/'+a.uid,a,doc('{}',5,{admin:{booleanValue:true}})),403);
await check('state muss Text sein',await call('PATCH','/users/'+a.uid,a,{fields:{state:{integerValue:'1'},updated:{integerValue:'6'}}}),403);
await check('updated muss Zahl sein',await call('PATCH','/users/'+a.uid,a,{fields:{state:{stringValue:'{}'},updated:{stringValue:'x'}}}),403);
await check('Zu groß abgelehnt',await call('PATCH','/users/'+a.uid,a,doc('x'.repeat(500001),7)),403);
await check('Andere Sammlung gesperrt',await call('PATCH','/notes/x',a,doc('{}',8)),403);
await check('Liste aller Nutzer gesperrt',await call('GET','/users',a),403);
await check('B legt eigenes Dokument an',await call('PATCH','/users/'+b.uid,b,doc('{}',9)),200);
await check('A löscht eigenes Dokument',await call('DELETE','/users/'+a.uid,a),200);
console.log('Sicherheitsregeln: '+results.length+' Prüfungen bestanden');
