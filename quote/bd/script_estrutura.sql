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
(27, 'C.S. Lewis'),
(28, 'Jorge Amado'),
(29, 'José Saramago'),
(30, 'Liev Tolstói'),
(31, 'Milan Kundera'),
(32, 'Daniel Kahneman'),
(33, 'Carol S. Dweck'),
(34, 'Daniel Goleman'),
(35, 'F. Scott Fitzgerald'),
(36, 'Nicolau Maquiavel'),
(37, 'Graciliano Ramos'),
(38, 'Homero'),
(39, 'Charlotte Brontë'),
(40, 'Victor Hugo'),
(41, 'Lima Barreto'),
(42, 'Margaret Atwood'),
(43, 'John Green'),
(44, 'Gillian Flynn'),
(45, 'Ray Bradbury'),
(46, 'Anne Frank'),
(47, 'Patrick Rothfuss'),
(48, 'Chimamanda Ngozi Adichie'),
(49, 'Carl Sagan'),
(50, 'Richard Dawkins'),
(51, 'Jeferson Tenório'),
(52, 'William Shakespeare'),
(53, 'Miguel de Cervantes'),
(54, 'Charles Dickens'),
(55, 'Henry David Thoreau'),
(56, 'Gustave Flaubert'),
(57, 'Nassim Nicholas Taleb'),
(58, 'Richard H. Thaler'),
(59, 'Cass R. Sunstein'),
(60, 'André Aciman'),
(61, 'Stephen Hawking'),
(62, 'Paula Hawkins');

INSERT INTO livro (id_livro, titulo, sinopse, ano_publicacao, qnt_paginas, cd_editora) VALUES
 
(9788535914849, '1984',
'Em uma Londres governada por Oceania, Winston Smith trabalha no Ministério da Verdade reescrevendo a história para que ela sempre corresponda à versão oficial do Partido. Vigiado dia e noite pelas telas do Grande Irmão, ele começa a questionar em segredo o regime que domina cada aspecto de sua vida.
 
Ao se envolver com Julia e buscar pequenos espaços de liberdade e verdade, Winston arrisca tudo em um mundo onde até os pensamentos podem ser crime. Sua rebelião silenciosa o leva a um confronto direto com o Partido e com os limites do que a mente humana pode suportar.',
'2009-07-21', '416', 1),
 
(9788582850350, 'Dom Casmurro',
'Já velho, Bento Santiago, o Bentinho, relembra a infância na Rua de Matacavalos e o amor que nutria pela vizinha Capitu, apesar da promessa feita por sua mãe de que ele se tornaria padre. Aos poucos, os dois driblam os obstáculos e conseguem se casar.
 
Anos depois, porém, a morte do amigo Escobar desperta em Bentinho um ciúme corrosivo. Ele passa a suspeitar de uma traição entre Capitu e o amigo, e o leitor é conduzido por uma narrativa ambígua, onde nunca fica claro se a culpa de Capitu é real ou fruto da mente atormentada do narrador.',
'2016-07-26', '400', 21),
 
(9788522031450, 'O Pequeno Príncipe',
'Um piloto cai com seu avião no deserto do Saara e, enquanto tenta consertar o motor, encontra um menino vindo de um pequeno asteroide distante. O garoto pede, insistentemente, que o piloto lhe desenhe um carneiro.
 
Aos poucos, o pequeno príncipe conta sobre seu planeta, sua rosa e as viagens que fez por outros mundos habitados por adultos estranhos e solitários, revelando reflexões simples e profundas sobre amizade, amor e aquilo que realmente importa na vida.',
'2015-05-01', '96', 22),
 
(9788532503251, 'O Alquimista',
'Santiago, um jovem pastor andaluz, sonha repetidamente com um tesouro escondido perto das pirâmides do Egito. Decidido a descobrir o que o sonho significa, ele vende suas ovelhas e parte em uma longa jornada pelo deserto.
 
Pelo caminho, encontra um rei, uma cigana, um inglês estudioso e, por fim, um alquimista, que o ajudam a decifrar os sinais do universo. Juntos, eles conduzem Santiago a compreender o verdadeiro significado de sua Lenda Pessoal.',
'2003-01-01', '222', 2),
 
(9788501012074, 'Cem Anos de Solidão',
'O romance narra a história da família Buendía ao longo de sete gerações na fictícia Macondo, vilarejo fundado por José Arcadio Buendía após uma longa jornada em busca de novas terras.
 
Guerras civis, amores proibidos, invenções fantásticas e uma solidão que parece perseguir a linhagem inteira se entrelaçam na saga, que mistura realidade e fantasia até o cumprimento de uma profecia escrita décadas antes pelo cigano Melquíades.',
'1977-04-01', '448', 5),
 
(9788571646858, 'A Metamorfose',
'Certa manhã, o caixeiro-viajante Gregor Samsa acorda em sua cama transformado em um inseto monstruoso, sem qualquer explicação para o que lhe aconteceu. Incapaz de sair para o trabalho, ele precisa lidar com as consequências imediatas dessa mudança.
 
Preso ao próprio quarto, Gregor passa a enfrentar o horror, a vergonha e, aos poucos, a rejeição da própria família, numa narrativa que expõe a alienação do indivíduo diante do trabalho e dos laços familiares.',
'1997-08-07', '96', 1),
 
(9788535909555, 'A Revolução dos Bichos',
'Cansados da exploração promovida pelo fazendeiro Jones, os animais de uma granja inglesa se rebelam e tomam conta da propriedade, expulsando os humanos e estabelecendo novas regras de convivência baseadas na igualdade entre todos.
 
Liderados pelos porcos, os animais aos poucos veem seus ideais igualitários se corromperem. O poder, cada vez mais concentrado nas mãos de poucos, acaba por reproduzir a mesma tirania que a revolução pretendia destruir.',
'2007-01-10', '152', 1),
 
(9788535933925, 'Sapiens: Uma Breve História da Humanidade',
'Harari percorre a trajetória da espécie humana desde o surgimento do Homo sapiens na África, passando pela Revolução Cognitiva, que deu origem à linguagem, aos mitos e à capacidade de cooperação em larga escala.
 
O livro segue pela Revolução Agrícola e pela unificação da humanidade por meio de impérios, religiões e do dinheiro, até chegar à Revolução Científica e aos dilemas éticos que a tecnologia impõe ao futuro da nossa espécie.',
'2020-11-13', '472', 1),

(9788599296578, 'O Guia do Mochileiro das Galáxias',
'Momentos antes de a Terra ser destruída para dar lugar a uma via expressa hiperespacial, o inglês Arthur Dent é resgatado por seu amigo Ford Prefect, que na verdade é um alienígena disfarçado, pesquisador do Guia do Mochileiro das Galáxias.
 
Juntos, eles embarcam em uma jornada caótica pelo espaço, cruzando com personagens excêntricos e situações absurdas, sempre acompanhados do famoso guia interestelar e da enigmática resposta 42 para o sentido da vida, do universo e de tudo mais.',
'2007-04-02', '208', 10),

(9788532511010, 'Harry Potter e a Pedra Filosofal',
'Órfão criado pelos tios que o desprezam, Harry Potter descobre em seu 11º aniversário que é um bruxo e recebe uma carta de aceitação em Hogwarts, a Escola de Magia e Bruxaria.
 
Na escola, ele faz amigos como Rony e Hermione, aprende feitiços e o esporte das vassouras voadoras, e se vê envolvido em um mistério que gira em torno da lendária Pedra Filosofal e do possível retorno do bruxo das trevas que matou seus pais.',
'2000-04-07', '264', 2),

(9788563560155, 'Orgulho e Preconceito',
'Elizabeth Bennet, a segunda de cinco irmãs de uma família da pequena nobreza inglesa, se choca com a arrogância do rico Fitzwilliam Darcy logo no primeiro encontro entre os dois.
 
Ao longo de uma sucessão de mal-entendidos, cartas reveladoras e reviravoltas sociais, os dois precisam superar o orgulho e os preconceitos que os separam para reconhecer o que realmente sentem um pelo outro.',
'2011-06-21', '576', 21),
 
(9788525056009, 'Admirável Mundo Novo',
'Em uma sociedade futurista organizada por castas geneticamente programadas, os seres humanos são condicionados desde o nascimento a aceitar seu papel e a buscar prazer imediato acima de qualquer outra coisa.
 
Quando Bernard Marx e o "selvagem" John, criado fora desse sistema, questionam os valores dessa civilização perfeita, eles expõem o preço pago pela estabilidade e pela felicidade artificial impostas a todos.',
'2014-02-14', '312', 6),
 
(9788579800245, 'Jogos Vorazes',
'Na nação de Panem, dividida em doze distritos controlados pela Capital, dois jovens de cada distrito são sorteados anualmente para participar dos Jogos Vorazes, um combate mortal transmitido pela televisão.
 
Ao se voluntariar no lugar da irmã mais nova, Katniss Everdeen precisa usar toda sua habilidade com o arco e sua astúcia para sobreviver à arena e, ao mesmo tempo, desafiar secretamente o poder da Capital.',
'2012-02-15', '400', 2),
 
(9788595084759, 'O Senhor dos Anéis: A Sociedade do Anel',
'O hobbit Frodo Bolseiro herda de seu tio Bilbo um simples anel que se revela ser o Um Anel, capaz de dar a Sauron, o Senhor do Escuro, poder para dominar toda a Terra-média.
 
Para impedir essa ameaça, Frodo parte do Condado ao lado de uma sociedade formada por hobbits, elfos, anões e homens, com a missão de levar o anel até as Montanhas da Perdição e destruí-lo para sempre.',
'2019-11-25', '576', 11),
 
(9788582850015, 'Memórias Póstumas de Brás Cubas',
'Já morto, Brás Cubas decide narrar sua própria biografia, dedicando o livro ao verme que roeu as frias carnes de seu cadáver, e revisita com ironia os fracassos amorosos e políticos de sua vida.
 
Por meio de capítulos curtos e de uma narrativa fragmentada e cheia de digressões, o defunto autor expõe, com humor ácido, a futilidade e a hipocrisia da elite brasileira do século XIX.',
'2014-09-16', '368', 21),
 
(9788520918852, 'Grande Sertão: Veredas',
'O ex-jagunço Riobaldo relembra, em um longo monólogo, sua trajetória pelos sertões de Minas Gerais, as batalhas que travou e o intenso e conturbado vínculo que manteve com o companheiro Diadorim.
 
Escrito em uma linguagem inventiva que mistura o falar sertanejo com um vocabulário erudito, o romance mergulha nos dilemas do bem e do mal enquanto acompanha a saga dos jagunços pelo Brasil profundo.',
'2012-10-01', '608', 20),
 
(9788532508126, 'A Hora da Estrela',
'O narrador Rodrigo S.M. conta a história de Macabéa, uma jovem nordestina pobre, datilógrafa desajeitada e quase invisível, que vive sozinha na cidade grande sem nunca ter tido a chance de sonhar com algo melhor.
 
Por meio de uma prosa que mistura compaixão e ironia, Clarice Lispector transforma a vida simples e apagada de Macabéa em uma reflexão sobre a miséria, a linguagem e o próprio ato de escrever.',
'1998-08-04', '88', 2),
 
(9788598078397, 'Percy Jackson e o Ladrão de Raios',
'Aos doze anos, Percy Jackson descobre que é filho de Poseidon, o deus grego dos mares, e que seu mau desempenho na escola sempre teve uma explicação que ninguém lhe havia contado.
 
Acusado de roubar o raio mestre de Zeus, Percy parte em uma jornada ao lado de amigos semideuses para encontrar o verdadeiro culpado antes que uma guerra entre os deuses do Olimpo se torne inevitável.',
'2008-11-21', '400', 3),
 
(9788582851425, 'O Morro dos Ventos Uivantes',
'Criados juntos na isolada propriedade de Wuthering Heights, Catherine Earnshaw e o enjeitado Heathcliff desenvolvem uma ligação intensa que é interrompida quando ela decide se casar por posição social.
 
Movido pelo rancor da rejeição, Heathcliff passa a perseguir uma vingança que se estende por duas gerações, arrastando todos ao seu redor para dentro de um ciclo de ressentimento e paixão destrutiva.',
'2021-07-19', '464', 21),
 
(9788598078175, 'A Menina que Roubava Livros',
'Narrada pela Morte, a história acompanha Liesel Meminger, uma menina alemã que, durante a Segunda Guerra Mundial, encontra consolo furtando livros e aprendendo a ler com a ajuda do pai adotivo.
 
Enquanto a família esconde um refugiado judeu no porão de casa, Liesel descobre no poder das palavras uma forma de resistência em meio ao horror e à destruição que tomam conta de sua cidade.',
'2007-01-01', '480', 3),

(9788580573299, 'Como Eu Era Antes de Você',
'Louisa Clark, uma jovem de vinte e seis anos sem grandes ambições, é contratada para cuidar de Will Traynor, um ex-executivo bem-sucedido que ficou tetraplégico após um acidente e perdeu a vontade de viver.
 
Ao longo dos meses de convivência, os dois desenvolvem um vínculo intenso que faz Lou repensar sua própria vida, enquanto ela tenta convencer Will de que ainda vale a pena continuar.',
'2013-01-01', '320', 3),
 
(9788535911121, 'O Menino do Pijama Listrado',
'Bruno, um menino alemão de nove anos, se muda com a família para uma região isolada por causa do novo trabalho do pai e passa a observar, intrigado, um grupo de pessoas de pijama listrado do outro lado de uma cerca.
 
Ao fazer amizade com Shmuel, um garoto judeu preso do outro lado da cerca, Bruno vai descobrindo, sem entender completamente, o horror do Holocausto que envolve sua própria família.',
'2007-10-11', '192', 1),
 
(9788594540188, 'Frankenstein',
'Obcecado por desvendar os segredos da vida, o jovem cientista Victor Frankenstein consegue dar vida a uma criatura montada a partir de partes de cadáveres, mas se horroriza com o resultado e a abandona.
 
Rejeitada por seu criador e por toda a sociedade, a criatura passa a buscar vingança contra Victor, desencadeando uma perseguição trágica que questiona os limites da ciência e da responsabilidade humana.',
'2017-02-06', '304', 15),
 
(9788563560438, 'O Retrato de Dorian Gray',
'Encantado com a própria beleza após ver seu retrato recém-pintado, o jovem Dorian Gray deseja permanecer eternamente jovem, mesmo que isso custe sua alma, enquanto o quadro envelhece e registra seus pecados em seu lugar.
 
Livre das marcas físicas de seus atos, Dorian mergulha em uma vida de excessos e crueldade, enquanto o retrato escondido revela, cada vez mais monstruoso, a verdadeira face de sua corrupção moral.',
'2012-04-12', '264', 21),
 
(9788539004119, 'O Poder do Hábito',
'O jornalista Charles Duhigg investiga a ciência por trás da formação dos hábitos, explicando como eles funcionam no cérebro e por que exercem tanto controle sobre nosso comportamento no dia a dia.
 
Por meio de exemplos de indivíduos, empresas e sociedades, o livro mostra como é possível identificar o ciclo de deixa, rotina e recompensa que sustenta um hábito para transformá-lo de forma deliberada.',
'2012-09-24', '408', 7),
 
(9788580573015, 'Extraordinário',
'August Pullman, um menino de dez anos nascido com uma rara condição genética que causa deformidades faciais, frequenta a escola regular pela primeira vez após anos sendo educado em casa.
 
Contada sob diferentes pontos de vista, a história acompanha como Auggie enfrenta o julgamento e a curiosidade dos colegas enquanto conquista, aos poucos, a aceitação e a amizade de quem o rodeia.',
'2013-01-31', '320', 3),
 
(9788582850985, 'Mulherzinhas',
'Durante a Guerra Civil americana, as quatro irmãs March, Meg, Jo, Beth e Amy, enfrentam as dificuldades financeiras da família e a ausência do pai, servindo no front, apoiadas pela força e pelo exemplo da mãe.
 
Ao longo dos anos, cada uma das irmãs precisa lidar com seus próprios sonhos, perdas e amadurecimento, em uma história que celebra a união familiar e a busca pela independência feminina.',
'2020-01-09', '592', 21),
 
(9788566636239, 'Drácula',
'O jovem advogado Jonathan Harker viaja até a Transilvânia para fechar um negócio imobiliário com o misterioso Conde Drácula e logo descobre que está sendo mantido prisioneiro no castelo do nobre vampiro.
 
De volta à Inglaterra, Drácula espalha o terror pela Londres vitoriana, obrigando um pequeno grupo liderado pelo professor Van Helsing a se unir para caçá-lo antes que ele transforme suas vítimas em criaturas da noite.',
'2018-10-24', '580', 15),
 
(9788578270889, 'O Leão, a Feiticeira e o Guarda-Roupa',
'Os quatro irmãos Pevensie são enviados para o interior da Inglaterra durante a guerra e, ao explorarem a casa onde estão hospedados, descobrem que um velho guarda-roupa é a passagem para o mundo mágico de Nárnia.
 
Lá, eles se veem no meio de uma batalha entre o bem e o mal, ao lado do grande leão Aslam, contra o domínio gelado e cruel da Feiticeira Branca, que mantém Nárnia presa em um inverno eterno.',
'2009-09-22', '184', 16),

(9788535911695, 'Capitães da Areia',
'Em Salvador, um grupo de meninos abandonados vive em um velho trapiche à beira do cais e sobrevive de pequenos furtos pelas ruas da cidade. Liderados por Pedro Bala, eles são conhecidos e temidos como os Capitães da Areia.

Entre a perseguição da polícia, a fome e a falta de afeto, cada garoto carrega seus próprios sonhos e feridas. Jorge Amado acompanha o bando com olhar humano, mostrando a infância roubada e a solidariedade que nasce entre eles.',
'2008-01-01', '296', 1),

(9788535930313, 'Ensaio sobre a Cegueira',
'Um motorista parado no sinal fica cego de repente, tomado por uma estranha brancura leitosa. Em pouco tempo a cegueira se espalha como uma epidemia, e os primeiros infectados são trancados em um manicômio abandonado, sob vigilância armada.

Isolados e sem regras, os internos veem a ordem social desmoronar em violência e degradação. Apenas uma mulher, que misteriosamente continua enxergando, guia um pequeno grupo em meio ao caos e testemunha até onde o ser humano pode chegar.',
'2020-01-01', '312', 1),

(9788535928198, 'Homo Deus: Uma Breve História do Amanhã',
'Depois de investigar o passado da espécie em Sapiens, Harari volta o olhar para o futuro. Com a fome, as pestes e as guerras cada vez mais controladas, ele pergunta quais serão os próximos grandes projetos da humanidade.

O livro discute a busca pela imortalidade, pela felicidade e por poderes quase divinos, e examina como a inteligência artificial e a biotecnologia podem transformar o trabalho, a política e a própria ideia do que significa ser humano.',
'2016-11-11', '448', 1),

(9788535930917, '21 Lições para o Século 21',
'Neste livro, Harari se concentra no presente e nas questões mais urgentes do nosso tempo, como o avanço da tecnologia, a crise da democracia liberal, o terrorismo, as notícias falsas e as mudanças climáticas.

Dividido em vinte e um capítulos temáticos, o autor convida o leitor a pensar com clareza em um mundo inundado de informações irrelevantes, discutindo trabalho, educação, religião, imigração e o sentido da vida.',
'2018-01-01', '432', 1),

(9788535929225, 'Anna Kariênina',
'Casada com um alto funcionário do governo russo, Anna Kariênina leva uma vida respeitável em São Petersburgo até conhecer o conde Vrónski, um jovem oficial por quem se apaixona perdidamente. Ao assumir esse amor, ela desafia as convenções da aristocracia.

Em paralelo, o romance acompanha Liévin, um proprietário rural que busca sentido na vida do campo, na fé e no casamento. Tolstói entrelaça as duas histórias em um amplo retrato da sociedade russa do século XIX.',
'2017-01-01', '808', 1),

(9788535928839, 'A Insustentável Leveza do Ser',
'Em Praga, às vésperas da invasão soviética de 1968, o cirurgião Tomas divide sua vida entre o amor por Tereza e as muitas amantes de que não consegue abrir mão, entre elas a pintora Sabina.

Com a ocupação do país, os destinos dos personagens se dispersam entre o exílio e a volta para casa. Kundera mistura romance e reflexão filosófica para discutir o peso e a leveza das escolhas, o amor, a traição e a liberdade.',
'2017-01-01', '344', 1),

(9788539003839, 'Rápido e Devagar: Duas Formas de Pensar',
'O psicólogo Daniel Kahneman, vencedor do Nobel de Economia, apresenta os dois sistemas que comandam o nosso pensamento: um rápido, intuitivo e emocional, e outro lento, deliberado e lógico.

Com base em décadas de pesquisa, ele mostra como atalhos mentais e vieses influenciam nossos julgamentos sem que percebamos, e como entender esses mecanismos ajuda a tomar decisões melhores na vida pessoal e profissional.',
'2012-01-01', '608', 7),

(9788547000240, 'Mindset: A Nova Psicologia do Sucesso',
'A psicóloga Carol Dweck, professora de Stanford, defende que o sucesso depende menos do talento e mais da forma como encaramos nossas próprias capacidades. Ela distingue dois tipos de mentalidade: a fixa e a de crescimento.

Com exemplos da escola, do esporte, dos negócios e dos relacionamentos, a autora mostra como quem acredita que pode se desenvolver lida melhor com desafios e fracassos, e como é possível cultivar essa atitude.',
'2017-01-18', '312', 7),

(9788573020809, 'Inteligência Emocional',
'Daniel Goleman questiona a ideia de que o QI é o principal fator de sucesso de uma pessoa. Apoiado em pesquisas sobre o cérebro e o comportamento, ele apresenta a inteligência emocional como um conjunto de habilidades igualmente decisivo.

O livro explica como autoconhecimento, autocontrole, motivação, empatia e sociabilidade influenciam a saúde, o trabalho e as relações, e defende que essas competências podem ser aprendidas e fortalecidas ao longo da vida.',
'1996-05-02', '384', 7),

(9788563560292, 'O Grande Gatsby',
'No verão de 1922, Nick Carraway se muda para Long Island e passa a ser vizinho de Jay Gatsby, um milionário misterioso conhecido pelas festas extravagantes que oferece em sua mansão.

Aos poucos, Nick descobre que todo aquele luxo tem um único objetivo: reconquistar Daisy Buchanan, um amor do passado agora casada com outro homem. A obsessão de Gatsby expõe o vazio e as ilusões por trás do sonho americano.',
'2011-09-30', '256', 21),

(9788563560032, 'O Príncipe',
'Escrito em 1513 e dedicado a Lourenço de Médici, o tratado de Maquiavel analisa como os governantes conquistam, mantêm e perdem o poder, a partir da observação da política italiana de seu tempo e de exemplos da Antiguidade.

Ao separar a política da moral tradicional, o autor discute virtude, fortuna, crueldade e clemência com um realismo que escandalizou gerações e fez da obra um dos textos fundadores do pensamento político moderno.',
'2010-07-22', '176', 21),

(9788582851890, 'Vidas Secas',
'Fugindo da seca no sertão nordestino, o vaqueiro Fabiano, sua mulher Sinha Vitória, os dois filhos e a cachorra Baleia caminham em busca de um lugar onde possam sobreviver.

Em capítulos curtos e de linguagem enxuta, Graciliano Ramos retrata a miséria, a exploração e a dificuldade de comunicação de uma família que mal consegue colocar em palavras o próprio sofrimento.',
'2024-01-01', '128', 21),

(9788563560278, 'Odisseia',
'Terminada a Guerra de Troia, o herói Ulisses tenta voltar para sua ilha de Ítaca, mas enfrenta dez anos de viagem marcados por tempestades, monstros, feiticeiras e a ira dos deuses.

Enquanto isso, sua esposa Penélope resiste aos pretendentes que ocupam o palácio, e seu filho Telêmaco parte em busca de notícias do pai. O poema de Homero é uma das narrativas fundadoras da literatura ocidental.',
'2011-01-01', '576', 21),

(9788582851395, 'Jane Eyre',
'Órfã criada por uma tia que a despreza, Jane Eyre passa a infância em um internato rígido antes de conseguir trabalho como preceptora na mansão de Thornfield Hall.

Lá ela se apaixona pelo patrão, o enigmático sr. Rochester, mas a casa guarda um segredo capaz de destruir a felicidade dos dois. Narrado pela própria Jane, o romance acompanha sua luta por independência e dignidade.',
'2021-01-01', '712', 21),

(9788582850480, 'Os Miseráveis',
'Depois de cumprir dezenove anos de trabalhos forçados por ter roubado um pão, Jean Valjean sai da prisão marcado pela condenação. Um gesto de bondade de um bispo o leva a reconstruir a vida sob outro nome.

Perseguido sem trégua pelo inspetor Javert, ele cria a pequena Cosette em meio às convulsões da França do século XIX. Victor Hugo constrói um vasto painel sobre justiça, pobreza e redenção.',
'2017-01-01', '1912', 21),

(9788563560179, 'Triste Fim de Policarpo Quaresma',
'O major Policarpo Quaresma, funcionário público do Rio de Janeiro no início da República, é um patriota exaltado que estuda tudo sobre o Brasil e chega a propor que o tupi seja adotado como língua oficial.

Ridicularizado por suas ideias, ele tenta transformar o país pela agricultura e depois pela política, mas esbarra na burocracia, na corrupção e no autoritarismo. Lima Barreto faz uma sátira amarga do nacionalismo ingênuo.',
'2011-01-01', '368', 21),

(9788532511669, 'Harry Potter e a Câmara Secreta',
'Depois de férias difíceis na casa dos tios, Harry volta para o segundo ano em Hogwarts, apesar dos avisos do elfo doméstico Dobby de que algo terrível está para acontecer na escola.

Quando alunos começam a aparecer petrificados e mensagens escritas nas paredes anunciam a reabertura da Câmara Secreta, Harry, Rony e Hermione precisam descobrir quem é o herdeiro de Sonserina e que criatura se esconde no castelo.',
'2000-01-01', '288', 2),

(9788532512062, 'Harry Potter e o Prisioneiro de Azkaban',
'No terceiro ano em Hogwarts, Harry descobre que Sirius Black, um perigoso prisioneiro, fugiu da fortaleza de Azkaban e estaria atrás dele. Para proteger a escola, os assustadores dementadores passam a guardar seus portões.

Com a ajuda do professor Lupin, Harry aprende a enfrentar seus medos e, ao lado de Rony e Hermione, acaba descobrindo a verdade sobre o passado de seus pais e sobre o homem que todos acreditam ser um traidor.',
'2000-01-01', '348', 2),

(9788532512529, 'Harry Potter e o Cálice de Fogo',
'Hogwarts recebe o Torneio Tribruxo, uma competição entre três escolas de magia reservada a alunos mais velhos. Misteriosamente, o Cálice de Fogo escolhe Harry como um quarto campeão, mesmo sem ele ter se inscrito.

Obrigado a enfrentar dragões, criaturas aquáticas e um labirinto cheio de armadilhas, Harry percebe que alguém o colocou ali de propósito, em um plano que culmina no retorno de seu maior inimigo.',
'2001-01-01', '584', 2),

(9788532520661, 'O Conto da Aia',
'Na República de Gilead, regime teocrático que tomou o lugar dos Estados Unidos, as mulheres perderam todos os direitos. Offred é uma aia, obrigada a gerar filhos para um comandante e sua esposa.

Vigiada o tempo todo, ela relembra a vida que tinha antes, com o marido e a filha, e procura pequenas brechas de resistência em um sistema que controla corpos, palavras e pensamentos.',
'2017-01-01', '368', 2),

(9788579800863, 'A Esperança',
'Depois de sobreviver duas vezes à arena, Katniss Everdeen é levada ao Distrito 13, que todos acreditavam destruído, e aceita se tornar o Tordo, símbolo da rebelião contra a Capital.

Enquanto a guerra se espalha por Panem e Peeta permanece prisioneiro do presidente Snow, Katniss descobre que os líderes rebeldes também têm seus próprios interesses e precisa decidir em quem pode confiar.',
'2012-01-01', '424', 2),

(9788580572261, 'A Culpa é das Estrelas',
'Hazel Grace tem dezesseis anos e convive com um câncer que a obriga a carregar um cilindro de oxigênio para onde vai. Em um grupo de apoio, ela conhece Augustus Waters, um ex-jogador de basquete em remissão.

Unidos pelo humor e por um livro que ambos adoram, os dois vivem uma história de amor intensa, que os leva até Amsterdã em busca do autor da obra e os faz refletir sobre a vida, a perda e o que deixamos para trás.',
'2014-01-01', '288', 3),

(9788580573749, 'Cidades de Papel',
'Quentin Jacobsen sempre foi apaixonado por sua vizinha, a imprevisível Margo Roth Spiegelman. Certa noite, ela entra pela janela do quarto dele e o convoca para uma madrugada de vinganças pela cidade.

No dia seguinte, Margo desaparece, deixando apenas pistas espalhadas. Ao segui-las com os amigos, Quentin percebe que a garota que ele procurava talvez fosse bem diferente da que imaginava conhecer.',
'2013-01-01', '368', 3),

(9788580572902, 'Garota Exemplar',
'Na manhã de seu quinto aniversário de casamento, Amy Dunne desaparece de casa, deixando sinais de luta na sala. Todas as suspeitas recaem sobre o marido, Nick, cujo comportamento estranho só piora a situação.

Alternando a versão de Nick com os diários de Amy, o suspense revela aos poucos as mentiras e os ressentimentos de um casamento que parecia perfeito, até uma reviravolta que muda tudo o que o leitor acreditava saber.',
'2013-01-01', '448', 3),

(9788595084742, 'O Hobbit',
'Bilbo Bolseiro é um hobbit que leva uma vida tranquila até receber a visita do mago Gandalf e de treze anões, que o arrastam para uma expedição rumo à Montanha Solitária, onde o dragão Smaug guarda um imenso tesouro.

Pelo caminho, Bilbo enfrenta trolls, orques e aranhas gigantes, e encontra um misterioso anel nas cavernas onde vive a criatura Gollum, descobrindo em si uma coragem que nem imaginava ter.',
'2019-01-01', '336', 11),

(9788595084766, 'O Senhor dos Anéis: As Duas Torres',
'Com a Sociedade do Anel desfeita, Frodo e Sam seguem sozinhos em direção a Mordor, guiados pela traiçoeira criatura Gollum, que já possuiu o anel e deseja recuperá-lo.

Enquanto isso, Aragorn, Legolas e Gimli partem em busca dos hobbits capturados e acabam envolvidos na defesa do reino de Rohan contra os exércitos do mago Saruman.',
'2019-01-01', '464', 11),

(9788595084773, 'O Senhor dos Anéis: O Retorno do Rei',
'As forças de Sauron marcham sobre Gondor, e os povos livres da Terra-média se reúnem para a batalha decisiva diante dos muros de Minas Tirith, enquanto Aragorn assume seu destino como herdeiro do trono.

Longe dali, exaustos e quase sem esperança, Frodo e Sam atravessam as terras de Mordor para tentar destruir o Um Anel nas chamas da Montanha da Perdição.',
'2019-01-01', '528', 11),

(9788595084377, 'O Silmarillion',
'Reunindo as lendas mais antigas do universo de Tolkien, o livro narra a criação do mundo pela música dos Ainur e os acontecimentos das primeiras eras, muito antes das aventuras de Bilbo e Frodo.

No centro da história estão as Silmarils, três joias forjadas pelo elfo Fëanor e roubadas por Morgoth, o primeiro Senhor do Escuro, o que desencadeia guerras, juramentos trágicos e a queda de reinos inteiros.',
'2019-01-01', '496', 11),

(9788525052247, 'Fahrenheit 451',
'Em um futuro em que os livros são proibidos, os bombeiros não apagam incêndios: sua função é queimar qualquer obra encontrada. Guy Montag é um deles e cumpre o trabalho sem questionar.

Depois de conhecer a jovem Clarisse e presenciar uma mulher que prefere morrer com sua biblioteca, Montag passa a esconder livros em casa e a duvidar de uma sociedade anestesiada por telas e entretenimento vazio.',
'2012-01-01', '216', 6),

(9788501044457, 'O Diário de Anne Frank',
'Em 1942, a adolescente judia Anne Frank e sua família se escondem em um anexo secreto nos fundos de um prédio em Amsterdã para escapar da perseguição nazista. Ali, ela registra em seu diário o dia a dia do confinamento.

Durante mais de dois anos, Anne escreve sobre o medo, as brigas, os sonhos e as descobertas da juventude, deixando um dos testemunhos mais comoventes da Segunda Guerra Mundial.',
'2019-01-01', '352', 5),

(9788599296493, 'O Nome do Vento',
'Em uma pousada de beira de estrada, o discreto taberneiro Kote é reconhecido por um cronista como Kvothe, uma figura lendária de quem se contam as histórias mais incríveis. Ele aceita, então, narrar sua verdadeira trajetória.

Da infância em uma trupe de artistas itinerantes aos anos de miséria nas ruas e à entrada na Universidade, Kvothe relembra como se tornou músico, arcanista e o homem que todos acreditam conhecer.',
'2009-01-01', '656', 10),

(9788535918502, 'Hibisco Roxo',
'Kambili tem quinze anos e vive em uma casa rica na Nigéria, sob as regras rígidas do pai, Eugene, um empresário respeitado e católico fervoroso que pune a família com violência a cada pequeno desvio.
 
Quando ela e o irmão Jaja passam uma temporada na casa da tia Ifeoma, em Nsukka, descobrem um lar mais pobre, porém cheio de risos, discussões e liberdade, e começam a questionar o silêncio em que foram criados.',
'2011-01-01', '328', 1),
 
(9788535924732, 'Americanah',
'Ifemelu e Obinze se apaixonam ainda adolescentes em Lagos, mas a Nigéria dos anos 1990, sob ditadura militar, oferece pouco futuro. Ela parte para estudar nos Estados Unidos, onde pela primeira vez se descobre vista como negra.
 
Enquanto Ifemelu se torna uma blogueira conhecida por escrever sobre raça, Obinze tenta a vida como imigrante ilegal em Londres. Anos depois, os dois se reencontram em uma Nigéria transformada e precisam decidir o que resta daquele amor.',
'2014-01-01', '520', 1),
 
(9788535930047, 'Guerra e Paz',
'Entre 1805 e 1812, enquanto os exércitos de Napoleão avançam sobre a Rússia, o romance acompanha a vida de cinco famílias aristocráticas, entre bailes, intrigas, casamentos e campos de batalha.
 
No centro da narrativa estão o desajeitado Pierre Bezúkhov, o orgulhoso príncipe Andrei Bolkónski e a jovem Natacha Rostova, cujos destinos se cruzam em uma obra monumental sobre a história, o acaso e o sentido da vida.',
'2017-01-01', '1544', 1),
 
(9788535925470, 'Sejamos Todos Feministas',
'Adaptado de uma palestra que Chimamanda Ngozi Adichie fez em 2012, o ensaio parte de histórias da infância e da vida adulta da autora na Nigéria para mostrar como a desigualdade entre homens e mulheres está presente no cotidiano.
 
Com humor e clareza, ela discute o que significa ser feminista hoje e defende que a mudança começa na forma como criamos meninas e meninos, para que todos possam ser mais livres e mais fiéis a si mesmos.',
'2015-01-01', '64', 1),
 
(9788535911701, 'Dona Flor e Seus Dois Maridos',
'Em Salvador, a professora de culinária Flor fica viúva quando Vadinho, seu marido boêmio, jogador e mulherengo, morre de repente em pleno Carnaval. Apesar de tudo o que sofreu com ele, ela sente falta de sua paixão.
 
Flor se casa então com o farmacêutico Teodoro, homem metódico e respeitável. A vida segue tranquila até que o fantasma de Vadinho reaparece, visível apenas para ela, disposto a retomar seu lugar na cama do casal.',
'2008-01-01', '488', 1),
 
(9788535929881, 'Cosmos',
'Carl Sagan conduz o leitor por uma viagem que vai das origens do universo ao surgimento da vida na Terra, passando pelas estrelas, pelos planetas e pela possibilidade de existirem outras civilizações.
 
Escrito em linguagem acessível, o livro também conta a história das descobertas científicas e de seus personagens, mostrando como a curiosidade humana transformou nossa compreensão do lugar que ocupamos no espaço e no tempo.',
'2017-01-01', '488', 1),
 
(9788535911299, 'O Gene Egoísta',
'Richard Dawkins propõe olhar a evolução do ponto de vista dos genes: os seres vivos seriam máquinas de sobrevivência construídas para garantir que essas unidades de informação se copiem ao longo das gerações.
 
A partir dessa ideia, o autor explica comportamentos como o altruísmo, a cooperação e a competição entre os animais, e apresenta o conceito de meme para descrever a forma como as ideias se espalham na cultura humana.',
'2007-01-01', '544', 1),
 
(9788535933390, 'O Avesso da Pele',
'Depois que seu pai, Henrique, um professor de escola pública, é morto em uma abordagem policial desastrosa em Porto Alegre, Pedro decide reconstruir a história dele a partir de objetos, lembranças e relatos.
 
Ao refazer os passos do pai, o jovem revisita os relacionamentos da família e as marcas deixadas pelo racismo, em um romance sobre identidade, afeto e as feridas de um país que ainda não acertou as contas com o passado.',
'2020-01-01', '192', 1),
 
(9788582850145, 'Hamlet',
'O príncipe Hamlet volta à Dinamarca para o funeral do pai e encontra a mãe já casada com seu tio Cláudio, o novo rei. Certa noite, o fantasma do pai lhe revela que foi assassinado pelo irmão e exige vingança.
 
Dividido entre a dúvida e o dever, Hamlet se finge de louco para investigar a verdade, e sua hesitação desencadeia uma sequência de mortes que atinge todos ao seu redor na mais célebre tragédia de Shakespeare.',
'2015-01-01', '320', 21),
 
(9788563560490, 'Razão e Sensibilidade',
'Com a morte do pai, as irmãs Elinor e Marianne Dashwood perdem a casa e a fortuna da família e precisam se mudar com a mãe para um chalé modesto no interior da Inglaterra.
 
Elinor, sensata e contida, esconde o que sente por Edward Ferrars, enquanto a impulsiva Marianne se entrega sem reservas à paixão pelo sedutor Willoughby. As desilusões de ambas mostram os riscos de viver só pela razão ou só pelo sentimento.',
'2012-01-01', '512', 21),
 
(9788563560551, 'Dom Quixote',
'De tanto ler romances de cavalaria, um fidalgo da região da Mancha perde o juízo e decide se tornar cavaleiro andante. Com o nome de Dom Quixote, ele sai pelo mundo para defender os fracos e honrar sua amada Dulcineia.
 
Acompanhado do fiel e prático escudeiro Sancho Pança, ele confunde moinhos com gigantes e estalagens com castelos, em aventuras que misturam humor e melancolia e fundaram o romance moderno.',
'2012-01-01', '1328', 21),
 
(9788563560568, 'Ilíada',
'No décimo ano da Guerra de Troia, o herói Aquiles se desentende com o rei Agamêmnon e, ferido em sua honra, se recusa a continuar lutando ao lado dos gregos.
 
Sem seu maior guerreiro, o exército grego sofre derrotas sucessivas diante dos troianos liderados por Heitor. A morte de Pátroclo, amigo de Aquiles, faz o herói voltar ao combate movido por uma fúria que decide o rumo da guerra.',
'2013-01-01', '720', 21),
 
(9788582850404, 'Romeu e Julieta',
'Em Verona, duas famílias poderosas, os Montéquio e os Capuleto, vivem em guerra há gerações. Em um baile de máscaras, o jovem Romeu Montéquio conhece Julieta Capuleto, e os dois se apaixonam à primeira vista.
 
Casados em segredo com a ajuda de frei Lourenço, eles tentam escapar do ódio que divide suas casas, mas uma sucessão de duelos, desencontros e mensagens perdidas conduz a história a um desfecho trágico.',
'2016-01-01', '248', 21),
 
(9788563560476, 'Grandes Esperanças',
'Órfão criado pela irmã e pelo cunhado ferreiro, o menino Pip ajuda um fugitivo da prisão e, pouco depois, passa a frequentar a casa da excêntrica srta. Havisham, onde se apaixona pela fria e bela Estella.
 
Anos mais tarde, um benfeitor anônimo lhe oferece uma fortuna e a chance de se tornar um cavalheiro em Londres. Ao descobrir de onde vem o dinheiro, Pip é obrigado a rever tudo o que pensava sobre riqueza, gratidão e caráter.',
'2012-01-01', '704', 21),
 
(9788563560513, 'A Desobediência Civil',
'Em 1846, Henry David Thoreau passou uma noite na cadeia por se recusar a pagar impostos a um governo que mantinha a escravidão e promovia a guerra contra o México. Dessa experiência nasceu este ensaio.
 
O autor defende que o indivíduo tem o dever de não colaborar com leis que considera injustas, mesmo que isso lhe custe a liberdade. O texto inspirou movimentos de resistência pacífica no mundo inteiro.',
'2012-01-01', '152', 21),
 
(9788563560315, 'Madame Bovary',
'Criada entre leituras românticas, Emma se casa com o médico Charles Bovary esperando uma vida de paixão e luxo, mas encontra apenas a rotina monótona de uma pequena cidade do interior da França.
 
Entediada e frustrada, ela busca nos amantes e nas compras a existência que imaginou, acumulando mentiras e dívidas que a levam à ruína. Flaubert retrata com precisão o choque entre o sonho e a realidade.',
'2011-01-01', '496', 21),
 
(9788547001087, 'Antifrágil',
'Nassim Nicholas Taleb apresenta o conceito de antifragilidade: a propriedade de certas coisas que não apenas resistem ao caos, à desordem e aos choques, mas se beneficiam deles e saem mais fortes.
 
Com exemplos da economia, da medicina, da política e da vida cotidiana, o autor defende que tentar eliminar toda a incerteza nos torna mais vulneráveis e propõe formas de tirar proveito do imprevisível.',
'2020-01-01', '616', 7),
 
(9788547001261, 'A Lógica do Cisne Negro',
'Taleb chama de Cisne Negro o evento altamente improvável, de enorme impacto, que só depois de acontecer parece explicável. Crises financeiras, grandes invenções e viradas históricas seriam exemplos desse fenômeno.
 
O livro mostra como a mente humana insiste em enxergar padrões e fazer previsões onde elas não são possíveis, e discute como lidar melhor com aquilo que não sabemos e não conseguimos antecipar.',
'2021-01-01', '528', 7),
 
(9788547000806, 'Nudge',
'O economista Richard Thaler e o jurista Cass Sunstein mostram que as pessoas nem sempre decidem de forma racional e que a maneira como as opções são apresentadas influencia fortemente as escolhas.
 
A partir dessa constatação, eles propõem o uso de pequenos empurrões, mudanças sutis no desenho das escolhas, para ajudar as pessoas a tomar decisões melhores sobre saúde, dinheiro e bem-estar, sem tirar sua liberdade.',
'2019-01-01', '408', 7),
 
(9788532516220, 'Harry Potter e a Ordem da Fênix',
'Depois de testemunhar o retorno de Voldemort, Harry volta a Hogwarts e descobre que o Ministério da Magia nega tudo e trata ele e Dumbledore como mentirosos. A escola passa a ser controlada pela cruel professora Dolores Umbridge.
 
Impedidos de aprender a se defender, Harry e os amigos formam em segredo a Armada de Dumbledore, enquanto sonhos perturbadores o conduzem a uma profecia guardada no Departamento de Mistérios.',
'2003-01-01', '704', 2),
 
(9788532519474, 'Harry Potter e o Enigma do Príncipe',
'Com o mundo bruxo em guerra aberta, Harry começa o sexto ano em Hogwarts e encontra um velho livro de Poções cheio de anotações de alguém que se chama de Príncipe Mestiço, cujas dicas o tornam o melhor aluno da turma.
 
Em aulas particulares com Dumbledore, ele mergulha nas memórias do passado de Voldemort e descobre o segredo que mantém o bruxo das trevas vivo, enquanto suspeita de que Draco Malfoy trama algo dentro do castelo.',
'2005-01-01', '512', 2),
 
(9788532522610, 'Harry Potter e as Relíquias da Morte',
'Harry, Rony e Hermione deixam Hogwarts para cumprir a missão deixada por Dumbledore: encontrar e destruir as Horcruxes que garantem a imortalidade de Voldemort, enquanto o Ministério cai nas mãos dos Comensais da Morte.
 
Fugindo e sem saber em quem confiar, os três descobrem a lenda das Relíquias da Morte e seguem até o confronto final, na batalha que decide o destino do mundo bruxo dentro dos muros de Hogwarts.',
'2007-01-01', '592', 2),
 
(9788551002735, 'Me Chame pelo Seu Nome',
'Elio tem dezessete anos e passa os verões na casa da família, no litoral da Itália. Todo ano seu pai, professor universitário, recebe um jovem pesquisador como hóspede, e desta vez chega o americano Oliver.
 
Ao longo de seis semanas, a curiosidade de Elio se transforma em fascínio e depois em uma paixão intensa e correspondida. O romance acompanha a descoberta do desejo e a marca que esse verão deixa na vida dos dois.',
'2018-01-01', '288', 3),
 
(9788580573152, 'O Teorema Katherine',
'Colin Singleton é um ex-menino prodígio com uma estranha particularidade: só namora garotas chamadas Katherine, e já levou um fora de dezenove delas. Depois do último, ele cai na estrada com o melhor amigo, Hassan.
 
Na pequena cidade de Gutshot, no Tennessee, Colin tenta criar um teorema matemático capaz de prever o futuro de qualquer relacionamento, e acaba descobrindo que nem tudo na vida cabe em uma fórmula.',
'2013-01-01', '304', 3),
 
(9788551002001, 'Tartarugas Até Lá Embaixo',
'Aza Holmes tem dezesseis anos e convive com um transtorno de ansiedade que a prende em espirais de pensamentos dos quais não consegue escapar. Quando um bilionário da cidade desaparece, sua melhor amiga, Daisy, a convence a investigar o caso.
 
A busca reaproxima Aza de Davis, filho do desaparecido e seu amigo de infância. Entre a amizade, o primeiro amor e a luta contra a própria mente, ela tenta descobrir quem realmente é.',
'2017-01-01', '272', 3),
 
(9788580578645, 'Depois de Você',
'Um ano e meio depois de perder Will Traynor, Louisa Clark trabalha em um bar de aeroporto em Londres e não consegue seguir em frente. Um acidente a obriga a voltar para a casa dos pais e a entrar em um grupo de apoio ao luto.
 
Enquanto se aproxima de Sam, o paramédico que a socorreu, Lou é surpreendida pela chegada de uma adolescente ligada ao passado de Will, que vira sua rotina de cabeça para baixo e a força a recomeçar.',
'2016-01-01', '320', 3),
 
(9788580576467, 'Uma Breve História do Tempo',
'Stephen Hawking explica, em linguagem acessível a leigos, as grandes questões da física moderna: como o universo começou, se ele terá um fim, o que é o tempo e o que acontece dentro de um buraco negro.
 
Do modelo de Aristóteles à relatividade de Einstein e à mecânica quântica, o livro percorre as teorias que moldaram nossa visão do cosmos e a busca por uma explicação única para todas as forças da natureza.',
'2015-01-01', '256', 3),
 
(9788580410327, 'O Temor do Sábio',
'No segundo dia de sua narrativa, Kvothe continua a contar sua história ao cronista. Ainda estudante na Universidade e perseguido pela rivalidade com um nobre poderoso, ele é obrigado a se afastar e partir para terras distantes.
 
A serviço de um governante em Vintas, ele caça bandidos na floresta, cruza com uma criatura lendária do mundo das fadas e treina com os guerreiros ademrianos, enquanto segue as pistas do grupo que matou sua família.',
'2011-01-01', '960', 10),
 
(9788599296585, 'O Restaurante no Fim do Universo',
'Depois de escapar da destruição da Terra, Arthur Dent, Ford Prefect, Zaphod Beeblebrox, Trillian e o deprimido robô Marvin continuam vagando pela galáxia a bordo da nave Coração de Ouro, e a fome aperta.
 
A solução é jantar no Milliways, o restaurante onde os clientes assistem ao fim do universo como espetáculo. Enquanto isso, Zaphod procura o homem que realmente governa tudo, e Arthur vai parar em um passado muito distante.',
'2009-01-01', '240', 10),
 
(9788599296592, 'A Vida, o Universo e Tudo Mais',
'Depois de anos perdido na Terra pré-histórica, Arthur Dent é resgatado por Ford Prefect com a ajuda de um sofá que surge do nada, e os dois vão parar no meio de uma partida de críquete na Inglaterra.
 
Lá eles descobrem que os habitantes do planeta Krikkit, incapazes de aceitar a existência do resto do universo, pretendem destruí-lo por completo, e cabe ao improvável grupo de viajantes impedir a catástrofe.',
'2009-01-01', '224', 10),
 
(9788599296608, 'Até Mais, e Obrigado pelos Peixes!',
'Depois de oito anos viajando pelo espaço, Arthur Dent volta para a Terra e a encontra intacta, como se nunca tivesse sido demolida. Todos se lembram apenas de uma estranha alucinação coletiva, e os golfinhos desapareceram.
 
Enquanto tenta entender o que aconteceu, Arthur se apaixona por Fenchurch, uma moça que também sente que algo está errado com o mundo, e os dois partem em busca da mensagem final de Deus para sua criação.',
'2009-01-01', '208', 10),
 
(9788599296615, 'Praticamente Inofensiva',
'No último volume da série, Arthur Dent finalmente encontra sossego em um planeta remoto, onde se torna um respeitado fazedor de sanduíches. A paz acaba quando aparece uma adolescente que ele não sabia que era sua filha.
 
Ao mesmo tempo, Ford Prefect descobre que a editora do Guia do Mochileiro foi comprada por uma corporação com planos sinistros, e uma nova versão do guia ameaça todas as realidades possíveis.',
'2009-01-01', '208', 10),
 
(9788501104656, 'A Garota no Trem',
'Todos os dias, Rachel pega o mesmo trem para Londres e, na parada em um sinal, observa pela janela um casal que parece viver a vida perfeita que ela perdeu depois do divórcio e do alcoolismo.
 
Certa manhã ela vê algo que a deixa abalada e, pouco depois, a mulher desaparece. Convencida de que pode ajudar, Rachel se envolve na investigação, mas suas lembranças falhas a tornam uma testemunha pouco confiável, até para si mesma.',
'2018-01-01', '378', 5);

INSERT INTO livro_genero (id_genero, id_livro) VALUES
(12, 9788535914849), -- 1984
(2, 9788535914849), -- 1984
(14, 9788535914849), -- 1984
(10, 9788582850350), -- Dom Casmurro
(14, 9788582850350), -- Dom Casmurro
(1, 9788582850350), -- Dom Casmurro
(11, 9788522031450), -- O Pequeno Príncipe
(14, 9788522031450), -- O Pequeno Príncipe
(10, 9788532503251), -- O Alquimista
(1, 9788532503251), -- O Alquimista
(1, 9788501012074), -- Cem Anos de Solidão
(14, 9788501012074), -- Cem Anos de Solidão
(14, 9788571646858), -- A Metamorfose
(12, 9788535909555), -- A Revolução dos Bichos
(14, 9788535909555), -- A Revolução dos Bichos
(9, 9788535933925), -- Sapiens: Uma Breve História da Humanidade
(2, 9788599296578), -- O Guia do Mochileiro das Galáxias
(3, 9788532511010), -- Harry Potter e a Pedra Filosofal
(11, 9788532511010), -- Harry Potter e a Pedra Filosofal
(1, 9788563560155), -- Orgulho e Preconceito
(14, 9788563560155), -- Orgulho e Preconceito
(12, 9788525056009), -- Admirável Mundo Novo
(2, 9788525056009), -- Admirável Mundo Novo
(14, 9788525056009), -- Admirável Mundo Novo
(12, 9788579800245), -- Jogos Vorazes
(2, 9788579800245), -- Jogos Vorazes
(11, 9788579800245), -- Jogos Vorazes
(3, 9788595084759), -- O Senhor dos Anéis: A Sociedade do Anel
(10, 9788582850015), -- Memórias Póstumas de Brás Cubas
(14, 9788582850015), -- Memórias Póstumas de Brás Cubas
(10, 9788520918852), -- Grande Sertão: Veredas
(14, 9788520918852), -- Grande Sertão: Veredas
(10, 9788532508126), -- A Hora da Estrela
(1, 9788532508126), -- A Hora da Estrela
(3, 9788598078397), -- Percy Jackson e o Ladrão de Raios
(11, 9788598078397), -- Percy Jackson e o Ladrão de Raios
(1, 9788582851425), -- O Morro dos Ventos Uivantes
(14, 9788582851425), -- O Morro dos Ventos Uivantes
(1, 9788598078175), -- A Menina que Roubava Livros
(1, 9788580573299), -- Como Eu Era Antes de Você
(1, 9788535911121), -- O Menino do Pijama Listrado
(11, 9788535911121), -- O Menino do Pijama Listrado
(4, 9788594540188), -- Frankenstein
(2, 9788594540188), -- Frankenstein
(14, 9788594540188), -- Frankenstein
(14, 9788563560438), -- O Retrato de Dorian Gray
(1, 9788563560438), -- O Retrato de Dorian Gray
(9, 9788539004119), -- O Poder do Hábito
(11, 9788580573015), -- Extraordinário
(1, 9788582850985), -- Mulherzinhas
(14, 9788582850985), -- Mulherzinhas
(11, 9788582850985), -- Mulherzinhas
(4, 9788566636239), -- Drácula
(14, 9788566636239), -- Drácula
(3, 9788578270889), -- O Leão, a Feiticeira e o Guarda-Roupa
(11, 9788578270889), -- O Leão, a Feiticeira e o Guarda-Roupa
(10, 9788535911695), -- Capitães da Areia
(1, 9788535911695), -- Capitães da Areia
(1, 9788535930313), -- Ensaio sobre a Cegueira
(12, 9788535930313), -- Ensaio sobre a Cegueira
(9, 9788535928198), -- Homo Deus: Uma Breve História do Amanhã
(9, 9788535930917), -- 21 Lições para o Século 21
(1, 9788535929225), -- Anna Kariênina
(14, 9788535929225), -- Anna Kariênina
(1, 9788535928839), -- A Insustentável Leveza do Ser
(9, 9788539003839), -- Rápido e Devagar: Duas Formas de Pensar
(9, 9788547000240), -- Mindset: A Nova Psicologia do Sucesso
(9, 9788573020809), -- Inteligência Emocional
(1, 9788563560292), -- O Grande Gatsby
(14, 9788563560292), -- O Grande Gatsby
(9, 9788563560032), -- O Príncipe
(14, 9788563560032), -- O Príncipe
(10, 9788582851890), -- Vidas Secas
(14, 9788582851890), -- Vidas Secas
(14, 9788563560278), -- Odisseia
(7, 9788563560278), -- Odisseia
(1, 9788582851395), -- Jane Eyre
(14, 9788582851395), -- Jane Eyre
(1, 9788582850480), -- Os Miseráveis
(14, 9788582850480), -- Os Miseráveis
(10, 9788563560179), -- Triste Fim de Policarpo Quaresma
(14, 9788563560179), -- Triste Fim de Policarpo Quaresma
(3, 9788532511669), -- Harry Potter e a Câmara Secreta
(11, 9788532511669), -- Harry Potter e a Câmara Secreta
(3, 9788532512062), -- Harry Potter e o Prisioneiro de Azkaban
(11, 9788532512062), -- Harry Potter e o Prisioneiro de Azkaban
(3, 9788532512529), -- Harry Potter e o Cálice de Fogo
(11, 9788532512529), -- Harry Potter e o Cálice de Fogo
(12, 9788532520661), -- O Conto da Aia
(2, 9788532520661), -- O Conto da Aia
(12, 9788579800863), -- A Esperança
(2, 9788579800863), -- A Esperança
(11, 9788579800863), -- A Esperança
(1, 9788580572261), -- A Culpa é das Estrelas
(11, 9788580572261), -- A Culpa é das Estrelas
(11, 9788580573749), -- Cidades de Papel
(6, 9788580573749), -- Cidades de Papel
(5, 9788580572902), -- Garota Exemplar
(6, 9788580572902), -- Garota Exemplar
(3, 9788595084742), -- O Hobbit
(11, 9788595084742), -- O Hobbit
(3, 9788595084766), -- O Senhor dos Anéis: As Duas Torres
(3, 9788595084773), -- O Senhor dos Anéis: O Retorno do Rei
(3, 9788595084377), -- O Silmarillion
(12, 9788525052247), -- Fahrenheit 451
(2, 9788525052247), -- Fahrenheit 451
(14, 9788525052247), -- Fahrenheit 451
(8, 9788501044457), -- O Diário de Anne Frank
(9, 9788501044457), -- O Diário de Anne Frank
(3, 9788599296493), -- O Nome do Vento
(1, 9788535918502), -- Hibisco Roxo
(1, 9788535924732), -- Americanah
(1, 9788535930047), -- Guerra e Paz
(14, 9788535930047), -- Guerra e Paz
(9, 9788535925470), -- Sejamos Todos Feministas
(10, 9788535911701), -- Dona Flor e Seus Dois Maridos
(1, 9788535911701), -- Dona Flor e Seus Dois Maridos
(9, 9788535929881), -- Cosmos
(9, 9788535911299), -- O Gene Egoísta
(10, 9788535933390), -- O Avesso da Pele
(1, 9788535933390), -- O Avesso da Pele
(14, 9788582850145), -- Hamlet
(1, 9788563560490), -- Razão e Sensibilidade
(14, 9788563560490), -- Razão e Sensibilidade
(14, 9788563560551), -- Dom Quixote
(1, 9788563560551), -- Dom Quixote
(14, 9788563560568), -- Ilíada
(7, 9788563560568), -- Ilíada
(14, 9788582850404), -- Romeu e Julieta
(1, 9788582850404), -- Romeu e Julieta
(1, 9788563560476), -- Grandes Esperanças
(14, 9788563560476), -- Grandes Esperanças
(9, 9788563560513), -- A Desobediência Civil
(14, 9788563560513), -- A Desobediência Civil
(1, 9788563560315), -- Madame Bovary
(14, 9788563560315), -- Madame Bovary
(9, 9788547001087), -- Antifrágil
(9, 9788547001261), -- A Lógica do Cisne Negro
(9, 9788547000806), -- Nudge
(3, 9788532516220), -- Harry Potter e a Ordem da Fênix
(11, 9788532516220), -- Harry Potter e a Ordem da Fênix
(3, 9788532519474), -- Harry Potter e o Enigma do Príncipe
(11, 9788532519474), -- Harry Potter e o Enigma do Príncipe
(3, 9788532522610), -- Harry Potter e as Relíquias da Morte
(11, 9788532522610), -- Harry Potter e as Relíquias da Morte
(1, 9788551002735), -- Me Chame pelo Seu Nome
(1, 9788580573152), -- O Teorema Katherine
(11, 9788580573152), -- O Teorema Katherine
(1, 9788551002001), -- Tartarugas Até Lá Embaixo
(11, 9788551002001), -- Tartarugas Até Lá Embaixo
(1, 9788580578645), -- Depois de Você
(9, 9788580576467), -- Uma Breve História do Tempo
(3, 9788580410327), -- O Temor do Sábio
(2, 9788599296585), -- O Restaurante no Fim do Universo
(2, 9788599296592), -- A Vida, o Universo e Tudo Mais
(2, 9788599296608), -- Até Mais, e Obrigado pelos Peixes!
(2, 9788599296615), -- Praticamente Inofensiva
(5, 9788501104656), -- A Garota no Trem
(6, 9788501104656); -- A Garota no Trem

INSERT INTO preferencia_usuario (id_usuario, id_genero) VALUES
(1, 12),
(1, 2),
(1, 1),
(2, 2),
(2, 3),
(3, 10),
(3, 14),
(3, 1),
(4, 7),
(4, 13),
(4, 10),
(5, 14),
(5, 1),
(6, 6),
(6, 5),
(7, 3),
(7, 11),
(8, 9),
(8, 8),
(9, 1),
(9, 14),
(9, 9),
(10, 15),
(10, 3),
(10, 2),
(11, 7),
(11, 10),
(12, 9),
(12, 14),
(13, 1),
(13, 14),
(14, 4),
(14, 5),
(15, 11),
(15, 3);

INSERT INTO seguidor (id_seguidor, id_seguido) VALUES
(1, 2),
(1, 3),
(1, 7),
(1, 9),
(2, 1),
(2, 7),
(2, 10),
(3, 9),
(3, 5),
(3, 11),
(3, 13),
(4, 11),
(4, 3),
(4, 12),
(5, 3),
(5, 12),
(5, 13),
(6, 14),
(6, 1),
(7, 2),
(7, 10),
(7, 15),
(7, 1),
(8, 12),
(8, 9),
(9, 3),
(9, 1),
(9, 8),
(10, 2),
(10, 7),
(11, 4),
(11, 3),
(12, 5),
(12, 8),
(12, 4),
(13, 5),
(13, 3),
(13, 1),
(14, 6),
(14, 2),
(15, 7),
(15, 3),
(15, 9);

INSERT INTO biblioteca (id_livro, id_biblioteca, status, visivel, id_usuario) VALUES
(9788535914849, 1, 'favorito', 1, 1), -- 1984
(9788525056009, 1, 'lido', 1, 1), -- Admirável Mundo Novo
(9788532520661, 1, 'lido', 1, 1), -- O Conto da Aia
(9788525052247, 1, 'lido', 1, 1), -- Fahrenheit 451
(9788579800245, 1, 'lido', 1, 1), -- Jogos Vorazes
(9788535909555, 1, 'lido', 1, 1), -- A Revolução dos Bichos
(9788579800863, 1, 'lendo', 1, 1), -- A Esperança
(9788535930313, 1, 'quero ler', 1, 1), -- Ensaio sobre a Cegueira
(9788535930047, 1, 'desisti', 0, 1), -- Guerra e Paz
(9788595084759, 2, 'favorito', 1, 2), -- O Senhor dos Anéis: A Sociedade do Anel
(9788595084766, 2, 'lido', 1, 2), -- O Senhor dos Anéis: As Duas Torres
(9788595084773, 2, 'lido', 1, 2), -- O Senhor dos Anéis: O Retorno do Rei
(9788595084742, 2, 'lido', 1, 2), -- O Hobbit
(9788599296578, 2, 'favorito', 1, 2), -- O Guia do Mochileiro das Galáxias
(9788599296585, 2, 'lido', 1, 2), -- O Restaurante no Fim do Universo
(9788599296493, 2, 'lido', 1, 2), -- O Nome do Vento
(9788535914849, 2, 'lido', 1, 2), -- 1984
(9788595084377, 2, 'lendo', 1, 2), -- O Silmarillion
(9788580410327, 2, 'quero ler', 1, 2), -- O Temor do Sábio
(9788582850350, 3, 'favorito', 1, 3), -- Dom Casmurro
(9788582850015, 3, 'lido', 1, 3), -- Memórias Póstumas de Brás Cubas
(9788520918852, 3, 'lido', 1, 3), -- Grande Sertão: Veredas
(9788582851890, 3, 'lido', 1, 3), -- Vidas Secas
(9788535911695, 3, 'lido', 1, 3), -- Capitães da Areia
(9788563560179, 3, 'lido', 1, 3), -- Triste Fim de Policarpo Quaresma
(9788532508126, 3, 'favorito', 1, 3), -- A Hora da Estrela
(9788535933390, 3, 'lendo', 1, 3), -- O Avesso da Pele
(9788535911701, 3, 'quero ler', 1, 3), -- Dona Flor e Seus Dois Maridos
(9788563560278, 4, 'lido', 1, 4), -- Odisseia
(9788532508126, 4, 'lido', 1, 4), -- A Hora da Estrela
(9788522031450, 4, 'favorito', 1, 4), -- O Pequeno Príncipe
(9788582851890, 4, 'lido', 1, 4), -- Vidas Secas
(9788520918852, 4, 'desisti', 1, 4), -- Grande Sertão: Veredas
(9788563560568, 4, 'lendo', 1, 4), -- Ilíada
(9788582850145, 4, 'quero ler', 1, 4), -- Hamlet
(9788535929225, 5, 'favorito', 1, 5), -- Anna Kariênina
(9788535930047, 5, 'lido', 1, 5), -- Guerra e Paz
(9788582850480, 5, 'lido', 1, 5), -- Os Miseráveis
(9788563560315, 5, 'lido', 1, 5), -- Madame Bovary
(9788571646858, 5, 'lido', 1, 5), -- A Metamorfose
(9788535928839, 5, 'lido', 1, 5), -- A Insustentável Leveza do Ser
(9788582851395, 5, 'lendo', 1, 5), -- Jane Eyre
(9788563560551, 5, 'quero ler', 1, 5), -- Dom Quixote
(9788580572902, 6, 'favorito', 1, 6), -- Garota Exemplar
(9788501104656, 6, 'lido', 1, 6), -- A Garota no Trem
(9788566636239, 6, 'lido', 1, 6), -- Drácula
(9788563560438, 6, 'lido', 1, 6), -- O Retrato de Dorian Gray
(9788535914849, 6, 'lendo', 1, 6), -- 1984
(9788594540188, 6, 'quero ler', 1, 6), -- Frankenstein
(9788580573749, 6, 'desisti', 0, 6), -- Cidades de Papel
(9788532511010, 7, 'favorito', 1, 7), -- Harry Potter e a Pedra Filosofal
(9788532511669, 7, 'lido', 1, 7), -- Harry Potter e a Câmara Secreta
(9788532512062, 7, 'lido', 1, 7), -- Harry Potter e o Prisioneiro de Azkaban
(9788532512529, 7, 'lido', 1, 7), -- Harry Potter e o Cálice de Fogo
(9788532516220, 7, 'lido', 1, 7), -- Harry Potter e a Ordem da Fênix
(9788598078397, 7, 'lido', 1, 7), -- Percy Jackson e o Ladrão de Raios
(9788579800245, 7, 'lido', 1, 7), -- Jogos Vorazes
(9788580572261, 7, 'lido', 1, 7), -- A Culpa é das Estrelas
(9788532519474, 7, 'lendo', 1, 7), -- Harry Potter e o Enigma do Príncipe
(9788532522610, 7, 'quero ler', 1, 7), -- Harry Potter e as Relíquias da Morte
(9788595084742, 7, 'quero ler', 1, 7), -- O Hobbit
(9788535933925, 8, 'favorito', 1, 8), -- Sapiens: Uma Breve História da Humanidade
(9788535928198, 8, 'lido', 1, 8), -- Homo Deus: Uma Breve História do Amanhã
(9788539003839, 8, 'lido', 1, 8), -- Rápido e Devagar: Duas Formas de Pensar
(9788539004119, 8, 'lido', 1, 8), -- O Poder do Hábito
(9788501044457, 8, 'lido', 1, 8), -- O Diário de Anne Frank
(9788547000240, 8, 'lido', 1, 8), -- Mindset: A Nova Psicologia do Sucesso
(9788535929881, 8, 'lendo', 1, 8), -- Cosmos
(9788547001087, 8, 'quero ler', 1, 8), -- Antifrágil
(9788535930917, 8, 'quero ler', 0, 8), -- 21 Lições para o Século 21
(9788563560155, 9, 'favorito', 1, 9), -- Orgulho e Preconceito
(9788563560490, 9, 'lido', 1, 9), -- Razão e Sensibilidade
(9788535924732, 9, 'lido', 1, 9), -- Americanah
(9788535925470, 9, 'lido', 1, 9), -- Sejamos Todos Feministas
(9788535930313, 9, 'lido', 1, 9), -- Ensaio sobre a Cegueira
(9788563560292, 9, 'lido', 1, 9), -- O Grande Gatsby
(9788535918502, 9, 'lendo', 1, 9), -- Hibisco Roxo
(9788547000806, 9, 'quero ler', 1, 9), -- Nudge
(9788599296578, 10, 'lido', 1, 10), -- O Guia do Mochileiro das Galáxias
(9788599296585, 10, 'lido', 1, 10), -- O Restaurante no Fim do Universo
(9788595084742, 10, 'favorito', 1, 10), -- O Hobbit
(9788599296493, 10, 'lido', 1, 10), -- O Nome do Vento
(9788598078397, 10, 'lido', 1, 10), -- Percy Jackson e o Ladrão de Raios
(9788578270889, 10, 'lido', 1, 10), -- O Leão, a Feiticeira e o Guarda-Roupa
(9788595084377, 10, 'desisti', 1, 10), -- O Silmarillion
(9788599296592, 10, 'lendo', 1, 10), -- A Vida, o Universo e Tudo Mais
(9788535911695, 11, 'favorito', 1, 11), -- Capitães da Areia
(9788535933390, 11, 'lido', 1, 11), -- O Avesso da Pele
(9788535918502, 11, 'lido', 1, 11), -- Hibisco Roxo
(9788532508126, 11, 'lido', 1, 11), -- A Hora da Estrela
(9788535925470, 11, 'lido', 1, 11), -- Sejamos Todos Feministas
(9788582851890, 11, 'lido', 1, 11), -- Vidas Secas
(9788535924732, 11, 'quero ler', 1, 11), -- Americanah
(9788563560032, 12, 'lido', 1, 12), -- O Príncipe
(9788563560513, 12, 'lido', 1, 12), -- A Desobediência Civil
(9788535928839, 12, 'favorito', 1, 12), -- A Insustentável Leveza do Ser
(9788547001261, 12, 'lido', 1, 12), -- A Lógica do Cisne Negro
(9788582850145, 12, 'lido', 1, 12), -- Hamlet
(9788535933925, 12, 'lido', 1, 12), -- Sapiens: Uma Breve História da Humanidade
(9788535911299, 12, 'lendo', 1, 12), -- O Gene Egoísta
(9788563560551, 12, 'quero ler', 1, 12), -- Dom Quixote
(9788501012074, 13, 'favorito', 1, 13), -- Cem Anos de Solidão
(9788582850480, 13, 'lido', 1, 13), -- Os Miseráveis
(9788582851425, 13, 'lido', 1, 13), -- O Morro dos Ventos Uivantes
(9788598078175, 13, 'lido', 1, 13), -- A Menina que Roubava Livros
(9788582850985, 13, 'lido', 1, 13), -- Mulherzinhas
(9788582851395, 13, 'lido', 1, 13), -- Jane Eyre
(9788580573299, 13, 'lido', 1, 13), -- Como Eu Era Antes de Você
(9788563560476, 13, 'lendo', 1, 13), -- Grandes Esperanças
(9788535930047, 13, 'quero ler', 1, 13), -- Guerra e Paz
(9788566636239, 14, 'favorito', 1, 14), -- Drácula
(9788594540188, 14, 'lido', 1, 14), -- Frankenstein
(9788563560438, 14, 'lido', 1, 14), -- O Retrato de Dorian Gray
(9788580572902, 14, 'lido', 1, 14), -- Garota Exemplar
(9788571646858, 14, 'lido', 1, 14), -- A Metamorfose
(9788535930313, 14, 'lendo', 1, 14), -- Ensaio sobre a Cegueira
(9788501104656, 14, 'quero ler', 1, 14), -- A Garota no Trem
(9788522031450, 15, 'favorito', 1, 15), -- O Pequeno Príncipe
(9788580573015, 15, 'lido', 1, 15), -- Extraordinário
(9788578270889, 15, 'lido', 1, 15), -- O Leão, a Feiticeira e o Guarda-Roupa
(9788532511010, 15, 'lido', 1, 15), -- Harry Potter e a Pedra Filosofal
(9788535911121, 15, 'lido', 1, 15), -- O Menino do Pijama Listrado
(9788582850985, 15, 'lido', 1, 15), -- Mulherzinhas
(9788598078397, 15, 'lendo', 1, 15), -- Percy Jackson e o Ladrão de Raios
(9788551002001, 15, 'quero ler', 1, 15); -- Tartarugas Até Lá Embaixo

INSERT INTO meta_leitura (id_meta, qnt_livros, data, id_usuario) VALUES
(1, 12, '2025-12-31', 2),
(2, 24, '2025-12-31', 3),
(3, 30, '2025-12-31', 7),
(4, 20, '2025-12-31', 8),
(5, 30, '2025-12-31', 9),
(6, 18, '2025-12-31', 13),
(7, 20, '2026-12-31', 1),
(8, 15, '2026-12-31', 2),
(9, 30, '2026-12-31', 3),
(10, 12, '2026-12-31', 4),
(11, 18, '2026-12-31', 5),
(12, 24, '2026-12-31', 6),
(13, 40, '2026-12-31', 7),
(14, 25, '2026-12-31', 8),
(15, 36, '2026-12-31', 9),
(16, 10, '2026-12-31', 10),
(17, 12, '2026-12-31', 11),
(18, 20, '2026-12-31', 12),
(19, 22, '2026-12-31', 13),
(20, 15, '2026-12-31', 14),
(21, 30, '2026-12-31', 15);

INSERT INTO avaliacao (id_avaliacao, nota, dt_avaliacao, id_livro, txt_resenha, id_usuario) VALUES
(1, 4, '2025-11-02', 9788535911695, NULL, 3), -- Capitães da Areia
(2, 5, '2025-11-06', 9788535929225, 'A melhor abertura de romance que existe, e o resto está à altura.', 5), -- Anna Kariênina
(3, 4, '2025-11-13', 9788539004119, NULL, 8), -- O Poder do Hábito
(4, 5, '2025-11-13', 9788535928839, 'Romance e ensaio ao mesmo tempo. A ideia do eterno retorno abre o livro e não sai mais da cabeça.', 12), -- A Insustentável Leveza do Ser
(5, 5, '2025-11-26', 9788501012074, 'Precisei de uma árvore genealógica do lado, mas que viagem. Macondo existe.', 13), -- Cem Anos de Solidão
(6, 5, '2025-12-10', 9788532511010, 'O livro que me fez gostar de ler. Hogwarts é a minha casa.', 7), -- Harry Potter e a Pedra Filosofal
(7, 4, '2025-12-12', 9788563560278, 'Poesia épica em tradução muito fluida. Dá para ler em voz alta.', 4), -- Odisseia
(8, 5, '2025-12-16', 9788532512062, 'Meu favorito da série. O Sirius e a reviravolta do final são demais.', 7), -- Harry Potter e o Prisioneiro de Azkaban
(9, 5, '2025-12-17', 9788535924732, 'Fala de raça, imigração e amor sem perder a leveza. Chimamanda no auge.', 9), -- Americanah
(10, 4, '2025-12-21', 9788582851890, NULL, 4), -- Vidas Secas
(11, 4, '2025-12-23', 9788579800245, NULL, 1), -- Jogos Vorazes
(12, 4, '2025-12-23', 9788582851425, 'Ninguém ali é boa pessoa, e mesmo assim não consegui largar.', 13), -- O Morro dos Ventos Uivantes
(13, 5, '2025-12-27', 9788532508126, 'Cada frase da Clarice parece um poema. Livro pequeno e enorme.', 4), -- A Hora da Estrela
(14, 4, '2025-12-30', 9788599296585, NULL, 10), -- O Restaurante no Fim do Universo
(15, 5, '2025-12-31', 9788535914849, 'Li duas vezes e continua assustadoramente atual. O final me deixou sem chão.', 1), -- 1984
(16, 4, '2026-01-02', 9788563560438, NULL, 14), -- O Retrato de Dorian Gray
(17, 4, '2026-01-06', 9788535933925, NULL, 12), -- Sapiens: Uma Breve História da Humanidade
(18, 5, '2026-01-12', 9788535933925, 'Muda a forma de olhar para a história. A parte sobre o dinheiro é brilhante.', 8), -- Sapiens: Uma Breve História da Humanidade
(19, 3, '2026-01-12', 9788580573299, NULL, 13), -- Como Eu Era Antes de Você
(20, 4, '2026-02-16', 9788563560315, NULL, 5), -- Madame Bovary
(21, 5, '2026-02-23', 9788595084759, 'Releio todo ano e sempre acho um detalhe novo. A saída do Condado é perfeita.', 2), -- O Senhor dos Anéis: A Sociedade do Anel
(22, 5, '2026-02-23', 9788582850145, NULL, 12), -- Hamlet
(23, 5, '2026-02-26', 9788594540188, 'O verdadeiro monstro é o Victor. Muito mais triste do que assustador.', 14), -- Frankenstein
(24, 5, '2026-03-03', 9788582851890, 'O capítulo da Baleia é das coisas mais tristes que já li.', 3), -- Vidas Secas
(25, 3, '2026-03-09', 9788535928839, 'Bonito, mas as partes filosóficas quebram o ritmo da história.', 5), -- A Insustentável Leveza do Ser
(26, 5, '2026-03-09', 9788578270889, NULL, 15), -- O Leão, a Feiticeira e o Guarda-Roupa
(27, 5, '2026-03-13', 9788535933390, 'Doeu ler. Um retrato do racismo que a gente vê todo dia.', 11), -- O Avesso da Pele
(28, 5, '2026-03-28', 9788522031450, NULL, 4), -- O Pequeno Príncipe
(29, 5, '2026-03-28', 9788579800245, NULL, 7), -- Jogos Vorazes
(30, 5, '2026-03-30', 9788598078397, 'Divertido e rápido, aprendi mitologia grega sem perceber.', 7), -- Percy Jackson e o Ladrão de Raios
(31, 5, '2026-04-08', 9788539003839, 'Denso, mas depois dele você passa a desconfiar das próprias certezas.', 8), -- Rápido e Devagar: Duas Formas de Pensar
(32, 4, '2026-04-10', 9788582850480, 'As digressões cansam, mas Jean Valjean compensa tudo.', 5), -- Os Miseráveis
(33, 4, '2026-04-13', 9788525056009, 'Menos sombrio que 1984, mas talvez mais realista. A parte do Selvagem é a melhor.', 1), -- Admirável Mundo Novo
(34, 4, '2026-04-24', 9788532511669, NULL, 7), -- Harry Potter e a Câmara Secreta
(35, 5, '2026-04-28', 9788580572902, 'A virada no meio do livro me fez voltar páginas para conferir. Ninguém presta nesse casamento.', 6), -- Garota Exemplar
(36, 3, '2026-05-02', 9788501104656, 'Prende bem, mas adivinhei o culpado antes da hora.', 6), -- A Garota no Trem
(37, 3, '2026-05-06', 9788547000240, 'Ideia boa que caberia em um artigo. Fica repetitivo.', 8), -- Mindset: A Nova Psicologia do Sucesso
(38, 5, '2026-05-08', 9788501044457, 'Impossível não se apegar à Anne. Leitura obrigatória.', 8), -- O Diário de Anne Frank
(39, 4, '2026-05-12', 9788566636239, NULL, 6), -- Drácula
(40, 4, '2026-05-23', 9788571646858, 'Li em uma tarde e fiquei pensando a semana inteira.', 5), -- A Metamorfose
(41, 2, '2026-05-23', 9788595084377, 'Parece um livro de história de um mundo que não existe. Não era o momento.', 10), -- O Silmarillion
(42, 5, '2026-05-24', 9788535925470, 'Dá para ler em meia hora e recomendar para todo mundo.', 9), -- Sejamos Todos Feministas
(43, 4, '2026-05-25', 9788535911121, 'Delicado e duro ao mesmo tempo. Pede uma boa conversa depois da leitura.', 15), -- O Menino do Pijama Listrado
(44, 5, '2026-06-04', 9788599296578, 'Nunca ri tanto com um livro. Não esqueça a toalha.', 2), -- O Guia do Mochileiro das Galáxias
(45, 4, '2026-06-04', 9788535918502, NULL, 11), -- Hibisco Roxo
(46, 4, '2026-06-05', 9788563560490, NULL, 9), -- Razão e Sensibilidade
(47, 5, '2026-06-06', 9788595084742, 'Aventura do começo ao fim. A conversa com o Smaug é a melhor cena.', 10), -- O Hobbit
(48, 4, '2026-06-08', 9788582850985, NULL, 13), -- Mulherzinhas
(49, 5, '2026-06-14', 9788520918852, 'Difícil no início, depois a linguagem vira música.', 3), -- Grande Sertão: Veredas
(50, 2, '2026-06-19', 9788520918852, 'Reconheço a grandeza, mas não consegui passar da página cem. Vou tentar de novo um dia.', 4), -- Grande Sertão: Veredas
(51, 4, '2026-06-22', 9788571646858, NULL, 14), -- A Metamorfose
(52, 4, '2026-06-23', 9788580572261, 'Chorei no ônibus. Vale cada lágrima.', 7), -- A Culpa é das Estrelas
(53, 5, '2026-06-25', 9788563560155, 'Elizabeth Bennet é a melhor protagonista da literatura inglesa. Ironia finíssima.', 9), -- Orgulho e Preconceito
(54, 5, '2026-06-29', 9788582851395, 'Jane é teimosa, digna e muito à frente do seu tempo.', 13), -- Jane Eyre
(55, 5, '2026-06-29', 9788522031450, 'Leio para as crianças e toda vez entendo uma coisa diferente.', 15), -- O Pequeno Príncipe
(56, 5, '2026-07-04', 9788535925470, NULL, 11), -- Sejamos Todos Feministas
(57, 5, '2026-07-05', 9788566636239, 'O formato de cartas e diários deixa tudo mais tenso. Clássico absoluto do terror.', 14), -- Drácula
(58, 5, '2026-07-10', 9788582850350, 'Capitu traiu ou não? Depois de tantas leituras continuo sem resposta, e é isso que faz o livro.', 3), -- Dom Casmurro
(59, 5, '2026-07-10', 9788535930047, 'Mil e quinhentas páginas e eu queria mais. Pierre é um personagem inesquecível.', 5), -- Guerra e Paz
(60, 3, '2026-07-10', 9788578270889, 'Achei infantil demais para mim, mas a ideia do guarda-roupa é ótima.', 10), -- O Leão, a Feiticeira e o Guarda-Roupa
(61, 5, '2026-07-14', 9788599296578, 'Humor absurdo do jeito que eu gosto. O Marvin é o melhor personagem.', 10), -- O Guia do Mochileiro das Galáxias
(62, 5, '2026-07-16', 9788532520661, 'Sufocante do começo ao fim. A narração da Offred fica na cabeça por dias.', 1), -- O Conto da Aia
(63, 5, '2026-07-18', 9788599296493, NULL, 10), -- O Nome do Vento
(64, 4, '2026-07-21', 9788525052247, 'Curto e direto. Queimar livros nunca pareceu tão perto da gente.', 1), -- Fahrenheit 451
(65, 4, '2026-07-21', 9788563560438, 'O quadro apodrecendo no sótão é uma imagem que não esqueço.', 6), -- O Retrato de Dorian Gray
(66, 4, '2026-07-21', 9788563560032, 'Mais citado do que lido. Vale pela frieza com que descreve o poder.', 12), -- O Príncipe
(67, 5, '2026-07-24', 9788563560513, 'Texto curto que continua incômodo. Thoreau faz a gente pensar no que aceita calado.', 12), -- A Desobediência Civil
(68, 5, '2026-07-26', 9788582850480, NULL, 13), -- Os Miseráveis
(69, 5, '2026-07-27', 9788535911695, 'Jorge Amado deu voz a quem ninguém queria ouvir. Pedro Bala é gigante.', 11), -- Capitães da Areia
(70, 4, '2026-08-03', 9788532516220, 'A Umbridge me dá mais raiva que o Voldemort.', 7), -- Harry Potter e a Ordem da Fênix
(71, 5, '2026-08-07', 9788580573015, 'Ótimo para conversar sobre empatia com os pequenos.', 15), -- Extraordinário
(72, 4, '2026-08-08', 9788599296493, 'A prosa é linda, mas o Kvothe às vezes cansa de tão bom em tudo.', 2), -- O Nome do Vento
(73, 4, '2026-08-11', 9788563560292, NULL, 9), -- O Grande Gatsby
(74, 4, '2026-08-12', 9788595084742, 'Mais leve que a trilogia, ótimo para começar na Terra-média.', 2), -- O Hobbit
(75, 5, '2026-08-13', 9788532512529, NULL, 7), -- Harry Potter e o Cálice de Fogo
(76, 4, '2026-08-14', 9788532511010, 'As crianças ficam vidradas. Funciona muito bem lido em voz alta.', 15), -- Harry Potter e a Pedra Filosofal
(77, 5, '2026-08-16', 9788532508126, 'Macabéa sou eu, é a minha vizinha, é meio Brasil.', 11), -- A Hora da Estrela
(78, 4, '2026-08-21', 9788599296585, NULL, 2), -- O Restaurante no Fim do Universo
(79, 3, '2026-08-22', 9788547001261, 'Boas ideias, tom arrogante demais.', 12), -- A Lógica do Cisne Negro
(80, 4, '2026-08-23', 9788535928198, 'Menos sólido que o Sapiens, mas provoca boas discussões.', 8), -- Homo Deus: Uma Breve História do Amanhã
(81, 5, '2026-08-27', 9788535930313, 'Brutal e necessário. A falta de pontuação incomoda no começo e depois some.', 9), -- Ensaio sobre a Cegueira
(82, 5, '2026-08-28', 9788582850015, 'O narrador mais debochado da nossa literatura.', 3), -- Memórias Póstumas de Brás Cubas
(83, 5, '2026-09-04', 9788595084766, 'A batalha do Abismo de Helm vale o livro inteiro.', 2), -- O Senhor dos Anéis: As Duas Torres
(84, 4, '2026-09-04', 9788598078397, NULL, 10), -- Percy Jackson e o Ladrão de Raios
(85, 4, '2026-09-11', 9788563560179, 'Engraçado e triste na mesma medida. O Brasil mudou pouco.', 3), -- Triste Fim de Policarpo Quaresma
(86, 5, '2026-09-15', 9788595084773, NULL, 2), -- O Senhor dos Anéis: O Retorno do Rei
(87, 5, '2026-09-15', 9788598078175, 'A Morte como narradora foi uma escolha genial.', 13), -- A Menina que Roubava Livros
(88, 4, '2026-09-17', 9788580572902, 'Não é terror, mas a Amy dá mais medo que muito vampiro.', 14); -- Garota Exemplar

INSERT INTO curtida_avaliacao (id_usuario, id_avaliacao, id_livro) VALUES
(4, 1, 9788535911695),
(3, 2, 9788535929225),
(12, 2, 9788535929225),
(13, 2, 9788535929225),
(4, 4, 9788535928839),
(5, 4, 9788535928839),
(3, 5, 9788501012074),
(5, 5, 9788501012074),
(2, 6, 9788532511010),
(12, 7, 9788563560278),
(2, 8, 9788532512062),
(10, 8, 9788532512062),
(3, 9, 9788535924732),
(8, 9, 9788535924732),
(15, 9, 9788535924732),
(11, 10, 9788582851890),
(7, 11, 9788579800245),
(9, 11, 9788579800245),
(5, 12, 9788582851425),
(11, 13, 9788532508126),
(12, 13, 9788532508126),
(2, 15, 9788535914849),
(6, 15, 9788535914849),
(7, 15, 9788535914849),
(9, 15, 9788535914849),
(5, 17, 9788535933925),
(8, 17, 9788535933925),
(9, 18, 9788535933925),
(5, 19, 9788580573299),
(7, 21, 9788595084759),
(10, 21, 9788595084759),
(4, 22, 9788582850145),
(5, 22, 9788582850145),
(8, 22, 9788582850145),
(7, 23, 9788594540188),
(1, 24, 9788582851890),
(9, 24, 9788582851890),
(11, 24, 9788582851890),
(13, 24, 9788582851890),
(15, 24, 9788582851890),
(3, 25, 9788535928839),
(12, 25, 9788535928839),
(13, 25, 9788535928839),
(14, 25, 9788535928839),
(3, 27, 9788535933390),
(4, 27, 9788535933390),
(12, 28, 9788522031450),
(2, 29, 9788579800245),
(15, 29, 9788579800245),
(1, 30, 9788598078397),
(3, 30, 9788598078397),
(10, 30, 9788598078397),
(9, 31, 9788539003839),
(12, 31, 9788539003839),
(3, 32, 9788582850480),
(13, 32, 9788582850480),
(2, 33, 9788525056009),
(6, 33, 9788525056009),
(7, 33, 9788525056009),
(9, 33, 9788525056009),
(13, 33, 9788525056009),
(1, 34, 9788532511669),
(14, 35, 9788580572902),
(14, 36, 9788501104656),
(15, 36, 9788501104656),
(4, 37, 9788547000240),
(9, 37, 9788547000240),
(12, 37, 9788547000240),
(9, 38, 9788501044457),
(3, 40, 9788571646858),
(7, 41, 9788595084377),
(12, 41, 9788595084377),
(1, 42, 9788535925470),
(8, 42, 9788535925470),
(15, 42, 9788535925470),
(1, 44, 9788599296578),
(7, 44, 9788599296578),
(10, 44, 9788599296578),
(14, 44, 9788599296578),
(3, 45, 9788535918502),
(1, 46, 9788563560490),
(3, 46, 9788563560490),
(2, 47, 9788595084742),
(7, 47, 9788595084742),
(5, 48, 9788582850985),
(4, 49, 9788520918852),
(5, 49, 9788520918852),
(9, 49, 9788520918852),
(15, 49, 9788520918852),
(11, 50, 9788520918852),
(12, 50, 9788520918852),
(6, 51, 9788571646858),
(1, 52, 9788580572261),
(15, 52, 9788580572261),
(1, 53, 9788563560155),
(3, 53, 9788563560155),
(8, 53, 9788563560155),
(15, 53, 9788563560155),
(3, 54, 9788582851395),
(5, 54, 9788582851395),
(7, 55, 9788522031450),
(6, 57, 9788566636239),
(4, 58, 9788582850350),
(5, 58, 9788582850350),
(11, 58, 9788582850350),
(13, 58, 9788582850350),
(15, 58, 9788582850350),
(12, 59, 9788535930047),
(13, 59, 9788535930047),
(1, 60, 9788578270889),
(2, 60, 9788578270889),
(2, 61, 9788599296578),
(7, 61, 9788599296578),
(2, 62, 9788532520661),
(5, 62, 9788532520661),
(6, 62, 9788532520661),
(7, 62, 9788532520661),
(9, 62, 9788532520661),
(13, 62, 9788532520661),
(2, 64, 9788525052247),
(6, 64, 9788525052247),
(7, 64, 9788525052247),
(9, 64, 9788525052247),
(13, 64, 9788525052247),
(4, 66, 9788563560032),
(5, 66, 9788563560032),
(7, 66, 9788563560032),
(8, 66, 9788563560032),
(4, 67, 9788563560513),
(5, 67, 9788563560513),
(15, 67, 9788563560513),
(3, 69, 9788535911695),
(4, 69, 9788535911695),
(1, 70, 9788532516220),
(2, 70, 9788532516220),
(10, 70, 9788532516220),
(4, 71, 9788580573015),
(7, 71, 9788580573015),
(1, 72, 9788599296493),
(10, 72, 9788599296493),
(1, 74, 9788595084742),
(10, 74, 9788595084742),
(14, 74, 9788595084742),
(7, 76, 9788532511010),
(12, 76, 9788532511010),
(3, 77, 9788532508126),
(4, 77, 9788532508126),
(8, 77, 9788532508126),
(4, 79, 9788547001261),
(5, 79, 9788547001261),
(8, 79, 9788547001261),
(9, 80, 9788535928198),
(12, 80, 9788535928198),
(1, 81, 9788535930313),
(3, 81, 9788535930313),
(15, 81, 9788535930313),
(4, 82, 9788582850015),
(9, 82, 9788582850015),
(11, 82, 9788582850015),
(12, 82, 9788582850015),
(13, 82, 9788582850015),
(15, 82, 9788582850015),
(1, 83, 9788595084766),
(7, 83, 9788595084766),
(10, 83, 9788595084766),
(14, 83, 9788595084766),
(2, 84, 9788598078397),
(1, 85, 9788563560179),
(4, 85, 9788563560179),
(5, 85, 9788563560179),
(9, 85, 9788563560179),
(13, 85, 9788563560179),
(5, 87, 9788598078175),
(6, 88, 9788580572902);

INSERT INTO comentario (id_comentario, texto, dt_comentario, id_usuario, id_avaliacao) VALUES
(1, 'Vou começar por sua causa. Qual tradução você leu?', '2025-11-06', 13, 2),
(2, 'Li a da Companhia das Letras, recomendo muito.', '2025-11-11', 5, 2),
(3, 'Viu? Cada um lê um livro diferente.', '2025-11-24', 5, 4),
(4, 'A árvore genealógica salvou a minha leitura também.', '2025-12-02', 5, 5),
(5, 'Estou lendo com a minha turma e eles amam.', '2025-12-13', 15, 6),
(6, 'Hibisco Roxo é ainda melhor, na minha opinião.', '2025-12-20', 3, 9),
(7, 'O melhor da série, sem discussão.', '2025-12-24', 2, 8),
(8, 'Concordo demais. A cena da sala 101 não sai da minha cabeça.', '2026-01-02', 2, 15),
(9, 'Assino embaixo. Clarice é poesia em prosa.', '2026-01-08', 11, 13),
(10, 'Gosto, mas acho que ele simplifica demais em alguns trechos.', '2026-01-21', 12, 18),
(11, 'Todo ano? Eu ainda travo no Tom Bombadil.', '2026-02-23', 1, 21),
(12, 'E pensar que ela escreveu isso antes dos vinte anos.', '2026-03-02', 2, 23),
(13, 'Justamente as partes filosóficas são as que eu mais gosto!', '2026-03-10', 12, 25),
(14, 'A Baleia sonhando com os preás... chorei.', '2026-03-14', 11, 24),
(15, 'Estou lendo agora e está sendo difícil no melhor sentido.', '2026-03-14', 3, 27),
(16, 'O segundo é ainda mais engraçado.', '2026-04-01', 10, 30),
(17, 'A Amy é a melhor vilã que li nos últimos anos.', '2026-05-03', 14, 35),
(18, 'Eu não adivinhei, fui enganada direitinho.', '2026-05-06', 1, 36),
(19, 'Senti a mesma coisa, larguei na metade.', '2026-05-15', 9, 37),
(20, 'Tenta de novo depois de reler O Senhor dos Anéis, faz muita diferença.', '2026-05-24', 2, 41),
(21, '42.', '2026-06-05', 10, 44),
(22, 'Pronto, vou furar a fila e ler esse.', '2026-06-11', 7, 47),
(23, 'Insiste! Lá pela página 150 a história engrena.', '2026-06-29', 3, 50),
(24, 'O essencial é invisível aos olhos.', '2026-06-30', 9, 55),
(25, 'Uma das minhas heroínas preferidas.', '2026-07-03', 3, 54),
(26, 'A parte do navio Deméter é sensacional.', '2026-07-14', 6, 57),
(27, 'Fiquei com vontade de reler depois da sua resenha.', '2026-07-18', 9, 62),
(28, 'Para mim o Bentinho é que não é confiável.', '2026-07-20', 5, 58),
(29, 'E continua atual, infelizmente.', '2026-07-22', 8, 66),
(30, 'O capítulo do carrossel é poesia pura.', '2026-08-03', 4, 69),
(31, 'Esse livro deveria ser leitura de escola.', '2026-08-17', 7, 71),
(32, 'Está na minha lista, agora subiu de posição.', '2026-08-20', 7, 74),
(33, 'Está na minha fila. Agora fiquei com medo e com vontade.', '2026-08-29', 1, 81);

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