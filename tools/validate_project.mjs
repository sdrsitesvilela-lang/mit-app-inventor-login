import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const aia = new URL('../LoginFirebaseFinal.aia', import.meta.url);
if (!fs.existsSync(aia)) throw new Error('Execute npm run build primeiro.');
const listing = execFileSync('unzip', ['-Z1', aia.pathname], { encoding: 'utf8' });
for (const required of ['youngandroidproject/project.properties', 'Screen1.scm', 'Screen1.bky', 'Screen2.scm', 'Screen2.bky']) {
  if (!listing.includes(required)) throw new Error(`Arquivo ausente no AIA: ${required}`);
}
for (const screen of ['Screen1', 'Screen2']) {
  const xml = execFileSync('unzip', ['-p', aia.pathname, `src/appinventor/ai_atividadeescolar/LoginFirebaseSeguro/${screen}.bky`], { encoding: 'utf8' });
  const semanticCheck = String.raw`
import sys, xml.etree.ElementTree as E
root = E.fromstring(sys.stdin.read())
local = lambda element: element.tag.rsplit('}', 1)[-1]

for element in root.iter():
    if local(element) in ('value', 'statement') and not any(local(child) in ('block', 'shadow') for child in element):
        raise SystemExit('Conexão ausente em ' + local(element) + ' ' + str(element.attrib))

events = set()
for block in (element for element in root.iter() if local(element) == 'block'):
    children = list(block)
    mutation = next((child for child in children if local(child) == 'mutation'), None)
    if block.attrib.get('type') == 'component_event' and mutation is not None:
        key = (mutation.attrib.get('instance_name'), mutation.attrib.get('event_name'))
        if key in events:
            raise SystemExit('Evento duplicado: ' + '.'.join(key))
        events.add(key)
    if block.attrib.get('type') == 'component_set_get' and mutation is not None and mutation.attrib.get('property_name') == 'TextColor':
        value = next((child for child in children if local(child) == 'value' and child.attrib.get('name') == 'VALUE'), None)
        connected = next((child for child in list(value) if local(child) == 'block'), None) if value is not None else None
        if connected is None or not connected.attrib.get('type', '').startswith('color_'):
            raise SystemExit('TextColor sem bloco de cor válido')
`;
  execFileSync('python3', ['-c', semanticCheck], { input: xml });
  const scm = execFileSync('unzip', ['-p', aia.pathname, `src/appinventor/ai_atividadeescolar/LoginFirebaseSeguro/${screen}.scm`], { encoding: 'utf8' });
  JSON.parse(scm.slice(scm.indexOf('{'), scm.lastIndexOf('}') + 1));
}
console.log('AIA íntegro: ZIP, project.properties, 2 telas, JSON dos formulários e XML dos blocos validados.');
