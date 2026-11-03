# Ranking de livros por gênero

A página `ranking.html` usa as APIs, classes e procedures existentes. O filtro
começa em **Geral**, consultando `buscarRankingGenero.php?codigoGenero=0`.
Os demais filtros vêm exclusivamente de `buscarGenero.php`. Um link como
`ranking.html?genero=3` abre diretamente o gênero correspondente; um código
inexistente volta para Geral.

Os três primeiros livros aparecem em um pódio, com o primeiro ao centro e mais
alto, o segundo à esquerda e o terceiro à direita. A lista seguinte começa no
quarto lugar e vai até o décimo. O filtro fica à direita no computador e em
botões com rolagem horizontal no celular.

## Dados exibidos

- `buscarGenero.php` retorna `{status: 'true', dados: [...]}`, com `id_genero`
  e `nm_genero`.
- `buscarRankingGenero.php?codigoGenero=...` retorna
  `{status: 'true', resposta: [...]}`, usando `LivroController`, `Livro` e
  `rankingLivroGenero`.
- A procedure ordena por nota média decrescente, quantidade de avaliações
  decrescente, título e código crescentes, com `LIMIT 10`. Usa a média real
  antes do arredondamento de apresentação. A interface preserva essa
  ordem e mostra posição, capa, título, autores, gêneros, ano de publicação,
  nota média com uma casa decimal e quantidade de avaliações.
- Apenas livros avaliados participam da consulta existente. Se houver menos
  de dez, a tela mostra a quantidade disponível; um gênero sem avaliações
  apresenta uma mensagem vazia, sem preencher posições com livros fictícios.
- As capas usam `https://covers.openlibrary.org/b/isbn/{id_livro}-L.jpg`.
  Os links levam o ISBN na URL da página do livro e também atualizam a sessão.

A página usa as APIs existentes. Para atualizar as consultas de uma base já
criada, execute `migracao_notas_livros.sql`; os dados não precisam ser
reimportados. Veja `README_NOTAS_LIVROS.md` para o contrato e a validação.

## Comportamento

Selecionar outro gênero atualiza a URL e os resultados; Voltar/Avançar restaura
os filtros. Uma troca rápida cancela a requisição anterior e ignora respostas
antigas. Falhas nos gêneros ou no ranking oferecem nova tentativa independente.
Os gêneros continuam disponíveis quando a consulta de livros falha. O ranking
Geral pode carregar mesmo se a lista de gêneros estiver lenta ou indisponível.

A página usa o cabeçalho, menu do avatar, pesquisa e navegação compartilhados.
Abrir a pesquisa mantém o campo editável; respostas pendentes continuam
atualizando o conteúdo original, sem alterar a URL da pesquisa.

## Verificação

As respostas de todos os gêneros e do ranking geral da API foram comparadas a
uma consulta SQL independente em MariaDB isolado, com modo estrito e
`ONLY_FULL_GROUP_BY`. Também foi verificada uma fixture transacional com
múltiplos autores, gêneros e avaliações, removida por rollback.

A interface foi conferida em 320, 375, 768 e 1440 px: seleção inicial Geral,
pódio na ordem visual 2–1–3, lista do quarto ao décimo lugar, filtros do banco,
navegação Voltar/Avançar e ausência de transbordamento horizontal. Também foram
verificados resultados com zero a três livros, falhas com nova tentativa e
trocas rápidas de filtro.
