# Massa de teste do Quote

`script_insert.sql` preenche as 14 tabelas do banco com dados de desenvolvimento.
Os livros usam ISBNs reais de 13 dígitos em `livro.id_livro`. As capas continuam
usando a mesma expressão do aplicativo:

```js
"https://covers.openlibrary.org/b/isbn/" + livro.id_livro + "-L.jpg"
```

| Tabela | Massa anterior | Massa ampliada |
| --- | ---: | ---: |
| usuario | 100 | 200 |
| genero | 20 | 29 |
| editora | 71 | 94 |
| autor | 111 | 180 |
| livro | 196 | 263 |
| autor_livro | 202 | 286 |
| livro_genero | 364 | 548 |
| preferencia_usuario | 297 | 693 |
| seguidor | 794 | 2.180 |
| biblioteca | 2.970 | 7.722 |
| meta_leitura | 198 | 495 |
| avaliacao | 2.178 | 5.742 |
| curtida_avaliacao | 6.534 | 20.790 |
| comentario | 2.178 | 9.306 |

Os 196 livros anteriores foram preservados. A ampliação acrescenta 67 ISBNs
com capa confirmada entre 69 candidatos consultados em 31/10/2026; os dois sem
capa foram excluídos. Os novos títulos incluem literatura infantil, mistérios,
contos, memórias e livros técnicos, com autores, editoras e gêneros vinculados.
As 297 avaliações que tinham nota zero passam a ter nota 1; seus IDs,
resenhas, datas, curtidas e comentários permanecem preservados.

## Importação

Na raiz do repositório, importe os arquivos nesta ordem em MySQL ou MariaDB:

```sh
mysql --default-character-set=utf8mb4 -u root -p < quote/bd/script_estrutura.sql
mysql --default-character-set=utf8mb4 -u root -p < quote/bd/script_spc.sql
mysql --default-character-set=utf8mb4 -u root -p < Quote/bd/script_insert.sql
mysql --default-character-set=utf8mb4 -u root -p < Quote/bd/verificar_massa.sql
```

O arquivo de estrutura existente **apaga e recria o schema `quote`**. Use uma
instância separada de desenvolvimento, sem dados a preservar. O seed exige as
tabelas vazias; ele não apaga registros, não desativa chaves estrangeiras e não
deve ser executado duas vezes na mesma base. Sua importação usa uma transação.

Observe a diferença entre `Quote/` e `quote/` nos caminhos do repositório,
especialmente em Linux. É possível abrir os mesmos arquivos no MySQL Workbench
e executar na ordem indicada. `script_test_spc.sql` é um roteiro antigo de
procedures e não faz parte desta importação.

## Contas e cenários

As contas de demonstração usam a senha **`123`**, com o MD5 exigido pelo login
atual do projeto. Exemplos:

- `leitor001@example.com`: usuário comum, ID 1, com biblioteca e atividade.
- `leitor016@example.com`: administrador, ID 16.
- `leitor100@example.com` e `leitor200@example.com`: contas sem atividade, para telas vazias.
- `leitor101@example.com`: conta com 20 livros lidos em 2024, 3 em 2025 e 5 em
  2026, para conferir a separação das metas por ano.

As contas e suas interações são fictícias. Todos os e-mails, inclusive os das
15 contas originais, usam o domínio reservado `example.com`; o SQL calcula
`MD5('123')` para uma senha de demonstração conhecida. Há bibliotecas públicas e privadas, os quatro
status (`lido`, `lendo`, `quero ler`, `desisti`), o campo independente
`favorito` (`1` para favorito e `0` para não favorito), avaliações de **1 a 5**,
curtidas de outros usuários, comentários posteriores às avaliações, seguidores,
preferências e metas para 2024, 2025 e 2026. Os livros têm editora, autor principal,
vínculos em `autor_livro` e gêneros; há também coautoria e múltiplos gêneros.

A massa ampliada tem 4.752 itens lidos, 1.089 em leitura, 1.287 em "quero ler"
e 594 abandonados, somando 7.722 entradas. Há 891 favoritos, sempre com
`favorito = 1`; os outros itens usam `favorito = 0`. Os livros lidos e avaliados
contam somente para a meta do ano de `dt_avaliacao`, independentemente de serem
favoritos. As novas avaliações e comentários têm datas entre 2024 e outubro
de 2026, sem registros futuros nem comentários anteriores à avaliação.
Os textos das resenhas começam diretamente pela opinião, sem o prefixo "Sobre...".

As datas de publicação dos títulos novos representam a edição do ISBN, não a
primeira publicação da obra. Quando só o ano era conhecido, foi usado 1º de
janeiro; páginas desconhecidas ficam em branco. As sinopses novas são resumos
curtos para demonstração. O catálogo contém edições em português e em inglês,
mantendo o título da edição correspondente ao ISBN.

## Verificação das capas

`capas_verificadas.csv` registra a consulta individual de cada ISBN incluído,
com título, URL, data UTC, status HTTP e resultado. ISBNs com HTTP 404, erros,
respostas inválidas ou imagens pequenas foram excluídos da seleção.

A verificação acrescenta `?default=false` à URL para distinguir ausência de capa
da imagem vazia que o Open Library retorna por padrão. O aplicativo continua
usando a URL sem esse parâmetro.

- `ok_jpeg`: o serviço retornou um JPEG com pelo menos 100 × 100 pixels; o
  relatório registra dimensões e SHA-256 do conteúdo.
- `ok_redirect`: o serviço associou o ISBN a um endereço conhecido de capa no
  `archive.org` ou a um ID de capa do próprio Open Library. O destino é
  registrado; a imagem de destino não foi baixada, pois `archive.org` não estava
  liberado na rede de validação. Isso confirma a associação informada pelo
  provedor, sem verificar o download final nem o conteúdo visual dessa capa.

A disponibilidade é a observada no horário registrado; o serviço externo pode
mudar. Para conferir novamente todos os livros, com Python 3 e sem dependências:

```sh
python3 Quote/bd/verificar_capas.py --output capas_reverificadas.csv
```

O verificador usa GET, não segue redirects e permite apenas os formatos de
destino de capa conhecidos. Falhas temporárias têm novas tentativas com espera
limitada; respostas inconclusivas fazem o comando falhar. O comando retorna 0
somente quando todas as capas foram confirmadas. A concorrência padrão é 1;
`--workers 2` permite duas consultas simultâneas.

## Validação

`verificar_massa.sql` apresenta contagens, distribuição dos cenários, URLs de
capa e verificações de consistência. Todos os valores da coluna `falhas` devem
ser zero. Chaves estrangeiras permanecem ativas durante a importação.

Os testes do verificador não acessam a rede:

```sh
python3 -m unittest discover -s Quote/bd -p 'test_verificar_capas.py' -v
```

Validação da ampliação realizada em 31/10/2026: importação em MariaDB 11.8.6
isolado com modo estrito, `ONLY_FULL_GROUP_BY` e chaves estrangeiras ativas.
Todas as 14 tabelas aumentaram; as 25 verificações de consistência passaram,
incluindo notas de 1 a 5, datas obrigatórias, ausência de prefixo nas resenhas e
metas únicas por usuário/ano. Os dados anteriores foram preservados, com a
única correção das 297 notas zero para 1.

Login de conta antiga, nova e vazia, biblioteca, avaliações, feed, ranking,
recomendações, comentários, curtidas e metas foram consultados pelas procedures.
A conta 101 retorna 3 leituras na meta de 2025 e 5 na de 2026. O manifesto
corresponde exatamente aos 263 ISBNs: 49 respostas JPEG e 214 redirecionamentos
de capa reconhecidos. Os 67 ISBNs novos foram consultados individualmente;
as verificações dos livros anteriores mantêm as datas registradas no CSV.
Os 14 testes automatizados do verificador de capas passaram. A execução em
MySQL não foi testada neste ambiente. Nenhum banco remoto foi alterado.
