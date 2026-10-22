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
let generosDisponiveis = [];
const preferenciasGravadas = new Set();
let ultimaBuscaLivros = 0;

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
            entrar().then(buscarGeneros).catch(function () { erroNoCadastro(ERRO_CONEXAO); });
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

    return fetch("../api/acessar.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, senha: senha})
    })
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        if ((resultado.status === "true" || resultado.status === true) && resultado.resultado && resultado.resultado[0]) {
            usuario = resultado.resultado[0];
            sessionStorage.setItem("codigo", usuario.id_usuario);
            sessionStorage.setItem("usuario", JSON.stringify(usuario));
        } else {
            throw new Error(mensagemDaApi(resultado));
        }
    })
    .catch(function (erro) {
        console.error(erro);
        throw erro;
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
    formulario.addEventListener("submit", function (e) {
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
            entrar().then(buscarGeneros).catch(function () { erroNoCadastro(ERRO_CONEXAO); });
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
    generosDisponiveis = generos;
    const tela = document.getElementById("templateGeneros").content.cloneNode(true);
    const selecaoGenero = tela.querySelector(".selecaoGenero");
    const erroGeneros = tela.querySelector(".mensagemErro");
    const proximo = tela.querySelector("#btnIrPasso3");
    const imagens = {
        romance: "Romance", suspense: "Suspense", fantasia: "Fantasia", biografia: "Biografia",
        ficcaohistorica: "FiccaoHistorica", ficcaocientifica: "FiccaoCientifica", poesia: "Poesia",
        terror: "Terror", aventura: "Aventura", autoajuda: "AutoAjuda", filosofia: "Filosofia", drama: "Drama"
    };
    generos.forEach(function (genero) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "botaoGenero";
        botao.dataset.codigo = genero.id_genero;
        botao.setAttribute("aria-label", genero.nm_genero);
        const marcado = generosSalvos.includes(genero.id_genero);
        botao.classList.toggle("ativo", marcado);
        botao.setAttribute("aria-pressed", String(marcado));
        botao.disabled = preferenciasGravadas.has(genero.id_genero);
        if (botao.disabled) botao.title = "Preferência já salva";
        const chave = genero.nm_genero.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
        if (imagens[chave]) {
            const imagem = document.createElement("img");
            imagem.src = "../img/genero" + imagens[chave] + ".png";
            imagem.alt = genero.nm_genero;
            imagem.addEventListener("error", function () { imagem.remove(); botao.textContent = genero.nm_genero; }, { once: true });
            botao.append(imagem);
        } else {
            botao.textContent = genero.nm_genero;
        }
        botao.addEventListener("click", function () {
            const selecionado = botao.classList.toggle("ativo");
            botao.setAttribute("aria-pressed", String(selecionado));
            if (selecionado) generosSalvos.push(genero.id_genero);
            else generosSalvos = generosSalvos.filter(function (id) { return id !== genero.id_genero; });
        });
        selecaoGenero.append(botao);
    });
    tela.querySelector(".voltarConta").addEventListener("click", function () {
        main.className = "containerCadastro";
        main.replaceChildren(formulario);
        btnProximo.disabled = false;
        document.querySelector(".cabecalhoCadastro h1").focus();
    });
    proximo.addEventListener("click", function () {
        if (proximo.disabled) return;
        if (!generosSalvos.length) { mostrarErro(erroGeneros, "Selecione pelo menos um gênero."); return; }
        if (!sessionStorage.getItem("codigo")) { mostrarErro(erroGeneros, ERRO_SERVIDOR); return; }
        proximo.disabled = true;
        salvarGeneros().then(function (sucesso) {
            if (sucesso) criarTelaPasso3();
            else { mostrarErro(erroGeneros, ERRO_SERVIDOR); proximo.disabled = false; }
        });
    });
    main.className = "cadastroEtapas";
    main.replaceChildren(tela);
    document.getElementById("tituloGeneros").focus();
}

function salvarGeneros() {
    const codigoUsuario = sessionStorage.getItem("codigo");
    const requisicoes = [];

    for (let i = 0; i < generosSalvos.length; i++) {
        const codigoGenero = generosSalvos[i];
        if (preferenciasGravadas.has(codigoGenero)) continue;
        // O cadastrarPreferencia.php lê $_GET, então os dados vão na URL.
        const url = "../api/cadastrarPreferencia.php?codigoUsuario=" + codigoUsuario + "&codigoGenero=" + codigoGenero;

        const requisicao = fetch(url, { method: "POST" })
        .then(function (resposta) {
            return resposta.json();
        })
        .then(function (resultado) {
            console.log("Gênero", codigoGenero, resultado);
            const sucesso = resultado.status === "true" || resultado.status === true;
            if (sucesso) preferenciasGravadas.add(codigoGenero);
            return sucesso;
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
    const tela = document.getElementById("templateLeituras").content.cloneNode(true);
    const pesquisa = tela.querySelector(".barraPesquisaInterna");
    const campo = pesquisa.querySelector("input");
    const titulo = tela.querySelector(".tituloResultados");
    const lista = tela.querySelector(".listaLivros");
    const erro = tela.querySelector(".mensagemErro");
    const proximo = tela.querySelector("#btnIrPasso4");
    tela.querySelector(".voltarGeneros").addEventListener("click", function () { criarTelaGeneros(generosDisponiveis); });
    pesquisa.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!campo.value.trim()) { mostrarErro(erro, "Digite o nome de um livro para pesquisar."); return; }
        buscarLivrosTitulo(campo.value.trim(), titulo, lista, erro);
    });
    proximo.addEventListener("click", function () {
        if (proximo.disabled) return;
        if (!livrosSelecionados.length) { criarTelaPasso4(); return; }
        proximo.disabled = true;
        salvarLivros().then(function (sucesso) {
            if (sucesso) criarTelaPasso4();
            else { mostrarErro(erro, ERRO_SERVIDOR); proximo.disabled = false; }
        });
    });
    main.className = "cadastroEtapas";
    main.replaceChildren(tela);
    atualizarQuantidadeLivros();
    document.getElementById("tituloLeituras").focus();
}

function atualizarQuantidadeLivros() {
    const quantidade = document.querySelector(".quantidadeSelecionada");
    if (quantidade) quantidade.textContent = livrosSelecionados.length + (livrosSelecionados.length === 1 ? " livro selecionado" : " livros selecionados");
}

function buscarLivrosTitulo(texto, tituloResultados, listaLivros, erroLivros) {
    const buscaAtual = ++ultimaBuscaLivros;
    erroLivros.classList.add("escondido");
    listaLivros.setAttribute("aria-busy", "true");
    tituloResultados.textContent = "Buscando livros...";
    fetch("../api/buscarLivroTitulo.php?titulo=" + encodeURIComponent(texto))
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        if (buscaAtual !== ultimaBuscaLivros) return;
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
        if (buscaAtual !== ultimaBuscaLivros) return;
        console.error(erro);
        mostrarErro(erroLivros, ERRO_CONEXAO);
    })
    .finally(function () { if (buscaAtual === ultimaBuscaLivros) listaLivros.setAttribute("aria-busy", "false"); });
}

function criarCardLivro(livro) {
    const card = document.createElement("article");
    card.classList.add("cardLivro");
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    // Se o livro já foi marcado numa pesquisa anterior, aparece marcado de novo.
    const jaSelecionado = livrosSelecionados.includes(livro.id_livro);
    card.setAttribute("aria-label", "Selecionar " + livro.titulo);
    card.classList.toggle("selecionado", jaSelecionado);
    card.setAttribute("aria-pressed", String(jaSelecionado));

    const capa = document.createElement("img");
    // Mesmo esquema do livros.js: o id do livro é o ISBN.
    capa.src = "https://covers.openlibrary.org/b/isbn/" + livro.id_livro + "-L.jpg";
    capa.alt = "Capa do livro " + livro.titulo;
    capa.className = "capaLivroCard";
    capa.addEventListener("error", function () {
        const aviso = document.createElement("div");
        aviso.className = "capaLivroCard capaIndisponivel";
        aviso.textContent = "Capa indisponível";
        capa.replaceWith(aviso);
    }, { once: true });

    const info = document.createElement("div");
    info.classList.add("infoLivro");

    const titulo = document.createElement("h2");
    titulo.textContent = livro.titulo;

    const autor = document.createElement("p");
    autor.textContent = livro.autores || livro.nm_autor || "";

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
        atualizarQuantidadeLivros();
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

        console.log(codigoLivro, codigoUsuario)

        const requisicao = fetch("../api/cadastrarBiblioteca.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                codigoUsuario: codigoUsuario,
                codigoLivro: codigoLivro,
                status: "lido",
                favorito: 0,
                visivel: 1
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
    window.location.href = "seguirAmigos.html";
}
