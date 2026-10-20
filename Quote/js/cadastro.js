// Etapa 1: validação, criação da conta e login.
let contaCriada = false;
let usuario = null;

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

