USE quote;

DELIMITER $$


-- ============================================================
-- EXTRA
-- ============================================================

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
    -- A data da avaliação identifica o ano da leitura dos livros marcados como lidos.
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
        SELECT b.id_usuario, YEAR(a.dt_avaliacao) AS ano,
            COUNT(DISTINCT b.id_livro) AS quantidade
        FROM biblioteca b
        INNER JOIN avaliacao a
            ON a.id_usuario = b.id_usuario AND a.id_livro = b.id_livro
        WHERE b.status = 'lido' AND a.dt_avaliacao IS NOT NULL
        GROUP BY b.id_usuario, YEAR(a.dt_avaliacao)
    ) lidos ON lidos.id_usuario = m.id_usuario AND lidos.ano = YEAR(m.data)
    WHERE m.id_usuario = p_id_usuario
    ORDER BY m.data, m.id_meta;
END $$

-- ============================================================

-- ============================================================
-- RANKING
-- ============================================================

-- ============================================================

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
        COALESCE(ROUND(notas.nota_media_real, 1), 0) AS nota_media,
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


-- ============================================================

-- ============================================================
-- USUÁRIO
-- ============================================================

-- ============================================================


DROP PROCEDURE IF EXISTS loginUsuario$$
CREATE PROCEDURE loginUsuario(pEmail varchar(100), pSenha varchar(100))
begin
    Declare qtd int default 0;
	
    Select count(*) into qtd from usuario 
	where email = pEmail 
	and senha = md5(pSenha);
    
    if (qtd = 0) Then
		signal sqlstate '45000' set message_text = 'Login e/ou senha inválida!';
    else
		Select id_usuario,
         nm_usuario,
         email,
         bio,
         dt_nascimento,
         tipo_usuario 
        from usuario 
		where email = pEmail 
		and senha = md5(pSenha);
    end if;
end$$


DROP PROCEDURE IF EXISTS cadastrarUsuario$$
CREATE PROCEDURE cadastrarUsuario(
    IN p_nm_usuario VARCHAR(80),
    IN p_email VARCHAR(100),
    IN p_senha VARCHAR(100),
    IN p_bio VARCHAR(70),
    IN p_dt_nascimento DATE,
    IN p_tipo_usuario ENUM('comum','administrador')
)
BEGIN
    DECLARE v_novo_id INT DEFAULT 1;
    DECLARE v_qtd INT DEFAULT 0;

    IF p_nm_usuario IS NULL OR TRIM(p_nm_usuario) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nome do usuario é obrigatorio.';
    END IF;

    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email é obrigatorio.';
    END IF;

    IF p_senha IS NULL OR TRIM(p_senha) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Senha é obrigatoria.';
    END IF;
    
    IF p_dt_nascimento IS NULL OR TRIM(p_dt_nascimento) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Data de nascimento  é obrigatoria.';
    END IF;

    SELECT COUNT(*)
    INTO v_qtd
    FROM usuario
    WHERE email = p_email;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E-mail já cadastrado.';
    END IF;

    SELECT COALESCE(MAX(id_usuario), 0) + 1
    INTO v_novo_id
    FROM usuario;

    INSERT INTO usuario
    (
        id_usuario,
        nm_usuario,
        email,
        senha,
        bio,
        dt_nascimento,
        tipo_usuario
    )
    VALUES
    (
        v_novo_id,
        p_nm_usuario,
        p_email,
        md5(p_senha),
        p_bio,
        p_dt_nascimento,
        COALESCE(p_tipo_usuario, 'comum')
    );
END $$

DROP PROCEDURE IF EXISTS buscarUsuarios$$
CREATE PROCEDURE buscarUsuarios()
BEGIN
    SELECT
        id_usuario,
        nm_usuario,
        email,
        bio,
        dt_nascimento,
        tipo_usuario
    FROM usuario
    ORDER BY nm_usuario;
END $$

DROP PROCEDURE IF EXISTS buscarUsuarioNome$$
CREATE PROCEDURE buscarUsuarioNome(
    IN pNome VARCHAR(80)
)
BEGIN
    SELECT
        u.id_usuario,
        u.nm_usuario,
        u.email,
        u.bio,
        u.dt_nascimento,
        (SELECT COUNT(*) FROM biblioteca b
            WHERE b.id_usuario = u.id_usuario AND b.status = 'lido') AS qtd_lidos,
        (SELECT COUNT(*) FROM seguidor s
            WHERE s.id_seguido = u.id_usuario) AS qtd_seguidores,
        (SELECT COUNT(*) FROM seguidor s
            WHERE s.id_seguidor = u.id_usuario) AS qtd_seguindo
    FROM usuario u
    WHERE u.nm_usuario LIKE CONCAT('%', pNome, '%')
    ORDER BY u.nm_usuario;
END $$

DROP PROCEDURE IF EXISTS sp_buscar_usuarios_por_nome_email$$
CREATE PROCEDURE sp_buscar_usuarios_por_nome_email(
    IN p_busca VARCHAR(100)
)
BEGIN
    SELECT
        id_usuario,
        nm_usuario,
        email,
        bio,
        tipo_usuario
    FROM usuario
    WHERE nm_usuario LIKE CONCAT('%', p_busca, '%')
       OR email LIKE CONCAT('%', p_busca, '%')
    ORDER BY nm_usuario;
END $$


DROP PROCEDURE IF EXISTS buscarUsuarioCodigo$$
CREATE PROCEDURE buscarUsuarioCodigo(
    IN p_id_usuario INT
)
BEGIN
     SELECT
        u.id_usuario,
        u.nm_usuario,
        u.email,
        u.bio,
        u.dt_nascimento,
        (SELECT COUNT(*) FROM biblioteca b
            WHERE b.id_usuario = u.id_usuario AND b.status = 'lido') AS qtd_lidos,
        (SELECT COUNT(*) FROM seguidor s
            WHERE s.id_seguido = u.id_usuario) AS qtd_seguidores,
        (SELECT COUNT(*) FROM seguidor s
            WHERE s.id_seguidor = u.id_usuario) AS qtd_seguindo
    FROM usuario u
    WHERE u.id_usuario = p_id_usuario
    ORDER BY u.nm_usuario;
END $$


DROP PROCEDURE IF EXISTS atualizarUsuario$$
CREATE PROCEDURE atualizarUsuario(
    IN p_id_usuario INT,
    IN p_nm_usuario VARCHAR(80),
    IN p_email VARCHAR(100),
    IN p_bio VARCHAR(70),
    IN p_dt_nascimento DATE,
    IN p_tipo_usuario ENUM('comum','administrador')
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM usuario
    WHERE id_usuario = p_id_usuario;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Usuario nao encontrado.';
    END IF;

    SELECT COUNT(*)
    INTO v_qtd
    FROM usuario
    WHERE email = p_email
      AND id_usuario <> p_id_usuario;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E-mail ja cadastrado para outro usuario.';
    END IF;

    UPDATE usuario
    SET
        nm_usuario = p_nm_usuario,
        email = p_email,
        bio = p_bio,
        dt_nascimento = p_dt_nascimento,
        tipo_usuario = COALESCE(p_tipo_usuario, tipo_usuario)
    WHERE id_usuario = p_id_usuario;
END $$

DROP PROCEDURE IF EXISTS atualizarSenhaUsuario$$
CREATE PROCEDURE atualizarSenhaUsuario(
    IN p_id_usuario INT,
    IN p_senha_atual VARCHAR(100),
    IN p_nova_senha VARCHAR(100)
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM usuario
    WHERE id_usuario = p_id_usuario;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Usuario nao encontrado.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM usuario
        WHERE id_usuario = p_id_usuario
          AND senha = MD5(p_senha_atual)
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Senha atual incorreta.';
    END IF;

    IF p_nova_senha IS NULL OR TRIM(p_nova_senha) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nova senha obrigatoria.';
    END IF;

    UPDATE usuario
    SET senha = MD5(p_nova_senha)
    WHERE id_usuario = p_id_usuario;
END$$


DROP PROCEDURE IF EXISTS deletarUsuario$$
CREATE PROCEDURE deletarUsuario(
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM usuario
    WHERE id_usuario = p_id_usuario;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Usuario nao encontrado.';
    END IF;

    DELETE FROM usuario
    WHERE id_usuario = p_id_usuario;
END $$

-- ============================================================

-- ============================================================

-- ============================================================
-- EDITORA
-- ============================================================

-- ============================================================

-- ============================================================


DROP PROCEDURE IF EXISTS sp_cadastrar_editora$$
CREATE PROCEDURE sp_cadastrar_editora(
    IN p_nm_editora VARCHAR(45)
)
BEGIN
    DECLARE v_novo_id INT DEFAULT 1;
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM editora
    WHERE nm_editora = p_nm_editora;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Editora ja cadastrada.';
    END IF;

    SELECT COALESCE(MAX(id_editora), 0) + 1
    INTO v_novo_id
    FROM editora;

    INSERT INTO editora
    (
        id_editora,
        nm_editora
    )
    VALUES
    (
        v_novo_id,
        p_nm_editora
    );
END $$


DROP PROCEDURE IF EXISTS sp_buscar_editoras$$
CREATE PROCEDURE sp_buscar_editoras()
BEGIN
    SELECT
        id_editora,
        nm_editora
    FROM editora
    ORDER BY nm_editora;
END $$


DROP PROCEDURE IF EXISTS sp_buscar_editora_por_id$$
CREATE PROCEDURE sp_buscar_editora_por_id(
    IN p_id_editora INT
)
BEGIN
    SELECT
        id_editora,
        nm_editora
    FROM editora
    WHERE id_editora = p_id_editora;
END $$


DROP PROCEDURE IF EXISTS sp_atualizar_editora$$
CREATE PROCEDURE sp_atualizar_editora(
    IN p_id_editora INT,
    IN p_nm_editora VARCHAR(45)
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM editora
    WHERE id_editora = p_id_editora;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Editora nao encontrada.';
    END IF;

    UPDATE editora
    SET nm_editora = p_nm_editora
    WHERE id_editora = p_id_editora;
END $$


DROP PROCEDURE IF EXISTS sp_deletar_editora$$
CREATE PROCEDURE sp_deletar_editora(
    IN p_id_editora INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM editora
    WHERE id_editora = p_id_editora;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Editora nao encontrada.';
    END IF;

    DELETE FROM editora
    WHERE id_editora = p_id_editora;
END $$


-- ============================================================

-- ============================================================

-- ============================================================
-- GÊNERO
-- ============================================================

-- ============================================================

-- ============================================================

DROP PROCEDURE IF EXISTS sp_cadastrar_genero$$
CREATE PROCEDURE sp_cadastrar_genero(
    IN p_nm_genero VARCHAR(45)
)
BEGIN
    DECLARE v_novo_id INT DEFAULT 1;
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM genero
    WHERE nm_genero = p_nm_genero;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Genero ja cadastrado.';
    END IF;

    SELECT COALESCE(MAX(id_genero), 0) + 1
    INTO v_novo_id
    FROM genero;

    INSERT INTO genero
    (
        id_genero,
        nm_genero
    )
    VALUES
    (
        v_novo_id,
        p_nm_genero
    );
END $$


DROP PROCEDURE IF EXISTS buscarGenero$$
CREATE PROCEDURE buscarGenero()
BEGIN
    SELECT
        id_genero,
        nm_genero
    FROM genero
    ORDER BY nm_genero;
END $$


DROP PROCEDURE IF EXISTS sp_buscar_genero_por_id$$
CREATE PROCEDURE sp_buscar_genero_por_id(
    IN p_id_genero INT
)
BEGIN
    SELECT
        id_genero,
        nm_genero
    FROM genero
    WHERE id_genero = p_id_genero;
END $$


DROP PROCEDURE IF EXISTS sp_atualizar_genero$$
CREATE PROCEDURE sp_atualizar_genero(
    IN p_id_genero INT,
    IN p_nm_genero VARCHAR(45)
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM genero
    WHERE id_genero = p_id_genero;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Genero nao encontrado.';
    END IF;

    UPDATE genero
    SET nm_genero = p_nm_genero
    WHERE id_genero = p_id_genero;
END $$


DROP PROCEDURE IF EXISTS sp_deletar_genero$$
CREATE PROCEDURE sp_deletar_genero(
    IN p_id_genero INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM genero
    WHERE id_genero = p_id_genero;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Genero nao encontrado.';
    END IF;

    DELETE FROM genero
    WHERE id_genero = p_id_genero;
END $$

-- ============================================================

-- ============================================================

-- ============================================================
-- AUTOR
-- ============================================================

-- ============================================================

-- ============================================================

DROP PROCEDURE IF EXISTS sp_cadastrar_autor$$
CREATE PROCEDURE sp_cadastrar_autor(
    IN p_nm_autor VARCHAR(100)
)
BEGIN
    DECLARE v_novo_id INT DEFAULT 1;
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM autor
    WHERE nm_autor = p_nm_autor;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Autor ja cadastrado.';
    END IF;

    SELECT COALESCE(MAX(id_autor), 0) + 1
    INTO v_novo_id
    FROM autor;

    INSERT INTO autor
    (
        id_autor,
        nm_autor
    )
    VALUES
    (
        v_novo_id,
        p_nm_autor
    );
END $$


DROP PROCEDURE IF EXISTS sp_buscar_autores$$
CREATE PROCEDURE sp_buscar_autores()
BEGIN
    SELECT
        id_autor,
        nm_autor
    FROM autor
    ORDER BY nm_autor;
END $$


DROP PROCEDURE IF EXISTS sp_buscar_autor_por_id$$
CREATE PROCEDURE sp_buscar_autor_por_id(
    IN p_id_autor INT
)
BEGIN
    SELECT
        id_autor,
        nm_autor
    FROM autor
    WHERE id_autor = p_id_autor;
END $$


DROP PROCEDURE IF EXISTS sp_atualizar_autor$$
CREATE PROCEDURE sp_atualizar_autor(
    IN p_id_autor INT,
    IN p_nm_autor VARCHAR(100)
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM autor
    WHERE id_autor = p_id_autor;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Autor nao encontrado.';
    END IF;

    UPDATE autor
    SET nm_autor = p_nm_autor
    WHERE id_autor = p_id_autor;
END $$


DROP PROCEDURE IF EXISTS sp_deletar_autor$$
CREATE PROCEDURE sp_deletar_autor(
    IN p_id_autor INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM autor
    WHERE id_autor = p_id_autor;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Autor nao encontrado.';
    END IF;

    DELETE FROM autor
    WHERE id_autor = p_id_autor;
END $$


-- ============================================================

-- ============================================================

-- ============================================================
-- LIVRO
-- ============================================================

-- ============================================================

-- ============================================================


DROP PROCEDURE IF EXISTS sp_cadastrar_livro$$
CREATE PROCEDURE sp_cadastrar_livro(
    IN p_id_livro BIGINT,
    IN p_titulo VARCHAR(100),
    IN p_sinopse LONGTEXT,
    IN p_ano_publicacao DATE,
    IN p_qnt_paginas VARCHAR(45),
    IN p_cd_editora INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM livro
    WHERE id_livro = p_id_livro;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Livro ja cadastrado.';
    END IF;

    SELECT COUNT(*)
    INTO v_qtd
    FROM editora
    WHERE id_editora = p_cd_editora;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Editora nao encontrada.';
    END IF;

    INSERT INTO livro
    (
        id_livro,
        titulo,
        sinopse,
        ano_publicacao,
        qnt_paginas,
        cd_editora
    )
    VALUES
    (
        p_id_livro,
        p_titulo,
        p_sinopse,
        p_ano_publicacao,
        p_qnt_paginas,
        p_cd_editora
    );
END $$


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
            SELECT COALESCE(ROUND(AVG(av_media.nota), 1), 0)
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
            SELECT COALESCE(ROUND(AVG(av_media.nota), 1), 0)
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
            SELECT COALESCE(ROUND(AVG(av.nota), 1), 0)
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
            SELECT COALESCE(ROUND(AVG(av_media.nota), 1), 0)
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
            SELECT COALESCE(ROUND(AVG(av_media.nota), 1), 0)
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
            SELECT COALESCE(ROUND(AVG(av_media.nota), 1), 0)
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
            SELECT COALESCE(ROUND(AVG(av_media.nota), 1), 0)
            FROM avaliacao av_media
            WHERE av_media.id_livro = l.id_livro
        ) AS nota_media
    FROM livro l
    INNER JOIN editora e
        ON l.cd_editora = e.id_editora
    WHERE l.cd_editora = p_id_editora
    ORDER BY l.titulo;
END $$


DROP PROCEDURE IF EXISTS sp_atualizar_livro$$
CREATE PROCEDURE sp_atualizar_livro(
    IN p_id_livro BIGINT,
    IN p_titulo VARCHAR(100),
    IN p_sinopse LONGTEXT,
    IN p_ano_publicacao DATE,
    IN p_qnt_paginas VARCHAR(45),
    IN p_cd_editora INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM livro
    WHERE id_livro = p_id_livro;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Livro nao encontrado.';
    END IF;

    UPDATE livro
    SET
        titulo = p_titulo,
        sinopse = p_sinopse,
        ano_publicacao = p_ano_publicacao,
        qnt_paginas = p_qnt_paginas,
        cd_editora = p_cd_editora
    WHERE id_livro = p_id_livro;
END $$


DROP PROCEDURE IF EXISTS sp_deletar_livro$$
CREATE PROCEDURE sp_deletar_livro(
    IN p_id_livro BIGINT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM livro
    WHERE id_livro = p_id_livro;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Livro nao encontrado.';
    END IF;

    DELETE FROM livro
    WHERE id_livro = p_id_livro;
END $$


-- ============================================================

-- ============================================================

-- ============================================================
-- AUTOR e LIVRO
-- ============================================================

-- ============================================================

-- ============================================================

DROP PROCEDURE IF EXISTS sp_vincular_autor_livro$$
CREATE PROCEDURE sp_vincular_autor_livro(
    IN p_id_autor INT,
    IN p_id_livro BIGINT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM autor
    WHERE id_autor = p_id_autor;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Autor nao encontrado.';
    END IF;

    SELECT COUNT(*)
    INTO v_qtd
    FROM livro
    WHERE id_livro = p_id_livro;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Livro nao encontrado.';
    END IF;

    SELECT COUNT(*)
    INTO v_qtd
    FROM autor_livro
    WHERE id_autor = p_id_autor
      AND id_livro = p_id_livro;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Autor ja vinculado a este livro.';
    END IF;

    INSERT INTO autor_livro
    VALUES (p_id_autor, p_id_livro);
END $$


DROP PROCEDURE IF EXISTS sp_buscar_autores_por_livro$$
CREATE PROCEDURE sp_buscar_autores_por_livro(
    IN p_id_livro BIGINT
)
BEGIN
    SELECT
        a.id_autor,
        a.nm_autor
    FROM autor a
    INNER JOIN autor_livro al
        ON a.id_autor = al.id_autor
    WHERE al.id_livro = p_id_livro
    ORDER BY a.nm_autor;
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
            SELECT COALESCE(ROUND(AVG(av_media.nota), 1), 0)
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


DROP PROCEDURE IF EXISTS sp_desvincular_autor_livro$$
CREATE PROCEDURE sp_desvincular_autor_livro(
    IN p_id_autor INT,
    IN p_id_livro BIGINT
)
BEGIN
    DELETE FROM autor_livro
    WHERE id_autor = p_id_autor
      AND id_livro = p_id_livro;
END $$


-- ============================================================

-- ============================================================

-- ============================================================
-- LIVRO e GÊNERO
-- ============================================================

-- ============================================================

-- ============================================================

DROP PROCEDURE IF EXISTS sp_vincular_livro_genero$$
CREATE PROCEDURE sp_vincular_livro_genero(
    IN p_id_genero INT,
    IN p_id_livro BIGINT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM livro_genero
    WHERE id_genero = p_id_genero
      AND id_livro = p_id_livro;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Genero ja vinculado a este livro.';
    END IF;

    INSERT INTO livro_genero
    VALUES (p_id_genero, p_id_livro);
END $$


DROP PROCEDURE IF EXISTS sp_buscar_generos_por_livro$$
CREATE PROCEDURE sp_buscar_generos_por_livro(
    IN p_id_livro BIGINT
)
BEGIN
    SELECT
        g.id_genero,
        g.nm_genero
    FROM genero g
    INNER JOIN livro_genero lg
        ON g.id_genero = lg.id_genero
    WHERE lg.id_livro = p_id_livro
    ORDER BY g.nm_genero;
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
            SELECT COALESCE(ROUND(AVG(av_media.nota), 1), 0)
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


DROP PROCEDURE IF EXISTS sp_desvincular_livro_genero$$
CREATE PROCEDURE sp_desvincular_livro_genero(
    IN p_id_genero INT,
    IN p_id_livro BIGINT
)
BEGIN
    DELETE FROM livro_genero
    WHERE id_genero = p_id_genero
      AND id_livro = p_id_livro;
END $$


-- ============================================================

-- ============================================================

-- ============================================================
-- AVALIAÇÃO
-- ============================================================

-- ============================================================

-- ============================================================


DROP PROCEDURE IF EXISTS cadastrarAvaliacao$$
CREATE PROCEDURE cadastrarAvaliacao(
    IN p_id_usuario INT,
    IN p_id_livro BIGINT,
    IN p_nota INT,
    IN p_txt_resenha VARCHAR(500)
)
BEGIN
    DECLARE v_novo_id INT DEFAULT 1;
    DECLARE v_qtd INT DEFAULT 0;

    IF p_nota IS NULL OR p_nota < 0 OR p_nota > 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nota invalida. Use uma nota entre 0 e 5.';
    END IF;

    SELECT COUNT(*)
    INTO v_qtd
    FROM avaliacao
    WHERE id_usuario = p_id_usuario
      AND id_livro = p_id_livro;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Este usuario ja avaliou este livro.';
    END IF;

    SELECT COALESCE(MAX(id_avaliacao), 0) + 1
    INTO v_novo_id
    FROM avaliacao;

    INSERT INTO avaliacao
    (
        id_avaliacao,
        nota,
        dt_avaliacao,
        id_livro,
        txt_resenha,
        id_usuario
    )
    VALUES
    (
        v_novo_id,
        p_nota,
        CURDATE(),
        p_id_livro,
        p_txt_resenha,
        p_id_usuario
    );
END $$


DROP PROCEDURE IF EXISTS buscarAvaliacoes$$
CREATE PROCEDURE buscarAvaliacoes()
BEGIN
    SELECT
        a.id_avaliacao,
        a.nota,
        a.dt_avaliacao,
        a.id_livro,
        l.titulo,
        a.txt_resenha,
        a.id_usuario,
        u.nm_usuario
    FROM avaliacao a
    INNER JOIN livro l
        ON a.id_livro = l.id_livro
    INNER JOIN usuario u
        ON a.id_usuario = u.id_usuario
    ORDER BY a.dt_avaliacao DESC;
END $$


DROP PROCEDURE IF EXISTS sp_buscar_avaliacao_por_id$$
CREATE PROCEDURE sp_buscar_avaliacao_por_id(
    IN p_id_avaliacao INT
)
BEGIN
    SELECT
        a.id_avaliacao,
        a.nota,
        a.dt_avaliacao,
        a.id_livro,
        l.titulo,
        a.txt_resenha,
        a.id_usuario,
        u.nm_usuario
    FROM avaliacao a
    INNER JOIN livro l
        ON a.id_livro = l.id_livro
    INNER JOIN usuario u
        ON a.id_usuario = u.id_usuario
    WHERE a.id_avaliacao = p_id_avaliacao;
END $$


DROP PROCEDURE IF EXISTS buscarAvaliacaoLivro$$
CREATE PROCEDURE buscarAvaliacaoLivro(
    IN p_id_livro BIGINT
)
BEGIN
    SELECT
        a.id_avaliacao,
        a.nota,
        a.dt_avaliacao,
        a.txt_resenha,
        a.id_usuario,
        u.nm_usuario
    FROM avaliacao a
    INNER JOIN usuario u
        ON a.id_usuario = u.id_usuario
    WHERE a.id_livro = p_id_livro
    ORDER BY a.dt_avaliacao DESC;
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


DROP PROCEDURE IF EXISTS calcularNotaMediaLivro$$
CREATE PROCEDURE calcularNotaMediaLivro(
    IN p_id_livro BIGINT
)
BEGIN
    SELECT
        p_id_livro AS id_livro,
        COALESCE(ROUND(AVG(nota), 1), 0) AS nota_media,
        COUNT(*) AS quantidade_avaliacoes
    FROM avaliacao
    WHERE id_livro = p_id_livro;
END $$


DROP PROCEDURE IF EXISTS atualizarAvaliacao$$
CREATE PROCEDURE atualizarAvaliacao(
    IN p_id_avaliacao INT,
    IN p_nota INT,
    IN p_txt_resenha VARCHAR(500)
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM avaliacao
    WHERE id_avaliacao = p_id_avaliacao;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Avaliacao nao encontrada.';
    END IF;

    IF p_nota < 0 OR p_nota > 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nota invalida.';
    END IF;

    UPDATE avaliacao
    SET
        nota = p_nota,
        txt_resenha = p_txt_resenha
    WHERE id_avaliacao = p_id_avaliacao;
END $$


DROP PROCEDURE IF EXISTS sp_deletar_avaliacao$$
CREATE PROCEDURE sp_deletar_avaliacao(
    IN p_id_avaliacao INT
)
BEGIN
    DELETE FROM avaliacao
    WHERE id_avaliacao = p_id_avaliacao;
END $$


DROP PROCEDURE IF EXISTS buscarFeed$$
CREATE PROCEDURE buscarFeed(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        a.id_avaliacao,
        a.nota,
        a.dt_avaliacao,
        a.txt_resenha,
        a.id_usuario,
        u.nm_usuario,
        a.id_livro,
        l.titulo
    FROM avaliacao a
    INNER JOIN usuario u
        ON a.id_usuario = u.id_usuario
    INNER JOIN livro l
        ON a.id_livro = l.id_livro
    INNER JOIN seguidor s
        ON s.id_seguido = a.id_usuario
    WHERE s.id_seguidor = p_id_usuario
    ORDER BY a.dt_avaliacao DESC, a.id_avaliacao DESC;
END $$


-- ============================================================

-- ============================================================

-- ============================================================
-- PREFERÊNCIA DO USUÁRIO
-- ============================================================

-- ============================================================

-- ============================================================

DROP PROCEDURE IF EXISTS cadastrarPreferenciaUsuario$$
CREATE PROCEDURE cadastrarPreferenciaUsuario(
    IN p_id_usuario INT,
    IN p_id_genero INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM preferencia_usuario
    WHERE id_usuario = p_id_usuario
      AND id_genero = p_id_genero;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Preferencia ja cadastrada.';
    END IF;

    INSERT INTO preferencia_usuario
    VALUES
    (
        p_id_usuario,
        p_id_genero
    );
END $$


DROP PROCEDURE IF EXISTS sp_buscar_preferencias_por_usuario$$
CREATE PROCEDURE sp_buscar_preferencias_por_usuario(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        g.id_genero,
        g.nm_genero
    FROM preferencia_usuario pu
    INNER JOIN genero g
        ON pu.id_genero = g.id_genero
    WHERE pu.id_usuario = p_id_usuario
    ORDER BY g.nm_genero;
END $$


DROP PROCEDURE IF EXISTS sp_deletar_preferencia_usuario$$
CREATE PROCEDURE sp_deletar_preferencia_usuario(
    IN p_id_usuario INT,
    IN p_id_genero INT
)
BEGIN
    DELETE FROM preferencia_usuario
    WHERE id_usuario = p_id_usuario
      AND id_genero = p_id_genero;
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
            SELECT COALESCE(ROUND(AVG(av.nota), 1), 0)
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
/*	DROP PROCEDURE IF EXISTS recomendarLivroUsuario$$
CREATE PROCEDURE recomendarLivroUsuario(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        l.id_livro,
        l.titulo,
        a.nm_autor,
        COUNT(DISTINCT lg.id_genero) AS generos_compativeis
    FROM livro l
    INNER JOIN autor_livro al
        ON l.id_livro = al.id_livro
    INNER JOIN autor a
        ON al.id_autor = a.id_autor
    INNER JOIN livro_genero lg
        ON l.id_livro = lg.id_livro
    LEFT JOIN preferencia_usuario pu
        ON pu.id_usuario = p_id_usuario
       AND pu.id_genero = lg.id_genero
    LEFT JOIN biblioteca b
        ON b.id_usuario = p_id_usuario
       AND b.id_livro = l.id_livro
    WHERE b.id_livro IS NULL
      AND
      (
          pu.id_genero IS NOT NULL
          OR EXISTS
          (
              SELECT 1
              FROM biblioteca b2
              INNER JOIN livro_genero lg2
                  ON b2.id_livro = lg2.id_livro
              WHERE b2.id_usuario = p_id_usuario
                AND lg2.id_genero = lg.id_genero
          )
          OR EXISTS
          (
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
        l.titulo,
        a.nm_autor
    ORDER BY
        generos_compativeis DESC,
        l.titulo;
END $$ */

-- ============================================================

-- ============================================================

-- ============================================================
-- BIBLIOTECA
-- ============================================================

-- ============================================================

-- ============================================================


DROP PROCEDURE IF EXISTS cadastrarBiblioteca$$
CREATE PROCEDURE cadastrarBiblioteca(
    IN p_id_livro BIGINT,
    IN p_status VARCHAR(20),
    IN p_favorito TINYINT,
    IN p_visivel TINYINT,
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;
    DECLARE v_id_biblioteca INT DEFAULT NULL;

    IF p_status IS NULL OR BINARY p_status NOT IN ('lido', 'lendo', 'quero ler', 'desisti') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Status invalido.';
    END IF;

    IF p_favorito IS NULL OR p_favorito NOT IN (0, 1) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Favorito invalido. Use 0 ou 1.';
    END IF;

    IF p_visivel IS NULL OR p_visivel NOT IN (0, 1) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Visibilidade invalida. Use 0 ou 1.';
    END IF;

    -- usuário existe?
    SELECT COUNT(*) INTO v_qtd
    FROM usuario
    WHERE id_usuario = p_id_usuario;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Usuario nao encontrado.';
    END IF;

    -- livro existe?
    SELECT COUNT(*) INTO v_qtd
    FROM livro
    WHERE id_livro = p_id_livro;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Livro nao encontrado.';
    END IF;

    -- livro já está na biblioteca do usuário?
    SELECT COUNT(*) INTO v_qtd
    FROM biblioteca
    WHERE id_usuario = p_id_usuario
      AND id_livro = p_id_livro;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Este livro ja esta na sua biblioteca.';
    END IF;

    -- pega o id_biblioteca que o usuário já tem
    SELECT id_biblioteca INTO v_id_biblioteca
    FROM biblioteca
    WHERE id_usuario = p_id_usuario
    LIMIT 1;

    -- se for o primeiro livro dele, cria um id novo
    IF v_id_biblioteca IS NULL THEN
        SELECT COALESCE(MAX(id_biblioteca), 0) + 1
        INTO v_id_biblioteca
        FROM biblioteca;
    END IF;

    INSERT INTO biblioteca (id_livro, id_biblioteca, status, favorito, visivel, id_usuario)
    VALUES (p_id_livro, v_id_biblioteca, p_status, p_favorito, p_visivel, p_id_usuario);
END $$


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
            SELECT COALESCE(ROUND(AVG(av_media.nota), 1), 0)
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
            SELECT COALESCE(ROUND(AVG(av_media.nota), 1), 0)
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

DROP PROCEDURE IF EXISTS sp_verificar_livro_na_biblioteca$$
CREATE PROCEDURE sp_verificar_livro_na_biblioteca(
    IN p_id_usuario INT,
    IN p_id_livro BIGINT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM biblioteca
    WHERE id_usuario = p_id_usuario
      AND id_livro = p_id_livro;

    IF v_qtd > 0 THEN
        SELECT
            1 AS esta_na_biblioteca,
            'Este livro esta na sua biblioteca.' AS mensagem;
    ELSE
        SELECT
            0 AS esta_na_biblioteca,
            'Este livro nao esta na sua biblioteca.' AS mensagem;
    END IF;
END $$


DROP PROCEDURE IF EXISTS sp_buscar_biblioteca_por_id$$
CREATE PROCEDURE sp_buscar_biblioteca_por_id(
    IN p_id_biblioteca INT
)
BEGIN
    SELECT
        b.id_biblioteca,
        b.id_livro,
        l.titulo,
        b.status,
        b.favorito,
        b.visivel,
        b.id_usuario
    FROM biblioteca b
    INNER JOIN livro l
        ON b.id_livro = l.id_livro
    WHERE b.id_biblioteca = p_id_biblioteca;
END $$


DROP PROCEDURE IF EXISTS atualizarStatusBiblioteca$$
CREATE PROCEDURE atualizarStatusBiblioteca(
    IN p_id_usuario INT,
    IN p_id_livro BIGINT,
    IN p_status VARCHAR(20)
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    IF p_status IS NULL OR BINARY p_status NOT IN ('lido', 'lendo', 'quero ler', 'desisti') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Status invalido.';
    END IF;

    -- livro está na biblioteca do usuário?
    SELECT COUNT(*) INTO v_qtd
    FROM biblioteca
    WHERE id_usuario = p_id_usuario
      AND id_livro = p_id_livro;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Este livro nao esta na sua biblioteca.';
    END IF;

    UPDATE biblioteca
    SET status = p_status
    WHERE id_usuario = p_id_usuario
      AND id_livro = p_id_livro;
END $$

DROP PROCEDURE IF EXISTS atualizarFavoritoBiblioteca$$
CREATE PROCEDURE atualizarFavoritoBiblioteca(
    IN p_id_usuario INT,
    IN p_id_livro BIGINT,
    IN p_favorito TINYINT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    IF p_favorito IS NULL OR p_favorito NOT IN (0, 1) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Favorito invalido. Use 0 ou 1.';
    END IF;

    SELECT COUNT(*) INTO v_qtd
    FROM biblioteca
    WHERE id_usuario = p_id_usuario
      AND id_livro = p_id_livro;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Este livro nao esta na sua biblioteca.';
    END IF;

    UPDATE biblioteca
    SET favorito = p_favorito
    WHERE id_usuario = p_id_usuario
      AND id_livro = p_id_livro;
END $$

DROP PROCEDURE IF EXISTS deletarLivroBiblioteca$$
CREATE PROCEDURE deletarLivroBiblioteca(
    IN p_id_usuario INT,
    IN p_id_livro BIGINT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    -- livro está na biblioteca do usuário?
    SELECT COUNT(*) INTO v_qtd
    FROM biblioteca
    WHERE id_usuario = p_id_usuario
      AND id_livro = p_id_livro;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Este livro nao esta na sua biblioteca.';
    END IF;

    DELETE FROM biblioteca
    WHERE id_usuario = p_id_usuario
      AND id_livro = p_id_livro;
END $$


DROP PROCEDURE IF EXISTS deletarBiblioteca$$
CREATE PROCEDURE deletarBiblioteca(
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    -- usuário existe?
    SELECT COUNT(*) INTO v_qtd
    FROM usuario
    WHERE id_usuario = p_id_usuario;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Usuario nao encontrado.';
    END IF;

    -- usuário tem livros na biblioteca?
    SELECT COUNT(*) INTO v_qtd
    FROM biblioteca
    WHERE id_usuario = p_id_usuario;

    IF v_qtd = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Sua biblioteca ja esta vazia.';
    END IF;

    DELETE FROM biblioteca
    WHERE id_usuario = p_id_usuario;
END $$


-- ============================================================

-- ============================================================

-- ============================================================
-- SEGUIDOR
-- ============================================================

-- ============================================================

-- ============================================================

DROP PROCEDURE IF EXISTS seguirUsuario$$
CREATE PROCEDURE seguirUsuario(
    IN p_id_seguidor INT,
    IN p_id_seguido INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    IF p_id_seguidor = p_id_seguido THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Um usuario nao pode seguir a si mesmo.';
    END IF;

    SELECT COUNT(*)
    INTO v_qtd
    FROM seguidor
    WHERE id_seguidor = p_id_seguidor
      AND id_seguido = p_id_seguido;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Voce ja segue este usuario.';
    END IF;

    INSERT INTO seguidor
    VALUES
    (
        p_id_seguidor,
        p_id_seguido
    );
END $$


DROP PROCEDURE IF EXISTS sp_buscar_seguidores_por_usuario$$
CREATE PROCEDURE sp_buscar_seguidores_por_usuario(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        u.id_usuario,
        u.nm_usuario
    FROM seguidor s
    INNER JOIN usuario u
        ON s.id_seguidor = u.id_usuario
    WHERE s.id_seguido = p_id_usuario
    ORDER BY u.nm_usuario;
END $$


DROP PROCEDURE IF EXISTS sp_buscar_seguidos_por_usuario$$
CREATE PROCEDURE sp_buscar_seguidos_por_usuario(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        u.id_usuario,
        u.nm_usuario
    FROM seguidor s
    INNER JOIN usuario u
        ON s.id_seguido = u.id_usuario
    WHERE s.id_seguidor = p_id_usuario
    ORDER BY u.nm_usuario;
END $$

DROP PROCEDURE IF EXISTS sp_contar_seguidores$$

CREATE PROCEDURE sp_contar_seguidores(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        COUNT(*) AS quantidade_seguidores
    FROM seguidor
    WHERE id_seguido = p_id_usuario;
END $$


-- Contar seguidos
DROP PROCEDURE IF EXISTS sp_contar_seguidos$$
CREATE PROCEDURE sp_contar_seguidos(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        COUNT(*) AS quantidade_seguidos
    FROM seguidor
    WHERE id_seguidor = p_id_usuario;
END $$

DROP PROCEDURE IF EXISTS sp_verificar_seguimento$$
CREATE PROCEDURE sp_verificar_seguimento(
    IN p_id_seguidor INT,
    IN p_id_seguido INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM seguidor
    WHERE id_seguidor = p_id_seguidor
      AND id_seguido = p_id_seguido;

    IF v_qtd > 0 THEN
        SELECT
            1 AS segue,
            'Seguindo' AS status;
    ELSE
        SELECT
            0 AS segue,
            'Seguir' AS status;
    END IF;
END $$


DROP PROCEDURE IF EXISTS deixarDeSeguir$$
CREATE PROCEDURE deixarDeSeguir(
    IN p_id_seguidor INT,
    IN p_id_seguido INT
)
BEGIN
    DELETE FROM seguidor
    WHERE id_seguidor = p_id_seguidor
      AND id_seguido = p_id_seguido;
END $$


-- ============================================================

-- ============================================================

-- ============================================================
-- META DE LEITURA
-- ============================================================

-- ============================================================

-- ============================================================

DROP PROCEDURE IF EXISTS cadastrarMetaLeitura$$
CREATE PROCEDURE cadastrarMetaLeitura(
    IN p_qnt_livros INT,
    IN p_data DATE,
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_novo_id INT DEFAULT 1;

    IF p_qnt_livros <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Quantidade de livros deve ser maior que zero.';
    END IF;

    SELECT COALESCE(MAX(id_meta), 0) + 1
    INTO v_novo_id
    FROM meta_leitura;

    INSERT INTO meta_leitura
    (
        id_meta,
        qnt_livros,
        data,
        id_usuario
    )
    VALUES
    (
        v_novo_id,
        p_qnt_livros,
        p_data,
        p_id_usuario
    );
END $$


DROP PROCEDURE IF EXISTS buscarMetaUsuario$$
CREATE PROCEDURE buscarMetaUsuario(
    IN p_id_usuario INT
)
BEGIN
    -- A data da avaliação identifica o ano da leitura dos livros marcados como lidos.
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
        SELECT b.id_usuario, YEAR(a.dt_avaliacao) AS ano,
            COUNT(DISTINCT b.id_livro) AS quantidade
        FROM biblioteca b
        INNER JOIN avaliacao a
            ON a.id_usuario = b.id_usuario AND a.id_livro = b.id_livro
        WHERE b.status = 'lido' AND a.dt_avaliacao IS NOT NULL
        GROUP BY b.id_usuario, YEAR(a.dt_avaliacao)
    ) lidos ON lidos.id_usuario = m.id_usuario AND lidos.ano = YEAR(m.data)
    WHERE m.id_usuario = p_id_usuario
    ORDER BY m.data, m.id_meta;
END $$


DROP PROCEDURE IF EXISTS sp_buscar_meta_por_id$$
CREATE PROCEDURE sp_buscar_meta_por_id(
    IN p_id_meta INT
)
BEGIN
    SELECT
        id_meta,
        qnt_livros,
        data,
        id_usuario
    FROM meta_leitura
    WHERE id_meta = p_id_meta;
END $$


DROP PROCEDURE IF EXISTS calcularProgressoMeta$$
CREATE PROCEDURE calcularProgressoMeta(
    IN p_id_meta INT
)
BEGIN
    SELECT
        m.id_meta,
        m.qnt_livros AS meta,
        COALESCE(lidos.quantidade, 0) AS livros_lidos,
        LEAST(COALESCE(lidos.quantidade, 0), m.qnt_livros) AS progresso,
        CONCAT(LEAST(COALESCE(lidos.quantidade, 0), m.qnt_livros), ' de ', m.qnt_livros) AS texto_progresso
    FROM meta_leitura m
    LEFT JOIN (
        SELECT b.id_usuario, YEAR(a.dt_avaliacao) AS ano,
            COUNT(DISTINCT b.id_livro) AS quantidade
        FROM biblioteca b
        INNER JOIN avaliacao a
            ON a.id_usuario = b.id_usuario AND a.id_livro = b.id_livro
        WHERE b.status = 'lido' AND a.dt_avaliacao IS NOT NULL
        GROUP BY b.id_usuario, YEAR(a.dt_avaliacao)
    ) lidos ON lidos.id_usuario = m.id_usuario AND lidos.ano = YEAR(m.data)
    WHERE m.id_meta = p_id_meta;
END $$


DROP PROCEDURE IF EXISTS atualizarMetaLeitura$$
CREATE PROCEDURE atualizarMetaLeitura(
    IN p_id_meta INT,
    IN p_qnt_livros INT,
    IN p_data DATE
)
BEGIN
    UPDATE meta_leitura
    SET
        qnt_livros = p_qnt_livros,
        data = p_data
    WHERE id_meta = p_id_meta;
END $$


DROP PROCEDURE IF EXISTS deletarMetaLeitura$$
CREATE PROCEDURE deletarMetaLeitura(
    IN p_id_meta INT
)
BEGIN
    DELETE FROM meta_leitura
    WHERE id_meta = p_id_meta;
END $$



-- ============================================================

-- ============================================================

-- ============================================================
-- CURTIDA
-- ============================================================

-- ============================================================

-- ============================================================

DROP PROCEDURE IF EXISTS curtirAvaliacao$$
CREATE PROCEDURE curtirAvaliacao(
    IN p_id_usuario INT,
    IN p_id_avaliacao INT
)
BEGIN
    DECLARE v_id_livro BIGINT;
    DECLARE v_qtd INT DEFAULT 0;

    SELECT id_livro
    INTO v_id_livro
    FROM avaliacao
    WHERE id_avaliacao = p_id_avaliacao;

    IF v_id_livro IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Avaliacao nao encontrada.';
    END IF;

    SELECT COUNT(*)
    INTO v_qtd
    FROM curtida_avaliacao
    WHERE id_usuario = p_id_usuario
      AND id_avaliacao = p_id_avaliacao;

    IF v_qtd > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Voce ja curtiu esta avaliacao.';
    END IF;

    INSERT INTO curtida_avaliacao
    (
        id_usuario,
        id_avaliacao,
        id_livro
    )
    VALUES
    (
        p_id_usuario,
        p_id_avaliacao,
        v_id_livro
    );
END $$


-- Contar curtidas
DROP PROCEDURE IF EXISTS contarCurtidasAvaliacao$$
CREATE PROCEDURE contarCurtidasAvaliacao(
    IN p_id_avaliacao INT
)
BEGIN
    SELECT
        COUNT(*) AS quantidade_curtidas
    FROM curtida_avaliacao
    WHERE id_avaliacao = p_id_avaliacao;
END $$

DROP PROCEDURE IF EXISTS sp_verificar_curtida_avaliacao$$
CREATE PROCEDURE sp_verificar_curtida_avaliacao(
    IN p_id_usuario INT,
    IN p_id_avaliacao INT
)
BEGIN
    DECLARE v_qtd INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_qtd
    FROM curtida_avaliacao
    WHERE id_usuario = p_id_usuario
      AND id_avaliacao = p_id_avaliacao;

    IF v_qtd > 0 THEN
        SELECT
            1 AS curtiu,
            'curtido' AS status;
    ELSE
        SELECT
            0 AS curtiu,
            'nao curtido' AS status;
    END IF;
END $$


DROP PROCEDURE IF EXISTS sp_buscar_curtidas_por_avaliacao$$
CREATE PROCEDURE sp_buscar_curtidas_por_avaliacao(
    IN p_id_avaliacao INT
)
BEGIN
    SELECT
        u.id_usuario,
        u.nm_usuario
    FROM curtida_avaliacao ca
    INNER JOIN usuario u
        ON ca.id_usuario = u.id_usuario
    WHERE ca.id_avaliacao = p_id_avaliacao
    ORDER BY u.nm_usuario;
END $$


DROP PROCEDURE IF EXISTS descurtirAvaliacao$$
CREATE PROCEDURE descurtirAvaliacao(
    IN p_id_usuario INT,
    IN p_id_avaliacao INT
)
BEGIN
    DELETE FROM curtida_avaliacao
    WHERE id_usuario = p_id_usuario
      AND id_avaliacao = p_id_avaliacao;
END $$


-- ============================================================

-- ============================================================

-- ============================================================
-- COMENTÁRIO
-- ============================================================

-- ============================================================

-- ============================================================

DROP PROCEDURE IF EXISTS cadastrarComentario$$
CREATE PROCEDURE cadastrarComentario(
    IN p_texto VARCHAR(500),
    IN p_id_usuario INT,
    IN p_id_avaliacao INT
)
BEGIN
    DECLARE v_novo_id INT DEFAULT 1;

    IF p_texto IS NULL OR TRIM(p_texto) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'O texto do comentario nao pode ser vazio.';
    END IF;

    SELECT COALESCE(MAX(id_comentario), 0) + 1
    INTO v_novo_id
    FROM comentario;

    INSERT INTO comentario
    (
        id_comentario,
        texto,
        dt_comentario,
        id_usuario,
        id_avaliacao
    )
    VALUES
    (
        v_novo_id,
        p_texto,
        CURDATE(),
        p_id_usuario,
        p_id_avaliacao
    );
END $$


DROP PROCEDURE IF EXISTS buscarComentarioAvaliacao$$
CREATE PROCEDURE buscarComentarioAvaliacao(
    IN p_id_avaliacao INT
)
BEGIN
    SELECT
        c.id_comentario,
        c.texto,
        c.dt_comentario,
        c.id_usuario,
        u.nm_usuario,
        c.id_avaliacao
    FROM comentario c
    INNER JOIN usuario u
        ON c.id_usuario = u.id_usuario
    WHERE c.id_avaliacao = p_id_avaliacao
    ORDER BY c.dt_comentario;
END $$


DROP PROCEDURE IF EXISTS sp_buscar_comentario_por_id$$
CREATE PROCEDURE sp_buscar_comentario_por_id(
    IN p_id_comentario INT
)
BEGIN
    SELECT
        id_comentario,
        texto,
        dt_comentario,
        id_usuario,
        id_avaliacao
    FROM comentario
    WHERE id_comentario = p_id_comentario;
END $$


DROP PROCEDURE IF EXISTS atualizarComentario$$
CREATE PROCEDURE atualizarComentario(
    IN p_id_comentario INT,
    IN p_id_usuario INT,
    IN p_texto VARCHAR(500)
)
BEGIN
    UPDATE comentario
    SET texto = p_texto
    WHERE id_comentario = p_id_comentario
      AND id_usuario = p_id_usuario;
END $$


DROP PROCEDURE IF EXISTS deletarComentario$$
CREATE PROCEDURE deletarComentario(
    IN p_id_comentario INT,
    IN p_id_usuario INT
)
BEGIN
    DELETE FROM comentario
    WHERE id_comentario = p_id_comentario
      AND id_usuario = p_id_usuario;
END $$

DELIMITER ;