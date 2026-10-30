-- Atualiza somente consultas de livros e ranking. Não altera tabelas nem dados.
USE quote;
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_buscar_livros$$
CREATE PROCEDURE sp_buscar_livros()
BEGIN
    SELECT
        l.id_livro,
        l.titulo,
        l.sinopse,
        l.ano_publicacao,
        l.qnt_paginas,
        e.id_editora,
        e.nm_editora,
        (
            SELECT COALESCE(ROUND(AVG(av_media.nota), 2), 0)
            FROM avaliacao av_media
            WHERE av_media.id_livro = l.id_livro
        ) AS nota_media
    FROM livro l
    INNER JOIN editora e
        ON l.cd_editora = e.id_editora
    ORDER BY l.titulo;
END $$

DROP PROCEDURE IF EXISTS filtroLivro$$
CREATE PROCEDURE filtroLivro(
    IN p_termo VARCHAR(100)
)
BEGIN
    SET p_termo = TRIM(p_termo);

    SELECT
        l.id_livro,
        l.titulo,
        l.sinopse,
        l.ano_publicacao,
        l.qnt_paginas,
        e.id_editora,
        e.nm_editora,
        GROUP_CONCAT(DISTINCT a.nm_autor ORDER BY a.nm_autor SEPARATOR ', ') AS autores,
        GROUP_CONCAT(DISTINCT g.nm_genero ORDER BY g.nm_genero SEPARATOR ', ') AS generos,
        (
            SELECT COALESCE(ROUND(AVG(av_media.nota), 2), 0)
            FROM avaliacao av_media
            WHERE av_media.id_livro = l.id_livro
        ) AS nota_media
    FROM livro l
    INNER JOIN editora e
        ON l.cd_editora = e.id_editora
    LEFT JOIN autor_livro al
        ON l.id_livro = al.id_livro
    LEFT JOIN autor a
        ON al.id_autor = a.id_autor
    LEFT JOIN livro_genero lg
        ON l.id_livro = lg.id_livro
    LEFT JOIN genero g
        ON lg.id_genero = g.id_genero
    WHERE p_termo IS NULL 
       OR p_termo = ''
       OR l.id_livro = IF(p_termo REGEXP '^[0-9]+$', CAST(p_termo AS UNSIGNED), NULL)
       OR l.titulo LIKE CONCAT('%', p_termo, '%')
       OR a.nm_autor LIKE CONCAT('%', p_termo, '%')
       OR e.nm_editora LIKE CONCAT('%', p_termo, '%')
       OR g.nm_genero LIKE CONCAT('%', p_termo, '%')
    GROUP BY
        l.id_livro,
        l.titulo,
        l.sinopse,
        l.ano_publicacao,
        l.qnt_paginas,
        e.id_editora,
        e.nm_editora;
END $$

DROP PROCEDURE IF EXISTS buscarLivroCodigo$$
CREATE PROCEDURE buscarLivroCodigo(
    IN p_id_livro BIGINT
)
BEGIN
    SELECT
        l.id_livro,
        l.titulo,
        l.sinopse,
        l.ano_publicacao,
        l.qnt_paginas,
        e.id_editora,
        e.nm_editora,
        GROUP_CONCAT(DISTINCT a.nm_autor SEPARATOR ', ') AS nm_autor,
        GROUP_CONCAT(DISTINCT g.nm_genero SEPARATOR ', ') AS nm_genero,
        (
            SELECT COALESCE(ROUND(AVG(av.nota), 2), 0)
            FROM avaliacao av
            WHERE av.id_livro = l.id_livro
        ) AS nota_media
    FROM livro l
    INNER JOIN editora e
        ON l.cd_editora = e.id_editora
    INNER JOIN autor_livro al
        ON l.id_livro = al.id_livro
    INNER JOIN autor a
        ON al.id_autor = a.id_autor
    INNER JOIN livro_genero lg
        ON l.id_livro = lg.id_livro
    INNER JOIN genero g
        ON lg.id_genero = g.id_genero
    WHERE l.id_livro = p_id_livro
    GROUP BY
        l.id_livro,
        l.titulo,
        l.sinopse,
        l.ano_publicacao,
        l.qnt_paginas,
        e.id_editora,
        e.nm_editora;
END $$

DROP PROCEDURE IF EXISTS buscarLivroTitulo$$
CREATE PROCEDURE buscarLivroTitulo(
    IN p_titulo VARCHAR(100)
)
BEGIN
    SELECT
        l.id_livro,
        l.titulo,
        l.sinopse,
        l.ano_publicacao,
        l.qnt_paginas,
        e.id_editora,
        e.nm_editora,
        GROUP_CONCAT(DISTINCT a.nm_autor SEPARATOR ', ') AS nm_autor,
        GROUP_CONCAT(DISTINCT g.nm_genero SEPARATOR ', ') AS nm_genero,
        (
            SELECT COALESCE(ROUND(AVG(av_media.nota), 2), 0)
            FROM avaliacao av_media
            WHERE av_media.id_livro = l.id_livro
        ) AS nota_media
    FROM livro l
    INNER JOIN editora e      ON l.cd_editora = e.id_editora
    LEFT JOIN autor_livro al  ON l.id_livro = al.id_livro
    LEFT JOIN autor a         ON al.id_autor = a.id_autor
    LEFT JOIN livro_genero lg ON l.id_livro = lg.id_livro
    LEFT JOIN genero g        ON lg.id_genero = g.id_genero
    WHERE l.titulo LIKE CONCAT('%', p_titulo, '%')
    GROUP BY
        l.id_livro, l.titulo, l.sinopse, l.ano_publicacao, l.qnt_paginas,
        e.id_editora, e.nm_editora
    ORDER BY l.titulo;
END $$

DROP PROCEDURE IF EXISTS buscarLivroGenero$$
CREATE PROCEDURE buscarLivroGenero(
    IN p_nm_genero VARCHAR(45)
)
BEGIN
    SELECT
        l.id_livro,
        l.titulo,
        (
            SELECT GROUP_CONCAT(a.nm_autor ORDER BY a.nm_autor SEPARATOR ', ')
            FROM autor_livro al
            INNER JOIN autor a
                ON al.id_autor = a.id_autor
            WHERE al.id_livro = l.id_livro
        ) AS autores,
        (
            SELECT GROUP_CONCAT(g.nm_genero ORDER BY g.nm_genero SEPARATOR ', ')
            FROM livro_genero lg
            INNER JOIN genero g
                ON lg.id_genero = g.id_genero
            WHERE lg.id_livro = l.id_livro
        ) AS generos,
        l.ano_publicacao,
        l.qnt_paginas,
        (
            SELECT COALESCE(ROUND(AVG(av_media.nota), 2), 0)
            FROM avaliacao av_media
            WHERE av_media.id_livro = l.id_livro
        ) AS nota_media
    FROM livro l
    WHERE l.id_livro IN (
        SELECT lg2.id_livro
        FROM livro_genero lg2
        INNER JOIN genero g2
            ON lg2.id_genero = g2.id_genero
        WHERE g2.nm_genero LIKE CONCAT('%', p_nm_genero, '%')
    )
    ORDER BY l.titulo;
END $$

DROP PROCEDURE IF EXISTS buscarLivroAutor$$
CREATE PROCEDURE buscarLivroAutor(
    IN p_nm_autor VARCHAR(100)
)
BEGIN
    SELECT
        l.id_livro,
        l.titulo,
        GROUP_CONCAT(a.nm_autor ORDER BY a.nm_autor SEPARATOR ', ') AS autores,
        l.ano_publicacao,
        l.qnt_paginas,
        (
            SELECT COALESCE(ROUND(AVG(av_media.nota), 2), 0)
            FROM avaliacao av_media
            WHERE av_media.id_livro = l.id_livro
        ) AS nota_media
    FROM livro l
    INNER JOIN autor_livro al
        ON l.id_livro = al.id_livro
    INNER JOIN autor a
        ON al.id_autor = a.id_autor
    WHERE l.id_livro IN (
        SELECT al2.id_livro
        FROM autor_livro al2
        INNER JOIN autor a2
            ON al2.id_autor = a2.id_autor
        WHERE a2.nm_autor LIKE CONCAT('%', p_nm_autor, '%')
    )
    GROUP BY l.id_livro, l.titulo, l.ano_publicacao, l.qnt_paginas
    ORDER BY l.titulo;
END $$

DROP PROCEDURE IF EXISTS sp_buscar_livros_por_editora$$
CREATE PROCEDURE sp_buscar_livros_por_editora(
    IN p_id_editora INT
)
BEGIN
    SELECT
        l.id_livro,
        l.titulo,
        l.sinopse,
        l.ano_publicacao,
        l.qnt_paginas,
        e.nm_editora,
        (
            SELECT COALESCE(ROUND(AVG(av_media.nota), 2), 0)
            FROM avaliacao av_media
            WHERE av_media.id_livro = l.id_livro
        ) AS nota_media
    FROM livro l
    INNER JOIN editora e
        ON l.cd_editora = e.id_editora
    WHERE l.cd_editora = p_id_editora
    ORDER BY l.titulo;
END $$

DROP PROCEDURE IF EXISTS sp_buscar_livros_por_autor$$
CREATE PROCEDURE sp_buscar_livros_por_autor(
    IN p_id_autor INT
)
BEGIN
    SELECT
        l.id_livro,
        l.titulo,
        l.sinopse,
        l.ano_publicacao,
        l.qnt_paginas,
        e.nm_editora,
        (
            SELECT COALESCE(ROUND(AVG(av_media.nota), 2), 0)
            FROM avaliacao av_media
            WHERE av_media.id_livro = l.id_livro
        ) AS nota_media
    FROM livro l
    INNER JOIN autor_livro al
        ON l.id_livro = al.id_livro
    INNER JOIN editora e
        ON l.cd_editora = e.id_editora
    WHERE al.id_autor = p_id_autor
    ORDER BY l.titulo;
END $$

DROP PROCEDURE IF EXISTS sp_buscar_livros_por_genero$$
CREATE PROCEDURE sp_buscar_livros_por_genero(
    IN p_id_genero INT
)
BEGIN
    SELECT
        l.id_livro,
        l.titulo,
        l.sinopse,
        l.ano_publicacao,
        l.qnt_paginas,
        e.nm_editora,
        (
            SELECT COALESCE(ROUND(AVG(av_media.nota), 2), 0)
            FROM avaliacao av_media
            WHERE av_media.id_livro = l.id_livro
        ) AS nota_media
    FROM livro l
    INNER JOIN livro_genero lg
        ON l.id_livro = lg.id_livro
    INNER JOIN editora e
        ON l.cd_editora = e.id_editora
    WHERE lg.id_genero = p_id_genero
    ORDER BY l.titulo;
END $$

DROP PROCEDURE IF EXISTS recomendarLivroUsuario$$
CREATE PROCEDURE recomendarLivroUsuario(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        l.id_livro,
        l.titulo,
        GROUP_CONCAT(
            DISTINCT a.nm_autor
            ORDER BY a.nm_autor
            SEPARATOR ', '
        ) AS autores,
        GROUP_CONCAT(
            DISTINCT g.nm_genero
            ORDER BY g.nm_genero
            SEPARATOR ', '
        ) AS generos,
        COUNT(DISTINCT lg.id_genero) AS generos_compativeis,
        (
            SELECT COALESCE(ROUND(AVG(av.nota), 2), 0)
            FROM avaliacao av
            WHERE av.id_livro = l.id_livro
        ) AS nota_media
    FROM livro l
    INNER JOIN autor_livro al
        ON l.id_livro = al.id_livro
    INNER JOIN autor a
        ON al.id_autor = a.id_autor
    INNER JOIN livro_genero lg
        ON l.id_livro = lg.id_livro
    INNER JOIN genero g
        ON lg.id_genero = g.id_genero
    LEFT JOIN preferencia_usuario pu
        ON pu.id_usuario = p_id_usuario
       AND pu.id_genero = lg.id_genero
    LEFT JOIN biblioteca b
        ON b.id_usuario = p_id_usuario
       AND b.id_livro = l.id_livro
    WHERE b.id_livro IS NULL
      AND (
          pu.id_genero IS NOT NULL
          OR EXISTS (
              SELECT 1
              FROM biblioteca b2
              INNER JOIN livro_genero lg2
                  ON b2.id_livro = lg2.id_livro
              WHERE b2.id_usuario = p_id_usuario
                AND lg2.id_genero = lg.id_genero
          )
          OR EXISTS (
              SELECT 1
              FROM avaliacao av
              INNER JOIN seguidor sg
                  ON sg.id_seguido = av.id_usuario
              WHERE sg.id_seguidor = p_id_usuario
                AND av.id_livro = l.id_livro
          )
      )
    GROUP BY
        l.id_livro,
        l.titulo
    ORDER BY
        generos_compativeis DESC,
        l.titulo;
END$$

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
        SELECT av.id_livro, ROUND(AVG(av.nota), 2) AS nota_media
        FROM avaliacao av
        GROUP BY av.id_livro
    ) notas ON notas.id_livro = l.id_livro
    WHERE b.id_usuario = p_id_usuario
    ORDER BY b.id_biblioteca, b.id_livro;
END $$

DROP PROCEDURE IF EXISTS filtrarBibliotecaStatus$$
CREATE PROCEDURE filtrarBibliotecaStatus(
    IN p_id_usuario INT,
    IN p_status VARCHAR(20)
)
BEGIN
    IF p_status IS NOT NULL AND BINARY p_status NOT IN ('lido', 'lendo', 'quero ler', 'desisti') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Status invalido.';
    END IF;

    SELECT
        b.id_biblioteca,
        b.id_livro,
        l.titulo,
        GROUP_CONCAT(a.nm_autor ORDER BY a.nm_autor SEPARATOR ', ') AS autores,
        b.status,
        b.favorito,
        b.visivel,
        (
            SELECT COALESCE(ROUND(AVG(av_media.nota), 2), 0)
            FROM avaliacao av_media
            WHERE av_media.id_livro = b.id_livro
        ) AS nota_media
    FROM biblioteca b
    INNER JOIN livro l
        ON b.id_livro = l.id_livro
    LEFT JOIN autor_livro al
        ON l.id_livro = al.id_livro
    LEFT JOIN autor a
        ON al.id_autor = a.id_autor
    WHERE b.id_usuario = p_id_usuario
      AND (p_status IS NULL OR b.status = p_status)
    GROUP BY b.id_biblioteca, b.id_livro, l.titulo, b.status, b.favorito, b.visivel
    ORDER BY l.titulo;
END $$

DROP PROCEDURE IF EXISTS filtrarBibliotecaFavoritos$$
CREATE PROCEDURE filtrarBibliotecaFavoritos(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        b.id_biblioteca,
        b.id_livro,
        l.titulo,
        GROUP_CONCAT(a.nm_autor ORDER BY a.nm_autor SEPARATOR ', ') AS autores,
        b.status,
        b.favorito,
        b.visivel,
        (
            SELECT COALESCE(ROUND(AVG(av_media.nota), 2), 0)
            FROM avaliacao av_media
            WHERE av_media.id_livro = b.id_livro
        ) AS nota_media
    FROM biblioteca b
    INNER JOIN livro l
        ON b.id_livro = l.id_livro
    LEFT JOIN autor_livro al
        ON l.id_livro = al.id_livro
    LEFT JOIN autor a
        ON al.id_autor = a.id_autor
    WHERE b.id_usuario = p_id_usuario
      AND b.favorito = 1
    GROUP BY b.id_biblioteca, b.id_livro, l.titulo, b.status, b.favorito, b.visivel
    ORDER BY l.titulo;
END $$

DROP PROCEDURE IF EXISTS rankingLivroGenero$$
CREATE PROCEDURE rankingLivroGenero(
    IN p_id_genero INT
)
BEGIN
    -- p_id_genero = 0 traz o ranking geral (todos os gêneros).
    SELECT
        l.id_livro,
        l.titulo,
        l.ano_publicacao,
        e.nm_editora,
        GROUP_CONCAT(DISTINCT au.nm_autor SEPARATOR ', ') AS nm_autor,
        GROUP_CONCAT(DISTINCT g.nm_genero SEPARATOR ', ') AS nm_genero,
        COALESCE(ROUND(notas.nota_media_real, 2), 0) AS nota_media,
        notas.quantidade_avaliacoes
    FROM livro l
    INNER JOIN livro_genero lg
        ON l.id_livro = lg.id_livro
    INNER JOIN genero g
        ON lg.id_genero = g.id_genero
    INNER JOIN editora e
        ON l.cd_editora = e.id_editora
    INNER JOIN (
        -- Agregar antes dos vínculos evita multiplicar avaliações por autores/gêneros.
        SELECT av.id_livro,
            AVG(av.nota) AS nota_media_real,
            COUNT(DISTINCT av.id_avaliacao) AS quantidade_avaliacoes
        FROM avaliacao av
        GROUP BY av.id_livro
    ) notas ON notas.id_livro = l.id_livro
    LEFT JOIN autor_livro al
        ON l.id_livro = al.id_livro
    LEFT JOIN autor au
        ON al.id_autor = au.id_autor
    WHERE p_id_genero = 0
       OR l.id_livro IN (SELECT id_livro FROM livro_genero WHERE id_genero = p_id_genero)
    GROUP BY
        l.id_livro,
        l.titulo,
        l.ano_publicacao,
        e.nm_editora,
        notas.nota_media_real,
        notas.quantidade_avaliacoes
    ORDER BY
        notas.nota_media_real DESC,
        notas.quantidade_avaliacoes DESC,
        l.titulo ASC,
        l.id_livro ASC
    LIMIT 10;
END $$

DROP PROCEDURE IF EXISTS calcularNotaMediaLivro$$
CREATE PROCEDURE calcularNotaMediaLivro(
    IN p_id_livro BIGINT
)
BEGIN
    SELECT
        p_id_livro AS id_livro,
        COALESCE(ROUND(AVG(nota), 2), 0) AS nota_media,
        COUNT(*) AS quantidade_avaliacoes
    FROM avaliacao
    WHERE id_livro = p_id_livro;
END $$

DELIMITER ;
