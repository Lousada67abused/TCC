# Ranking de livros por gênero

A página `ranking.html` usa as APIs, classes e procedures existentes. O filtro
lateral e o seletor do celular são preenchidos exclusivamente por
`buscarGenero.php`. O primeiro gênero retornado pelo banco é selecionado ao
abrir a página sem filtro. Um link como `ranking.html?genero=3` abre diretamente
o gênero correspondente; um código inexistente volta ao primeiro disponível.

## Dados exibidos

- `buscarGenero.php` retorna `{status: 'true', dados: [...]}`, com `id_genero`
  e `nm_genero`.
- `buscarRankingGenero.php?codigoGenero=...` retorna
  `{status: 'true', resposta: [...]}`, usando `LivroController`, `Livro` e
  `rankingLivroGenero`.
- A procedure ordena por nota média decrescente, quantidade de avaliações
  decrescente e título crescente, com `LIMIT 10`. A interface preserva essa
  ordem e mostra posição, capa, título, autores, gêneros, nota média em duas
  casas e quantidade de avaliações.
- Apenas livros avaliados participam da consulta existente. Se houver menos
  de dez, a tela mostra a quantidade disponível; um gênero sem avaliações
  apresenta uma mensagem vazia, sem preencher posições com livros fictícios.
- As capas usam `https://covers.openlibrary.org/b/isbn/{id_livro}-L.jpg`.
  Os links levam o ISBN na URL da página do livro e também atualizam a sessão.

Não há API ou alteração SQL nova nesta implementação. Uma base já configurada
com essas duas consultas pode usar a página diretamente.

## Comportamento

Selecionar outro gênero atualiza a URL e os resultados; Voltar/Avançar restaura
os filtros. Uma troca rápida cancela a requisição anterior e ignora respostas
antigas. Falhas nos gêneros ou no ranking oferecem nova tentativa independente.
Os gêneros continuam disponíveis quando a consulta de livros falha.

A página usa o cabeçalho, menu do avatar, pesquisa e navegação compartilhados.
Abrir a pesquisa mantém o campo editável; respostas pendentes continuam
atualizando o conteúdo original, sem alterar a URL da pesquisa.

## Verificação

As respostas de todos os gêneros e do ranking geral da API foram comparadas a
uma consulta SQL independente em MariaDB isolado, com modo estrito e
`ONLY_FULL_GROUP_BY`. Também foi verificada uma fixture transacional com
múltiplos autores, gêneros e avaliações, removida por rollback.
