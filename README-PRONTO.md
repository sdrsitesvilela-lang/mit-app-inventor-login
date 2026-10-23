# Como usar

1. No Firebase Console, abra **Realtime Database → Regras** do projeto `mit-app-inventor-banco-master`.
2. Copie o conteúdo de `firebase-rules.json` e clique em **Publicar**. Estas regras substituem as atuais; outros caminhos continuam bloqueados.
3. Importe `LoginFirebasePRONTO.aia` no MIT App Inventor. A API Key da Screen1 enviada já foi copiada para ambas as telas. Não é necessário editar blocos.
4. Teste pelo Companion Android conectado à internet. Cadastre `aluno_teste` com uma senha de pelo menos 6 caracteres; volte e faça login.
5. Tente cadastrar `ALUNO_TESTE`, uma senha errada, campos vazios e desconectar a internet. Em dois aparelhos, tente cadastrar o mesmo nome ao mesmo tempo: somente uma conta deve ser criada.

## O que foi corrigido

As duas telas usam Firebase Authentication REST antes de acessar o banco. A senha segue por HTTPS apenas para Authentication; não é enviada ao Realtime Database nem armazenada localmente. Os campos de senha são limpos após o envio. O idToken permanece somente em memória durante a operação e é removido ao terminar.

Após autenticar, um PATCH autenticado e atômico grava:

```
login_escolar/usernames/aluno_teste = {username: "aluno_teste", uid: "UID_REAL"}
login_escolar/users/UID_REAL       = {username: "aluno_teste", uid: "UID_REAL"}
```

Os nomes são normalizados para minúsculas, removendo espaços nas extremidades. Aceitam de 3 a 32 caracteres: a–z, números e _. O Authentication usa internamente `nome@login-escolar.example`; não é uma caixa postal e não oferece recuperação de senha por e-mail. Contas antigas com outros caracteres não são migradas automaticamente.

O Authentication rejeita contas com a mesma identidade de e-mail. As regras permitem reivindicar um nome somente com o UID autenticado e um token cujo e-mail corresponda exatamente ao nome. Um segundo UID não pode sobrescrever o índice, mesmo simultaneamente. A conta não pode acessar registros de outros usuários nem listar o banco. A API Key não concede privilégios de banco. Nenhum token administrativo é usado.

Authentication e Realtime Database não compartilham uma transação. Se criar a conta mas a gravação do perfil falhar, a conta permanece criada: corrija as regras/conexão e faça **login**; o aplicativo tenta novamente a gravação atômica do perfil. Só mostra sucesso depois da resposta HTTP 200 do banco. Não use DataChanged como confirmação de gravação remota.

O FirebaseDB nativo foi preservado para a atividade, mas não faz leituras/gravações no fluxo seguro. O acesso autenticado ao banco usa WebDatabase REST, pois FirebaseDB não recebe automaticamente o token REST. Erros do componente legado são capturados separadamente. As telas e os componentes visuais originais foram preservados.

Credenciais incorretas e usuário inexistente compartilham a mensagem de erro quando o Firebase ativa proteção contra enumeração. Erros de permissão, falhas de rede, timeout, senha fraca e duplicidade têm tratamento nos blocos. A aplicação bloqueia campos, botões e navegação durante requisições.

## Validação e limites

Foram executadas verificações estáticas do ZIP, JSON das telas, XML e tipos dos blocos, conexões obrigatórias, referências de componentes, variáveis, eventos duplicados, igualdade da chave nas telas e preservação visual. Consulte `VALIDACAO-PRONTO.txt`.

Não foi realizada importação no editor, compilação APK ou autenticação contra o Firebase real. As regras não foram publicadas automaticamente. Os testes de aparelhos, concorrência e regras no servidor ainda precisam ser realizados após sua publicação. Validação estática não comprova zero erros no editor nem funcionamento online.

Para recriar a entrega a partir da exportação enviada, execute `python3 tools/secure_aia.py CAMINHO_DO_ORIGINAL.aia`. Esse comando usa a chave existente no original sem exibi-la.
