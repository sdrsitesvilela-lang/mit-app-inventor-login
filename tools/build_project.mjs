import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'aia-src');
const projectPath = 'appinventor/ai_atividadeescolar/LoginFirebaseSeguro';
const screens = path.join(src, 'src', projectPath);
fs.rmSync(src, { recursive: true, force: true });
fs.mkdirSync(screens, { recursive: true });
fs.mkdirSync(path.join(src, 'youngandroidproject'), { recursive: true });

const C = {
  form: 32, button: 8, label: 6, textbox: 15, password: 8,
  vertical: 4, horizontal: 4, firebase: 3, web: 9, notifier: 7,
};

const component = (name, type, version, props = {}, children) => ({
  $Name: name, $Type: type, $Version: String(version), Uuid: String(component.uuid--),
  ...props, ...(children ? { $Components: children } : {}),
});
component.uuid = -1001;

function scm(name, title, children) {
  const json = {
    YaVersion: '237', Source: 'Form', Properties: {
      $Name: name, $Type: 'Form', $Version: String(C.form), Uuid: '0',
      AppName: 'Login Firebase Seguro', Title: title, Theme: 'AppTheme.Light.DarkActionBar',
      PrimaryColor: '&HFF3949AB', PrimaryColorDark: '&HFF283593', AccentColor: '&HFFFF7043',
      BackgroundColor: '&HFFF5F7FB', AlignHorizontal: '3', Scrollable: 'True',
      Sizing: 'Responsive', ShowListsAsJson: 'True', $Components: children,
    },
  };
  return `#|\n$JSON\n${JSON.stringify(json)}\n|#`;
}

const text = value => `<block type="text"><field name="TEXT">${escapeXml(value)}</field></block>`;
const bool = value => `<block type="logic_boolean"><field name="BOOL">${value ? 'TRUE' : 'FALSE'}</field></block>`;
const getGlobal = name => `<block type="lexical_variable_get"><field name="VAR">global ${name}</field></block>`;
const getLocal = name => `<block type="lexical_variable_get"><mutation xmlns="http://www.w3.org/1999/xhtml"><eventparam name="${name}"></eventparam></mutation><field name="VAR">${name}</field></block>`;
const componentType = componentName => componentName === 'FirebaseDB1' ? 'FirebaseDB' : componentName === 'WebAuth' ? 'Web' : componentName.startsWith('Btn') ? 'Button' : componentName.startsWith('Txt') ? (componentName.includes('Senha') ? 'PasswordTextBox' : 'TextBox') : componentName.startsWith('Lbl') ? 'Label' : componentName;
const propGet = (componentName, prop) => `<block type="component_set_get"><mutation xmlns="http://www.w3.org/1999/xhtml" component_type="${componentType(componentName)}" set_or_get="get" property_name="${prop}" is_generic="false" instance_name="${componentName}"></mutation><field name="COMPONENT_SELECTOR">${componentName}</field><field name="PROP">${prop}</field></block>`;
const trim = block => `<block type="text_trim"><value name="TEXT">${block}</value></block>`;
const downcase = block => `<block type="text_changeCase"><field name="OP">DOWNCASE</field><value name="TEXT">${block}</value></block>`;
const join = (...parts) => `<block type="text_join"><mutation items="${parts.length}"></mutation>${parts.map((p, i) => `<value name="ADD${i}">${p}</value>`).join('')}</block>`;
const replaceAll = (source, segment, replacement) => `<block type="text_replace_all"><value name="TEXT">${source}</value><value name="SEGMENT">${text(segment)}</value><value name="REPLACEMENT">${text(replacement)}</value></block>`;
const pair = (key, value) => `<block type="pair"><value name="KEY">${text(key)}</value><value name="VALUE">${value}</value></block>`;
const dictionary = (...pairs) => `<block type="dictionaries_create_with"><mutation xmlns="http://www.w3.org/1999/xhtml" items="${pairs.length}"></mutation>${pairs.map((p, i) => `<value name="ADD${i}">${p}</value>`).join('')}</block>`;
const compare = (a, op, b) => `<block type="logic_compare"><field name="OP">${op}</field><value name="A">${a}</value><value name="B">${b}</value></block>`;
const logic = (a, op, b) => `<block type="logic_operation"><field name="OP">${op}</field><value name="A">${a}</value><value name="B">${b}</value></block>`;
const setGlobal = (name, value, next = '') => `<block type="lexical_variable_set" inline="false"><field name="VAR">global ${name}</field><value name="VALUE">${value}</value>${next ? `<next>${next}</next>` : ''}</block>`;
const setProp = (componentName, prop, value, yail = 'text', next = '') => `<block type="component_set_get" inline="false"><mutation xmlns="http://www.w3.org/1999/xhtml" component_type="${componentType(componentName)}" set_or_get="set" property_name="${prop}" is_generic="false" instance_name="${componentName}"></mutation><field name="COMPONENT_SELECTOR">${componentName}</field><field name="PROP">${prop}</field><value name="VALUE">${value}</value>${next ? `<next>${next}</next>` : ''}</block>`;
const method = (componentName, methodName, args, next = '') => `<block type="component_method" inline="false"><mutation xmlns="http://www.w3.org/1999/xhtml" component_type="${componentType(componentName)}" method_name="${methodName}" is_generic="false" instance_name="${componentName}"></mutation><field name="COMPONENT_SELECTOR">${componentName}</field>${args.map((a, i) => `<value name="ARG${i}">${a}</value>`).join('')}${next ? `<next>${next}</next>` : ''}</block>`;
const ifBlock = (condition, yes, no = '', next = '') => `<block type="controls_if" inline="false"><mutation${no ? ' else="1"' : ''}></mutation><value name="IF0">${condition}</value><statement name="DO0">${yes}</statement>${no ? `<statement name="ELSE">${no}</statement>` : ''}${next ? `<next>${next}</next>` : ''}</block>`;
const event = (componentName, eventName, body, x, y) => `<block type="component_event" x="${x}" y="${y}"><mutation xmlns="http://www.w3.org/1999/xhtml" component_type="${componentType(componentName)}" is_generic="false" instance_name="${componentName}" event_name="${eventName}"></mutation><field name="COMPONENT_SELECTOR">${componentName}</field><statement name="DO">${body}</statement></block>`;
const globalDecl = (name, value, x, y) => `<block type="global_declaration" x="${x}" y="${y}"><field name="NAME">${name}</field><value name="VALUE">${value}</value></block>`;
const escapeXml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// FirebaseDB.DataChanged reports only a direct child's key. Keep each user at
// the bucket root so the StoreValue acknowledgement can be matched exactly.
const userTag = () => join(text('usuario_'), replaceAll(method('WebAuth', 'UriEncode', [getGlobal('usuarioNormalizado')]), '.', '%2E'));
const email = () => join(method('WebAuth', 'UriEncode', [getGlobal('usuarioNormalizado')]), text('@login-escolar.example'));
const authJson = () => method('WebAuth', 'JsonObjectEncode', [dictionary(
  pair('email', email()), pair('password', getGlobal('senhaTemporaria')),
  pair('returnSecureToken', bool(true)),
)]);
const authUrl = mode => join(text(`https://identitytoolkit.googleapis.com/v1/accounts:${mode}?key=`), getGlobal('firebaseApiKey'));
const setBusy = (button, busy, next = '') => setProp(button, 'Enabled', bool(!busy), 'boolean', next);
// Color properties require a typed color block. Passing a text block containing
// &H... makes App Inventor disconnect the value during import.
const colorBlock = color => {
  const colors = {
    '&HFFD32F2F': ['color_red', '#ff0000'],
    '&HFF2E7D32': ['color_green', '#009900'],
    '&HFF3949AB': ['color_blue', '#0000ff'],
  };
  const [type, value] = colors[color];
  return `<block type="${type}"><field name="COLOR">${value}</field></block>`;
};
const show = (label, message, color, next = '') => setProp(label, 'Text', text(message), 'text', setProp(label, 'TextColor', colorBlock(color), 'number', next));

function requestAuth(mode, button, label) {
  const headers = `<block type="lists_create_with"><mutation items="1"></mutation><value name="ADD0"><block type="lists_create_with"><mutation items="2"></mutation><value name="ADD0">${text('Content-Type')}</value><value name="ADD1">${text('application/json; charset=UTF-8')}</value></block></value></block>`;
  return setProp('WebAuth', 'Url', authUrl(mode), 'text',
    setProp('WebAuth', 'RequestHeaders', headers, 'list',
      method('WebAuth', 'PostText', [authJson()], show(label, 'Conectando ao Firebase Authentication…', '&HFF3949AB'))));
}

const loginComponents = [
  component('Main', 'VerticalArrangement', C.vertical, { Width: '-2', Height: '-2', AlignHorizontal: '3', AlignVertical: '2' }, [
    component('EspacoSuperior', 'Label', C.label, { Text: '', Width: '-2', Height: '24' }),
    component('Card', 'VerticalArrangement', C.vertical, { Width: '-1090', BackgroundColor: '&HFFFFFFFF', AlignHorizontal: '3' }, [
      component('EspacoCardTopo', 'Label', C.label, { Text: '', Width: '-2', Height: '18' }),
      component('Titulo', 'Label', C.label, { Text: 'Acesso do aluno', FontBold: 'True', FontSize: '22.0', TextColor: '&HFF283593', TextAlignment: '1', Width: '-2', Height: '48' }),
      component('Subtitulo', 'Label', C.label, { Text: 'Entre com sua conta escolar', FontSize: '14.0', TextColor: '&HFF5F6368', TextAlignment: '1', Width: '-2', Height: '34' }),
      component('EspacoCabecalho', 'Label', C.label, { Text: '', Width: '-2', Height: '10' }),
      component('TxtUsuario', 'TextBox', C.textbox, { Hint: 'Digite seu usuário', Width: '-2', Height: '52', FontSize: '16.0', BackgroundColor: '&HFFF1F3F8', TextColor: '&HFF202124' }),
      component('EspacoCampos', 'Label', C.label, { Text: '', Width: '-2', Height: '10' }),
      component('TxtSenha', 'PasswordTextBox', C.password, { Hint: 'Digite sua senha', Width: '-2', Height: '52', FontSize: '16.0', BackgroundColor: '&HFFF1F3F8', TextColor: '&HFF202124' }),
      component('EspacoAntesBotoes', 'Label', C.label, { Text: '', Width: '-2', Height: '18' }),
      component('BtnEntrar', 'Button', C.button, { Text: 'ENTRAR', Width: '-2', Height: '50', Shape: '1', BackgroundColor: '&HFF3949AB', TextColor: '&HFFFFFFFF', FontBold: 'True', FontSize: '15.0' }),
      component('EspacoBotoes', 'Label', C.label, { Text: '', Width: '-2', Height: '8' }),
      component('BtnCriarConta', 'Button', C.button, { Text: 'CRIAR CONTA', Width: '-2', Height: '50', Shape: '1', BackgroundColor: '&HFFFF7043', TextColor: '&HFFFFFFFF', FontBold: 'True', FontSize: '15.0' }),
      component('EspacoMensagem', 'Label', C.label, { Text: '', Width: '-2', Height: '10' }),
      component('LblMensagem', 'Label', C.label, { Text: '', Width: '-2', Height: '42', TextAlignment: '1', FontSize: '14.0', TextColor: '&HFF5F6368' }),
      component('EspacoCardFim', 'Label', C.label, { Text: '', Width: '-2', Height: '14' }),
    ]),
    component('EspacoInferior', 'Label', C.label, { Text: '', Width: '-2', Height: '24' }),
  ]),
  component('FirebaseDB1', 'FirebaseDB', C.firebase, { FirebaseURL: 'DEFAULT', FirebaseToken: '', ProjectBucket: 'login_escolar' }),
  component('WebAuth', 'Web', C.web), component('Notifier1', 'Notifier', C.notifier),
];

const registrationComponents = [
  component('Main', 'VerticalArrangement', C.vertical, { Width: '-2', Height: '-2', AlignHorizontal: '3', AlignVertical: '2' }, [
    component('EspacoSuperior', 'Label', C.label, { Text: '', Width: '-2', Height: '24' }),
    component('Card', 'VerticalArrangement', C.vertical, { Width: '-1090', BackgroundColor: '&HFFFFFFFF', AlignHorizontal: '3' }, [
      component('EspacoCardTopo', 'Label', C.label, { Text: '', Width: '-2', Height: '18' }),
      component('Titulo', 'Label', C.label, { Text: 'Criar conta', FontBold: 'True', FontSize: '22.0', TextColor: '&HFF283593', TextAlignment: '1', Width: '-2', Height: '48' }),
      component('Subtitulo', 'Label', C.label, { Text: 'Cadastre seu usuário e senha', FontSize: '14.0', TextColor: '&HFF5F6368', TextAlignment: '1', Width: '-2', Height: '34' }),
      component('EspacoCabecalho', 'Label', C.label, { Text: '', Width: '-2', Height: '10' }),
      component('TxtNovoUsuario', 'TextBox', C.textbox, { Hint: 'Digite um nome de usuário', Width: '-2', Height: '52', FontSize: '16.0', BackgroundColor: '&HFFF1F3F8', TextColor: '&HFF202124' }),
      component('EspacoCampos', 'Label', C.label, { Text: '', Width: '-2', Height: '10' }),
      component('TxtNovaSenha', 'PasswordTextBox', C.password, { Hint: 'Senha com pelo menos 6 caracteres', Width: '-2', Height: '52', FontSize: '16.0', BackgroundColor: '&HFFF1F3F8', TextColor: '&HFF202124' }),
      component('EspacoAntesBotoes', 'Label', C.label, { Text: '', Width: '-2', Height: '18' }),
      component('BtnCadastrar', 'Button', C.button, { Text: 'CADASTRAR', Width: '-2', Height: '50', Shape: '1', BackgroundColor: '&HFF3949AB', TextColor: '&HFFFFFFFF', FontBold: 'True', FontSize: '15.0' }),
      component('EspacoBotoes', 'Label', C.label, { Text: '', Width: '-2', Height: '8' }),
      component('BtnVoltar', 'Button', C.button, { Text: 'VOLTAR AO LOGIN', Width: '-2', Height: '50', Shape: '1', BackgroundColor: '&HFFFF7043', TextColor: '&HFFFFFFFF', FontBold: 'True', FontSize: '15.0' }),
      component('EspacoMensagem', 'Label', C.label, { Text: '', Width: '-2', Height: '10' }),
      component('LblMensagem', 'Label', C.label, { Text: '', Width: '-2', Height: '54', TextAlignment: '1', FontSize: '14.0', TextColor: '&HFF5F6368' }),
      component('EspacoCardFim', 'Label', C.label, { Text: '', Width: '-2', Height: '14' }),
    ]),
    component('EspacoInferior', 'Label', C.label, { Text: '', Width: '-2', Height: '24' }),
  ]),
  component('FirebaseDB1', 'FirebaseDB', C.firebase, { FirebaseURL: 'DEFAULT', FirebaseToken: '', ProjectBucket: 'login_escolar' }),
  component('WebAuth', 'Web', C.web), component('Notifier1', 'Notifier', C.notifier),
];

const emptyEitherLogin = logic(compare(trim(propGet('TxtUsuario', 'Text')), 'EQ', text('')), 'OR', compare(trim(propGet('TxtSenha', 'Text')), 'EQ', text('')));
const startLogin = setGlobal('usuarioNormalizado', downcase(trim(propGet('TxtUsuario', 'Text'))),
  setGlobal('senhaTemporaria', trim(propGet('TxtSenha', 'Text')),
    setGlobal('pendente', bool(true), setBusy('BtnEntrar', true,
      show('LblMensagem', 'Verificando usuário…', '&HFF3949AB', method('FirebaseDB1', 'GetValue', [userTag(), text('__NAO_EXISTE__')]))))));
const loginClick = ifBlock(emptyEitherLogin, show('LblMensagem', 'Preencha usuário e senha.', '&HFFD32F2F'), startLogin);
const loginGot = ifBlock(logic(getGlobal('pendente'), 'AND', compare(getLocal('tag'), 'EQ', userTag())),
  ifBlock(compare(getLocal('value'), 'EQ', text('__NAO_EXISTE__')),
    setGlobal('pendente', bool(false), setBusy('BtnEntrar', false, show('LblMensagem', 'Usuário ou senha incorretos.', '&HFFD32F2F'))),
    requestAuth('signInWithPassword', 'BtnEntrar', 'LblMensagem')));
const loginWeb = ifBlock(getGlobal('pendente'),
  ifBlock(compare(getLocal('responseCode'), 'EQ', `<block type="math_number"><field name="NUM">200</field></block>`),
    setGlobal('pendente', bool(false), setBusy('BtnEntrar', false, show('LblMensagem', 'Login realizado com sucesso!', '&HFF2E7D32'))),
    setGlobal('pendente', bool(false), setBusy('BtnEntrar', false, show('LblMensagem', 'Usuário ou senha incorretos.', '&HFFD32F2F')))));
const firebaseErrorLogin = setGlobal('pendente', bool(false), setBusy('BtnEntrar', false, show('LblMensagem', 'Falha de conexão com o Firebase. Tente novamente.', '&HFFD32F2F')));
const loginXml = `<xml xmlns="https://developers.google.com/blockly/xml">
${globalDecl('firebaseApiKey', text('COLE_SUA_WEB_API_KEY'), 20, 20)}
${globalDecl('pendente', bool(false), 20, 100)}
${globalDecl('usuarioNormalizado', text(''), 20, 180)}
${globalDecl('senhaTemporaria', text(''), 20, 260)}
${event('BtnEntrar', 'Click', loginClick, 360, 20)}
${event('BtnCriarConta', 'Click', `<block type="controls_openAnotherScreen"><value name="SCREEN">${text('Screen2')}</value></block>`, 360, 420)}
${event('FirebaseDB1', 'GotValue', loginGot, 800, 20)}
${event('WebAuth', 'GotText', loginWeb, 800, 420)}
${event('WebAuth', 'TimedOut', firebaseErrorLogin, 1240, 300)}
${event('FirebaseDB1', 'FirebaseError', firebaseErrorLogin, 1240, 20)}
<yacodeblocks xmlns="http://www.w3.org/1999/xhtml" ya-version="237" language-version="37"></yacodeblocks></xml>`;

const emptyEitherReg = logic(compare(trim(propGet('TxtNovoUsuario', 'Text')), 'EQ', text('')), 'OR', compare(trim(propGet('TxtNovaSenha', 'Text')), 'EQ', text('')));
const startReg = setGlobal('usuarioNormalizado', downcase(trim(propGet('TxtNovoUsuario', 'Text'))),
  setGlobal('senhaTemporaria', trim(propGet('TxtNovaSenha', 'Text')),
    setGlobal('pendente', bool(true), setBusy('BtnCadastrar', true,
      show('LblMensagem', 'Verificando disponibilidade…', '&HFF3949AB', method('FirebaseDB1', 'GetValue', [userTag(), text('__NAO_EXISTE__')]))))));
const regClick = ifBlock(emptyEitherReg, show('LblMensagem', 'Preencha usuário e senha.', '&HFFD32F2F'), startReg);
const regGot = ifBlock(logic(getGlobal('pendente'), 'AND', compare(getLocal('tag'), 'EQ', userTag())),
  ifBlock(compare(getLocal('value'), 'EQ', text('__NAO_EXISTE__')),
    requestAuth('signUp', 'BtnCadastrar', 'LblMensagem'),
    setGlobal('pendente', bool(false), setBusy('BtnCadastrar', false, show('LblMensagem', 'Este usuário já está cadastrado', '&HFFD32F2F')))));
const regWeb = ifBlock(getGlobal('pendente'),
  ifBlock(compare(getLocal('responseCode'), 'EQ', `<block type="math_number"><field name="NUM">200</field></block>`),
    setGlobal('aguardandoGravacao', bool(true), show('LblMensagem', 'Salvando cadastro…', '&HFF3949AB', method('FirebaseDB1', 'StoreValue', [userTag(), text('cadastrado')]))),
    setGlobal('pendente', bool(false), setBusy('BtnCadastrar', false, show('LblMensagem', 'Não foi possível cadastrar. A senha deve ter ao menos 6 caracteres e a configuração do Firebase deve estar correta.', '&HFFD32F2F')))));
const dataChanged = ifBlock(logic(getGlobal('aguardandoGravacao'), 'AND', compare(getLocal('tag'), 'EQ', userTag())),
  setGlobal('aguardandoGravacao', bool(false), setGlobal('pendente', bool(false), setBusy('BtnCadastrar', false,
    show('LblMensagem', 'Conta criada com sucesso!', '&HFF2E7D32')))));
const firebaseErrorReg = setGlobal('aguardandoGravacao', bool(false), setGlobal('pendente', bool(false), setBusy('BtnCadastrar', false, show('LblMensagem', 'Falha de conexão com o Firebase. Tente novamente.', '&HFFD32F2F'))));
const regXml = `<xml xmlns="https://developers.google.com/blockly/xml">
${globalDecl('firebaseApiKey', text('COLE_SUA_WEB_API_KEY'), 20, 20)}
${globalDecl('pendente', bool(false), 20, 100)}
${globalDecl('aguardandoGravacao', bool(false), 20, 180)}
${globalDecl('usuarioNormalizado', text(''), 20, 260)}
${globalDecl('senhaTemporaria', text(''), 20, 340)}
${event('BtnCadastrar', 'Click', regClick, 360, 20)}
${event('BtnVoltar', 'Click', '<block type="controls_closeScreen"></block>', 360, 440)}
${event('FirebaseDB1', 'GotValue', regGot, 800, 20)}
${event('WebAuth', 'GotText', regWeb, 800, 440)}
${event('FirebaseDB1', 'DataChanged', dataChanged, 1240, 20)}
${event('WebAuth', 'TimedOut', firebaseErrorReg, 1240, 300)}
${event('FirebaseDB1', 'FirebaseError', firebaseErrorReg, 1240, 440)}
<yacodeblocks xmlns="http://www.w3.org/1999/xhtml" ya-version="237" language-version="37"></yacodeblocks></xml>`;

fs.writeFileSync(path.join(screens, 'Screen1.scm'), scm('Screen1', 'Login', loginComponents));
fs.writeFileSync(path.join(screens, 'Screen1.bky'), loginXml);
fs.writeFileSync(path.join(screens, 'Screen2.scm'), scm('Screen2', 'Cadastro', registrationComponents));
fs.writeFileSync(path.join(screens, 'Screen2.bky'), regXml);
fs.writeFileSync(path.join(src, 'youngandroidproject', 'project.properties'), `main=${projectPath}.Screen1\nname=LoginFirebaseSeguro\nassets=../assets\nsource=../src\nbuild=../build\nversioncode=1\nversionname=1.0\nuseslocation=False\naname=Login Firebase Seguro\nsizing=Responsive\nshowlistsasjson=True\nactionbar=True\ntheme=AppTheme.Light.DarkActionBar\ncolor.primary=&HFF3949AB\ncolor.primary.dark=&HFF283593\ncolor.accent=&HFFFF7043\n`);

console.log(`Fontes geradas em ${src}`);
