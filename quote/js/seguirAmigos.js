// Último passo do cadastro: procurar amigos pelo nome e seguir.
const txtPesquisaAmigos = document.getElementById("txtPesquisaAmigos");
const btnPesquisaAmigos = document.getElementById("btnPesquisaAmigos");
const tituloAmigos = document.querySelector(".tituloAmigos");
const listaLeitores = document.querySelector(".listaLeitores");
const erroAmigos = document.querySelector(".mensagemErro");

function mostrarErro(mensagem) {
    erroAmigos.textContent = mensagem;
    erroAmigos.classList.remove("escondido");
    clearTimeout(erroAmigos.temporizador);
    erroAmigos.temporizador = setTimeout(function () {
        erroAmigos.classList.add("escondido");
    }, 5000);
}

function pesquisarAmigos() {
    const nome = txtPesquisaAmigos.value.trim();
    if (nome === "") {
        mostrarErro("Digite o nome de um amigo para pesquisar.");
        return;
    }

    fetch("../api/buscarUsuarioNome.php?nome=" + encodeURIComponent(nome))
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        console.log(resultado);
        if (resultado.status !== "true") {
            mostrarErro("Erro no servidor. Por favor, tente novamente mais tarde.");
            return;
        }

        listaLeitores.textContent = "";
        const usuarios = resultado.resposta;
        if (usuarios.length === 0) {
            tituloAmigos.textContent = "Nenhum leitor encontrado para “" + nome + "”";
            return;
        }

        tituloAmigos.textContent = "Exibindo resultados para “" + nome + "”";
        for (let i = 0; i < usuarios.length; i++) {
            listaLeitores.appendChild(criarCardLeitor(usuarios[i]));
        }
    })
    .catch(function (erro) {
        console.error(erro);
        mostrarErro("Não foi possível acessar o servidor. Por favor, tente novamente mais tarde.");
    });
}

txtPesquisaAmigos.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        pesquisarAmigos();
    }
});
btnPesquisaAmigos.addEventListener("click", pesquisarAmigos);

txtPesquisaAmigos.focus();
