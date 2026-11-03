# Feed da homepage

`buscarFeed.php?codigoUsuario=ID` mantém o array de avaliações em `resposta` e
acrescenta `modo`: `amigos` ou `sugestoes`. O título da seção acompanha esse
campo: **Amigos** para quem segue pelo menos um leitor e **Sugestões para você**
para quem não segue ninguém. Um seguido sem resenhas continua no modo amigos.

As sugestões são ordenadas pelo total de curtidas da avaliação, do maior para o
menor. Os desempates usam a data e o código da avaliação, dos mais recentes para
os mais antigos. São retornadas até 40 resenhas, excluindo as próprias e as sem
texto. Resenhas sem curtidas também podem aparecer, com contagem zero. Gêneros e
preferências não participam dessa ordenação. O feed de amigos mantém a ordem
cronológica existente.
O botão **ver mais** continua mostrando quatro por vez, com curtidas, comentários
e links para o perfil público.

Cada card também tem um botão **seguir** / **seguindo** para o autor. Ele usa
`seguirUsuario.php` e `deixarDeSeguir.php`, com a identidade conferida pela sessão
PHP. O feed acrescenta `estado.autenticado` e `estado.codigoUsuarioLogado` para
que contas com a sessão expirada ou diferente da conta do navegador recebam o
link de login. Cards repetidos do mesmo autor acompanham a mesma relação, inclusive
ao carregar mais resenhas. Os botões ficam bloqueados durante o envio; uma resposta
perdida provoca a consulta de `buscarSeguidosUsuario.php` antes de outra alteração.
Não há mensagens de sucesso ao seguir/deixar de seguir. Na próxima abertura da
homepage, o feed passa a Amigos se a conta tiver começado a seguir alguém.

As tabelas e a procedure `buscarFeed` existentes são reutilizadas. Não é
necessário executar migração nem reimportar os dados.

Para verificar as consultas em uma base de teste, com o mesmo arquivo de conexão
dos testes do perfil:

```sh
php quote/bd/test_feed_sugestoes.php /caminho/cliente-teste.cnf
```

O arquivo deve conter `[client]` com `socket`, `user` e `password`. O teste cobre
curtidas, empates, múltiplos autores/gêneros, resenhas próprias/vazias, contas sem
preferências, ausência de curtidas, seguidos sem resenhas, mudança entre os dois
feeds e limite. Todas as alterações da base de teste são revertidas por rollback.
