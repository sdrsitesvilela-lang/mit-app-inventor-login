# Login Firebase Seguro — MIT App Inventor 2

Projeto escolar com duas telas, cadastro e login assíncronos. O arquivo final é `LoginFirebaseFINAL_CORRIGIDO.aia`.

## Conectar ao seu Firebase

1. No Firebase Console, crie um projeto e ative **Authentication > Sign-in method > Email/Password**.
2. Crie o **Realtime Database**. Durante testes escolares, configure o acesso ao bucket `login_escolar`; antes de publicar, aplique regras adequadas ao seu projeto.
3. Importe o `.aia` no MIT App Inventor 2.
4. Em **Screen1** e **Screen2**, selecione `FirebaseDB1` e informe a mesma `FirebaseURL` e o mesmo `ProjectBucket` (`login_escolar`, ou outro nome igual nas duas telas). Use `FirebaseToken` apenas se a sua configuração legada realmente exigir.
5. Em **Project Settings > General > Your apps > Web app**, copie a **Web API Key**. O arquivo enviado ainda continha `COLE_SUA_WEB_API_KEY` nas duas telas; substitua esse marcador na variável global `firebaseApiKey` de ambas.

Nenhuma URL, token ou chave real é incluída no projeto.

## Segurança e funcionamento

A senha não é gravada no Realtime Database. Ela é transmitida por HTTPS ao Firebase Authentication; o banco guarda somente `cadastrado` em uma chave `usuario_...` derivada do nome normalizado. O e-mail técnico usado internamente é derivado do usuário (`usuario@login-escolar.example`) e existe apenas para permitir o provedor Email/Password sem pedir um e-mail na atividade.

O componente nativo `FirebaseDB` não oferece hashing de senha nem autenticação segura por nome de usuário. Guardar senha ou um hash caseiro nesse componente seria inseguro. Para produção, prefira solicitar um e-mail real ou usar um backend/Cloud Function que mapeie nomes de usuário para identidades do Firebase Auth e emita autenticação customizada; também proteja o Realtime Database com regras vinculadas a `auth.uid`.

O cadastro evita cliques duplicados enquanto há uma requisição, normaliza o usuário com `trim` + minúsculas, consulta `GotValue`, cria a identidade no Auth e só confirma depois que `DataChanged` observa a gravação feita por `StoreValue`. Erros do banco passam por `FirebaseError`. O login consulta o índice no banco e então valida a senha no Firebase Authentication.

## Regerar e validar

Requer Node.js e `zip`:

```sh
npm run build
npm test
```
