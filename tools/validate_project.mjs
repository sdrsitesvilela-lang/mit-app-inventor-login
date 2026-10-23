import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const aia = new URL('../LoginFirebaseFINAL_CORRIGIDO.aia', import.meta.url);
if (!fs.existsSync(aia)) throw new Error('Execute npm run build primeiro.');
const listing = execFileSync('unzip', ['-Z1', aia.pathname], { encoding: 'utf8' });
for (const required of ['youngandroidproject/project.properties', 'Screen1.scm', 'Screen1.bky', 'Screen2.scm', 'Screen2.bky']) {
  if (!listing.includes(required)) throw new Error(`Arquivo ausente no AIA: ${required}`);
}
for (const screen of ['Screen1', 'Screen2']) {
  const xml = execFileSync('unzip', ['-p', aia.pathname, `src/appinventor/ai_atividadeescolar/LoginFirebaseSeguro/${screen}.bky`], { encoding: 'utf8' });
  const scm = execFileSync('unzip', ['-p', aia.pathname, `src/appinventor/ai_atividadeescolar/LoginFirebaseSeguro/${screen}.scm`], { encoding: 'utf8' });
  const form = JSON.parse(scm.slice(scm.indexOf('{'), scm.lastIndexOf('}') + 1)).Properties;
  const componentNames = new Set([form.$Name]);
  const collectComponents = components => (components || []).forEach(component => {
    componentNames.add(component.$Name);
    collectComponents(component.$Components);
  });
  collectComponents(form.$Components);
  const semanticCheck = String.raw`
import json, sys, xml.etree.ElementTree as E
root = E.fromstring(sys.stdin.read())
local = lambda element: element.tag.rsplit('}', 1)[-1]
components = set(json.loads(sys.argv[1]))

for element in root.iter():
    if local(element) in ('value', 'statement') and not any(local(child) in ('block', 'shadow') for child in element):
        raise SystemExit('Conexão ausente em ' + local(element) + ' ' + str(element.attrib))

events = set()
globals_declared = set()
globals_used = set()
for block in (element for element in root.iter() if local(element) == 'block'):
    children = list(block)
    mutation = next((child for child in children if local(child) == 'mutation'), None)
    if block.attrib.get('type') == 'global_declaration':
        name = next((child.text for child in children if local(child) == 'field' and child.attrib.get('name') == 'NAME'), None)
        if name:
            globals_declared.add(name)
    if block.attrib.get('type') in ('lexical_variable_get', 'lexical_variable_set'):
        name = next((child.text for child in children if local(child) == 'field' and child.attrib.get('name') == 'VAR'), '')
        if name.startswith('global '):
            globals_used.add(name[7:])
    if mutation is not None and mutation.attrib.get('instance_name') and mutation.attrib['instance_name'] not in components:
        raise SystemExit('Componente inexistente: ' + mutation.attrib['instance_name'])
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
missing_globals = globals_used - globals_declared
if missing_globals:
    raise SystemExit('Variáveis globais não declaradas: ' + ', '.join(sorted(missing_globals)))
`;
  execFileSync('python3', ['-c', semanticCheck, JSON.stringify([...componentNames])], { input: xml });
}
console.log('AIA íntegro: ZIP, project.properties, 2 telas, JSON dos formulários e XML dos blocos validados.');
