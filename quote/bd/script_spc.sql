delimiter $$

DROP PROCEDURE IF EXISTS buscarLivros$$
CREATE PROCEDURE buscarLivros()
begin

	Select id_livro, titulo, sinopse, ano_publicacao, qnt_paginas, cd_editora from livro;

end$$

delimiter ;