1 - fazer pop-ups na parte de cadastro;
2 - tentar fazer um css global para o cadastro (informações, selecionar gêneros favoritos, livros já lidos e encontrar amigos)

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/global.css">
    <link rel="stylesheet" href="css/cadastro.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=visibility_off" />
    <title>Cadastro</title>
</head>
<body>
    <header>
        <figure><img src="img/logoBranco.svg" alt="Logotipo do Quote"></figure>
    </header>
    <main>
        <form action="" method="post">
            <div class="cabecalhoForm">
                <div>
                    <a href="../index.html"><span class="material-symbols-outlined line_start_arrow_notch" id="line_start_arrow_notch">line_start_arrow_notch</span></a>
                    <h1>Criar Conta</h1>
                </div>
                <h2>Junte-se ao quote e compartilhe sua jornada literária.</h2>
            </div>

            <section>
                <div>
                    <label for="txtNome">Nome de usuário</label>
                    <input type="text" name="txtNome" id="txtNome" placeholder="Digite seu nome de usuário">
                </div>
                
                <div>
                    <label for="txtNascimento">Data de nascimento</label>
                    <input type="date" name="txtNascimento" id="txtNascimento">
                </div>
                
                <div>
                    <label for="txtBiografia">Biografia (opcional)</label>
                    <textarea name="txtBiografia" id="txtBiografia" cols="30" rows="4" id="txtBiografia"></textarea>
                </div>
                
                <div>
                    <label for="txtEmail">Email</label>
                    <input type="email" name="email" id="txtEmail" placeholder="Digite seu email">
                </div>
            
                <div>
                    <label for="txtSenha">Senha</label>
                        <input type="text" name="senha" id="txtSenha" placeholder="Mínimo de 6 caracteres">
                        <span class="material-symbols-outlined">
                            visibility_off
                            </span>
                </div> 
                
                <div>
                    <label for="txtConfirmarSenha">Confirme sua senha</label>
                    <input type="text" name="senha" id="txtConfirmarSenha" placeholder="Confirme sua senha">
                </div> 
            </section>
           
           <div class="adorno">
                <div class="tracado"></div><span>ou continue com</span><div class="tracado"></div>
            </div> 
           
           <nav class="opcoesEntrar">
            <section>
                <button id="btnGoogle"><img src="img/iconeGoogle.svg" alt="Botão para cadastrar usando conta do Google"></button>
                <button id="btnApple"><img src="img/iconeApple.svg" alt="Botão para cadastrar usando conta da Apple"></button>
                <button id="btnTwitter"><img src="img/iconeTwitter.svg" alt="Botão para cadastrar usando conta do Tinder"></button>
                <button id="btnFacebook"><img src="img/iconeFacebook.svg" alt="Botão para cadastrar usando conta do Facebook"></button> 
            </section>

            <div><span>Já tem conta?</span><a href="../index.html">Entrar</a></div>
        </nav>
            <button type="submit" id="btnProximo">próximo<span class="material-symbols-outlined" id="line_end_arrow_notch">line_end_arrow_notch</span></button>
        </form>
    </main>

    <script src="js/cadastro.js"></script>
</body>
</html>
body{
    background-color: var(--background);
}

main{
    position: relative;
    width: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

form{
    background-color: var(--white);
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    padding: 20px 78px;
    justify-content: center;
    box-shadow: 2px 2px 22px rgba(27, 27, 27, 0.308);
    gap: 16px;

}

h1{
    color: var(--black);
    font-size: 24px;
}

h2{
    color: #8495AF;
    font-weight: normal;
    font-size: 20px;
}

.cabecalhoForm{
    display: flex;
    flex-direction: column;
    align-items: left;
    justify-content: center;
}

.cabecalhoForm > div{
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: left;
    gap: 12px;
}

section{
    display: flex;
    flex-direction: column;
    align-items: left;
    gap: 12px;
}

section > div{
    display: flex;
    flex-direction: column;
}

label{
    font-size: 18px;
    margin-bottom: 1px;
}
input, textarea{
    border: 1px solid var(--softBlue);
    border-radius: 5px;
    padding: 6px 12px;
    font-size: 16px;
    color: #8495AF;
}

.tracado{
    background-color: var(--deepNavyBlue);
    height: 1px;
    flex: 1;
 }

 span{
    color: #8495AF;
    font-weight: normal;
    font-size: 14px;
    text-align: center;
}

.adorno{
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 12px;
}


nav{
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

nav > section{
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

button{
    border-radius: 50%;
    background-color: var(--white);
    border: #B3AFAF solid 1px;
    width: 44px;
    height: 44px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

a{
    text-decoration: none; 
    color: var(--successful);
    font-size: 14px;
    margin-left: 1px;

}

#btnProximo{
    background-color: var(--royalBlue);
    color: var(--white);
    border: none;
    border-radius: 5px;
    width: auto;
    padding: 12px;
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 18px;
    gap: 10px;
    justify-content: space-between;
    align-self: self-end;
    margin-top: 22px;
}

.btnConfirmar span{
    color: white;
    font-size: 22px;
}

#line_start_arrow_notch{
    color: var(--black);
}

#line_end_arrow_notch{
    color: var(--white);
}


<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=visibility_off" />
    <link rel="stylesheet" href="css/global.css">
    <link rel="stylesheet" href="css/cadastro.css">
    <link rel="stylesheet" href="css/generos.css">

    <title>Gêneros Favoritos</title>
</head>
<body>
    <header>
        <figure>
            <a href="homepage.html">
                <img src="img/logoBranco.svg" alt="Logotipo do quote">
            </a>
        </figure>
    </header>
    <main>
        <div class="">
            <a href="../index.html"><span class="material-symbols-outlined line_start_arrow_notch" id="line_start_arrow_notch">line_start_arrow_notch</span></a><h1>Selecione seus gêneros favoritos</h1>
        </div>
      
        <section class="selecaoGenero">
            <button><img src="img/generoRomance.png" alt="Selecionar livros com gênero de romance"></button>
            <button><img src="img/generoSuspense.png" alt="Selecionar livros com gênero de suspense"></button>
            <button><img src="img/generoFantasia.png" alt="Selecionar livros com gênero de fantasia"></button>
            <button><img src="img/generoBiografia.png" alt="Selecionar livros com gênero de biografia"></button>
            <button><img src="img/generoFiccaoHistorica.png" alt="Selecionar livros com gênero de ficção histórica"></button>
            <button><img src="img/generoFiccaoCientifica.png" alt="Selecionar livros com gênero de ficção científica"></button>
            <button><img src="img/generoPoesia.png" alt="Selecionar livros com gênero de poesia"></button>
            <button><img src="img/generoTerror.png" alt="Selecionar livros com gênero de terror"></button>
            <button><img src="img/generoAventura.png" alt="Selecionar livros com gênero de aventura"></button>
            <button><img src="img/generoAutoAjuda.png" alt="Selecionar livros com gênero de auto-ajuda"></button>
            <button><img src="img/generoFilosofia.png" alt="Selecionar livros com gênero de filosofia"></button>
            <button><img src="img/generoDrama.png" alt="Selecionar livros com gênero de drama"></button>
        </section>
        
        <button type="submit" id="btnProximo">próximo<span class="material-symbols-outlined" id="line_end_arrow_notch">line_end_arrow_notch</span></button>
    </main>
</body>
</html>



<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link rel="stylesheet" href="css/global.css">
    <link rel="stylesheet" href="css/generos.css">
    <link rel="stylesheet" href="css/biblioteca.css">


    <title>Encontrar amigos cadastro</title>
</head>
<body>

      <header>
        <figure>
            <a href="homepage.html">
                <img src="img/logoBranco.svg" alt="Logotipo do quote">
            </a>
        </figure>
        <div class="barraPesquisa">
            <input type="text" placeholder="Pesquise por autores, livros, gêneros e pessoas.">
            <span class="material-symbols-outlined">
                search
            </span>
        </div>
    </header>

    <main>
        <div>
            <a href="index.html"><img src="imagens/voltarCadastro.png" alt="Botão voltar" class="btnVoltar"></a>

            <div class="barraPesquisa">
                <input type="text" placeholder="Encontre seus amigos">
                <span class="material-symbols-outlined">search</span>
            </div>
        </div>

        <section class="">
            <h1>Exibindo resultados para...</h1>

            <div class="">
                <img src="" alt="">
                <div>
                    <p id="nomeUsuario">Nome usuário</p>
                    <div>
                        <p class="lidos">189</p>
                        <p class="seguidores">10</p>
                        <p class="seguindo">257</p>
                        <p>Lidos</p>
                        <p>Seguidores</p>
                        <p>Seguindo</p>
                    </div>
                    <button></button>
                </div>
            </div>
        </section>
        
        <button type="submit" id="btnProximo">finalizar<span class="material-symbols-outlined" id="line_end_arrow_notch">line_end_arrow_notch</span></button>
    </main>
</body>
</html>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link rel="stylesheet" href="css/global.css">
    <link rel="stylesheet" href="css/generos.css">
    <link rel="stylesheet" href="css/biblioteca.css">


    <title>Últimas Leituras</title>
</head>
<body>
    <header>
        <figure>
            <a href="homepage.html">
                <img src="img/logoBranco.svg" alt="Logotipo do quote">
            </a>
        </figure>
        <!--  -->
        <!-- <img src="img/avatar.png" alt="Foto de perfil do usuario"> -->
    </header>
    <main>
        <div>
            <a href="index.html"><img src="imagens/voltarCadastro.png" alt="Botão voltar" class="btnVoltar"></a>

            <div class="barraPesquisa">
                <input type="text" placeholder="Pesquise por autores, livros, gêneros e pessoas.">
                <span class="material-symbols-outlined">search</span>
            </div>

        </div>
   
        <section class="">
            <h1>Exibindo resultados para...</h1>

            <div>
                <img src="" alt="">
                <div>
                    <h2></h2>
                    <p></p>
                </div>
                <!-- <div class="areaEstrelas">
                    <img src="img/estrela-cheia.svg" alt="Estrela cheia">
                    <img src="img/estrela-cheia.svg" alt="Estrela cheia">
                    <img src="img/estrela-vazia.svg" alt="Estrela vazia">
                    <img src="img/estrela-vazia.svg" alt="Estrela vazia">
                    <img src="img/estrela-vazia.svg" alt="Estrela vazia">
                </div> -->
            </div>
        </section>
        
        <button type="submit" id="btnProximo">próximo<span class="material-symbols-outlined" id="line_end_arrow_notch">line_end_arrow_notch</span></button>
    </main>
</body>
</html>