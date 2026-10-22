const areaLivros = document.querySelector(".areaLivros");
const containerDetalhesLivro = document.querySelector(".containerDetalhesLivro");

if (areaLivros){
    fetch("../api/recomendarLivroUsuario.php?codigoUsuario=" + sessionStorage.getItem("codigo"), {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    })
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        console.log(resultado);
        
        let deuCerto = null;
        if (resultado.status){
            deuCerto = true
        } else{
            deuCerto = false;
        }
        
        if (deuCerto) {
            const livros = resultado.resultado;
            for (let i = 0; i < livros.length; i++) {
                const livro = livros[i];
                const divLivro = criarLivro(livro);
                areaLivros.appendChild(divLivro);
                
                divLivro.addEventListener("click", function () {
                    const idLivro = this.dataset.idLivro;
                    sessionStorage.setItem("codigoLivro", idLivro);
                    console.log(sessionStorage.getItem("codigoLivro"));
                    window.location.href = "livro.html";
                });
            }
        }
        
    })
    .catch(function (erro) {
        console.error(erro);
    });
}

if (containerDetalhesLivro) {
    fetch("../api/buscarLivroCodigo.php?codigo=" + sessionStorage.getItem("codigoLivro"), {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    })
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        const deuCerto = resultado.status === true || resultado.status === "true";

        if (deuCerto && resultado.resposta && resultado.resposta.length > 0) {
            const dados = resultado.resposta[0];
            console.log(resultado)
            const titulo = document.querySelector(".tituloLivroDestaque");
            const autorNome = document.querySelector(".autorNome");
            const paginas = document.getElementById("qtdPaginas");
            const ano = document.getElementById("ano");
            const genero = document.getElementById("genero");
            const editora = document.getElementById("editora");
            const sinopse = document.querySelector(".sinopseLivro p");
            const capa = document.querySelector(".capaDestaque");

            capa.src = "https://covers.openlibrary.org/b/isbn/" + dados.id_livro + "-L.jpg";
            titulo.textContent = dados.titulo;
            autorNome.textContent = dados.nm_autor;
            paginas.textContent = dados.qnt_paginas;
            ano.textContent = dados.ano_publicacao;
            editora.textContent = dados.nm_editora;
            genero.textContent = dados.nm_genero;
            sinopse.textContent = dados.sinopse;

            const areaEstrelas = document.querySelector(".avaliacaoResumo .estrelasExibicao");
            areaEstrelas.innerHTML = "";

            const nota = Number(String(dados.nota_media ?? 0).replace(",", ".")) || 0;
            const estrelasCheias = Math.round(Math.min(5, Math.max(0, nota)));

            areaEstrelas.setAttribute("aria-label", "Avaliação média: " + nota.toFixed(1));

            for (let i = 1; i <= 5; i++) {
                const estrela = document.createElement("span");
                estrela.className = "material-symbols-outlined";
                estrela.textContent = "star";
                estrela.classList.add(i <= estrelasCheias ? "estrelaCheia" : "estrelaVazia");

                areaEstrelas.appendChild(estrela);
            }
        }
    })
    .catch(function (erro) {
        console.error(erro);
    });
}

function criarLivro(livro) {
    const divLivro = document.createElement("article");
    divLivro.className = "cardLivro";
    divLivro.dataset.idLivro = livro.id_livro;

    const capa = document.createElement("img");
    capa.className = "capaLivro";
    capa.src = "https://covers.openlibrary.org/b/isbn/" + livro.id_livro + "-L.jpg";
    capa.alt = livro.titulo;

    const titulo = document.createElement("h3");
    titulo.className = "tituloLivro";
    titulo.textContent = livro.titulo;

    const autor = document.createElement("p");
    autor.className = "autorLivro";
    autor.textContent = livro.autores;

    const areaEstrelas = document.createElement("div");
    areaEstrelas.className = "areaEstrelas";

    const nota = Number(livro.nota_media) || 0;
    const pNota = document.createElement("p");
    pNota.textContent = nota.toFixed(1);
    
    
    
    const estrelasCheias = Math.round(nota);
    for (let i = 1; i <= 5; i++) {
        const estrela = document.createElement("span");
        estrela.className = "material-symbols-outlined estrelaVazia";
        estrela.textContent = "star";
        estrela.classList.add("estrelaVazia");
        
        if (i <= estrelasCheias) {
            estrela.className = "material-symbols-outlined estrelaCheia";
        }
        
        areaEstrelas.appendChild(estrela);
    }
    
    areaEstrelas.append(pNota);
    divLivro.appendChild(capa);
    divLivro.appendChild(titulo);
    divLivro.appendChild(autor);
    divLivro.appendChild(areaEstrelas);

    return divLivro;
}