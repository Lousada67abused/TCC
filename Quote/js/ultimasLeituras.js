// Últimas leituras: pesquisa, seleção e inclusão na biblioteca.
(() => {
    const formulario = document.getElementById("formPesquisaLivros");
    const pesquisa = document.getElementById("txtPesquisaLivros");
    const lista = document.getElementById("listaLivros");
    const titulo = document.getElementById("tituloResultados");
    const mensagem = document.getElementById("mensagemLivros");
    const contador = document.getElementById("contadorLivros");
    const proximo = document.getElementById("btnProximo");
    const codigoUsuario = sessionStorage.getItem("codigo");
    const selecionados = new Set();
    const salvos = new Set();
    let numeroBusca = 0;
    let salvando = false;

    if (!codigoUsuario) {
        window.location.replace("cadastro.html");
        return;
    }

    function avisar(texto) {
        mensagem.textContent = texto;
        mensagem.hidden = !texto;
    }

    function atualizarContador() {
        const total = selecionados.size;
        contador.textContent = total + (total === 1 ? " livro selecionado" : " livros selecionados");
        proximo.textContent = total ? "Salvar e continuar" : "Pular esta etapa";
    }

    function criarCard(livro) {
        const codigo = String(livro.id_livro);
        const card = document.createElement("button");
        card.type = "button";
        card.className = "cardLivroResultado";
        const capa = document.createElement("img");
        capa.className = "capaLivroCard";
        capa.src = "https://covers.openlibrary.org/b/isbn/" + encodeURIComponent(codigo) + "-L.jpg";
        capa.alt = "Capa de " + livro.titulo;
        capa.loading = "lazy";
        capa.addEventListener("error", function () {
            capa.hidden = true;
        });
        const nome = document.createElement("span");
        nome.className = "tituloLivroCard";
        nome.textContent = livro.titulo;
        const autor = document.createElement("span");
        autor.className = "autorLivroCard";
        autor.textContent = livro.nm_autor || "Autor não informado";
        function atualizar() {
            const marcado = selecionados.has(codigo);
            card.classList.toggle("selecionado", marcado);
            card.setAttribute("aria-pressed", String(marcado));
        }
        card.addEventListener("click", function () {
            if (salvando) return;
            if (selecionados.has(codigo)) selecionados.delete(codigo);
            else selecionados.add(codigo);
            atualizar();
            atualizarContador();
        });
        atualizar();
        card.append(capa, nome, autor);
        return card;
    }

    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        if (salvando) return;
        const buscaAtual = ++numeroBusca;
        const texto = pesquisa.value.trim();
        avisar("");
        if (!texto) {
            lista.setAttribute("aria-busy", "false");
            avisar("Digite o título de um livro para pesquisar.");
            pesquisa.focus();
            return;
        }
        titulo.textContent = "Buscando livros…";
        lista.setAttribute("aria-busy", "true");
        try {
            const resposta = await fetch("../../quote/api/buscarLivroTitulo.php?titulo=" + encodeURIComponent(texto));
            const dados = await resposta.json();
            if (buscaAtual !== numeroBusca) return;
            if (!resposta.ok || dados.status !== "true" || !Array.isArray(dados.resposta)) {
                throw new Error("Resposta inválida");
            }
            lista.replaceChildren();
            const vistos = new Set();
            dados.resposta.forEach(function (livro) {
                if (livro.id_livro == null || vistos.has(String(livro.id_livro))) return;
                vistos.add(String(livro.id_livro));
                lista.append(criarCard(livro));
            });
            titulo.textContent = vistos.size ? 'Resultados para "' + texto + '"' : 'Nenhum livro encontrado para "' + texto + '"';
        } catch (erro) {
            if (buscaAtual !== numeroBusca) return;
            titulo.textContent = "Não foi possível concluir a busca";
            avisar("Não foi possível buscar os livros. Tente novamente.");
        } finally {
            if (buscaAtual === numeroBusca) lista.setAttribute("aria-busy", "false");
        }
    });

    proximo.addEventListener("click", async function () {
        if (salvando) return;
        if (!selecionados.size) {
            window.location.href = "seguirAmigos.html";
            return;
        }
        salvando = true;
        proximo.disabled = true;
        proximo.textContent = "Salvando…";
        avisar("");
        try {
            for (const codigoLivro of selecionados) {
                if (salvos.has(codigoLivro)) continue;
                const resposta = await fetch("../../quote/api/cadastrarBiblioteca.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ codigoUsuario, codigoLivro, status: "lido", visivel: 1 })
                });
                const dados = await resposta.json();
                const duplicado = typeof dados.erro === "string" && dados.erro.includes("Este livro ja esta na sua biblioteca.");
                if (!(resposta.ok && dados.status === "true") && !duplicado) throw new Error("Falha ao salvar");
                salvos.add(codigoLivro);
            }
            window.location.href = "seguirAmigos.html";
        } catch (erro) {
            avisar("Não foi possível salvar todos os livros. Tente novamente para concluir.");
        } finally {
            salvando = false;
            proximo.disabled = false;
            atualizarContador();
        }
    });

    atualizarContador();
})();
