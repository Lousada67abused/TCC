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
atividade apresenta avaliações com suas datas; não cria eventos de leitura ou
favoritos sem registro no banco. As melhores avaliações usam o ano da avaliação.

As abas aceitam links como `perfil.html#estante` e `perfil.html#metas` e acompanham
o histórico do navegador. As capas usam o ISBN em
`https://covers.openlibrary.org/b/isbn/{id_livro}-L.jpg`.

O menu do avatar mantém a prévia ao passar o mouse. Clicar fixa o menu; clicar
novamente, clicar fora ou usar Escape fecha. Os links das seções abrem a aba
correspondente do perfil. A navegação também funciona por teclado.

Todas as abas usam proporções compactas. Os livros apresentam capa, título em
até duas linhas e autor em uma linha, sem nota individual, inclusive nos
favoritos, na atividade e nas resenhas. Textos maiores têm reticências.

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
