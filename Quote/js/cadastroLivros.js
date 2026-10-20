// Etapa 3: pesquisa e gravação dos livros já lidos.
let livrosSelecionados = [];

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
    return;
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

