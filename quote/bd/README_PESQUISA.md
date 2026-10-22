# Pesquisa de livros e leitores

As telas usam HTML, CSS e JavaScript sem framework, junto das APIs PHP e
procedures existentes. `pesquisa.html` permite explorar os gêneros;
`busca.html?termo=...&filtro=...` apresenta os resultados. Os filtros são
`geral`, `livros`, `generos`, `autores` e `leitores`.

## Atualização do banco

Recarregue as procedures para que os resultados incluam a nota média:

```sh
mysql --default-character-set=utf8mb4 -u root -p < quote/bd/script_spc.sql
```

Não é necessário recriar a estrutura nem importar a massa novamente.
`filtroLivro` mantém a assinatura anterior, acrescenta `nota_media` e preserva
todos os coautores e gêneros mesmo ao pesquisar por um desses campos. A média
é calculada uma vez por livro na consulta; não há uma chamada HTTP por capa.

O modelo `Seguidor` agora consulta `sp_buscar_seguidos_por_usuario` e
`sp_buscar_seguidores_por_usuario`, nomes já presentes no script SQL.
O parâmetro de `buscarUsuarioNome` aceita até 100 caracteres, como o campo de
pesquisa; a coluna que armazena o nome do usuário não foi alterada.

## Dados exibidos

- **Gêneros:** vêm exclusivamente de `buscarGenero.php`, no campo `dados`.
  A tela não contém uma lista fixa de gêneros. O mapa no JavaScript escolhe
  apenas as imagens existentes; um gênero sem imagem aparece com seu nome.
  Adicionar, renomear ou excluir um gênero no banco se reflete na próxima
  consulta da tela. Uma falha da API apresenta erro e permite tentar novamente.
- **Livros:** `filtrarlivro.php?filtro=...`, no campo `resposta`, com título,
  autores, gêneros e nota média. A aba livros também aceita ISBN exato. As
  capas seguem `https://covers.openlibrary.org/b/isbn/{id_livro}-L.jpg`.
- **Leitores:** `buscarUsuarioNome.php?nome=...` fornece nome e contagens.
  `buscarSeguidosUsuario.php?codigoUsuario=...` identifica os botões
  seguir/seguindo. As alterações usam as APIs `seguirUsuario.php` e
  `deixarDeSeguir.php`; o estado é reconsultado se uma gravação falhar.

Os nomes completos continuam disponíveis no atributo `title` quando houver
reticências. A própria conta não pode ser seguida e visitantes podem pesquisar,
mas os botões de seguir ficam desabilitados. A tela de perfil atual continua
sendo a tela própria existente; os resultados não inventam links de perfil
público.

## Verificação realizada

Validado em MariaDB 11.8.6 isolado com modo estrito, `ONLY_FULL_GROUP_BY` e
chaves estrangeiras ativas: importação dos 196 livros, consultas HTTP reais,
metadados completos, médias, ISBN, filtros e seguir/desseguir. As fixtures e
relações temporárias dos testes foram removidas.

No Chromium foram conferidos os fluxos de navegação e os layouts de gêneros,
livros e leitores em 320, 375, 768, 1024 e 1440 px, incluindo estado vazio,
falhas parciais, repetição de consulta, visitante e navegação pelo histórico.
A lista de gêneros foi comparada à API e testada após inserir e excluir um
gênero temporário. Nenhum banco remoto foi alterado.
