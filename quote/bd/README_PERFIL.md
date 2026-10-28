# Perfil do usuário

O perfil mantém as classes e APIs existentes do Quote. A conta exibida é a
identificada por `codigo` na sessão do navegador; nome, biografia, contagens,
estante, avaliações e metas são consultados no banco, sem dados de exemplo.

## Atualização de uma base existente

Execute apenas a migração do perfil:

```sh
mysql --default-character-set=utf8mb4 -u root -p < quote/bd/migracao_perfil.sql
```

Ela atualiza `buscarBibliotecaUsuario`, `buscarAvaliacaoUsuario` e
`buscarMetaUsuario`, preservando campos e assinaturas. Não altera tabelas nem
registros. Uma instalação nova pode usar `script_spc.sql`, que contém as mesmas
consultas. Não é necessário importar a massa novamente.

## Dados e navegação

- `buscarUsuarioCodigo.php?codigoUsuario=...`: nome, biografia e contagens de
  lidos, seguidores e seguindo, sem senha.
- `buscarBibliotecaUsuario.php?codigoUsuario=...`: estante, autores, gêneros,
  páginas e nota média; favoritos são identificados por `favorito = 1`.
- `buscarAvaliacaoUsuario.php?codigoUsuario=...`: resenhas, notas, livros,
  autores e datas reais, também usados na atividade recente.
- `buscarMetaUsuario.php?codigoUsuario=...`: todas as metas, com prazo e
  progresso. A interface permite criar, editar e excluir usando as APIs de
  metas existentes. Quantidade e identificadores precisam ser inteiros positivos
  e a data deve existir no calendário.

A estante não registra a data em que um livro foi concluído. Por isso, o
progresso das metas e o resumo de leituras consideram os livros atualmente
marcados como `lido`, inclusive ao selecionar metas de anos anteriores. A
atividade apresenta avaliações com suas datas e, depois, os status e favoritos
atuais da estante. Como a estante não guarda a data dessas escolhas, essas linhas
exibem `—`, com uma indicação acessível de que a data não foi registrada. Não
há histórico novo nem alteração no banco. As melhores avaliações usam o ano da avaliação.

As abas aceitam links como `perfil.html#estante` e `perfil.html#metas` e acompanham
o histórico do navegador. As capas usam o ISBN em
`https://covers.openlibrary.org/b/isbn/{id_livro}-L.jpg`.

## Perfil público de um leitor

Os nomes e avatares nas resenhas do livro e no feed da homepage abrem
`perfilPublico.html?codigoUsuario=ID`. O identificador da conta conectada no
`sessionStorage` permanece inalterado. Ao visitar a própria conta, a página
redireciona para `perfil.html`.

`buscarPerfilPublico.php` retorna nome, biografia, contagens, resenhas e somente
livros com `visivel = 1`, inclusive ao selecionar favoritos. Não retorna e-mail,
data de nascimento ou senha. O perfil público é de leitura: não exibe edição de
metas nem controles para alterar ou excluir resenhas de outro leitor.

O botão permite seguir e deixar de seguir, atualizando a contagem de seguidores
após a confirmação do servidor. Visitantes recebem o link para entrar na conta.
As APIs `seguirUsuario.php` e `deixarDeSeguir.php` usam o usuário autenticado na
sessão PHP, aceitam `codigoSeguido` e continuam aceitando `codigoSeguidor` quando
ele corresponde à sessão. Pedidos repetidos são idempotentes; seguir a si mesmo
ou alterar os seguidos de outra conta é rejeitado.

Não há migração adicional de banco: são reutilizadas as tabelas e procedures
existentes do projeto. Após uma resposta de gravação perdida, a página consulta
novamente o perfil para confirmar a relação antes de permitir outra alteração.

O menu do avatar mantém a prévia ao passar o mouse. Clicar fixa o menu; clicar
novamente, clicar fora ou usar Escape fecha. Os links das seções abrem a aba
correspondente do perfil. A navegação também funciona por teclado.

As avaliações na homepage, no livro e nos perfis mostram um coração e a contagem
real de curtidas. Clicar usa `curtirAvaliacao.php`; clicar novamente usa
`descurtirAvaliacao.php`. Os envios aceitam `codigoAvaliacao` e `codigoLivro`,
com `codigoUsuario` opcional correspondente à sessão PHP. A operação é
idempotente e valida se a avaliação pertence ao livro, sem migração de banco.
`contarCurtidasAvaliacao.php` mantém o array `resposta` existente e acrescenta
`estado`, também devolvido pelos envios: IDs da avaliação e livro, quantidade,
`curtida`, `autenticado` e `codigoUsuarioLogado`.

O coração e a contagem mudam após confirmação do servidor. Cópias da mesma
avaliação no perfil ficam sincronizadas; uma resposta perdida provoca nova
consulta antes de liberar o botão. Visitantes veem a contagem e recebem o link
para entrar ao tentar curtir. Falhas de consulta permitem tentar novamente.

Todas as abas usam proporções compactas. Os livros apresentam capa, título em
até duas linhas e autor em uma linha, sem nota individual, inclusive nos
favoritos e nas resenhas. A aba Atividade usa linhas compactas sem capas, com
usuário e título em destaque, estrelas nas avaliações e tempo relativo à direita.
O botão `ver mais` exibe cinco linhas adicionais. Os títulos levam ao livro.
Textos maiores nos cards de livros têm reticências.

A tela de metas mostra o progresso circular e em barra, os lidos acumulados,
a média das avaliações do ano da meta e os dias até o prazo. O histórico usa
linhas compactas; o menu `⋯` permite editar ou excluir cada meta. Percentuais
acima de 100% permanecem no texto, com o preenchimento limitado ao círculo ou
barra completos. No celular, Metas tem cabeçalho próprio e botão para voltar
ao perfil.

Falhas parciais preservam as seções que carregaram e oferecem nova tentativa.
Durante o envio de uma meta os controles ficam bloqueados. Se a resposta de
uma gravação falhar, a interface reconsulta as metas antes de permitir outro
cadastro, evitando repetir uma operação que já pode ter sido salva.

## Verificação

Consultas comparadas ao MariaDB isolado para duas contas, incluindo contagens,
metadados, favoritos e progresso. SQL estrito com `ONLY_FULL_GROUP_BY` verificou
livros com múltiplos autores e gêneros sem duplicar registros. O CRUD de metas
foi exercitado pelas APIs e pela interface, com remoção das metas temporárias.

No Chromium foram conferidas todas as abas em 320, 375, 768 e 1440 px, navegação
por teclado e histórico, estados vazios, visitante, falhas parciais, envio lento
e resposta perdida de gravação. Nenhum banco remoto foi alterado.
