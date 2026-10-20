// Etapa 3: pesquisa e gravação dos livros já lidos.
let livrosSelecionados = [];

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
    card.classList.add("cardLivroResultado");
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    // Se o livro já foi marcado numa pesquisa anterior, aparece marcado de novo.
    const jaSelecionado = livrosSelecionados.includes(livro.id_livro);
    card.classList.toggle("selecionado", jaSelecionado);
    card.setAttribute("aria-pressed", String(jaSelecionado));

    const capa = document.createElement("img");
    // Mesmo esquema do livros.js: o id do livro é o ISBN.
    capa.src = "https://covers.openlibrary.org/b/isbn/" + livro.id_livro + "-L.jpg";
    capa.classList.add("capaLivroCard");
    capa.alt = "Capa do livro " + livro.titulo;

    const info = document.createElement("div");
    info.classList.add("infoLivro");

    const titulo = document.createElement("h2");
    titulo.classList.add("tituloLivroCard");
    titulo.textContent = livro.titulo;

    const autor = document.createElement("p");
    autor.classList.add("autorLivroCard");
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

        console.log(codigoLivro, codigoUsuario)

        const requisicao = fetch("../api/cadastrarBiblioteca.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                codigoUsuario: codigoUsuario,
                codigoLivro: codigoLivro,
                status: "lido",
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


const camposPesquisa = document.querySelectorAll(".barraPesquisaInterna input, .barraPesquisaMobileHeader input");
const tituloResultados = document.querySelector(".tituloResultados");
const listaLivros = document.querySelector(".gridResultadosLivros");
const erroLivros = document.querySelector(".mensagemErro");
const btnProximo = document.querySelector(".btnProximo");

function pesquisarLivros(campo) {
    const texto = campo.value.trim();
    camposPesquisa.forEach(function (input) { input.value = campo.value; });
    if (texto === "") {
        mostrarErro(erroLivros, "Digite o nome de um livro para pesquisar.");
        return;
    }
    buscarLivrosTitulo(texto, tituloResultados, listaLivros, erroLivros);
}

if (!sessionStorage.getItem("codigo")) {
    window.location.href = "cadastro.html";
} else {
    camposPesquisa.forEach(function (campo) {
        campo.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                pesquisarLivros(campo);
            }
        });
        campo.parentElement.querySelector("span").addEventListener("click", function () {
            pesquisarLivros(campo);
        });
    });

    btnProximo.addEventListener("click", function () {
        if (btnProximo.disabled) return;
        if (livrosSelecionados.length === 0) {
            window.location.href = "seguirAmigos.html";
            return;
        }
        btnProximo.disabled = true;
        salvarLivros().then(function (todosSalvos) {
            if (todosSalvos) {
                window.location.href = "seguirAmigos.html";
            } else {
                mostrarErro(erroLivros, ERRO_SERVIDOR);
                btnProximo.disabled = false;
            }
        });
    });
}
