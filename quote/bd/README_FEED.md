# Feed da homepage

`buscarFeed.php?codigoUsuario=ID` mantém o array de avaliações em `resposta` e
acrescenta `modo`: `amigos` ou `sugestoes`. O título da seção acompanha esse
campo: **Amigos** para quem segue pelo menos um leitor e **Sugestões para você**
para quem não segue ninguém. Um seguido sem resenhas continua no modo amigos.

As sugestões comparam os gêneros escolhidos no cadastro e os gêneros dos livros
da estante marcados como lido, lendo, quero ler ou favoritos. Gêneros repetidos
contam uma única vez. Para outros leitores, somente as estantes visíveis entram
na comparação; a estante do próprio usuário também pode personalizar seu feed.
Livros apenas com status desisti ou com status cancelado não indicam interesse.

Leitores com mais gêneros em comum vêm primeiro; os desempates usam a data e o
código da avaliação, dos mais recentes para os mais antigos. São retornadas até
40 resenhas, excluindo as próprias e as sem texto. Se não houver resenhas com
afinidade identificada, a descoberta usa resenhas recentes de outros leitores.
O botão **ver mais** continua mostrando quatro por vez, com curtidas, comentários
e links para o perfil público.

As tabelas e a procedure `buscarFeed` existentes são reutilizadas. Não é
necessário executar migração nem reimportar os dados. A consulta de afinidade
usa CTEs, disponíveis em MySQL 8+ e MariaDB 10.2+.

Para verificar as consultas em uma base de teste, com o mesmo arquivo de conexão
dos testes do perfil:

```sh
php quote/bd/test_feed_sugestoes.php /caminho/cliente-teste.cnf
```

O arquivo deve conter `[client]` com `socket`, `user` e `password`. O teste cobre
afinidades repetidas, preferências e estantes, livros privados de outros leitores,
resenhas próprias/vazias, contas sem histórico, seguidos sem resenhas, mudança
entre os dois feeds, desempates e limite. As fixtures são revertidas por rollback.
