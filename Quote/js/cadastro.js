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

const ERRO_SERVIDOR = "Erro no servidor. Por favor, tente novamente mais tarde.";
const ERRO_CONEXAO = "Não foi possível acessar o servidor. Por favor, tente novamente mais tarde.";

let contaCriada = false;
let usuario = null;
let generosSalvos = [];

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

    fetch("../api/cadastrar.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nome: txtNome.value.trim(),
            email: txtEmail.value.trim(),
            dataNascimento: txtDataNascimento.value,
            biografia: biografia || null,
            senha: txtSenha1.value.trim(),
            tipo: tipo
        })
    })
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        console.log(resultado)
        if (resultado.status === "true") {
            buscarGeneros();
            container.textContent = "";
            
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

        cadastrarUsuario();
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
function nomeParaClasse(nome) {
    return nome
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
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
    
    const selecaoGenero = document.createElement("section");
    selecaoGenero.classList.add("selecaoGenero");
    for (let i = 0; i < generos.length; i++) {
        const genero = generos[i];
        console.log(genero.nm_genero)
        const botaoGenero = document.createElement("button");
        botaoGenero.textContent = genero.nm_genero;
        const fotoGenero = document.createElement("img");
        fotoGenero.src="../img/genero" + genero.nm_genero + ".png"
        fotoGenero.alt="Selecionar livros com gênero de " + genero.nm_genero
        botaoGenero.append(fotoGenero);
        selecaoGenero.append(botaoGenero);
    }

    const titulo = document.createElement("h1");
    titulo.textContent = "Selecione seus gêneros favoritos";

    cabecalho.append(btnVoltar, titulo);

    const btnProximo = document.createElement("button");
    btnProximo.type = "submit";
    btnProximo.id = "btnIrPasso3";

    const setaAvancar = document.createElement("span");
    setaAvancar.classList.add("material-symbols-outlined");
    setaAvancar.id = "line_end_arrow_notch";
    setaAvancar.textContent = "line_end_arrow_notch";

    btnProximo.append("próximo", setaAvancar);

    card.append(cabecalho, selecaoGenero, btnProximo);
    secao.append(card);

    container.append(secao);
    return secao;
}

function salvarGeneros(etapa) {
    const erroGeneros = etapa.querySelector(".mensagemErro");
    const btnConcluir = etapa.querySelector(".btnProximo");
    const caixas = Array.from(etapa.querySelectorAll(".invisivelInput"));
    const escolhidos = [];
    caixas.forEach(function (caixa) {
        if (caixa.checked) {
            escolhidos.push(caixa.value);
        }
    });

    if (escolhidos.length === 0) {
        mostrarErro(erroGeneros, "Escolha pelo menos um gênero para continuar.");
        return;
    }
    erroGeneros.classList.add("escondido");

    function travar(valor) {
        btnConcluir.disabled = valor;
        caixas.forEach(function (caixa) {
            caixa.disabled = valor;
        });
    }

    // Salva um gênero por vez: quando um termina, chama o próximo da lista.
    function salvarGenero(posicao) {
        if (posicao === escolhidos.length) {
            window.location.href = "homepage.html";
            return;
        }

        const codigoGenero = escolhidos[posicao];
        // Se o botão for clicado de novo depois de um erro, pula os que já foram salvos
        // (a procedure recusa preferência repetida).
        if (generosSalvos.includes(codigoGenero)) {
            salvarGenero(posicao + 1);
            return;
        }

        fetch("../api/cadastrarPreferencia.php?codigoUsuario=" + usuario.id_usuario + "&codigoGenero=" + codigoGenero, {
            method: "POST"
        })
        .then(function (resposta) {
            return resposta.json();
        })
        .then(function (resultado) {
            if (resultado.status === "true") {
                generosSalvos.push(codigoGenero);
                salvarGenero(posicao + 1);
            } else {
                console.error(resultado);
                mostrarErro(erroGeneros, ERRO_SERVIDOR);
                travar(false);
            }
        })
        .catch(function (erro) {
            console.error(erro);
            mostrarErro(erroGeneros, ERRO_CONEXAO);
            travar(false);
        });
    }

    travar(true);
    salvarGenero(0);
}