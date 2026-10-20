// Elementos e funções utilizados pelas etapas do cadastro.
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

