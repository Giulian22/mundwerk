/* Prüft, dass der Service Worker alle App-Dateien kennt und die Version zu den Dateien passt.
   Schlägt er fehl: npm run stamp */
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {ROOT,appFiles,contentHash,readSw} from '../tools/version.mjs';

test('Service Worker kennt alle App-Dateien', function(){
  const sw=readSw();
  assert.deepEqual(sw.files,appFiles(),'Dateiliste in sw.js veraltet: npm run stamp');
  for(const f of sw.files) assert.ok(f==='./'||existsSync(ROOT+f),'fehlt: '+f);
});

test('Nach jeder Änderung gibt es eine neue Version, damit das Update wirklich ankommt', function(){
  const sw=readSw();
  assert.match(sw.version,/^\d{4}-\d{2}-\d{2}-[0-9a-f]{8}$/);
  assert.ok(sw.version.endsWith('-'+contentHash(appFiles())),'Dateien geändert, Version nicht: npm run stamp');
});
