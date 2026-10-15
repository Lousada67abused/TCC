const container = document.querySelector(".containerCadastro");
const formulario = document.querySelector(".formularioCadastro");
const txtNome = document.getElementById("txtNome");
const txtDataNascimento = document.getElementById("txtDataNascimento");
const txtBiografia = document.getElementById("txtBiografia");
const txtEmail = document.getElementById("txtEmail");
const txtSenha1 = document.getElementById("txtSenha1");
const txtSenha2 = document.getElementById("txtSenha2");
const btnProximo = document.querySelector(".btnProximo");
const mensagemErro = document.querySelector(".mensagemErro");
const main = document.querySelector("main");

const ERRO_SERVIDOR = "Erro no servidor. Por favor, tente novamente mais tarde.";
const ERRO_CONEXAO = "Não foi possível acessar o servidor. Por favor, tente novamente mais tarde.";

let contaCriada = false;
let usuario = null;
let generosSalvos = [];
let livrosSelecionados = [];

function mostrarErro(elemento, mensagem) {
    elemento.textContent = mensagem;
    elemento.classList.remove("escondido");
    clearTimeout(elemento.temporizador);
    elemento.temporizador = setTimeout(function () {
        elemento.classList.add("escondido");
    }, 5000);
}

function mensagemDaApi(resultado) {
    if (typeof resultado.erro === "string" && resultado.erro.startsWith("SQLSTATE[45000]")) {
        const partes = resultado.erro.split(": 1644 ");
        if (partes.length === 2) {
            return partes[1];
        }
    }
    return ERRO_SERVIDOR;
}

function dataDeHoje() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return hoje.getFullYear() + "-" + mes + "-" + dia;
}

function validarFormulario() {
    const nome = txtNome.value.trim();
    const nascimento = txtDataNascimento.value;
    const biografia = txtBiografia.value.trim();
    const email = txtEmail.value.trim();
    const senha = txtSenha1.value.trim();
    const confirmacao = txtSenha2.value.trim();

    let campo = null;
    let mensagem = "";

    if (nome === "") {
        campo = txtNome;
        mensagem = "Por favor, digite o campo de nome.";
    } else if (nascimento === "") {
        campo = txtDataNascimento;
        mensagem = "Por favor, digite o campo de data de nascimento.";
    } else if (nascimento < "1900-01-01" || nascimento > dataDeHoje()) {
        campo = txtDataNascimento;
        mensagem = "Digite uma data de nascimento válida.";
    } else if (biografia.length > 70) {
        campo = txtBiografia;
        mensagem = "A biografia pode ter no máximo 70 caracteres.";
    } else if (email === "") {
        campo = txtEmail;
        mensagem = "Por favor, digite o campo de email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        campo = txtEmail;
        mensagem = "Digite um email válido.";
    } else if (senha === "") {
        campo = txtSenha1;
        mensagem = "Por favor, digite o campo de senha.";
    } else if (senha.length < 6) {
        campo = txtSenha1;
        mensagem = "A senha precisa ter no mínimo 6 caracteres.";
    } else if (confirmacao === "") {
        campo = txtSenha2;
        mensagem = "Por favor, digite o campo de confirmação de senha.";
    } else if (senha !== confirmacao) {
        campo = txtSenha2;
        mensagem = "As senhas não coincidem.";
    }

    if (campo !== null) {
        mostrarErro(mensagemErro, mensagem);
        campo.focus();
        return false;
    }
    return true;
}

function erroNoCadastro(mensagem) {
    mostrarErro(mensagemErro, mensagem);
    btnProximo.disabled = false;
}

function cadastrarUsuario() {
    let biografia = null;
    if (txtBiografia.value.trim() !== "") {
        biografia = txtBiografia.value.trim();
    }

    const tipo = "comum";

    fetch("../api/cadastrarUsuario.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nome: txtNome.value.trim(),
            email: txtEmail.value.trim(),
            dataNascimento: txtDataNascimento.value,
            biografia: biografia,
            senha: txtSenha1.value.trim(),
            tipo: tipo
        })
    })
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        if (resultado.status === "true") {
            contaCriada = true;
            // A conta já existe: os dados não podem mudar se o botão for clicado de novo.
            [txtNome, txtDataNascimento, txtBiografia, txtEmail, txtSenha1, txtSenha2].forEach(function (campo) {
                campo.readOnly = true;
            });
            entrar();
            buscarGeneros();
        } else {
            console.error(resultado);
            erroNoCadastro(mensagemDaApi(resultado));
        }
    })
    .catch(function (erro) {
        console.error(erro);
        erroNoCadastro(ERRO_CONEXAO);
    });
}

function entrar() {
    const senha = txtSenha1.value.trim();
    const email = txtEmail.value.trim();

    fetch("../api/acessar.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, senha: senha})
    })
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        if (resultado.status === "true") {
            usuario = resultado.resultado[0];
            sessionStorage.setItem("codigo", usuario.id_usuario);
            sessionStorage.setItem("usuario", JSON.stringify(usuario));
        } else {
            console.error(resultado);
            mostrarErro(mensagemErro, mensagemDaApi(resultado));
        }
    })
    .catch(function (erro) {
        console.error(erro);
        mostrarErro(mensagemErro, ERRO_CONEXAO);
    });
}

function buscarGeneros() {
    fetch("../api/buscarGenero.php")
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        if (resultado.status === "true") {
            if (resultado.dados.length === 0) {
                window.location.href = "homepage.html";
                return;
            }
            criarTelaGeneros(resultado.dados);
        } else {
            console.error(resultado);
            erroNoCadastro(ERRO_SERVIDOR);
        }
    })
    .catch(function (erro) {
        console.error(erro);
        erroNoCadastro(ERRO_CONEXAO);
    });
}

if (formulario) {
    btnProximo.addEventListener("click", function (e) {
        e.preventDefault();
        if (btnProximo.disabled || !validarFormulario()) {
            return;
        }
        mensagemErro.classList.add("escondido");
        btnProximo.disabled = true;

        // Continua de onde parou, caso o botão seja clicado de novo depois de um erro.
        if (!contaCriada) {
            cadastrarUsuario();
        } else {
            buscarGeneros();
        }
    });

    document.querySelectorAll(".btnMostrarSenha").forEach(function (botao) {
        botao.addEventListener("click", function () {
            const campo = botao.parentElement.querySelector("input");
            const icone = botao.querySelector("span");
            if (campo.type === "password") {
                campo.type = "text";
                icone.textContent = "visibility";
            } else {
                campo.type = "password";
                icone.textContent = "visibility_off";
            }
        });
    });
}

function criarTelaGeneros(generos) {
    const secao = document.createElement("section");
    secao.id = "cadastroPasso2";

    const card = document.createElement("div");
    card.id = "cardCadastroPasso2";

    const cabecalho = document.createElement("div");

    const btnVoltar = document.createElement("a");
    btnVoltar.href = "../index.html";
    btnVoltar.classList.add("btnVoltar");
    btnVoltar.setAttribute("aria-label", "Voltar para a página anterior");

    const setaVoltar = document.createElement("span");
    setaVoltar.classList.add("material-symbols-outlined", "line_start_arrow_notch");
    setaVoltar.id = "line_start_arrow_notch";
    setaVoltar.textContent = "line_start_arrow_notch";

    btnVoltar.append(setaVoltar);

    const titulo = document.createElement("h1");
    titulo.textContent = "Selecione seus gêneros favoritos";

    cabecalho.append(btnVoltar, titulo);

    const selecaoGenero = document.createElement("section");
    selecaoGenero.classList.add("selecaoGenero");
    for (let i = 0; i < generos.length; i++) {
        const genero = generos[i];
        const botaoGenero = document.createElement("button");
        botaoGenero.type = "button";
        botaoGenero.textContent = genero.nm_genero;
        // "Ficção Científica" -> classe "cardFicçãoCientífica"
        botaoGenero.classList.add("card" + genero.nm_genero.replaceAll(" ", ""));
        // Guarda o código do gênero no botão, para salvar depois.
        botaoGenero.dataset.codigo = genero.id_genero;
        botaoGenero.setAttribute("aria-pressed", "false");

        botaoGenero.addEventListener("click", function () {
            // toggle: o primeiro clique marca, o segundo desmarca.
            const marcado = botaoGenero.classList.toggle("ativo");
            botaoGenero.setAttribute("aria-pressed", String(marcado));
            if (marcado) {
                generosSalvos.push(genero.id_genero);
            } else {
                generosSalvos = generosSalvos.filter(function (id) {
                    return id !== genero.id_genero;
                });
            }
        });

        selecaoGenero.append(botaoGenero);
    }

    const erroGeneros = document.createElement("span");
    erroGeneros.classList.add("mensagemErro", "escondido");

    const btnIrPasso3 = document.createElement("button");
    btnIrPasso3.type = "button";
    btnIrPasso3.id = "btnIrPasso3";

    const setaAvancar = document.createElement("span");
    setaAvancar.classList.add("material-symbols-outlined");
    setaAvancar.id = "line_end_arrow_notch";
    setaAvancar.textContent = "line_end_arrow_notch";

    btnIrPasso3.append("próximo", setaAvancar);

    btnIrPasso3.addEventListener("click", function () {
        if (generosSalvos.length === 0) {
            mostrarErro(erroGeneros, "Selecione pelo menos um gênero.");
                return;
        }
        if (!sessionStorage.getItem("codigo")) {
            mostrarErro(erroGeneros, ERRO_SERVIDOR);
            return;
        }
        btnIrPasso3.disabled = true;
        salvarGeneros().then(function (todosSalvos) {
            if (todosSalvos) {
                criarTelaPasso3();
            } else {
                mostrarErro(erroGeneros, ERRO_SERVIDOR);
                btnIrPasso3.disabled = false;
            }
        });
    });


    card.append(cabecalho, selecaoGenero, erroGeneros, btnIrPasso3);
    secao.append(card);

    // Só limpa o formulário quando a tela nova está pronta. Se limpar antes e der erro
    // no meio do caminho, a mensagem de erro some junto e a página fica em branco.
    container.textContent = "";
    container.append(secao);
    return secao;
}

function salvarGeneros() {
    const codigoUsuario = sessionStorage.getItem("codigo");
    const requisicoes = [];

    for (let i = 0; i < generosSalvos.length; i++) {
        const codigoGenero = generosSalvos[i];
        // O cadastrarPreferencia.php lê $_GET, então os dados vão na URL.
        const url = "../api/cadastrarPreferencia.php?codigoUsuario=" + codigoUsuario + "&codigoGenero=" + codigoGenero;

        const requisicao = fetch(url, { method: "POST" })
        .then(function (resposta) {
            return resposta.json();
        })
        .then(function (resultado) {
            console.log("Gênero", codigoGenero, resultado);
            return resultado.status === "true";
        })
        .catch(function (erro) {
            console.error("Erro no gênero", codigoGenero, erro);
            return false;
        });

        requisicoes.push(requisicao);
    }

    // Espera todos os fetch terminarem
    return Promise.all(requisicoes).then(function (resultados) {
        const todosSalvos = resultados.every(function (deuCerto) {
            return deuCerto;
        });
        console.log("Todos os gêneros salvos?", todosSalvos);
        return todosSalvos;
    });
}

// Terceira tela do cadastro: aparece depois que os gêneros foram salvos.
function criarTelaPasso3() {
    main.textContent = "";
    const secao = document.createElement("section");
    secao.id = "cadastroPasso3";

    // Topo: seta de voltar + barra de pesquisa
    const topo = document.createElement("div");
    topo.classList.add("versaoDesktop");

    const btnVoltar = document.createElement("a");
    btnVoltar.href = "../index.html";
    btnVoltar.classList.add("btnVoltar");
    btnVoltar.setAttribute("aria-label", "Voltar para a página anterior");

    const setaVoltar = document.createElement("span");
    setaVoltar.classList.add("material-symbols-outlined", "line_start_arrow_notch");
    setaVoltar.id = "line_start_arrow_notch";
    setaVoltar.textContent = "line_start_arrow_notch";
    btnVoltar.append(setaVoltar);

    const barraPesquisa = document.createElement("div");
    barraPesquisa.classList.add("barraPesquisa");

    const txtPesquisa = document.createElement("input");
    txtPesquisa.type = "text";
    txtPesquisa.placeholder = "Busque por suas últimas leituras";

    const iconePesquisa = document.createElement("span");
    iconePesquisa.classList.add("material-symbols-outlined");
    iconePesquisa.textContent = "search";

    barraPesquisa.append(txtPesquisa, iconePesquisa);
    topo.append(btnVoltar, barraPesquisa);

    // Resultados
    const resultados = document.createElement("section");
    resultados.classList.add("resultadosPesquisaLivros");

    const tituloResultados = document.createElement("h1");
    tituloResultados.textContent = "Busque os livros que você já leu";

    const listaLivros = document.createElement("div");
    listaLivros.classList.add("listaLivros");

    resultados.append(tituloResultados, listaLivros);

    const erroLivros = document.createElement("span");
    erroLivros.classList.add("mensagemErro", "escondido");

    // Botão próximo
    const btnIrPasso4 = document.createElement("button");
    btnIrPasso4.type = "button";
    btnIrPasso4.id = "btnIrPasso4";

    const setaAvancar = document.createElement("span");
    setaAvancar.classList.add("material-symbols-outlined");
    setaAvancar.id = "line_end_arrow_notch";
    setaAvancar.textContent = "line_end_arrow_notch";

    btnIrPasso4.append("próximo", setaAvancar);

    // Pesquisa ao apertar Enter ou clicar na lupa
    function pesquisar() {
        const texto = txtPesquisa.value.trim();
        if (texto === "") {
            mostrarErro(erroLivros, "Digite o nome de um livro para pesquisar.");
            return;
        }
        buscarLivrosTitulo(texto, tituloResultados, listaLivros, erroLivros);
    }

    txtPesquisa.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            pesquisar();
        }
    });
    iconePesquisa.addEventListener("click", pesquisar);

    btnIrPasso4.addEventListener("click", function () {
        // Essa etapa é opcional: sem livro marcado, só segue em frente.
        if (livrosSelecionados.length === 0) {
            criarTelaPasso4();
            return;
        }
        btnIrPasso4.disabled = true;
        salvarLivros().then(function (todosSalvos) {
            if (todosSalvos) {
                criarTelaPasso4();
            } else {
                mostrarErro(erroLivros, ERRO_SERVIDOR);
                btnIrPasso4.disabled = false;
            }
        });
    });

    main
    .append(topo, resultados, erroLivros, btnIrPasso4);

    txtPesquisa.focus();
    return body;
}

function buscarLivrosTitulo(texto, tituloResultados, listaLivros, erroLivros) {
    fetch("../api/buscarLivroTitulo.php?titulo=" + encodeURIComponent(texto))
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        console.log(resultado);
        if (resultado.status !== "true") {
            console.error(resultado);
            mostrarErro(erroLivros, ERRO_SERVIDOR);
            return;
        }

        // Essa API devolve os livros em "resposta", não em "resultado".
        const livros = resultado.resposta;
        listaLivros.textContent = "";

        if (livros.length === 0) {
            tituloResultados.textContent = "Nenhum livro encontrado para \"" + texto + "\"";
            return;
        }

        tituloResultados.textContent = "Exibindo resultados para \"" + texto + "\"";
        for (let i = 0; i < livros.length; i++) {
            console.log(livros[i])
            listaLivros.append(criarCardLivro(livros[i]));
        }
    })
    .catch(function (erro) {
        console.error(erro);
        mostrarErro(erroLivros, ERRO_CONEXAO);
    });
}

function criarCardLivro(livro) {
    const card = document.createElement("article");
    card.classList.add("cardLivro");
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    // Se o livro já foi marcado numa pesquisa anterior, aparece marcado de novo.
    const jaSelecionado = livrosSelecionados.includes(livro.id_livro);
    card.classList.toggle("selecionado", jaSelecionado);
    card.setAttribute("aria-pressed", String(jaSelecionado));

    const capa = document.createElement("img");
    // Mesmo esquema do livros.js: o id do livro é o ISBN.
    capa.src = "https://covers.openlibrary.org/b/isbn/" + livro.id_livro + "-L.jpg";
    capa.alt = "Capa do livro " + livro.titulo;

    const info = document.createElement("div");
    info.classList.add("infoLivro");

    const titulo = document.createElement("h2");
    titulo.textContent = livro.titulo;

    const autor = document.createElement("p");
    autor.textContent = livro.nm_autor || "";

    info.append(titulo, autor);
    card.append(capa, info);

    function alternarSelecao() {
        const marcado = card.classList.toggle("selecionado");
        card.setAttribute("aria-pressed", String(marcado));
        if (marcado) {
            livrosSelecionados.push(livro.id_livro);
        } else {
            livrosSelecionados = livrosSelecionados.filter(function (id) {
                return id !== livro.id_livro;
            });
        }
    }

    card.addEventListener("click", alternarSelecao);
    card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            alternarSelecao();
        }
    });

    return card;
}

// Salva cada livro marcado na biblioteca do usuário como "lido".
function salvarLivros() {
    const codigoUsuario = sessionStorage.getItem("codigo");
    const requisicoes = [];

    for (let i = 0; i < livrosSelecionados.length; i++) {
        const codigoLivro = livrosSelecionados[i];

        const requisicao = fetch("../api/cadastrarBiblioteca.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                codigoUsuario: codigoUsuario,
                codigoLivro: codigoLivro,
                status: "lido"
            })
        })
        .then(function (resposta) {
            return resposta.json();
        })
        .then(function (resultado) {
            if (resultado.status === "true") {
                return true;
            }
            // Se o botão for clicado de novo depois de um erro, os livros que já
            // foram salvos voltam com esse aviso. Pra gente, isso conta como salvo.
            if (mensagemDaApi(resultado) === "Este livro ja esta na sua biblioteca.") {
                return true;
            }
            console.error("Erro no livro", codigoLivro, resultado);
            return false;
        })
        .catch(function (erro) {
            console.error("Erro no livro", codigoLivro, erro);
            return false;
        });

        requisicoes.push(requisicao);
    }

    return Promise.all(requisicoes).then(function (resultados) {
        return resultados.every(function (deuCerto) {
            return deuCerto;
        });
    });
}

// Quarta tela do cadastro.
function criarTelaPasso4() {
    // TODO: montar aqui a tela 4. Enquanto ela não existe, vai para a homepage.
    window.location.href = "homepage.html";
}