-- USUÁRIO
-- ============================================================

CALL sp_verificar_email_usuario(
    'teste.procedures@quote.com'
);

SELECT *
FROM usuario
WHERE email = 'teste.procedures@quote.com';

CALL sp_cadastrar_usuario(
    'Usuario Teste Procedures',
    'teste.procedures@quote.com',
    '123456',
    'Usuario criado para testar as procedures.',
    '2000-01-01',
    'comum'
);

SELECT id_usuario
INTO @id_usuario_teste
FROM usuario
WHERE email = 'teste.procedures@quote.com';

SELECT *
FROM usuario
WHERE id_usuario = @id_usuario_teste;

CALL sp_verificar_email_usuario(
    'teste.procedures@quote.com'
);

CALL sp_buscar_usuarios();

CALL sp_buscar_usuarios_por_nome_email(
    'Usuario Teste'
);

CALL sp_buscar_usuarios_por_nome_email(
    'teste.procedures@quote.com'
);

CALL sp_buscar_usuario_por_id(
    @id_usuario_teste
);

SELECT *
FROM usuario
WHERE id_usuario = @id_usuario_teste;

CALL sp_atualizar_usuario(
    @id_usuario_teste,
    'Usuario Teste Atualizado',
    'teste.procedures@quote.com',
    'Bio atualizada.',
    '2000-01-01',
    'comum'
);

SELECT *
FROM usuario
WHERE id_usuario = @id_usuario_teste;

CALL sp_alterar_senha_usuario(
    @id_usuario_teste,
    '654321'
);

SELECT *
FROM usuario
WHERE id_usuario = @id_usuario_teste;

CALL sp_logar_usuario(
    'teste.procedures@quote.com',
    '654321'
);


-- EDITORA
-- ============================================================

SELECT *
FROM editora
WHERE nm_editora = 'Editora Teste Procedures';

CALL sp_cadastrar_editora(
    'Editora Teste Procedures'
);

SELECT id_editora
INTO @id_editora_teste
FROM editora
WHERE nm_editora = 'Editora Teste Procedures';

SELECT *
FROM editora
WHERE id_editora = @id_editora_teste;

CALL sp_buscar_editoras();

CALL sp_buscar_editora_por_id(
    @id_editora_teste
);

SELECT *
FROM editora
WHERE id_editora = @id_editora_teste;

CALL sp_atualizar_editora(
    @id_editora_teste,
    'Editora Teste Atualizada'
);

SELECT *
FROM editora
WHERE id_editora = @id_editora_teste;


-- GÊNERO
-- ============================================================

SELECT *
FROM genero
WHERE nm_genero = 'Genero Teste Procedures';

CALL sp_cadastrar_genero(
    'Genero Teste Procedures'
);

SELECT id_genero
INTO @id_genero_teste
FROM genero
WHERE nm_genero = 'Genero Teste Procedures';

SELECT *
FROM genero
WHERE id_genero = @id_genero_teste;

CALL sp_buscar_generos();

CALL sp_buscar_genero_por_id(
    @id_genero_teste
);

SELECT *
FROM genero
WHERE id_genero = @id_genero_teste;

CALL sp_atualizar_genero(
    @id_genero_teste,
    'Genero Teste Atualizado'
);

SELECT *
FROM genero
WHERE id_genero = @id_genero_teste;


-- AUTOR
-- ============================================================

SELECT *
FROM autor
WHERE nm_autor = 'Autor Teste Procedures';

CALL sp_cadastrar_autor(
    'Autor Teste Procedures'
);

SELECT id_autor
INTO @id_autor_teste
FROM autor
WHERE nm_autor = 'Autor Teste Procedures';

SELECT *
FROM autor
WHERE id_autor = @id_autor_teste;

CALL sp_buscar_autores();

CALL sp_buscar_autor_por_id(
    @id_autor_teste
);

SELECT *
FROM autor
WHERE id_autor = @id_autor_teste;

CALL sp_atualizar_autor(
    @id_autor_teste,
    'Autor Teste Atualizado'
);

SELECT *
FROM autor
WHERE id_autor = @id_autor_teste;

-- LIVRO
-- ============================================================

SET @isbn_teste = 9799999999999;

SELECT *
FROM livro
WHERE id_livro = @isbn_teste;

CALL sp_cadastrar_livro(
    @isbn_teste,
    'Livro Teste Procedures',
    'Livro criado exclusivamente para testar as procedures.',
    '2026-01-01',
    '250',
    @id_editora_teste
);

SELECT *
FROM livro
WHERE id_livro = @isbn_teste;

CALL sp_buscar_livros();

CALL sp_buscar_livro_por_id(
    @isbn_teste
);

CALL sp_buscar_livros_por_titulo(
    'Livro Teste'
);

CALL sp_buscar_livros_por_editora(
    @id_editora_teste
);

SELECT *
FROM livro
WHERE id_livro = @isbn_teste;

CALL sp_atualizar_livro(
    @isbn_teste,
    'Livro Teste Atualizado',
    'Sinopse atualizada para teste.',
    '2025-01-01',
    '300',
    @id_editora_teste
);

SELECT *
FROM livro
WHERE id_livro = @isbn_teste;

CALL sp_buscar_livros_por_titulo(
    'Livro Teste Atualizado'
);



-- AUTOR e LIVRO
-- ============================================================


SELECT *
FROM autor_livro
WHERE id_autor = @id_autor_teste
  AND id_livro = @isbn_teste;

CALL sp_vincular_autor_livro(
    @id_autor_teste,
    @isbn_teste
);

SELECT *
FROM autor_livro
WHERE id_autor = @id_autor_teste
  AND id_livro = @isbn_teste;

CALL sp_buscar_autores_por_livro(
    @isbn_teste
);

CALL sp_buscar_livros_por_autor(
    @id_autor_teste
);

CALL sp_desvincular_autor_livro(
    @id_autor_teste,
    @isbn_teste
);

SELECT *
FROM autor_livro
WHERE id_autor = @id_autor_teste
  AND id_livro = @isbn_teste;

-- GÊNERO e LIVRO
-- ============================================================

SELECT *
FROM livro_genero
WHERE id_genero = @id_genero_teste
  AND id_livro = @isbn_teste;

CALL sp_vincular_livro_genero(
    @id_genero_teste,
    @isbn_teste
);

SELECT *
FROM livro_genero
WHERE id_genero = @id_genero_teste
  AND id_livro = @isbn_teste;

CALL sp_buscar_generos_por_livro(
    @isbn_teste
);

CALL sp_buscar_livros_por_genero(
    @id_genero_teste
);

CALL sp_desvincular_livro_genero(
    @id_genero_teste,
    @isbn_teste
);

SELECT *
FROM livro_genero
WHERE id_genero = @id_genero_teste
  AND id_livro = @isbn_teste;


-- AVALIAÇÃO
-- ============================================================

SELECT *
FROM avaliacao
WHERE id_usuario = @id_usuario_teste
  AND id_livro = @isbn_teste;

-- CADASTRAR
CALL sp_cadastrar_avaliacao(
    @id_usuario_teste,
    @isbn_teste,
    5,
    'Excelente livro de teste!'
);

SELECT id_avaliacao
INTO @id_avaliacao_teste
FROM avaliacao
WHERE id_usuario = @id_usuario_teste
  AND id_livro = @isbn_teste;

SELECT *
FROM avaliacao
WHERE id_avaliacao = @id_avaliacao_teste;

CALL sp_buscar_avaliacoes();

CALL sp_buscar_avaliacao_por_id(
    @id_avaliacao_teste
);

CALL sp_buscar_avaliacoes_por_livro(
    @isbn_teste
);

CALL sp_buscar_avaliacoes_por_usuario(
    @id_usuario_teste
);

CALL sp_calcular_nota_media_livro(
    @isbn_teste
);

SELECT *
FROM avaliacao
WHERE id_avaliacao = @id_avaliacao_teste;

CALL sp_atualizar_avaliacao(
    @id_avaliacao_teste,
    4,
    'Avaliação atualizada.'
);

SELECT *
FROM avaliacao
WHERE id_avaliacao = @id_avaliacao_teste;

CALL sp_calcular_nota_media_livro(
    @isbn_teste
);

CALL sp_buscar_feed(
    @id_usuario_teste
);


-- PREFERÊNCIA
-- ============================================================

SELECT *
FROM preferencia_usuario
WHERE id_usuario = @id_usuario_teste
  AND id_genero = @id_genero_teste;

CALL sp_cadastrar_preferencia_usuario(
    @id_usuario_teste,
    @id_genero_teste
);

SELECT *
FROM preferencia_usuario
WHERE id_usuario = @id_usuario_teste
  AND id_genero = @id_genero_teste;

CALL sp_buscar_preferencias_por_usuario(
    @id_usuario_teste
);

CALL sp_recomendar_livros_usuario(
    @id_usuario_teste
);

CALL sp_deletar_preferencia_usuario(
    @id_usuario_teste,
    @id_genero_teste
);

SELECT *
FROM preferencia_usuario
WHERE id_usuario = @id_usuario_teste
  AND id_genero = @id_genero_teste;


-- BIBLIOTECA
-- ============================================================

SELECT *
FROM biblioteca
WHERE id_usuario = @id_usuario_teste
  AND id_livro = @isbn_teste;

CALL sp_cadastrar_biblioteca(
    @isbn_teste,
    'quero ler',
    1,
    @id_usuario_teste
);

SELECT id_biblioteca
INTO @id_biblioteca_teste
FROM biblioteca
WHERE id_usuario = @id_usuario_teste
  AND id_livro = @isbn_teste;

SELECT *
FROM biblioteca
WHERE id_biblioteca = @id_biblioteca_teste;

CALL sp_buscar_biblioteca_por_usuario(
    @id_usuario_teste
);

CALL sp_buscar_biblioteca_por_id(
    @id_biblioteca_teste
);

CALL sp_verificar_livro_na_biblioteca(
    @id_usuario_teste,
    @isbn_teste
);

CALL sp_filtrar_biblioteca_por_status(
    @id_usuario_teste,
    'quero ler'
);

-- UPDATE
SELECT *
FROM biblioteca
WHERE id_biblioteca = @id_biblioteca_teste;

CALL sp_atualizar_biblioteca(
    @id_biblioteca_teste,
    'lido',
    0
);

SELECT *
FROM biblioteca
WHERE id_biblioteca = @id_biblioteca_teste;

CALL sp_filtrar_biblioteca_por_status(
    @id_usuario_teste,
    'lido'
);

CALL sp_verificar_livro_na_biblioteca(
    @id_usuario_teste,
    @isbn_teste
);


-- SEGUIDOR
-- ============================================================

SELECT *
FROM seguidor
WHERE id_seguidor = @id_usuario_teste
  AND id_seguido = 1;

CALL sp_seguir_usuario(
    @id_usuario_teste,
    1
);

SELECT *
FROM seguidor
WHERE id_seguidor = @id_usuario_teste
  AND id_seguido = 1;

CALL sp_verificar_seguimento(
    @id_usuario_teste,
    1
);

CALL sp_contar_seguidores(
    1
);

CALL sp_contar_seguidos(
    @id_usuario_teste
);

CALL sp_buscar_seguidores_por_usuario(
    1
);

CALL sp_buscar_seguidos_por_usuario(
    @id_usuario_teste
);

CALL sp_deixar_de_seguir(
    @id_usuario_teste,
    1
);

SELECT *
FROM seguidor
WHERE id_seguidor = @id_usuario_teste
  AND id_seguido = 1;

CALL sp_verificar_seguimento(
    @id_usuario_teste,
    1
);

-- META DE LEITURA
-- ============================================================

CALL sp_cadastrar_meta_leitura(
    10,
    '2026-12-31',
    @id_usuario_teste
);

SELECT id_meta
INTO @id_meta_teste
FROM meta_leitura
WHERE id_usuario = @id_usuario_teste
ORDER BY id_meta DESC
LIMIT 1;

SELECT *
FROM meta_leitura
WHERE id_meta = @id_meta_teste;

CALL sp_buscar_metas_por_usuario(
    @id_usuario_teste
);

CALL sp_buscar_meta_por_id(
    @id_meta_teste
);

CALL sp_calcular_progresso_meta(
    @id_meta_teste
);

SELECT *
FROM meta_leitura
WHERE id_meta = @id_meta_teste;

CALL sp_atualizar_meta_leitura(
    @id_meta_teste,
    20,
    '2026-11-30'
);

SELECT *
FROM meta_leitura
WHERE id_meta = @id_meta_teste;

CALL sp_calcular_progresso_meta(
    @id_meta_teste
);

-- CURTIDA
-- ============================================================

SELECT *
FROM curtida_avaliacao
WHERE id_usuario = @id_usuario_teste
  AND id_avaliacao = @id_avaliacao_teste;

CALL sp_curtir_avaliacao(
    @id_usuario_teste,
    @id_avaliacao_teste
);

SELECT *
FROM curtida_avaliacao
WHERE id_usuario = @id_usuario_teste
  AND id_avaliacao = @id_avaliacao_teste;

CALL sp_contar_curtidas_avaliacao(
    @id_avaliacao_teste
);

CALL sp_verificar_curtida_avaliacao(
    @id_usuario_teste,
    @id_avaliacao_teste
);

CALL sp_buscar_curtidas_por_avaliacao(
    @id_avaliacao_teste
);

CALL sp_descurtir_avaliacao(
    @id_usuario_teste,
    @id_avaliacao_teste
);

SELECT *
FROM curtida_avaliacao
WHERE id_usuario = @id_usuario_teste
  AND id_avaliacao = @id_avaliacao_teste;

CALL sp_verificar_curtida_avaliacao(
    @id_usuario_teste,
    @id_avaliacao_teste
);


-- COMENTÁRIO
-- ============================================================

CALL sp_cadastrar_comentario(
    'Este é um comentário de teste.',
    @id_usuario_teste,
    @id_avaliacao_teste
);

SELECT id_comentario
INTO @id_comentario_teste
FROM comentario
WHERE id_usuario = @id_usuario_teste
  AND id_avaliacao = @id_avaliacao_teste
ORDER BY id_comentario DESC
LIMIT 1;

SELECT *
FROM comentario
WHERE id_comentario = @id_comentario_teste;

CALL sp_buscar_comentarios_por_avaliacao(
    @id_avaliacao_teste
);

CALL sp_buscar_comentario_por_id(
    @id_comentario_teste
);

SELECT *
FROM comentario
WHERE id_comentario = @id_comentario_teste;

CALL sp_atualizar_comentario(
    @id_comentario_teste,
    @id_usuario_teste,
    'Comentário atualizado com sucesso.'
);

SELECT *
FROM comentario
WHERE id_comentario = @id_comentario_teste;


-- TESTES DE DELETE
-- ============================================================

SELECT *
FROM comentario
WHERE id_comentario = @id_comentario_teste;

CALL sp_deletar_comentario(
    @id_comentario_teste,
    @id_usuario_teste
);

SELECT *
FROM comentario
WHERE id_comentario = @id_comentario_teste;


SELECT *
FROM avaliacao
WHERE id_avaliacao = @id_avaliacao_teste;

CALL sp_deletar_avaliacao(
    @id_avaliacao_teste
);

SELECT *
FROM avaliacao
WHERE id_avaliacao = @id_avaliacao_teste;


SELECT *
FROM biblioteca
WHERE id_biblioteca = @id_biblioteca_teste;

CALL sp_deletar_biblioteca(
    @id_biblioteca_teste
);

SELECT *
FROM biblioteca
WHERE id_biblioteca = @id_biblioteca_teste;


SELECT *
FROM meta_leitura
WHERE id_meta = @id_meta_teste;

CALL sp_deletar_meta_leitura(
    @id_meta_teste
);

SELECT *
FROM meta_leitura
WHERE id_meta = @id_meta_teste;


SELECT *
FROM livro
WHERE id_livro = @isbn_teste;

CALL sp_deletar_livro(
    @isbn_teste
);

SELECT *
FROM livro
WHERE id_livro = @isbn_teste;


SELECT *
FROM autor
WHERE id_autor = @id_autor_teste;

CALL sp_deletar_autor(
    @id_autor_teste
);

SELECT *
FROM autor
WHERE id_autor = @id_autor_teste;


SELECT *
FROM genero
WHERE id_genero = @id_genero_teste;

CALL sp_deletar_genero(
    @id_genero_teste
);

SELECT *
FROM genero
WHERE id_genero = @id_genero_teste;


SELECT *
FROM editora
WHERE id_editora = @id_editora_teste;

CALL sp_deletar_editora(
    @id_editora_teste
);

SELECT *
FROM editora
WHERE id_editora = @id_editora_teste;


SELECT *
FROM usuario
WHERE id_usuario = @id_usuario_teste;

CALL sp_deletar_usuario(
    @id_usuario_teste
);

SELECT *
FROM usuario
WHERE id_usuario = @id_usuario_teste;



-- CONFERÊNCIA FINAL
-- ============================================================

SELECT *
FROM usuario
WHERE email = 'teste.procedures@quote.com';

SELECT *
FROM editora
WHERE nm_editora = 'Editora Teste Atualizada';

SELECT *
FROM genero
WHERE nm_genero = 'Genero Teste Atualizado';

SELECT *
FROM autor
WHERE nm_autor = 'Autor Teste Atualizado';

SELECT *
FROM livro
WHERE id_livro = @isbn_teste;

SELECT *
FROM avaliacao
WHERE id_avaliacao = @id_avaliacao_teste;

SELECT *
FROM biblioteca
WHERE id_biblioteca = @id_biblioteca_teste;

SELECT *
FROM meta_leitura
WHERE id_meta = @id_meta_teste;

SELECT *
FROM comentario
WHERE id_comentario = @id_comentario_teste;

