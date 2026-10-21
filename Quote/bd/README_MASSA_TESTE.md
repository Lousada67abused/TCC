# Massa de teste do Quote

`script_insert.sql` preenche as 14 tabelas do banco com dados de desenvolvimento.
Os livros usam ISBNs reais de 13 dígitos em `livro.id_livro`. As capas continuam
usando a mesma expressão do aplicativo:

```js
"https://covers.openlibrary.org/b/isbn/" + livro.id_livro + "-L.jpg"
```

| Tabela | Antes | Nova massa |
| --- | ---: | ---: |
| usuario | 15 | 100 |
| genero | 15 | 20 |
| editora | 22 | 71 |
| autor | 62 | 111 |
| livro | 93 | 196 |
| autor_livro | 94 | 202 |
| livro_genero | 159 | 364 |
| preferencia_usuario | 35 | 297 |
| seguidor | 43 | 794 |
| biblioteca | 126 | 2.970 |
| meta_leitura | 21 | 198 |
| avaliacao | 88 | 2.178 |
| curtida_avaliacao | 174 | 6.534 |
| comentario | 33 | 2.178 |

Dos 93 ISBNs originais, 78 passaram na consulta de capa; os outros 15 foram
excluídos. Foram acrescentados 118 ISBNs com capa confirmada, após verificar
122 candidatos adicionais. Os relacionamentos e as interações foram gerados
para o catálogo final de 196 livros.

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
- `leitor100@example.com`: usuário comum, ID 100, sem atividade, para telas vazias.

As contas e suas interações são fictícias. Todos os e-mails, inclusive os das
15 contas originais, usam o domínio reservado `example.com`; o SQL calcula
`MD5('123')` para uma senha de demonstração conhecida. Há bibliotecas públicas e privadas, os cinco
status (`lido`, `lendo`, `quero ler`, `desisti`, `favorito`), avaliações de 0 a 5,
curtidas de outros usuários, comentários posteriores às avaliações, seguidores,
preferências e metas para 2025 e 2026. Os livros têm editora, autor principal,
vínculos em `autor_livro` e gêneros; há também coautoria e múltiplos gêneros.

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

Validação realizada em 21/10/2026: importação em MariaDB 11.8.6 isolado, com
modo estrito, `ONLY_FULL_GROUP_BY` e chaves estrangeiras ativas; 19 verificações
de consistência sem falhas; login, ranking, recomendações, biblioteca, feed,
metas, detalhe de livro, comentários e curtidas consultados com sucesso;
14 testes automatizados do verificador aprovados. O manifesto corresponde
exatamente aos 196 ISBNs importados: 45 respostas JPEG e 151 redirecionamentos
de capa reconhecidos. A execução em MySQL não foi testada neste ambiente.

