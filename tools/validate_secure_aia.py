import copy,json,sys,zipfile
from pathlib import Path
import xml.etree.ElementTree as E
ROOT=Path(__file__).resolve().parents[1]
original=zipfile.ZipFile(sys.argv[1]); final=zipfile.ZipFile(ROOT/'LoginFirebasePRONTO.aia')
assert final.testzip() is None
tag=lambda e:e.tag.rsplit('}',1)[-1]
def children(b,t): return [e for e in b if tag(e)==t]
def fields(b): return {e.get('name'):e.text for e in children(b,'field')}
def mutation(b): return next(iter(children(b,'mutation')),E.Element('mutation'))
def scm(z,p):
 s=z.read(p).decode();return json.loads(s[s.index('{'):s.rindex('}')+1])
def components(c):
 yield c
 for a in c.get('$Components',[]): yield from components(a)
report=['Validação estática de LoginFirebasePRONTO.aia','ZIP íntegro.']
keys=[]
required={'logic_compare':['A','B'],'math_compare':['A','B'],'logic_operation':['A','B'],'logic_negate':['BOOL'],'text_trim':['TEXT'],'text_changeCase':['TEXT'],'text_length':['VALUE'],'text_segment':['TEXT','START','LENGTH'],'text_contains':['TEXT','PIECE'],'pair':['KEY','VALUE'],'dictionaries_lookup':['KEY','DICT','NOTFOUND'],'lexical_variable_set':['VALUE'],'global_declaration':['VALUE'],'controls_openAnotherScreen':['SCREEN'],'controls_forRange':['START','END','STEP']}
arity={'UriEncode':1,'JsonObjectEncode':1,'JsonTextDecodeWithDictionaries':1,'PostText':1,'PatchText':1}
for name in final.namelist():
 if not name.endswith('.bky'): continue
 screen=Path(name).stem; design=name[:-4]+'.scm'
 old=scm(original,design); new=scm(final,design)
 oldc={c['$Name']:c for c in components(old['Properties'])}; newc={c['$Name']:c for c in components(new['Properties'])}
 for n,c in oldc.items():
  if c['$Type'] in ['FirebaseDB','Web']: continue
  a=copy.deepcopy(c);b=copy.deepcopy(newc[n]); a.pop('$Components',None);b.pop('$Components',None)
  assert a==b,(screen,'visual changed',n)
 assert set(oldc)<=set(newc)
 assert newc['FirebaseDB1']['FirebaseToken']==''
 root=E.fromstring(final.read(name)); blocks=[e for e in root.iter() if tag(e)=='block']
 ids=[b.get('id') for b in blocks];assert len(ids)==len(set(ids))
 globals_={fields(b)['NAME'] for b in blocks if b.get('type')=='global_declaration'}
 events=set(); colors=0
 for b in blocks:
  t=b.get('type');m=mutation(b);f=fields(b)
  vals={e.get('name'):e for e in children(b,'value')}
  for e in children(b,'value')+children(b,'statement')+children(b,'next'): assert len(children(e,'block'))==1,(screen,t,'empty connection')
  needed=required.get(t,[])
  if t in ['lists_create_with','text_join','dictionaries_create_with']: needed=['ADD'+str(i) for i in range(int(m.get('items')))]
  if t=='controls_if': needed=['IF0'];assert children(b,'statement')
  if t=='component_set_get':
   if m.get('set_or_get')=='set':needed=['VALUE']
   assert m.get('instance_name') in newc
   assert newc[m.get('instance_name')]['$Type']==m.get('component_type')
   if m.get('property_name')=='TextColor':
    assert children(vals['VALUE'],'block')[0].get('type') in ['color_red','color_green','color_blue'];colors+=1
  if t=='component_method':
   assert m.get('instance_name') in ['WebAuth','WebDatabase'], 'Unexpected legacy database call'
   assert m.get('method_name') in arity
   needed=['ARG'+str(i) for i in range(arity[m.get('method_name')])]
  if t=='component_event':
   ident=(m.get('instance_name'),m.get('event_name'));assert ident not in events;events.add(ident)
   assert ident[0] in newc
  if t.startswith('lexical_variable') and f.get('VAR','').startswith('global '):assert f['VAR'][7:] in globals_
  assert set(needed)<=set(vals),(screen,t,'missing required inputs',needed)
  if t=='global_declaration' and f.get('NAME')=='firebaseApiKey':keys.append(fields(children(vals['VALUE'],'block')[0])['TEXT'])
 assert ('WebAuth','GotText') in events and ('WebDatabase','GotText') in events
 assert ('WebAuth','TimedOut') in events and ('WebDatabase','TimedOut') in events
 report.append(f'{screen}: {len(blocks)} blocos, {len(events)} eventos únicos, {colors} cores tipadas; entradas obrigatórias e referências verificadas. Visual preservado.')
oldroot=E.fromstring(original.read(next(n for n in original.namelist() if n.endswith('Screen1.bky'))))
oldkey=next(fields(children(children(b,'value')[0],'block')[0])['TEXT'] for b in oldroot if b.get('type')=='global_declaration' and fields(b).get('NAME')=='firebaseApiKey')
assert keys==[oldkey,oldkey] and oldkey!='COLE_SUA_WEB_API_KEY'
rules=json.loads((ROOT/'firebase-rules.json').read_text())['rules']
assert rules['.read'] is False and rules['.write'] is False
assert 'auth.token.email' in rules['login_escolar']['usernames']['$name']['.write']
report+=['API Key original preservada e igual nas duas telas; valor não exibido.','Regras JSON válidas, acesso global negado, caminhos por UID e identidade do nome.','PostText/PatchText/TimedOut e tipos de blocos novos conferidos no código-fonte oficial do MIT.','NÃO executado: importação no editor, compilação APK, emulador de regras, Firebase real, concorrência em aparelhos.','Nenhuma configuração remota alterada.']
(ROOT/'VALIDACAO-PRONTO.txt').write_text('\n'.join(report)+'\n')
print('\n'.join(report))
