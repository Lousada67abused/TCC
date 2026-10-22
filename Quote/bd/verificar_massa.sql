-- Consultas somente de leitura. Execute depois de importar a massa de teste.
USE quote;

SELECT 'usuario' AS tabela, COUNT(*) AS registros FROM usuario
UNION ALL SELECT 'genero', COUNT(*) FROM genero
UNION ALL SELECT 'editora', COUNT(*) FROM editora
UNION ALL SELECT 'autor', COUNT(*) FROM autor
UNION ALL SELECT 'livro', COUNT(*) FROM livro
UNION ALL SELECT 'autor_livro', COUNT(*) FROM autor_livro
UNION ALL SELECT 'livro_genero', COUNT(*) FROM livro_genero
UNION ALL SELECT 'preferencia_usuario', COUNT(*) FROM preferencia_usuario
UNION ALL SELECT 'seguidor', COUNT(*) FROM seguidor
UNION ALL SELECT 'biblioteca', COUNT(*) FROM biblioteca
UNION ALL SELECT 'meta_leitura', COUNT(*) FROM meta_leitura
UNION ALL SELECT 'avaliacao', COUNT(*) FROM avaliacao
UNION ALL SELECT 'curtida_avaliacao', COUNT(*) FROM curtida_avaliacao
UNION ALL SELECT 'comentario', COUNT(*) FROM comentario;

-- Todos os resultados da coluna falhas devem ser zero.
SELECT 'livro_sem_editora' AS verificacao, COUNT(*) AS falhas
FROM livro l LEFT JOIN editora e ON e.id_editora = l.cd_editora
WHERE e.id_editora IS NULL
UNION ALL
SELECT 'livro_sem_autor_principal', COUNT(*)
FROM livro l LEFT JOIN autor a ON a.id_autor = l.cd_autor
WHERE a.id_autor IS NULL
UNION ALL
SELECT 'autor_principal_sem_vinculo', COUNT(*) FROM livro l
WHERE NOT EXISTS (SELECT 1 FROM autor_livro al
                  WHERE al.id_livro = l.id_livro AND al.id_autor = l.cd_autor)
UNION ALL
SELECT 'livro_sem_genero', COUNT(*) FROM livro l
WHERE NOT EXISTS (SELECT 1 FROM livro_genero lg WHERE lg.id_livro = l.id_livro)
UNION ALL
SELECT 'isbn_invalido', COUNT(*) FROM livro
WHERE CHAR_LENGTH(CAST(id_livro AS CHAR)) <> 13 OR MOD(
    SUBSTRING(id_livro, 1, 1) + 3 * SUBSTRING(id_livro, 2, 1) +
    SUBSTRING(id_livro, 3, 1) + 3 * SUBSTRING(id_livro, 4, 1) +
    SUBSTRING(id_livro, 5, 1) + 3 * SUBSTRING(id_livro, 6, 1) +
    SUBSTRING(id_livro, 7, 1) + 3 * SUBSTRING(id_livro, 8, 1) +
    SUBSTRING(id_livro, 9, 1) + 3 * SUBSTRING(id_livro, 10, 1) +
    SUBSTRING(id_livro, 11, 1) + 3 * SUBSTRING(id_livro, 12, 1) +
    SUBSTRING(id_livro, 13, 1), 10) <> 0
UNION ALL
SELECT 'avaliacao_duplicada_usuario_livro', COUNT(*) FROM (
    SELECT id_usuario, id_livro FROM avaliacao
    GROUP BY id_usuario, id_livro HAVING COUNT(*) > 1
) duplicadas
UNION ALL
SELECT 'nota_fora_de_zero_a_cinco', COUNT(*) FROM avaliacao
WHERE nota IS NULL OR nota NOT BETWEEN 0 AND 5
UNION ALL
SELECT 'avaliacao_sem_livro_na_biblioteca', COUNT(*) FROM avaliacao a
WHERE NOT EXISTS (SELECT 1 FROM biblioteca b
                  WHERE b.id_usuario = a.id_usuario AND b.id_livro = a.id_livro)
UNION ALL
SELECT 'avaliacao_antes_da_publicacao', COUNT(*)
FROM avaliacao a JOIN livro l ON l.id_livro = a.id_livro
WHERE a.dt_avaliacao < l.ano_publicacao
UNION ALL
SELECT 'avaliacao_futura', COUNT(*) FROM avaliacao WHERE dt_avaliacao > CURRENT_DATE()
UNION ALL
SELECT 'curtida_propria_ou_livro_divergente', COUNT(*)
FROM curtida_avaliacao c JOIN avaliacao a ON a.id_avaliacao = c.id_avaliacao
WHERE c.id_usuario = a.id_usuario OR c.id_livro <> a.id_livro
UNION ALL
SELECT 'comentario_antes_da_avaliacao', COUNT(*)
FROM comentario c JOIN avaliacao a ON a.id_avaliacao = c.id_avaliacao
WHERE c.dt_comentario < a.dt_avaliacao
UNION ALL
SELECT 'comentario_futuro', COUNT(*) FROM comentario WHERE dt_comentario > CURRENT_DATE()
UNION ALL
SELECT 'usuario_seguindo_a_si_mesmo', COUNT(*) FROM seguidor WHERE id_seguidor = id_seguido
UNION ALL
SELECT 'biblioteca_com_visibilidade_invalida', COUNT(*) FROM biblioteca
WHERE visivel IS NULL OR visivel NOT IN (0, 1)
UNION ALL
SELECT 'biblioteca_com_favorito_invalido', COUNT(*) FROM biblioteca
WHERE favorito IS NULL OR favorito NOT IN (0, 1)
UNION ALL
SELECT 'biblioteca_com_status_invalido', COUNT(*) FROM biblioteca
WHERE status IS NULL OR status NOT IN ('lido', 'lendo', 'quero ler', 'desisti')
UNION ALL
SELECT 'usuario_com_mais_de_uma_biblioteca', COUNT(*) FROM (
    SELECT id_usuario FROM biblioteca GROUP BY id_usuario HAVING COUNT(DISTINCT id_biblioteca) <> 1
) divergentes
UNION ALL
SELECT 'biblioteca_compartilhada_por_usuarios', COUNT(*) FROM (
    SELECT id_biblioteca FROM biblioteca GROUP BY id_biblioteca HAVING COUNT(DISTINCT id_usuario) <> 1
) divergentes
UNION ALL
SELECT 'meta_nao_positiva', COUNT(*) FROM meta_leitura WHERE qnt_livros IS NULL OR qnt_livros <= 0
UNION ALL
SELECT 'senha_incompativel_com_login', COUNT(*) FROM usuario
WHERE senha IS NULL OR senha <> MD5('123');

-- Distribuição dos cenários disponíveis para testar a interface.
SELECT status, favorito, visivel, COUNT(*) AS quantidade FROM biblioteca GROUP BY status, favorito, visivel;
SELECT nota, COUNT(*) AS quantidade FROM avaliacao GROUP BY nota ORDER BY nota;
SELECT tipo_usuario, COUNT(*) AS quantidade FROM usuario GROUP BY tipo_usuario;

-- O app monta as capas diretamente a partir do ISBN, sem uma coluna adicional.
SELECT id_livro, titulo,
       CONCAT('https://covers.openlibrary.org/b/isbn/', id_livro, '-L.jpg') AS capa
FROM livro ORDER BY titulo;
