delimiter $$

DROP PROCEDURE IF EXISTS sp_buscar_livros$$
CREATE PROCEDURE sp_buscar_livros()
begin

	Select id_livro, titulo, sinopse, ano_publicacao, qnt_paginas, cd_editora from livro;

end$$

drop procedure if exists sp_entrar $$

create procedure sp_entrar(
  in p_email varchar(100),
  in p_senha varchar(100)
)
begin
  select id_usuario,
         nm_usuario,
         email,
         bio,
         dt_nascimento,
         tipo_usuario
  from usuario
  where email = p_email
    and binary senha = p_senha;
end $$

DROP PROCEDURE IF EXISTS buscarAvaliacoes$$
CREATE PROCEDURE buscarAvaliacoes()
begin

	Select id_avaliacao, nota, dt_avaliacao, id_livro, txt_resenha, id_usuario from avaliacao;

end$$

drop procedure if exists sp_inserir_avaliacao$$

create procedure sp_inserir_avaliacao(
    in p_id_usuario int,
    in p_id_livro bigint,
    in p_nota int,
    in p_txt_resenha varchar(500)
)
begin
    declare v_qtd_usuario int default 0;
    declare v_qtd_livro int default 0;
    declare v_novo_id int default 1;

    if p_nota is null or p_nota < 0 or p_nota > 5 then
        signal sqlstate '45000'
        set message_text = 'nota invalida: a nota deve ser um valor entre 0 e 5.';
    end if;

    select count(*) 
    into v_qtd_usuario
    from usuario
    where id_usuario = p_id_usuario;

    if v_qtd_usuario = 0 then
        signal sqlstate '45000'
        set message_text = 'usuario nao encontrado.';
    end if;

    select count(*) 
    into v_qtd_livro
    from livro
    where id_livro = p_id_livro;

    if v_qtd_livro = 0 then
        signal sqlstate '45000'
        set message_text = 'livro nao encontrado.';
    end if;

    select coalesce(max(id_avaliacao), 0) + 1 
    into v_novo_id 
    from avaliacao;

    insert into avaliacao (
        id_avaliacao, 
        nota, 
        dt_avaliacao, 
        id_livro, 
        txt_resenha, 
        id_usuario
    ) 
    values (
        v_novo_id, 
        p_nota, 
        curdate(), 
        p_id_livro, 
        p_txt_resenha, 
        p_id_usuario
    );

end $$

delimiter ;