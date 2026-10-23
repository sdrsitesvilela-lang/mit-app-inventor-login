"""Patch the supplied exported project; never print its API key."""
import copy, json, sys, zipfile
from pathlib import Path
import xml.etree.ElementTree as E

SOURCE = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[1]
NS = 'https://developers.google.com/blockly/xml'
E.register_namespace('', NS)
def el(tag, attrs=None, text=None):
    e=E.Element('{'+NS+'}'+tag, attrs or {})
    e.text=text
    return e
def block(t, fields=None, values=None, statements=None, mutation=None):
    b=el('block', {'type':t})
    if mutation is not None: b.append(el('mutation',mutation))
    for k,v in (fields or {}).items(): b.append(el('field',{'name':k},str(v)))
    for kind, entries in [('value',values),('statement',statements)]:
        for k,v in (entries or {}).items():
            if v is not None:
                node=el(kind,{'name':k}); node.append(v); b.append(node)
    return b
def seq(*items):
    items=[x for x in items if x is not None]
    for a,b in zip(items,items[1:]):
        n=el('next'); n.append(b); a.append(n)
    return items[0] if items else None
def txt(s): return block('text',{'TEXT':s})
def num(n): return block('math_number',{'NUM':n})
def boolean(v): return block('logic_boolean',{'BOOL':'TRUE' if v else 'FALSE'})
def var(n,local=False):
    b=block('lexical_variable_get',{'VAR':n if local else 'global '+n})
    if local and n not in ['i']:
        m=el('mutation'); m.append(el('eventparam',{'name':n})); b.insert(0,m)
    return b
def assign(n,v): return block('lexical_variable_set',{'VAR':'global '+n},{'VALUE':v})
def join(*v): return block('text_join',values={f'ADD{i}':x for i,x in enumerate(v)},mutation={'items':str(len(v))})
def eq(a,b): return block('logic_compare',{'OP':'EQ'},{'A':a,'B':b})
def both(a,b): return block('logic_operation',{'OP':'AND'},{'A':a,'B':b})
def either(a,b): return block('logic_operation',{'OP':'OR'},{'A':a,'B':b})
def negate(a): return block('logic_negate',values={'BOOL':a})
def cond(test,yes,no=None): return block('controls_if',values={'IF0':test},statements={'DO0':yes,'ELSE':no},mutation={'else':'1'} if no is not None else {})
def typ(n):
    if n.startswith('Screen'): return 'Form'
    if n.startswith('Web'): return 'Web'
    if n.startswith('Btn'): return 'Button'
    if n.startswith('Txt'): return 'PasswordTextBox' if 'Senha' in n else 'TextBox'
    return {'LblMensagem':'Label','FirebaseDB1':'FirebaseDB'}[n]
def prop(n,p,v=None): return block('component_set_get',{'COMPONENT_SELECTOR':n,'PROP':p},values={'VALUE':v} if v is not None else {},mutation={'component_type':typ(n),'instance_name':n,'is_generic':'false','set_or_get':'set' if v is not None else 'get','property_name':p})
def call(n,m,*args): return block('component_method',{'COMPONENT_SELECTOR':n},values={f'ARG{i}':v for i,v in enumerate(args)},mutation={'component_type':typ(n),'instance_name':n,'is_generic':'false','method_name':m})
def event(n,e,body): return block('component_event',{'COMPONENT_SELECTOR':n},statements={'DO':body},mutation={'component_type':typ(n),'instance_name':n,'is_generic':'false','event_name':e})
def dictionary(**entries): return block('dictionaries_create_with',values={f'ADD{i}':block('pair',values={'KEY':txt(k),'VALUE':v}) for i,(k,v) in enumerate(entries.items())},mutation={'items':str(len(entries))})
def lookup(d,k): return block('dictionaries_lookup',values={'KEY':txt(k),'DICT':d,'NOTFOUND':txt('')})
def listing(*v): return block('lists_create_with',values={f'ADD{i}':x for i,x in enumerate(v)},mutation={'items':str(len(v))})
def length(v): return block('text_length',values={'VALUE':v})
def contains(v,part): return block('text_contains',{'OP':'CONTAINS'},{'TEXT':v,'PIECE':txt(part)},mutation={'mode':'CONTAINS'})
def message(s,color='red'):
    colors={'red':'#ff0000','green':'#009900','blue':'#0000ff'}
    return seq(prop('LblMensagem','Text',txt(s)),prop('LblMensagem','TextColor',block('color_'+color,{'COLOR':colors[color]})))

with zipfile.ZipFile(SOURCE) as z: files={n:z.read(n) for n in z.namelist() if not n.endswith('/')}
base=next(n.rsplit('/',1)[0]+'/' for n in files if n.endswith('/Screen1.bky'))
r=E.fromstring(files[base+'Screen1.bky'])
key=None
for b in r:
    if b.get('type')=='global_declaration':
        fields={x.get('name'):x.text for x in b if x.tag.endswith('field')}
        if fields.get('NAME')=='firebaseApiKey':
            key=next((x.text for x in b.iter() if x.tag.endswith('field') and x.get('name')=='TEXT'),None)
assert key and key!='COLE_SUA_WEB_API_KEY', 'API key not configured in supplied Screen1'

for screen in ['Screen1','Screen2']:
    registration=screen=='Screen2'
    user='TxtNovoUsuario' if registration else 'TxtUsuario'
    password='TxtNovaSenha' if registration else 'TxtSenha'
    button='BtnCadastrar' if registration else 'BtnEntrar'
    navigation='BtnVoltar' if registration else 'BtnCriarConta'
    def busy(v): return seq(*(prop(n,'Enabled',boolean(not v)) for n in [user,password,button,navigation]))
    def finish(s,color='red'):
        return seq(assign('estado',txt('')),assign('idToken',txt('')),assign('resposta',dictionary()),prop(password,'Text',txt('')),busy(False),message(s,color))
    def headers(): return listing(listing(txt('Content-Type'),txt('application/json; charset=UTF-8')))
    def email(): return join(var('usuario'),txt('@login-escolar.example'))
    def auth_request():
        return seq(assign('estado',txt('auth')),busy(True),message('Autenticando…','blue'),
            prop('WebAuth','Url',join(txt('https://identitytoolkit.googleapis.com/v1/accounts:'+('signUp' if registration else 'signInWithPassword')+'?key='),var('firebaseApiKey'))),
            prop('WebAuth','RequestHeaders',headers()),
            call('WebAuth','PostText',call('WebAuth','JsonObjectEncode',dictionary(email=email(),password=block('text_trim',values={'TEXT':prop(password,'Text')}),returnSecureToken=boolean(True)))),
            prop(password,'Text',txt('')))
    # Validate the canonical username alphabet so database keys and Auth identity agree.
    character=block('text_segment',values={'TEXT':var('usuario'),'START':var('i',True),'LENGTH':num(1)})
    char_ok=block('text_contains',{'OP':'CONTAINS'},{'TEXT':txt('abcdefghijklmnopqrstuvwxyz0123456789_'),'PIECE':character},mutation={'mode':'CONTAINS'})
    check_chars=block('controls_forRange',{'VAR':'i'},{'START':num(1),'END':length(var('usuario')),'STEP':num(1)}, {'DO':cond(negate(char_ok),assign('nomeValido',boolean(False)))})
    size_ok=both(block('math_compare',{'OP':'GTE'},{'A':length(var('usuario')),'B':num(3)}),block('math_compare',{'OP':'LTE'},{'A':length(var('usuario')),'B':num(32)}))
    start=cond(eq(var('estado'),txt('')),seq(
        assign('usuario',block('text_changeCase',{'OP':'DOWNCASE'},{'TEXT':block('text_trim',values={'TEXT':prop(user,'Text')})})),
        assign('nomeValido',size_ok),check_chars,
        cond(either(eq(var('usuario'),txt('')),eq(block('text_trim',values={'TEXT':prop(password,'Text')}),txt(''))),message('Preencha usuário e senha.'),
            cond(negate(var('nomeValido')),message('Usuário: 3 a 32 letras a–z, números ou _. Sem acentos.'),auth_request()))))
    # Atomic multi-location update. Rules bind each path to this Auth identity.
    record=lambda:dictionary(username=var('usuario'),uid=var('uid'))
    update=block('dictionaries_create_with',values={
        'ADD0':block('pair',values={'KEY':join(txt('usernames/'),var('usuario')),'VALUE':record()}),
        'ADD1':block('pair',values={'KEY':join(txt('users/'),var('uid')),'VALUE':record()})},mutation={'items':'2'})
    write=seq(assign('estado',txt('db')),message('Confirmando perfil no banco…','blue'),
        prop('WebDatabase','Url',join(txt('https://mit-app-inventor-banco-master-default-rtdb.firebaseio.com/login_escolar.json?auth='),call('WebDatabase','UriEncode',var('idToken')))),
        prop('WebDatabase','RequestHeaders',headers()),call('WebDatabase','PatchText',call('WebDatabase','JsonObjectEncode',update)))
    auth_success=seq(assign('resposta',call('WebAuth','JsonTextDecodeWithDictionaries',var('responseContent',True))),
        assign('uid',lookup(var('resposta'),'localId')),assign('idToken',lookup(var('resposta'),'idToken')),
        cond(either(eq(var('uid'),txt('')),eq(var('idToken'),txt(''))),finish('Resposta de autenticação incompleta.'),write))
    auth_failure=cond(contains(var('responseContent',True),'EMAIL_EXISTS'),finish('Este usuário já está cadastrado'),
        cond(contains(var('responseContent',True),'WEAK_PASSWORD'),finish('A senha deve ter pelo menos 6 caracteres.'),
        cond(either(contains(var('responseContent',True),'INVALID_LOGIN_CREDENTIALS'),either(contains(var('responseContent',True),'EMAIL_NOT_FOUND'),contains(var('responseContent',True),'INVALID_PASSWORD'))),finish('Usuário inexistente ou senha incorreta.'),
        cond(contains(var('responseContent',True),'TOO_MANY_ATTEMPTS'),finish('Muitas tentativas. Aguarde e tente novamente.'),finish('Falha de autenticação. Verifique a chave, o provedor e a conexão.')))))
    auth_result=cond(eq(var('estado'),txt('auth')),cond(eq(var('responseCode',True),num(200)),auth_success,auth_failure))
    db_result=cond(eq(var('estado'),txt('db')),cond(eq(var('responseCode',True),num(200)),finish('Conta criada com sucesso!' if registration else 'Login realizado com sucesso!','green'),
        cond(either(eq(var('responseCode',True),num(401)),eq(var('responseCode',True),num(403))),finish('Perfil não confirmado: permissão negada ou nome em conflito. Confira as regras. Se criou a conta, tente entrar novamente.'),finish('Falha ao confirmar perfil no banco. Tente entrar novamente.'))))
    blocks=[]
    for n,v in [('firebaseApiKey',txt(key)),('estado',txt('')),('usuario',txt('')),('uid',txt('')),('idToken',txt('')),('resposta',dictionary()),('nomeValido',boolean(False)),('erroFirebaseLegado',txt(''))]:
        blocks.append(block('global_declaration',{'NAME':n},{'VALUE':v}))
    blocks += [event(button,'Click',start),event('WebAuth','GotText',auth_result),event('WebDatabase','GotText',db_result)]
    for web,state in [('WebAuth','auth'),('WebDatabase','db')]:
        blocks.append(event(web,'TimedOut',cond(eq(var('estado'),txt(state)),finish('Tempo esgotado. Confira a internet; tente entrar novamente.'))))
    blocks.append(event(screen,'ErrorOccurred',cond(negate(eq(var('estado'),txt(''))),finish('Falha de rede ou resposta inválida. Tente entrar novamente.'))))
    blocks.append(event('FirebaseDB1','FirebaseError',assign('erroFirebaseLegado',var('message',True))))
    nav=block('controls_closeScreen') if registration else block('controls_openAnotherScreen',values={'SCREEN':txt('Screen2')})
    blocks.append(event(navigation,'Click',cond(eq(var('estado'),txt('')),nav)))
    blocks.append(event(screen,'BackPressed',cond(eq(var('estado'),txt('')),block('controls_closeScreen') if registration else block('controls_closeApplication'),message('Aguarde a requisição terminar.','blue'))))
    root=el('xml')
    for i,b in enumerate(blocks): b.set('x',str(30+(i%3)*650)); b.set('y',str(30+(i//3)*450)); root.append(b)
    root.append(el('yacodeblocks',{'ya-version':'237','language-version':'37'}))
    for i,b in enumerate(root.iter()):
        if b.tag.endswith('}block'): b.set('id',screen+'_'+str(i))
    files[base+screen+'.bky']=E.tostring(root,encoding='utf-8')
    raw=files[base+screen+'.scm'].decode(); data=json.loads(raw[raw.index('{'):raw.rindex('}')+1])
    cs=data['Properties']['$Components']
    for c in cs:
        if c['$Name']=='WebAuth': c['Timeout']='20000'; c['SaveResponse']='False'; c['AllowCookies']='False'
        if c['$Name']=='FirebaseDB1':
            c['FirebaseURL']='https://mit-app-inventor-banco-master-default-rtdb.firebaseio.com/'
            c['ProjectBucket']='login_escolar'; c['FirebaseToken']=''
    assert not any(c['$Name']=='WebDatabase' for c in cs)
    cs.append({'$Name':'WebDatabase','$Type':'Web','$Version':'9','Uuid':'-987654321','Timeout':'20000','SaveResponse':'False','AllowCookies':'False'})
    files[base+screen+'.scm']=('#|\n$JSON\n'+json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n|#').encode()
with zipfile.ZipFile(OUT/'LoginFirebasePRONTO.aia','w',zipfile.ZIP_DEFLATED) as z:
    for n,v in files.items(): z.writestr(n,v)
print('Gerado LoginFirebasePRONTO.aia; chave da Screen1 reutilizada nas duas telas (valor oculto).')
