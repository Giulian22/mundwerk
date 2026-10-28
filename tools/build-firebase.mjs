/* Baut vendor/firebase.js aus dem npm-Paket firebase. Aufruf: npm install, dann npm run build:firebase
   Die Datei liegt im Projekt, damit kein Code von fremden Servern nachgeladen wird und sie offline gespeichert ist. */
import {build} from 'esbuild';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const ROOT=fileURLToPath(new URL('..',import.meta.url));
const version=JSON.parse(readFileSync(ROOT+'node_modules/firebase/package.json','utf8')).version;
await build({
  entryPoints:[ROOT+'tools/firebase-entry.js'],
  outfile:ROOT+'vendor/firebase.js',
  bundle:true,format:'esm',platform:'browser',target:'es2020',minify:true,
  legalComments:'eof',
  banner:{js:'/* Firebase JS SDK '+version+' (Apache License 2.0), nur App, Auth und Firestore Lite. Erzeugt mit npm run build:firebase. */'}
});
console.log('vendor/firebase.js gebaut (Firebase '+version+')');
