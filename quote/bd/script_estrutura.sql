DROP SCHEMA IF EXISTS quote;
CREATE SCHEMA quote;
USE quote;

CREATE TABLE usuario
(
  id_usuario INT,
  nm_usuario VARCHAR(80),
  email VARCHAR(100) UNIQUE,
  senha VARCHAR(100),
  bio VARCHAR(70),
  dt_nascimento DATE,
  tipo_usuario ENUM('comum', 'administrador'),
  PRIMARY KEY (id_usuario)
);

CREATE TABLE editora
(
  id_editora INT,
  nm_editora VARCHAR(45),
  PRIMARY KEY (id_editora)
);

CREATE TABLE genero
(
  id_genero INT,
  nm_genero VARCHAR(45),
  PRIMARY KEY (id_genero)
);

CREATE TABLE autor
(
  id_autor INT,
  nm_autor VARCHAR(100),
  PRIMARY KEY (id_autor)
);

CREATE TABLE livro
(
  id_livro BIGINT,
  titulo VARCHAR(100),
  sinopse LONGTEXT,
  ano_publicacao DATE,
  qnt_paginas VARCHAR(45),
  cd_editora INT,
  cd_autor INT,
  PRIMARY KEY (id_livro),
  FOREIGN KEY (cd_editora) REFERENCES editora(id_editora),
  FOREIGN KEY (cd_autor) REFERENCES autor(id_autor)
);

CREATE TABLE autor_livro
(
  id_autor INT,
  id_livro BIGINT,
  PRIMARY KEY (id_autor, id_livro),
  FOREIGN KEY (id_autor) REFERENCES autor(id_autor),
  FOREIGN KEY (id_livro) REFERENCES livro(id_livro)
);

CREATE TABLE livro_genero
(
  id_genero INT,
  id_livro BIGINT,
  PRIMARY KEY (id_genero, id_livro),
  FOREIGN KEY (id_genero) REFERENCES genero(id_genero),
  FOREIGN KEY (id_livro) REFERENCES livro(id_livro)
);

CREATE TABLE avaliacao
(
  id_avaliacao INT,
  nota INT,
  dt_avaliacao DATE,
  id_livro BIGINT,
  txt_resenha VARCHAR(500),
  id_usuario INT,
  PRIMARY KEY (id_avaliacao),
  UNIQUE (id_avaliacao, id_livro),
  FOREIGN KEY (id_livro) REFERENCES livro(id_livro),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE preferencia_usuario
(
  id_usuario INT,
  id_genero INT,
  PRIMARY KEY (id_usuario, id_genero),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_genero) REFERENCES genero(id_genero)
);

CREATE TABLE biblioteca
(
  id_livro BIGINT,
  id_biblioteca INT,
  status ENUM('lido', 'lendo', 'quero ler', 'desisti'),
  favorito TINYINT,
  visivel TINYINT,
  id_usuario INT,
  PRIMARY KEY (id_biblioteca, id_livro),
  UNIQUE (id_usuario, id_livro),
  FOREIGN KEY (id_livro) REFERENCES livro(id_livro),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE seguidor
(
  id_seguidor INT,
  id_seguido INT,
  PRIMARY KEY (id_seguidor, id_seguido),
  FOREIGN KEY (id_seguidor) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_seguido) REFERENCES usuario(id_usuario)
);

CREATE TABLE meta_leitura
(
  id_meta INT,
  qnt_livros INT,
  data DATE,
  id_usuario INT,
  PRIMARY KEY (id_meta),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE curtida_avaliacao
(
  id_usuario INT,
  id_avaliacao INT,
  id_livro BIGINT,
  PRIMARY KEY (id_usuario, id_avaliacao, id_livro),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_avaliacao, id_livro) REFERENCES avaliacao(id_avaliacao, id_livro)
);

CREATE TABLE comentario
(
  id_comentario INT,
  texto VARCHAR(500),
  dt_comentario DATE,
  id_usuario INT,
  id_avaliacao INT,
  PRIMARY KEY (id_comentario, id_usuario),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_avaliacao) REFERENCES avaliacao(id_avaliacao)
);