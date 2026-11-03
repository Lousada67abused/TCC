-- Atualiza apenas as consultas de metas. Não altera tabelas nem datas existentes.
-- O cadastro de avaliações já salva dt_avaliacao com CURDATE().
USE quote;
DELIMITER $$

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

DELIMITER ;
