/* Schreibt die Dateiliste und eine neue VERSION in sw.js, sobald sich eine App-Datei geändert hat.
   Aufruf: npm run stamp   (ohne Änderung bleibt alles, wie es ist) */
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const ROOT=fileURLToPath(new URL('..',import.meta.url));

function walk(dir){
  return readdirSync(ROOT+dir,{withFileTypes:true}).flatMap(function(d){
    const p=dir+'/'+d.name;
    return d.isDirectory()?walk(p):[p];
  });
}
/* Alles, was die App zum Starten braucht. Lizenztexte, Tests und Werkzeuge gehören nicht dazu. */
export function appFiles(){
  const files=['index.html','manifest.webmanifest']
    .concat(walk('css'),walk('js'),walk('icons'),walk('fonts').filter(function(f){return f.endsWith('.woff2');}));
  return ['./'].concat(files.sort());
}
export function contentHash(files){
  const h=createHash('sha256');
  files.forEach(function(f){h.update(f+'\n');h.update(readFileSync(ROOT+(f==='./'?'index.html':f)));});
  return h.digest('hex').slice(0,8);
}
export function readSw(){
  const src=readFileSync(ROOT+'sw.js','utf8');
  const v=/const VERSION='([^']*)';/.exec(src), f=/const FILES=(\[[^\]]*\]);/.exec(src);
  if(!v||!f) throw new Error('sw.js: VERSION oder FILES nicht gefunden');
  return {src:src,version:v[1],files:JSON.parse(f[1].replace(/'/g,'"'))};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const sw=readSw(),files=appFiles(),hash=contentHash(files);
  if(sw.version.endsWith('-'+hash)&&JSON.stringify(sw.files)===JSON.stringify(files)){
    console.log('sw.js ist aktuell: '+sw.version);
  }else{
    const version=new Date().toISOString().slice(0,10)+'-'+hash;
    const list='['+files.map(function(f){return "'"+f+"'";}).join(',')+']';
    writeFileSync(ROOT+'sw.js',sw.src.replace(/const VERSION='[^']*';/,"const VERSION='"+version+"';").replace(/const FILES=\[[^\]]*\];/,'const FILES='+list+';'));
    console.log('sw.js: neue Version '+version+' mit '+files.length+' Dateien');
  }
}
