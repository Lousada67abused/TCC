// Etapa 2: seleção e gravação dos gêneros favoritos.
let generosSalvos = [];

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

