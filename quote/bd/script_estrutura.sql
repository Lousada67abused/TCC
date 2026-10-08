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
  id_autor INT REFERENCES autor(id_autor),
  id_livro BIGINT REFERENCES livro(id_livro),
  PRIMARY KEY (id_autor, id_livro)
);

CREATE TABLE livro_genero
(
  id_genero INT REFERENCES genero(id_genero),
  id_livro BIGINT REFERENCES livro(id_livro),
  PRIMARY KEY (id_genero, id_livro)
);

CREATE TABLE avaliacao
(
  id_avaliacao INT,
  nota INT,
  dt_avaliacao DATE,
  id_livro BIGINT REFERENCES livro(id_livro),
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
    id_livro BIGINT REFERENCES livro(id_livro),
    id_biblioteca INT,
    status ENUM('lido','lendo','quero ler','desisti','favorito'),
    visivel TINYINT,
    id_usuario INT REFERENCES usuario(id_usuario),

    PRIMARY KEY (id_biblioteca),
    UNIQUE (id_usuario, id_livro)
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
  id_livro BIGINT,
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

INSERT INTO usuario (id_usuario, nm_usuario, email, senha, bio, dt_nascimento, tipo_usuario) VALUES
(1, 'Ana Beatriz Ferreira', 'teste@gmail.com', md5('123'), 'Viciada em romances distópicos. Sempre com um livro na bolsa.', '1998-03-14', 'comum'),
(2, 'Bruno Costa Almeida', 'bruno.almeida@email.com', md5('123'), 'Fã de ficção científica e fantasia épica. Leio Tolkien todo ano.', '1995-07-22', 'comum'),
(3, 'Camila Souza Ribeiro', 'camila.ribeiro@email.com', md5('123'), 'Administradora do Quote. Apaixonada por literatura brasileira.', '1990-11-05', 'administrador'),
(4, 'Diego Martins Oliveira', 'diego.oliveira@email.com', md5('123'), 'Poesia contemporânea e crônicas do dia a dia.', '2000-01-30', 'comum'),
(5, 'Elisa Pereira Lima', 'elisa.lima@email.com', md5('123'), 'Amante de clássicos russos. Dostoiévski é vida.', '1993-09-18', 'comum'),
(6, 'Felipe Rocha Barbosa', 'felipe.barbosa@email.com', md5('123'), 'Leitor de mistérios e thrillers psicológicos.', '1997-05-09', 'comum'),
(7, 'Gabriela Nunes Cardoso', 'gabriela.cardoso@email.com', md5('123'), 'Fantasia jovem adulto é meu vício confesso.', '2001-12-25', 'comum'),
(8, 'Henrique Duarte Santos', 'henrique.santos@email.com', md5('123'), 'Não-ficção e biografias. Sempre aprendendo algo novo.', '1988-04-11', 'comum'),
(9, 'Isabela Moreira Castro', 'isabela.castro@email.com', md5('123'), 'Administradora do Quote. Moderação e curadoria de conteúdo.', '1992-08-07', 'administrador'),
(10, 'João Vitor Araújo', 'joao.araujo@email.com', md5('123'), 'Quadrinhos, mangás e literatura fantástica.', '1999-02-16', 'comum'),
(11, 'Larissa Teixeira Gomes', 'larissa.gomes@email.com', md5('123'), 'Poesia marginal e literatura periférica.', '1996-06-29', 'comum'),
(12, 'Marcelo Fontes Pinto', 'marcelo.pinto@email.com', md5('123'), 'Ensaísta amador. Curto discutir filosofia e literatura.', '1985-10-03', 'comum'),
(13, 'Natália Vieira Correia', 'natalia.correia@email.com', md5('123'), 'Romance histórico e sagas familiares são minha praia.', '1994-01-20', 'comum'),
(14, 'Otávio Ramos Cavalcanti', 'otavio.cavalcanti@email.com', md5('123'), 'Leitor voraz de terror e horror cósmico.', '1991-03-27', 'comum'),
(15, 'Patrícia Andrade Melo', 'patricia.melo@email.com', md5('123'), 'Literatura infantojuvenil e contação de histórias.', '1989-07-14', 'comum');

INSERT INTO genero (id_genero, nm_genero) VALUES
(1, 'Romance'),
(2, 'Ficção Científica'),
(3, 'Fantasia'),
(4, 'Terror'),
(5, 'Suspense'),
(6, 'Mistério'),
(7, 'Poesia'),
(8, 'Biografia'),
(9, 'Não Ficção'),
(10, 'Literatura Brasileira'),
(11, 'Literatura Infantojuvenil'),
(12, 'Distopia'),
(13, 'Crônica'),
(14, 'Clássicos'),
(15, 'Quadrinhos e Mangás');

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

INSERT INTO autor (id_autor, nm_autor) VALUES
(1, 'George Orwell'),
(2, 'Machado de Assis'),
(3, 'Antoine de Saint-Exupéry'),
(4, 'Paulo Coelho'),
(5, 'Gabriel García Márquez'),
(6, 'Franz Kafka'),
(7, 'Yuval Noah Harari'),
(8, 'Douglas Adams'),
(9, 'J.K. Rowling'),
(10, 'Jane Austen'),
(11, 'Aldous Huxley'),
(12, 'Suzanne Collins'),
(13, 'J.R.R. Tolkien'),
(14, 'João Guimarães Rosa'),
(15, 'Clarice Lispector'),
(16, 'Rick Riordan'),
(17, 'Emily Brontë'),
(18, 'Markus Zusak'),
(19, 'Jojo Moyes'),
(20, 'John Boyne'),
(21, 'Mary Shelley'),
(22, 'Oscar Wilde'),
(23, 'Charles Duhigg'),
(24, 'R.J. Palacio'),
(25, 'Louisa May Alcott'),
(26, 'Bram Stoker'),
(27, 'C.S. Lewis');

INSERT INTO livro (id_livro, titulo, sinopse, ano_publicacao, qnt_paginas, cd_editora, cd_autor) VALUES
(9788535914849, '1984',
'Em uma Londres governada por Oceania, Winston Smith trabalha no Ministério da Verdade reescrevendo a história para que ela sempre corresponda à versão oficial do Partido. Vigiado dia e noite pelas telas do Grande Irmão, ele começa a questionar em segredo o regime que domina cada aspecto de sua vida.

Ao se envolver com Julia e buscar pequenos espaços de liberdade e verdade, Winston arrisca tudo em um mundo onde até os pensamentos podem ser crime. Sua rebelião silenciosa o leva a um confronto direto com o Partido e com os limites do que a mente humana pode suportar.',
'2009-07-21', '416', 1, 1),

(9788582850350, 'Dom Casmurro',
'Já velho, Bento Santiago, o Bentinho, relembra a infância na Rua de Matacavalos e o amor que nutria pela vizinha Capitu, apesar da promessa feita por sua mãe de que ele se tornaria padre. Aos poucos, os dois driblam os obstáculos e conseguem se casar.

Anos depois, porém, a morte do amigo Escobar desperta em Bentinho um ciúme corrosivo. Ele passa a suspeitar de uma traição entre Capitu e o amigo, e o leitor é conduzido por uma narrativa ambígua, onde nunca fica claro se a culpa de Capitu é real ou fruto da mente atormentada do narrador.',
'2016-07-26', '400', 21, 2),

(9788522031450, 'O Pequeno Príncipe',
'Um piloto cai com seu avião no deserto do Saara e, enquanto tenta consertar o motor, encontra um menino vindo de um pequeno asteroide distante. O garoto pede, insistentemente, que o piloto lhe desenhe um carneiro.

Aos poucos, o pequeno príncipe conta sobre seu planeta, sua rosa e as viagens que fez por outros mundos habitados por adultos estranhos e solitários, revelando reflexões simples e profundas sobre amizade, amor e aquilo que realmente importa na vida.',
'2015-05-01', '96', 22, 3),

(9788532503251, 'O Alquimista',
'Santiago, um jovem pastor andaluz, sonha repetidamente com um tesouro escondido perto das pirâmides do Egito. Decidido a descobrir o que o sonho significa, ele vende suas ovelhas e parte em uma longa jornada pelo deserto.

Pelo caminho, encontra um rei, uma cigana, um inglês estudioso e, por fim, um alquimista, que o ajudam a decifrar os sinais do universo. Juntos, eles conduzem Santiago a compreender o verdadeiro significado de sua Lenda Pessoal.',
'2003-01-01', '222', 2, 4),

(9788501012074, 'Cem Anos de Solidão',
'O romance narra a história da família Buendía ao longo de sete gerações na fictícia Macondo, vilarejo fundado por José Arcadio Buendía após uma longa jornada em busca de novas terras.

Guerras civis, amores proibidos, invenções fantásticas e uma solidão que parece perseguir a linhagem inteira se entrelaçam na saga, que mistura realidade e fantasia até o cumprimento de uma profecia escrita décadas antes pelo cigano Melquíades.',
'1977-04-01', '448', 5, 5),

(9788571646858, 'A Metamorfose',
'Certa manhã, o caixeiro-viajante Gregor Samsa acorda em sua cama transformado em um inseto monstruoso, sem qualquer explicação para o que lhe aconteceu. Incapaz de sair para o trabalho, ele precisa lidar com as consequências imediatas dessa mudança.

Preso ao próprio quarto, Gregor passa a enfrentar o horror, a vergonha e, aos poucos, a rejeição da própria família, numa narrativa que expõe a alienação do indivíduo diante do trabalho e dos laços familiares.',
'1997-08-07', '96', 1, 6),

(9788535909555, 'A Revolução dos Bichos',
'Cansados da exploração promovida pelo fazendeiro Jones, os animais de uma granja inglesa se rebelam e tomam conta da propriedade, expulsando os humanos e estabelecendo novas regras de convivência baseadas na igualdade entre todos.

Liderados pelos porcos, os animais aos poucos veem seus ideais igualitários se corromperem. O poder, cada vez mais concentrado nas mãos de poucos, acaba por reproduzir a mesma tirania que a revolução pretendia destruir.',
'2007-01-10', '152', 1, 1),

(9788535933925, 'Sapiens: Uma Breve História da Humanidade',
'Harari percorre a trajetória da espécie humana desde o surgimento do Homo sapiens na África, passando pela Revolução Cognitiva, que deu origem à linguagem, aos mitos e à capacidade de cooperação em larga escala.

O livro segue pela Revolução Agrícola e pela unificação da humanidade por meio de impérios, religiões e do dinheiro, até chegar à Revolução Científica e aos dilemas éticos que a tecnologia impõe ao futuro da nossa espécie.',
'2020-11-13', '472', 1, 7),

(9788599296578, 'O Guia do Mochileiro das Galáxias',
'Momentos antes de a Terra ser destruída para dar lugar a uma via expressa hiperespacial, o inglês Arthur Dent é resgatado por seu amigo Ford Prefect, que na verdade é um alienígena disfarçado, pesquisador do Guia do Mochileiro das Galáxias.

Juntos, eles embarcam em uma jornada caótica pelo espaço, cruzando com personagens excêntricos e situações absurdas, sempre acompanhados do famoso guia interestelar e da enigmática resposta 42 para o sentido da vida, do universo e de tudo mais.',
'2007-04-02', '208', 10, 8),

(9788532511010, 'Harry Potter e a Pedra Filosofal',
'Órfão criado pelos tios que o desprezam, Harry Potter descobre em seu 11º aniversário que é um bruxo e recebe uma carta de aceitação em Hogwarts, a Escola de Magia e Bruxaria.

Na escola, ele faz amigos como Rony e Hermione, aprende feitiços e o esporte das vassouras voadoras, e se vê envolvido em um mistério que gira em torno da lendária Pedra Filosofal e do possível retorno do bruxo das trevas que matou seus pais.',
'2000-04-07', '264', 2, 9),

(9788563560155, 'Orgulho e Preconceito',
'Elizabeth Bennet, a segunda de cinco irmãs de uma família da pequena nobreza inglesa, se choca com a arrogância do rico Fitzwilliam Darcy logo no primeiro encontro entre os dois.

Ao longo de uma sucessão de mal-entendidos, cartas reveladoras e reviravoltas sociais, os dois precisam superar o orgulho e os preconceitos que os separam para reconhecer o que realmente sentem um pelo outro.',
'2011-06-21', '576', 21, 10),

(9788525056009, 'Admirável Mundo Novo',
'Em uma sociedade futurista organizada por castas geneticamente programadas, os seres humanos são condicionados desde o nascimento a aceitar seu papel e a buscar prazer imediato acima de qualquer outra coisa.

Quando Bernard Marx e o "selvagem" John, criado fora desse sistema, questionam os valores dessa civilização perfeita, eles expõem o preço pago pela estabilidade e pela felicidade artificial impostas a todos.',
'2014-02-14', '312', 6, 11),

(9788579800245, 'Jogos Vorazes',
'Na nação de Panem, dividida em doze distritos controlados pela Capital, dois jovens de cada distrito são sorteados anualmente para participar dos Jogos Vorazes, um combate mortal transmitido pela televisão.

Ao se voluntariar no lugar da irmã mais nova, Katniss Everdeen precisa usar toda sua habilidade com o arco e sua astúcia para sobreviver à arena e, ao mesmo tempo, desafiar secretamente o poder da Capital.',
'2012-02-15', '400', 2, 12),

(9788595084759, 'O Senhor dos Anéis: A Sociedade do Anel',
'O hobbit Frodo Bolseiro herda de seu tio Bilbo um simples anel que se revela ser o Um Anel, capaz de dar a Sauron, o Senhor do Escuro, poder para dominar toda a Terra-média.

Para impedir essa ameaça, Frodo parte do Condado ao lado de uma sociedade formada por hobbits, elfos, anões e homens, com a missão de levar o anel até as Montanhas da Perdição e destruí-lo para sempre.',
'2019-11-25', '576', 11, 13),

(9788582850015, 'Memórias Póstumas de Brás Cubas',
'Já morto, Brás Cubas decide narrar sua própria biografia, dedicando o livro ao verme que roeu as frias carnes de seu cadáver, e revisita com ironia os fracassos amorosos e políticos de sua vida.

Por meio de capítulos curtos e de uma narrativa fragmentada e cheia de digressões, o defunto autor expõe, com humor ácido, a futilidade e a hipocrisia da elite brasileira do século XIX.',
'2014-09-16', '368', 21, 2),

(9788520918852, 'Grande Sertão: Veredas',
'O ex-jagunço Riobaldo relembra, em um longo monólogo, sua trajetória pelos sertões de Minas Gerais, as batalhas que travou e o intenso e conturbado vínculo que manteve com o companheiro Diadorim.

Escrito em uma linguagem inventiva que mistura o falar sertanejo com um vocabulário erudito, o romance mergulha nos dilemas do bem e do mal enquanto acompanha a saga dos jagunços pelo Brasil profundo.',
'2012-10-01', '608', 20, 14),

(9788532508126, 'A Hora da Estrela',
'O narrador Rodrigo S.M. conta a história de Macabéa, uma jovem nordestina pobre, datilógrafa desajeitada e quase invisível, que vive sozinha na cidade grande sem nunca ter tido a chance de sonhar com algo melhor.

Por meio de uma prosa que mistura compaixão e ironia, Clarice Lispector transforma a vida simples e apagada de Macabéa em uma reflexão sobre a miséria, a linguagem e o próprio ato de escrever.',
'1998-08-04', '88', 2, 15),

(9788598078397, 'Percy Jackson e o Ladrão de Raios',
'Aos doze anos, Percy Jackson descobre que é filho de Poseidon, o deus grego dos mares, e que seu mau desempenho na escola sempre teve uma explicação que ninguém lhe havia contado.

Acusado de roubar o raio mestre de Zeus, Percy parte em uma jornada ao lado de amigos semideuses para encontrar o verdadeiro culpado antes que uma guerra entre os deuses do Olimpo se torne inevitável.',
'2008-11-21', '400', 3, 16),

(9788582851425, 'O Morro dos Ventos Uivantes',
'Criados juntos na isolada propriedade de Wuthering Heights, Catherine Earnshaw e o enjeitado Heathcliff desenvolvem uma ligação intensa que é interrompida quando ela decide se casar por posição social.

Movido pelo rancor da rejeição, Heathcliff passa a perseguir uma vingança que se estende por duas gerações, arrastando todos ao seu redor para dentro de um ciclo de ressentimento e paixão destrutiva.',
'2021-07-19', '464', 21, 17),

(9788598078175, 'A Menina que Roubava Livros',
'Narrada pela Morte, a história acompanha Liesel Meminger, uma menina alemã que, durante a Segunda Guerra Mundial, encontra consolo furtando livros e aprendendo a ler com a ajuda do pai adotivo.

Enquanto a família esconde um refugiado judeu no porão de casa, Liesel descobre no poder das palavras uma forma de resistência em meio ao horror e à destruição que tomam conta de sua cidade.',
'2007-01-01', '480', 3, 18),

(9788580573299, 'Como Eu Era Antes de Você',
'Louisa Clark, uma jovem de vinte e seis anos sem grandes ambições, é contratada para cuidar de Will Traynor, um ex-executivo bem-sucedido que ficou tetraplégico após um acidente e perdeu a vontade de viver.

Ao longo dos meses de convivência, os dois desenvolvem um vínculo intenso que faz Lou repensar sua própria vida, enquanto ela tenta convencer Will de que ainda vale a pena continuar.',
'2013-01-01', '320', 3, 19),

(9788535911121, 'O Menino do Pijama Listrado',
'Bruno, um menino alemão de nove anos, se muda com a família para uma região isolada por causa do novo trabalho do pai e passa a observar, intrigado, um grupo de pessoas de pijama listrado do outro lado de uma cerca.

Ao fazer amizade com Shmuel, um garoto judeu preso do outro lado da cerca, Bruno vai descobrindo, sem entender completamente, o horror do Holocausto que envolve sua própria família.',
'2007-10-11', '192', 1, 20),

(9788594540188, 'Frankenstein',
'Obcecado por desvendar os segredos da vida, o jovem cientista Victor Frankenstein consegue dar vida a uma criatura montada a partir de partes de cadáveres, mas se horroriza com o resultado e a abandona.

Rejeitada por seu criador e por toda a sociedade, a criatura passa a buscar vingança contra Victor, desencadeando uma perseguição trágica que questiona os limites da ciência e da responsabilidade humana.',
'2017-02-06', '304', 15, 21),

(9788563560438, 'O Retrato de Dorian Gray',
'Encantado com a própria beleza após ver seu retrato recém-pintado, o jovem Dorian Gray deseja permanecer eternamente jovem, mesmo que isso custe sua alma, enquanto o quadro envelhece e registra seus pecados em seu lugar.

Livre das marcas físicas de seus atos, Dorian mergulha em uma vida de excessos e crueldade, enquanto o retrato escondido revela, cada vez mais monstruoso, a verdadeira face de sua corrupção moral.',
'2012-04-12', '264', 21, 22),

(9788539004119, 'O Poder do Hábito',
'O jornalista Charles Duhigg investiga a ciência por trás da formação dos hábitos, explicando como eles funcionam no cérebro e por que exercem tanto controle sobre nosso comportamento no dia a dia.

Por meio de exemplos de indivíduos, empresas e sociedades, o livro mostra como é possível identificar o ciclo de deixa, rotina e recompensa que sustenta um hábito para transformá-lo de forma deliberada.',
'2012-09-24', '408', 7, 23),

(9788580573015, 'Extraordinário',
'August Pullman, um menino de dez anos nascido com uma rara condição genética que causa deformidades faciais, frequenta a escola regular pela primeira vez após anos sendo educado em casa.

Contada sob diferentes pontos de vista, a história acompanha como Auggie enfrenta o julgamento e a curiosidade dos colegas enquanto conquista, aos poucos, a aceitação e a amizade de quem o rodeia.',
'2013-01-31', '320', 3, 24),

(9788582850985, 'Mulherzinhas',
'Durante a Guerra Civil americana, as quatro irmãs March, Meg, Jo, Beth e Amy, enfrentam as dificuldades financeiras da família e a ausência do pai, servindo no front, apoiadas pela força e pelo exemplo da mãe.

Ao longo dos anos, cada uma das irmãs precisa lidar com seus próprios sonhos, perdas e amadurecimento, em uma história que celebra a união familiar e a busca pela independência feminina.',
'2020-01-09', '592', 21, 25),

(9788566636239, 'Drácula',
'O jovem advogado Jonathan Harker viaja até a Transilvânia para fechar um negócio imobiliário com o misterioso Conde Drácula e logo descobre que está sendo mantido prisioneiro no castelo do nobre vampiro.

De volta à Inglaterra, Drácula espalha o terror pela Londres vitoriana, obrigando um pequeno grupo liderado pelo professor Van Helsing a se unir para caçá-lo antes que ele transforme suas vítimas em criaturas da noite.',
'2018-10-24', '580', 15, 26),

(9788578270889, 'O Leão, a Feiticeira e o Guarda-Roupa',
'Os quatro irmãos Pevensie são enviados para o interior da Inglaterra durante a guerra e, ao explorarem a casa onde estão hospedados, descobrem que um velho guarda-roupa é a passagem para o mundo mágico de Nárnia.

Lá, eles se veem no meio de uma batalha entre o bem e o mal, ao lado do grande leão Aslam, contra o domínio gelado e cruel da Feiticeira Branca, que mantém Nárnia presa em um inverno eterno.',
'2009-09-22', '184', 16, 27);

INSERT INTO livro_genero (id_genero, id_livro) VALUES

(2, 9788535914849),
(12, 9788535914849),

(1, 9788582850350),
(10, 9788582850350),
(14, 9788582850350),

(11, 9788522031450),
(14, 9788522031450),

(1, 9788532503251),
(10, 9788532503251),

(1, 9788501012074),
(3, 9788501012074),
(14, 9788501012074),

(2, 9788571646858),
(14, 9788571646858),

(2, 9788535909555),
(12, 9788535909555),
(14, 9788535909555),

(9, 9788535933925),

(2, 9788599296578),

(3, 9788532511010),
(11, 9788532511010),

(1, 9788563560155),
(14, 9788563560155),

(2, 9788525056009),
(12, 9788525056009),
(14, 9788525056009),

(2, 9788579800245),
(11, 9788579800245),
(12, 9788579800245),

(3, 9788595084759),
(14, 9788595084759),

(1, 9788582850015),
(10, 9788582850015),
(14, 9788582850015),

(1, 9788520918852),
(10, 9788520918852),
(14, 9788520918852),

(1, 9788532508126),
(10, 9788532508126),
(14, 9788532508126),

(3, 9788598078397),
(11, 9788598078397),

(1, 9788582851425),
(14, 9788582851425),

(1, 9788598078175),
(11, 9788598078175),

(1, 9788580573299),

(1, 9788535911121),
(11, 9788535911121),

(2, 9788594540188),
(4, 9788594540188),
(14, 9788594540188),

(4, 9788563560438),
(14, 9788563560438),

(9, 9788539004119),

(1, 9788580573015),
(11, 9788580573015),

(1, 9788582850985),
(14, 9788582850985),

(4, 9788566636239),
(14, 9788566636239),

(3, 9788578270889),
(11, 9788578270889),
(14, 9788578270889);

INSERT INTO autor_livro (id_autor, id_livro) VALUES
(1, 9788535914849),
(2, 9788582850350),
(3, 9788522031450),
(4, 9788532503251),
(5, 9788501012074),
(6, 9788571646858),
(1, 9788535909555),
(7, 9788535933925),
(8, 9788599296578),
(9, 9788532511010),
(10, 9788563560155),
(11, 9788525056009),
(12, 9788579800245),
(13, 9788595084759),
(2, 9788582850015),
(14, 9788520918852),
(15, 9788532508126),
(16, 9788598078397),
(17, 9788582851425),
(18, 9788598078175),
(19, 9788580573299),
(20, 9788535911121),
(21, 9788594540188),
(22, 9788563560438),
(23, 9788539004119),
(24, 9788580573015),
(25, 9788582850985),
(26, 9788566636239),
(27, 9788578270889);