# Foto de perfil

No cartão de perfil em **Configurações**, clique na foto para escolher uma imagem e
confira a prévia antes de salvar. O botão fica sobre a foto, com fundo escuro e
ícone de editar ao passar o mouse ou usar o teclado; em telas de toque, o ícone
fica visível. Cancelar não altera a foto atual. O editor também permite remover
a foto e usar o avatar padrão.

A conta é conferida pela sessão PHP. O código no navegador não autoriza alterar
a foto de outra pessoa. O envio aceita JPG, PNG e WebP de até 5 MB, no máximo
12 megapixels e 6000 pixels por lado. A imagem final é um JPEG de 512 × 512,
com recorte central e remoção de metadados.

## Servidor

O envio pelo editor funciona mesmo sem GD e Fileinfo. A API informa em
`prepararNoNavegador` quando precisa da preparação local; nesse caso, o navegador
decodifica JPG/PNG/WebP, aplica a orientação da foto, recorta e exporta um JPEG
de 512 × 512 antes de enviar. O servidor aceita somente esse tamanho/formato,
confere a estrutura JPEG e remove metadados e conteúdo após o fim da imagem.

Com GD disponível, o PHP continua decodificando e recodificando a imagem, inclusive
para clientes que enviam os arquivos originais diretamente à API. Fileinfo reforça
a identificação quando está habilitada; EXIF corrige a orientação no processamento
pelo PHP. Configure os limites do upload:

```ini
upload_max_filesize=5M
post_max_size=8M
```

As imagens são salvas com o código do usuário: `CODIGO_USUARIO.jpg`. Por padrão,
o armazenamento é `quote-private/avatars`, quatro níveis acima do diretório do
modelo `classes/models/AvatarUsuario.php`, quando esse local está fora da pasta
pública. Se a instalação estiver dentro de `htdocs`/`www`, o caminho é ajustado
automaticamente para uma pasta ao lado da raiz pública. Um armazenamento antigo
que já esteja fora dela é preservado. A variável de
ambiente `QUOTE_AVATAR_DIR` permite escolher outra pasta absoluta, gravável pelo
PHP e também fora da raiz pública. Preserve essa pasta ao atualizar o site.
Não é necessário alterar o banco nem reimportar os dados.

## APIs e atualização das imagens

- `avatarUsuario.php?codigoUsuario=ID`: imagem pública, com ETag e revalidação.
- `buscarAvatarUsuario.php?codigoUsuario=ID`: imagem atual, versão e conta
  autenticada, usados para habilitar a edição.
- `atualizarAvatarUsuario.php`: POST multipart com `codigoUsuario` e `foto`, ou
  `codigoUsuario` e `acao=remover`. Somente o dono pode salvar ou remover.

`js/avatares.js` centraliza os endereços e atualiza as fotos da conta na página
após o envio. As demais páginas consultam a imagem atual ao navegar. Fotos
legadas em `img/ID.png` continuam disponíveis, mesmo quando os arquivos estão
divididos entre `Quote/img` e `quote/img`; removê-las pelo editor apenas
oculta o legado, preservando os arquivos originais do projeto.

As mensagens de sucesso são verdes e desaparecem após dois segundos. Durante
o envio, os controles ficam bloqueados para evitar duplicações. Falhas mantêm
a prévia para tentar novamente; quando a resposta do envio se perde, o editor
consulta o estado salvo antes de liberar outra alteração.

Para verificar os caminhos do avatar em uma instalação direta, incluindo as
pastas `Quote/img` e `quote/img` e um projeto dentro de `htdocs`/`www`:

```sh
php quote/bd/test_avatar_caminhos.php
```

O teste usa apenas arquivos temporários, sem conexão ao banco e sem modificar
fotos existentes.

Para conferir a validação de JPEG preparado sem extensões de imagem:

```sh
php -n quote/bd/test_avatar_jpeg.php
```

As duas imagens em `fixtures/` são quadrados sintéticos de 512 pixels para testar
JPEG baseline e progressivo. O teste não usa fotos de usuários nem banco.
