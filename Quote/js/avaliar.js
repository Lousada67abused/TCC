const titulo = document.querySelector(".tituloLivroDestaque");
const autorNome = document.querySelector(".tituloLivroDestaque");

const txtResenha = document.querySelector("#txtResenha");
const btnPublicar = document.querySelector(".btnPublicar");

console.log(sessionStorage.getItem("codigo"));

console.log(sessionStorage.getItem("codigoLivro"));

if (btnPublicar) {
    btnPublicar.addEventListener("click", function (e) {
        e.preventDefault();

        if (txtResenha.value === "") {
            document.querySelector(".mensagemErro").textContent = "O campo de resenha está vazio.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() =>{
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
            return;
        }   
        
        const resenha = txtResenha.value.trim();
        const codigoUsuario = sessionStorage.getItem("codigo");
        const codigoLivro = sessionStorage.getItem("codigoLivro");
        const nota = 3;
        console.log(codigoLivro, codigoUsuario, nota, resenha)

        fetch("../api/avaliarLivro.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigoUsuario: codigoUsuario, codigoLivro: codigoLivro, nota: nota, resenha: resenha})
        })
        .then(function (resposta) {
            return resposta.json();
        })
        .then(function (resultado) {
            console.log(resultado);
            let deuCerto = null;
            if (resultado.status){
                deuCerto = true
            }else{
                deuCerto = false;
            }
        
            if (deuCerto) {              
                console.log("certo")
                
            } else {
                console.log("erro")
                // document.querySelector(".mensagemErro").textContent = "Erro no servidor.";
                // document.querySelector(".mensagemErro").classList.remove("escondido");
                // setTimeout(() =>{
                //     document.querySelector(".mensagemErro").classList.add("escondido");
                // }, 5000);
            }
        })
        .catch(function (erro) {
            console.error(erro);
            document.querySelector(".mensagemErro").textContent = "Não foi possível acessar o servidor. Por favor, tente novamente mais tarde.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() => {
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
            return;
        });
    });
}
