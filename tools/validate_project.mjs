import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const aia = new URL('../LoginFirebaseSeguro.aia', import.meta.url);
if (!fs.existsSync(aia)) throw new Error('Execute npm run build primeiro.');
const listing = execFileSync('unzip', ['-Z1', aia.pathname], { encoding: 'utf8' });
for (const required of ['youngandroidproject/project.properties', 'Screen1.scm', 'Screen1.bky', 'Screen2.scm', 'Screen2.bky']) {
  if (!listing.includes(required)) throw new Error(`Arquivo ausente no AIA: ${required}`);
}
for (const screen of ['Screen1', 'Screen2']) {
  const xml = execFileSync('unzip', ['-p', aia.pathname, `src/appinventor/ai_atividadeescolar/LoginFirebaseSeguro/${screen}.bky`], { encoding: 'utf8' });
  execFileSync('python3', ['-c', 'import sys,xml.etree.ElementTree as E; E.fromstring(sys.stdin.read())'], { input: xml });
  const scm = execFileSync('unzip', ['-p', aia.pathname, `src/appinventor/ai_atividadeescolar/LoginFirebaseSeguro/${screen}.scm`], { encoding: 'utf8' });
  JSON.parse(scm.slice(scm.indexOf('{'), scm.lastIndexOf('}') + 1));
}
console.log('AIA íntegro: ZIP, project.properties, 2 telas, JSON dos formulários e XML dos blocos validados.');
