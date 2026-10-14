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
            // Confira: o cadastrar.php do zip lê $corpo['nascimento'], não 'dataNascimento'.
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

// O cadastro não devolve o código do usuário, e ele é necessário para salvar os gêneros.
// Por isso o login é feito na hora de salvar: "depois" roda se der certo, "aoFalhar" se der errado.
function entrar(depois, aoFalhar) {
    fetch("../api/acessar.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: txtEmail.value.trim(), senha: txtSenha1.value.trim() })
    })
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        if (resultado.status === "true") {
            usuario = resultado.resultado[0];
            sessionStorage.setItem("codigo", usuario.id_usuario);
            sessionStorage.setItem("usuario", JSON.stringify(usuario));
            depois();
        } else {
            console.error(resultado);
            aoFalhar(mensagemDaApi(resultado));
        }
    })
    .catch(function (erro) {
        console.error(erro);
        aoFalhar(ERRO_CONEXAO);
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
        salvarGeneros(secao);
    });

    card.append(cabecalho, selecaoGenero, erroGeneros, btnIrPasso3);
    secao.append(card);

    // Só limpa o formulário quando a tela nova está pronta. Se limpar antes e der erro
    // no meio do caminho, a mensagem de erro some junto e a página fica em branco.
    container.textContent = "";
    container.append(secao);
    return secao;
}

function salvarGeneros(secao) {
    const erroGeneros = secao.querySelector(".mensagemErro");
    const btnIrPasso3 = secao.querySelector("#btnIrPasso3");
    const botoes = Array.from(secao.querySelectorAll(".selecaoGenero button"));
    const escolhidos = [];
    botoes.forEach(function (botao) {
        if (botao.classList.contains("ativo")) {
            escolhidos.push(botao.dataset.codigo);
        }
    });

    if (escolhidos.length === 0) {
        mostrarErro(erroGeneros, "Escolha pelo menos um gênero para continuar.");
        return;
    }
    erroGeneros.classList.add("escondido");

    function travar(valor) {
        btnIrPasso3.disabled = valor;
        botoes.forEach(function (botao) {
            botao.disabled = valor;
        });
    }

    // Salva um gênero por vez: quando um termina, chama o próximo da lista.
    function salvarGenero(posicao) {
        if (posicao === escolhidos.length) {
            criarTelaPasso3();
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
    if (usuario === null) {
        entrar(function () {
            salvarGenero(0);
        }, function (mensagem) {
            mostrarErro(erroGeneros, mensagem);
            travar(false);
        });
    } else {
        salvarGenero(0);
    }
}

// Terceira tela do cadastro: aparece depois que os gêneros foram salvos.
function criarTelaPasso3() {
    // TODO: montar aqui a tela 3. Enquanto ela não existe, vai para a homepage.
    window.location.href = "homepage.html";
}