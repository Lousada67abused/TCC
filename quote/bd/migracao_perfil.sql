-- Atualiza apenas as consultas utilizadas pelo perfil. Não altera tabelas nem dados.
USE quote;
DELIMITER $$

DROP PROCEDURE IF EXISTS buscarBibliotecaUsuario$$
CREATE PROCEDURE buscarBibliotecaUsuario(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        b.id_biblioteca,
        b.id_livro,
        l.titulo,
        b.status,
        b.favorito,
        b.visivel,
        b.id_usuario,
        COALESCE(autores.autores, '') AS autores,
        COALESCE(generos.generos, '') AS generos,
        l.qnt_paginas,
        COALESCE(notas.nota_media, 0) AS nota_media
    FROM biblioteca b
    INNER JOIN livro l
        ON b.id_livro = l.id_livro
    LEFT JOIN (
        SELECT al.id_livro,
            GROUP_CONCAT(DISTINCT a.nm_autor ORDER BY a.nm_autor SEPARATOR ', ') AS autores
        FROM autor_livro al
        INNER JOIN autor a ON a.id_autor = al.id_autor
        GROUP BY al.id_livro
    ) autores ON autores.id_livro = l.id_livro
    LEFT JOIN (
        SELECT lg.id_livro,
            GROUP_CONCAT(DISTINCT g.nm_genero ORDER BY g.nm_genero SEPARATOR ', ') AS generos
        FROM livro_genero lg
        INNER JOIN genero g ON g.id_genero = lg.id_genero
        GROUP BY lg.id_livro
    ) generos ON generos.id_livro = l.id_livro
    LEFT JOIN (
        SELECT av.id_livro, ROUND(AVG(av.nota), 1) AS nota_media
        FROM avaliacao av
        GROUP BY av.id_livro
    ) notas ON notas.id_livro = l.id_livro
    WHERE b.id_usuario = p_id_usuario
    ORDER BY b.id_biblioteca, b.id_livro;
END $$

DROP PROCEDURE IF EXISTS buscarAvaliacaoUsuario$$
CREATE PROCEDURE buscarAvaliacaoUsuario(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        a.id_avaliacao,
        a.nota,
        a.dt_avaliacao,
        a.txt_resenha,
        a.id_livro,
        l.titulo,
        a.id_usuario,
        COALESCE(autores.autores, '') AS autores
    FROM avaliacao a
    INNER JOIN livro l
        ON a.id_livro = l.id_livro
    LEFT JOIN (
        SELECT al.id_livro,
            GROUP_CONCAT(DISTINCT au.nm_autor ORDER BY au.nm_autor SEPARATOR ', ') AS autores
        FROM autor_livro al
        INNER JOIN autor au ON au.id_autor = al.id_autor
        GROUP BY al.id_livro
    ) autores ON autores.id_livro = l.id_livro
    WHERE a.id_usuario = p_id_usuario
    ORDER BY a.dt_avaliacao DESC, a.id_avaliacao DESC;
END $$

DROP PROCEDURE IF EXISTS buscarMetaUsuario$$
CREATE PROCEDURE buscarMetaUsuario(
    IN p_id_usuario INT
)
BEGIN
    -- A biblioteca não registra a data da leitura: o progresso é acumulado.
    SELECT
        m.id_meta,
        m.qnt_livros,
        m.data,
        m.id_usuario,
        COALESCE(lidos.quantidade, 0) AS livros_lidos,
        LEAST(COALESCE(lidos.quantidade, 0), m.qnt_livros) AS progresso,
        CONCAT(LEAST(COALESCE(lidos.quantidade, 0), m.qnt_livros), ' de ', m.qnt_livros) AS texto_progresso
    FROM meta_leitura m
    LEFT JOIN (
        SELECT id_usuario, COUNT(*) AS quantidade
        FROM biblioteca
        WHERE status = 'lido'
        GROUP BY id_usuario
    ) lidos ON lidos.id_usuario = m.id_usuario
    WHERE m.id_usuario = p_id_usuario
    ORDER BY m.data, m.id_meta;
END $$

DELIMITER ;
