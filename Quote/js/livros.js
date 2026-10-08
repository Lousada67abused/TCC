const areaLivros = document.querySelector(".areaLivros");
const containerDetalhesLivro = document.querySelector(".containerDetalhesLivro");
const avatar = document.querySelector("header > img");
avatar.src=`../img/${sessionStorage.getItem("codigo")}.png`;
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

if (containerDetalhesLivro){
    fetch("../api/buscarLivroCodigo.php?codigo=" + sessionStorage.getItem("codigoLivro"), {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    })
    .then(function (resposta) {
        return resposta.json();
    })
    .then(function (resultado) {
        const dados = resultado.resposta[0];
        console.log(resultado.resposta[0])
        
        let deuCerto = null;
        if (resultado.status){
            deuCerto = true
        } else{
            deuCerto = false;
        }
        
        if (deuCerto) {
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
            paginas.textContent = dados.qnt_paginas;
            ano.textContent = dados.ano_publicacao;
            editora.textContent = dados.nm_editora;
            sinopse.textContent = dados.sinopse;

        }
        
    })
    .catch(function (erro) {
        console.error(erro);
    });
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
    autor.textContent = livro.nm_autor;
 
    textoLivro.appendChild(titulo);
    textoLivro.appendChild(autor);
 
    // const areaEstrelas = document.createElement("div");
    // areaEstrelas.className = "areaEstrelas";
 
    // const nota = Number(livro.nota) || 0;
 
    // const textoNota = document.createElement("p");
    // textoNota.textContent = nota.toFixed(1);
    // areaEstrelas.appendChild(textoNota);
 
    // const estrelasCheias = Math.round(nota);
 
    // for (let i = 1; i <= 5; i++) {
    //     const estrela = document.createElement("img");
 
    //     if (i <= estrelasCheias) {
    //         estrela.src = "../img/estrela-cheia.svg";
    //         estrela.alt = "Estrela cheia";
    //     } else {
    //         estrela.src = "../img/estrela-vazia.svg";
    //         estrela.alt = "Estrela vazia";
    //     }
 
    //     areaEstrelas.appendChild(estrela);
    // }
 
    divLivro.appendChild(capa);
    divLivro.appendChild(textoLivro);
    // divLivro.appendChild(areaEstrelas);
 
    return divLivro;
}