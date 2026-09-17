DROP SCHEMA IF EXISTS quote;
CREATE SCHEMA quote;
USE quote;

CREATE TABLE usuario
(
  id_usuario INT,
  nm_usuario VARCHAR(80),
  email VARCHAR(100) UNIQUE,
  senha VARCHAR(100),
  ft_perfil VARCHAR(300),
  bio VARCHAR(70),
  dt_nascimento DATE,
  tipo_usuario ENUM('comum','administrador'),
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
  id_livro INT,
  titulo VARCHAR(100),
  sinopse LONGTEXT,
  ano_publicacao DATE,
  capa VARCHAR(300),
  qnt_paginas VARCHAR(45),
  cd_editora INT REFERENCES editora(id_editora),
  PRIMARY KEY (id_livro)
);

CREATE TABLE autor_livro
(
  id_autor INT REFERENCES autor(id_autor),
  id_livro INT REFERENCES livro(id_livro),
  PRIMARY KEY (id_autor, id_livro)
);

CREATE TABLE livro_genero
(
  id_genero INT REFERENCES genero(id_genero),
  id_livro INT REFERENCES livro(id_livro),
  PRIMARY KEY (id_genero, id_livro)
);

CREATE TABLE avaliacao
(
  id_avaliacao INT,
  nota INT,
  dt_avaliacao DATE,
  id_livro INT REFERENCES livro(id_livro),
  txt_resenha VARCHAR(500),
  id_usuario INT REFERENCES usuario(id_usuario),
  PRIMARY KEY (id_avaliacao),
  UNIQUE (id_avaliacao, id_livro)
);

CREATE TABLE preferencia_usuario
(
  id_usuario INT REFERENCES usuario(id_usuario),
  id_genero INT REFERENCES genero(id_genero),
  PRIMARY KEY (id_usuario, id_genero)
);

CREATE TABLE biblioteca
(
  id_livro INT REFERENCES livro(id_livro),
  id_biblioteca INT,
  status ENUM('lido','lendo','quero ler','desisti','favorito'),
  visivel TINYINT,
  id_usuario INT REFERENCES usuario(id_usuario),
  PRIMARY KEY (id_livro, id_biblioteca)
);

CREATE TABLE seguidor
(
  id_seguidor INT REFERENCES usuario(id_usuario),
  id_seguido INT REFERENCES usuario(id_usuario),
  PRIMARY KEY (id_seguidor, id_seguido)
);

CREATE TABLE meta_leitura
(
  id_meta INT,
  qnt_livros INT,
  data DATE,
  id_usuario INT REFERENCES usuario(id_usuario),
  PRIMARY KEY (id_meta)
);

CREATE TABLE curtida_avaliacao
(
  id_usuario INT REFERENCES usuario(id_usuario),
  id_avaliacao INT,
  id_livro INT,
  PRIMARY KEY (id_usuario, id_avaliacao, id_livro),
  FOREIGN KEY (id_avaliacao, id_livro) REFERENCES avaliacao (id_avaliacao, id_livro)
);

CREATE TABLE comentario
(
  id_comentario INT,
  texto VARCHAR(500),
  dt_comentario DATE,
  id_usuario INT REFERENCES usuario(id_usuario),
  id_avaliacao INT REFERENCES avaliacao(id_avaliacao),
  PRIMARY KEY (id_comentario, id_usuario)
);

INSERT INTO editora (id_editora, nm_editora) VALUES
(1, 'Companhia das Letras'),
(2, 'Rocco'),
(3, 'Intrínseca'),
(4, 'Sextante'),
(5, 'Record'),
(6, 'Globo Livros'),
(7, 'Objetiva'),
(8, 'Planeta'),
(9, 'Suma'),
(10, 'Arqueiro'),
(11, 'HarperCollins Brasil'),
(12, 'Bertrand Brasil'),
(13, 'Verus'),
(14, 'LeYa'),
(15, 'DarkSide Books'),
(16, 'Martins Fontes'),
(17, 'Ediouro'),
(18, 'Zahar'),
(19, 'Aleph'),
(20, 'Nova Fronteira'),
(21, 'Penguin-Companhia'),
(22, 'Agir');