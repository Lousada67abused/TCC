# Massa de teste do Quote

`script_insert.sql` preenche as 14 tabelas com dados de desenvolvimento.
O catálogo contém **51 livros com imagem JPEG efetivamente validada** pela
mesma URL usada no aplicativo:

```js
"https://covers.openlibrary.org/b/isbn/" + livro.id_livro + "-L.jpg"
```

| Tabela | Antes do filtro de capas | Massa atual |
| --- | ---: | ---: |
| usuario | 200 | 200 |
| genero | 29 | 29 |
| editora | 94 | 94 |
| autor | 180 | 180 |
| livro | 263 | 51 |
| autor_livro | 286 | 53 |
| livro_genero | 548 | 91 |
| preferencia_usuario | 693 | 693 |
| seguidor | 2.180 | 2.180 |
| biblioteca | 7.722 | 1.658 |
| meta_leitura | 495 | 495 |
| avaliacao | 5.742 | 1.232 |
| curtida_avaliacao | 20.790 | 4.407 |
| comentario | 9.306 | 1.943 |

O filtro mantém somente os ISBNs cuja URL retornou HTTP 200 com JPEG completo
e dimensões de pelo menos 100 × 100 pixels. Os 212 ISBNs que retornaram apenas
redirecionamentos ficaram fora da seleção, pois a imagem final não foi validada.
Foram removidos também seus vínculos com autores/gêneros, itens de estante,
avaliações, curtidas e comentários dependentes. Os registros mantidos conservam
seus IDs e valores; usuários, autores, editoras, gêneros, preferências, seguidores
e metas permanecem preservados.

## Importação

Na raiz do repositório, importe nesta ordem em MySQL ou MariaDB:

```sh
mysql --default-character-set=utf8mb4 -u root -p < quote/bd/script_estrutura.sql
mysql --default-character-set=utf8mb4 -u root -p < quote/bd/script_spc.sql
mysql --default-character-set=utf8mb4 -u root -p < Quote/bd/script_insert.sql
mysql --default-character-set=utf8mb4 -u root -p < Quote/bd/verificar_massa.sql
```

O arquivo de estrutura existente **apaga e recria o schema `quote`**. Use uma
instância separada de desenvolvimento, sem dados a preservar. O arquivo de
inserts exige tabelas vazias; não apaga registros, não desativa chaves
estrangeiras e não deve ser executado duas vezes na mesma base. A importação
usa uma transação. Não é uma migração incremental de uma base já preenchida.

Observe `Quote/` e `quote/` nos caminhos, especialmente em Linux. Os mesmos
arquivos podem ser executados no MySQL Workbench na ordem indicada.
`script_test_spc.sql` é um roteiro antigo e não faz parte desta importação.

## Contas e cenários

Todas as contas do arquivo usam a senha **`123`**, calculada com `MD5('123')`
para o login atual do projeto. Exemplos:

- `leitor001@example.com`: conta comum com biblioteca e atividade.
- `leitor101@example.com`: administrador com metas em 2024, 2025 e 2026.
- `leitor100@example.com` e `leitor200@example.com`: contas sem atividade.

As 1.658 entradas de estante incluem 1.020 livros lidos, 226 em leitura,
278 em "quero ler" e 134 abandonados. Há 190 favoritos, identificados por
`favorito = 1`; os demais usam `favorito = 0`. A visibilidade também varia
entre 0 e 1. As 1.232 avaliações usam somente notas de **1 a 5**, sem o prefixo
"Sobre..." nas resenhas. As datas vão de 2024 a outubro de 2026, com comentários
na data da avaliação ou depois dela, sem registros futuros.

Metas contam somente os livros atualmente marcados como lidos e avaliados no
ano da meta, independentemente de serem favoritos. Depois do filtro, a conta
101 tem uma leitura em 2024, uma em 2025 e três em 2026. As quantidades das
metas foram preservadas, e o progresso é recalculado pelas procedures.

As datas de publicação representam a edição do ISBN. Quando só o ano era
conhecido, foi usado 1º de janeiro; páginas desconhecidas ficam em branco.
As sinopses são resumos curtos de demonstração. Há edições em português e inglês.

## Verificação das capas

`capas_verificadas.csv` contém exatamente os 51 ISBNs do catálogo, todos com
`resultado = ok_jpeg`, HTTP 200, URL sem parâmetros, data UTC, dimensões e
SHA-256 do conteúdo recebido. Para revalidar:

```sh
python3 Quote/bd/verificar_capas.py --output capas_reverificadas.csv
```

O verificador usa a URL exata do aplicativo, sem `?default=false`, e valida os
bytes da imagem. JPEGs incompletos, imagens menores que 100 × 100, respostas
inválidas, erros e redirecionamentos não são aceitos. Um redirecionamento conhecido
é registrado como `redirect_nao_verificado`, sem seguir seu destino e sem afirmar
que a capa está ausente. Apenas `ok_jpeg` é sucesso.

O comando retorna 0 somente quando todas as imagens foram validadas. Falhas
transitórias têm novas tentativas com espera limitada; `--workers 2` permite
duas consultas simultâneas. A disponibilidade é a observada na data registrada
no manifesto e pode mudar no serviço externo.

## Validação

A seleção foi reimportada em MariaDB 11.8.6 isolado em 31/10/2026, com modo
estrito, `ONLY_FULL_GROUP_BY` e chaves estrangeiras ativas. As 25 verificações
em `verificar_massa.sql` passaram sem falhas. Foram comparados todos os registros
antes e depois do filtro para confirmar a remoção completa das dependências e
a preservação dos dados restantes. Nenhum banco remoto foi alterado.

O manifesto corresponde aos 51 ISBNs importados; dimensões e hashes foram
conferidos contra os JPEGs recebidos. Login, estante, ranking, feed,
recomendações, metas e avaliações foram consultados pelas procedures.

Os 15 testes do verificador de capas passaram, incluindo a regressão que exige
falha no CLI quando há apenas um redirecionamento conhecido, sem imagem validada:

```sh
python3 -m unittest discover -s Quote/bd -p 'test_verificar_capas.py' -v
```

A execução em MySQL não foi testada neste ambiente.
