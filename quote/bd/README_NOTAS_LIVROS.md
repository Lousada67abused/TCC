# Notas médias nas consultas de livros

`migracao_notas_livros.sql` atualiza as consultas existentes sem alterar tabelas
ou registros. Em uma base `quote` já criada, execute esse arquivo completo no
MySQL Workbench ou pelo cliente SQL:

```sh
mysql -u SEU_USUARIO -p quote < quote/bd/migracao_notas_livros.sql
```

Para uma instalação nova, as mesmas definições já estão em `script_spc.sql`.
`migracao_perfil.sql` também mantém a mesma precisão na consulta da estante.
As assinaturas e os campos que as APIs já recebiam permanecem disponíveis.

## Contrato dos retornos

As consultas de livros retornam `nota_media`, calculada com
`COALESCE(ROUND(AVG(nota), 2), 0)`: duas casas decimais de precisão e zero quando
não há notas. O cálculo usa as avaliações do livro, independentemente da
quantidade de autores ou gêneros vinculados. Notas iguais de avaliações
diferentes entram normalmente na média; não se usa `AVG(DISTINCT nota)`.

Consultas atualizadas:

- Catálogo e filtros: `sp_buscar_livros`, `filtroLivro`, `buscarLivroCodigo`,
  `buscarLivroTitulo`, `buscarLivroGenero` e `buscarLivroAutor`.
- Relações por código: `sp_buscar_livros_por_editora`,
  `sp_buscar_livros_por_autor` e `sp_buscar_livros_por_genero`.
- Recomendações e estante: `recomendarLivroUsuario`, `buscarBibliotecaUsuario`,
  `filtrarBibliotecaStatus` e `filtrarBibliotecaFavoritos`.
- Cálculo individual: `calcularNotaMediaLivro`.
- Ranking: `rankingLivroGenero`.

As consultas de avaliações continuam retornando a nota individual em `nota`.
As buscas preservam seus filtros e sua ordenação anterior; a recomendação
continua priorizando os gêneros compatíveis.

## Ordenação do ranking

`rankingLivroGenero` primeiro agrega as avaliações de cada livro e depois
combina autores e gêneros. Assim, os vínculos não multiplicam a contagem de
avaliações. A ordenação é:

1. Média real decrescente, antes do arredondamento de apresentação.
2. Quantidade de avaliações distintas decrescente, quando a média empata.
3. Título e código do livro crescentes, para uma ordem estável.

O retorno mantém `nota_media` e `quantidade_avaliacoes`, com até dez livros.
`CALL rankingLivroGenero(0)` consulta o ranking geral; outro código limita
os resultados ao gênero indicado. Apenas livros com avaliações participam
do ranking, como na consulta anterior.

Duas médias reais diferentes podem aparecer com o mesmo valor após o
arredondamento; nesse caso, a maior média real continua acima.

## Teste de integração

Em uma base de teste `quote` com as tabelas e procedures já carregadas:

```sh
php quote/bd/test_notas_livros.php /caminho/cliente-teste.cnf
```

O arquivo de conexão usa a seção `[client]` com `socket`, `user` e `password`,
como no cliente MariaDB/MySQL. O teste verifica 18 cenários com modo estrito e
`ONLY_FULL_GROUP_BY`: buscas por texto/código/relações, livros sem notas,
notas repetidas, múltiplos autores/gêneros, contagem e desempates do ranking,
incluindo médias que ficam iguais após o arredondamento. As fixtures são
inseridas em uma transação e revertidas por rollback, inclusive em falhas.
