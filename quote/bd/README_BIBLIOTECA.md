# Biblioteca: status de leitura e favorito

O status agora tem somente `lido`, `lendo`, `quero ler` ou `desisti`.
`favorito` é um campo `TINYINT`: `1` para favorito e `0` para não favorito,
com padrão `0`. Os dois campos são independentes: um livro em leitura ou na
lista de desejos também pode ser favorito. Favoritar não significa terminar
a leitura e não aumenta a contagem de livros lidos ou o progresso das metas.

## Atualizar uma base existente

Na raiz do repositório, execute:

```sh
mysql --default-character-set=utf8mb4 -u root -p < quote/bd/migracao_biblioteca_favorito.sql
mysql --default-character-set=utf8mb4 -u root -p < quote/bd/script_spc.sql
```

Não execute `script_estrutura.sql` para atualizar uma base com dados: esse
arquivo apaga e recria o schema. A migração preserva os registros e pode ser
executada novamente. Também atende uma base que já tenha a coluna `favorito`.
As procedures precisam ser recarregadas para usar o novo contrato.

O status antigo `favorito` não guardava o estado de leitura anterior. A
conversão adotada é `status = 'lido', favorito = 1`; os demais status e flags
0/1 existentes são preservados. Valores `NULL` do campo favorito recebem `0`.
Essa escolha também é aplicada à massa de teste: 396 favoritos legados foram
convertidos, preservando as 2.970 entradas. O `ALTER TABLE` da migração tem
commit implícito, como os demais comandos DDL do MySQL/MariaDB.

Para uma instalação nova, a sequência continua sendo estrutura, procedures
e `Quote/bd/script_insert.sql`, em uma base de desenvolvimento vazia.

## Procedures

```sql
-- Ordem: livro, status, favorito, visível, usuário.
CALL cadastrarBiblioteca(9788535914849, 'lendo', 1, 1, 100);

-- Cada atualização preserva o outro campo.
CALL atualizarStatusBiblioteca(100, 9788535914849, 'quero ler');
CALL atualizarFavoritoBiblioteca(100, 9788535914849, 0);

CALL buscarBibliotecaUsuario(100);
CALL filtrarBibliotecaStatus(100, 'lendo');
CALL filtrarBibliotecaStatus(100, NULL); -- todos os status
CALL filtrarBibliotecaFavoritos(100);   -- favorito = 1, em qualquer status
```

Os exemplos de escrita pressupõem um usuário e livro existentes e uma entrada
ainda não cadastrada. Status fora da lista e flags fora de 0/1 são rejeitados.
Metas e contagens continuam consultando apenas `status = 'lido'`.

## APIs e PHP

`POST cadastrarBiblioteca.php` mantém os campos anteriores e aceita `favorito`
opcional, com padrão `0`:

```json
{
  "codigoLivro": 9788535914849,
  "codigoUsuario": 100,
  "status": "lendo",
  "favorito": 1,
  "visivel": 0
}
```

`POST atualizarStatusBiblioteca.php` recebe `codigoUsuario`, `codigoLivro` e
`status`, sem modificar favorito. Para favoritar ou desfavoritar:

```http
POST atualizarFavoritoBiblioteca.php
Content-Type: application/json
```

```json
{"codigoUsuario": 100, "codigoLivro": 9788535914849, "favorito": 0}
```

O campo `favorito` é obrigatório nessa atualização, inclusive quando seu valor
for `0`. As APIs aceitam os inteiros `0`/`1` ou as strings `"0"`/`"1"` e
rejeitam `null`, booleanos, valores fracionários e outros números. Visibilidade
`0` também é válida. `GET buscarBibliotecaUsuario.php?codigoUsuario=100`
inclui `favorito` em cada item retornado.

Os métodos PHP preservam a ordem de argumentos anterior, acrescentando o
favorito ao final, opcionalmente: `Biblioteca::Cadastrar($livro, $status,
$visivel, $usuario, $favorito = 0)`. Internamente o modelo envia os cinco
argumentos na ordem da procedure. Chamadas SQL diretas ao cadastro devem usar
os cinco parâmetros novos.

Na tela do livro, os controles de status e favorito usam essas APIs e ficam
sincronizados entre desktop e celular. Primeiro se escolhe um status para
adicionar o livro à estante; depois o favorito pode ser alternado sem mudar
esse status. Os filtros estáticos das telas de biblioteca/perfil não fazem
chamadas SQL; qualquer integração dessas listas deve filtrar favoritos por
`favorito = 1`, nunca por `status = 'favorito'`.

Ao excluir uma avaliação, o status `lido` desse livro volta a `NULL`, que a
tela apresenta como a opção sem valor. A linha da biblioteca permanece para
preservar favorito e visibilidade; os outros status não são alterados. Essa
atualização ocorre na mesma transação da exclusão da avaliação e de suas
interações. Não exige migração, pois a coluna `status` já aceita `NULL`.

As resenhas permitem até 500 caracteres nos formulários de cadastro e edição,
com validação nas APIs. Quebras de linha são preservadas na exibição e textos
sem espaços quebram dentro do cartão.

## Verificações

`Quote/bd/verificar_massa.sql` verifica os quatro status e o campo favorito,
além das validações de relacionamentos existentes. Para exercitar a
independência entre os campos por meio das procedures:

```sh
mysql --default-character-set=utf8mb4 -u root -p < quote/bd/script_test_biblioteca.sql
```

O teste usa um usuário temporário dentro de uma transação e faz `ROLLBACK` ao
final, inclusive em falhas. Deve ser executado em uma base de desenvolvimento
com a estrutura, as procedures e pelo menos um livro cadastrados.

Validação em 22/10/2026: importação e migração em MariaDB 11.8.6 isolado,
com modo estrito, `ONLY_FULL_GROUP_BY` e chaves estrangeiras ativas. As 21
verificações da massa e o teste transacional passaram. As APIs foram
exercitadas via HTTP com os quatro status, favorito 0/1, visibilidade 0,
omissão do favorito e entradas inválidas. A tela foi testada em Chromium,
em desktop e celular, incluindo persistência, bloqueio durante o envio e
recuperação de falhas. Não houve alterações em banco remoto.

O modelo Workbench `.mwb` também recebeu o campo favorito e os quatro status.
Sua estrutura XML, referências e integridade ZIP foram verificadas; a
abertura na interface do Workbench não foi testada neste ambiente.
