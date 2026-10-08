const areaLivros = document.querySelector("main > section");
const avatar = document.querySelector("header > img");
avatar.src=`../img/${sessionStorage.getItem("codigo")}.png`;
console.log("js conectado")
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
                    sessionStorage.setItem("idLivro", idLivro);
                    window.location.href = "livro.html";
                });
            }
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