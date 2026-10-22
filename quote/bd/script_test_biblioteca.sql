-- Teste de integração das procedures em uma base de desenvolvimento com livros.
-- Todas as alterações de dados são revertidas por ROLLBACK.
USE quote;
DELIMITER $$
DROP PROCEDURE IF EXISTS testarBibliotecaFavorito$$
CREATE PROCEDURE testarBibliotecaFavorito()
BEGIN
    DECLARE v_usuario INT;
    DECLARE v_livro BIGINT;
    DECLARE v_status VARCHAR(20);
    DECLARE v_favorito TINYINT;
    DECLARE v_visivel TINYINT;
    DECLARE v_cenario INT DEFAULT 0;
    DECLARE v_rejeitado TINYINT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    SELECT MIN(id_livro) INTO v_livro FROM livro;
    IF v_livro IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cadastre pelo menos um livro para executar o teste.';
    END IF;
    SELECT COALESCE(MAX(id_usuario), 0) + 1 INTO v_usuario FROM usuario;
    INSERT INTO usuario (id_usuario, nm_usuario, email, senha, bio, dt_nascimento, tipo_usuario)
    VALUES (v_usuario, 'Teste Biblioteca', CONCAT('biblioteca-teste-', v_usuario, '@example.com'),
            MD5('123'), '', '2000-01-01', 'comum');

    CALL cadastrarBiblioteca(v_livro, 'quero ler', 0, 0, v_usuario);
    SELECT status, favorito, visivel INTO v_status, v_favorito, v_visivel
    FROM biblioteca WHERE id_usuario = v_usuario AND id_livro = v_livro;
    IF v_status <> 'quero ler' OR v_favorito <> 0 OR v_visivel <> 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cadastro deve aceitar favorito e visibilidade iguais a zero.';
    END IF;

    WHILE v_cenario < 4 DO
        SET v_status = CASE v_cenario WHEN 0 THEN 'lido' WHEN 1 THEN 'lendo'
                                      WHEN 2 THEN 'quero ler' ELSE 'desisti' END;
        CALL atualizarStatusBiblioteca(v_usuario, v_livro, v_status);
        CALL atualizarFavoritoBiblioteca(v_usuario, v_livro, 1);
        IF NOT EXISTS (SELECT 1 FROM biblioteca WHERE id_usuario = v_usuario
                       AND id_livro = v_livro AND status = v_status AND favorito = 1 AND visivel = 0) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Favoritar alterou o status ou a visibilidade.';
        END IF;
        CALL atualizarStatusBiblioteca(v_usuario, v_livro, IF(v_status = 'lido', 'lendo', 'lido'));
        IF NOT EXISTS (SELECT 1 FROM biblioteca WHERE id_usuario = v_usuario
                       AND id_livro = v_livro AND favorito = 1) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mudar o status removeu o favorito.';
        END IF;
        CALL atualizarStatusBiblioteca(v_usuario, v_livro, v_status);
        IF NOT EXISTS (SELECT 1 FROM biblioteca WHERE id_usuario = v_usuario
                       AND id_livro = v_livro AND status = v_status AND favorito = 1) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Atualizar o status removeu o favorito.';
        END IF;
        CALL atualizarFavoritoBiblioteca(v_usuario, v_livro, 0);
        IF NOT EXISTS (SELECT 1 FROM biblioteca WHERE id_usuario = v_usuario
                       AND id_livro = v_livro AND status = v_status AND favorito = 0) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Desfavoritar alterou o status.';
        END IF;
        SET v_cenario = v_cenario + 1;
    END WHILE;

    BEGIN
        DECLARE CONTINUE HANDLER FOR SQLSTATE '45000' SET v_rejeitado = 1;
        CALL atualizarStatusBiblioteca(v_usuario, v_livro, 'favorito');
    END;
    IF v_rejeitado <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O status legado favorito deve ser rejeitado.';
    END IF;
    SET v_rejeitado = 0;
    BEGIN
        DECLARE CONTINUE HANDLER FOR SQLSTATE '45000' SET v_rejeitado = 1;
        CALL atualizarFavoritoBiblioteca(v_usuario, v_livro, 2);
    END;
    IF v_rejeitado <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Favorito fora de zero ou um deve ser rejeitado.';
    END IF;

    ROLLBACK;
    SELECT 'OK: favorito 0/1 independente dos quatro status; dados revertidos.' AS resultado;
END$$
CALL testarBibliotecaFavorito()$$
DROP PROCEDURE testarBibliotecaFavorito$$
DELIMITER ;
