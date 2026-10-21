const tituloBusca = document.querySelector(".tituloBusca");
const botoesFiltro = document.querySelectorAll(".filtros button");
const resultadoLivros = document.querySelector(".resultadoLivros");
const resultadoLeitores = document.querySelector(".resultadoLeitores");
const areaLivros = document.querySelector(".areaLivros");
const listaLeitores = document.querySelector(".listaLeitores");
const subtitulos = document.querySelectorAll(".subtituloBusca");
const erroBusca = document.querySelector(".mensagemErro");
const txtPesquisaBusca = document.getElementById("txtPesquisaBusca");
const btnPesquisaBusca = document.getElementById("btnPesquisaBusca");

const ERRO_CONEXAO = "Não foi possível acessar o servidor. Por favor, tente novamente mais tarde.";

// O termo e o filtro vêm da URL: busca.html?termo=delirio&filtro=livros
const parametros = new URLSearchParams(location.search);
const termo = (parametros.get("termo") || "").trim();
let filtroAtual = parametros.get("filtro") || "geral";

let livrosEncontrados = [];
let leitoresEncontrados = [];

// Tira acento e deixa minúsculo, para "ficcao" achar "Ficção".
function normalizar(texto) {
    return (texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function contemTermo(texto) {
    return normalizar(texto).includes(normalizar(termo));
}

function criarLivro(livro) {
    const divLivro = document.createElement("div");
    divLivro.className = "livro";
    divLivro.dataset.idLivro = livro.id_livro;

    const capa = document.createElement("img");
    capa.src = "https://covers.openlibrary.org/b/isbn/" + livro.id_livro + "-L.jpg";
    capa.alt = "Capa do livro " + livro.titulo;

    const textoLivro = document.createElement("div");
    textoLivro.className = "textoLivro";

    const titulo = document.createElement("h2");
    titulo.textContent = livro.titulo;

    const autor = document.createElement("p");
    autor.textContent = livro.autores || "";

    textoLivro.append(titulo, autor);
    divLivro.append(capa, textoLivro);

    divLivro.addEventListener("click", function () {
        sessionStorage.setItem("codigoLivro", livro.id_livro);
        window.location.href = "livro.html";
    });
    return divLivro;
}

function mostrarResultados() {
    for (let i = 0; i < botoesFiltro.length; i++) {
        botoesFiltro[i].classList.toggle("ativo", botoesFiltro[i].dataset.filtro === filtroAtual);
    }

    let livros = [];
    if (filtroAtual === "geral") {
        livros = livrosEncontrados;
    } else if (filtroAtual === "livros") {
        livros = livrosEncontrados.filter(function (livro) { return contemTermo(livro.titulo); });
    } else if (filtroAtual === "generos") {
        livros = livrosEncontrados.filter(function (livro) { return contemTermo(livro.generos); });
    } else if (filtroAtual === "autores") {
        livros = livrosEncontrados.filter(function (livro) { return contemTermo(livro.autores); });
    }

    let leitores = [];
    if (filtroAtual === "geral" || filtroAtual === "leitores") {
        leitores = leitoresEncontrados;
    }

    areaLivros.textContent = "";
    for (let i = 0; i < livros.length; i++) {
        areaLivros.appendChild(criarLivro(livros[i]));
    }

    listaLeitores.textContent = "";
    for (let i = 0; i < leitores.length; i++) {
        listaLeitores.appendChild(criarCardLeitor(leitores[i]));
    }

    resultadoLivros.classList.toggle("escondido", livros.length === 0);
    resultadoLeitores.classList.toggle("escondido", leitores.length === 0);

    // Os subtítulos "Livros" e "Leitores" só aparecem na aba geral.
    for (let i = 0; i < subtitulos.length; i++) {
        subtitulos[i].classList.toggle("escondido", filtroAtual !== "geral");
    }

    if (livros.length === 0 && leitores.length === 0) {
        erroBusca.textContent = "Nenhum resultado encontrado.";
        erroBusca.classList.remove("escondido");
    } else {
        erroBusca.classList.add("escondido");
    }
}

function buscarJson(url) {
    return fetch(url).then(function (resposta) {
        return resposta.json();
    });
}

function pesquisar() {
    tituloBusca.textContent = "Exibindo resultados para “" + termo + "”";
    txtPesquisaBusca.value = termo;
    txtPesquisaHeader.value = termo;

    Promise.all([
        buscarJson("../api/filtrarlivro.php?filtro=" + encodeURIComponent(termo)),
        buscarJson("../api/buscarUsuarioNome.php?nome=" + encodeURIComponent(termo))
    ])
    .then(function (resultados) {
        console.log(resultados);
        livrosEncontrados = resultados[0].status === "true" ? resultados[0].resposta : [];
        leitoresEncontrados = resultados[1].status === "true" ? resultados[1].resposta : [];
        mostrarResultados();
    })
    .catch(function (erro) {
        console.error(erro);
        erroBusca.textContent = ERRO_CONEXAO;
        erroBusca.classList.remove("escondido");
    });
}

for (let i = 0; i < botoesFiltro.length; i++) {
    botoesFiltro[i].addEventListener("click", function () {
        filtroAtual = this.dataset.filtro;
        history.replaceState(null, "", "?termo=" + encodeURIComponent(termo) + "&filtro=" + filtroAtual);
        mostrarResultados();
    });
}

// A pesquisa do celular funciona igual à do cabeçalho.
function pesquisarMobile() {
    const novoTermo = txtPesquisaBusca.value.trim();
    if (novoTermo !== "") {
        window.location.href = "busca.html?termo=" + encodeURIComponent(novoTermo) + "&filtro=" + filtroAtual;
    }
}

txtPesquisaBusca.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        pesquisarMobile();
    }
});
btnPesquisaBusca.addEventListener("click", pesquisarMobile);

if (termo !== "") {
    pesquisar();
} else {
    resultadoLivros.classList.add("escondido");
    resultadoLeitores.classList.add("escondido");
}
