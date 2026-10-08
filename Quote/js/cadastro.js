const txtNome = document.getElementById("txtNome");
const txtDataNascimento = document.getElementById("txtDataNascimento");
const txtBiografia = document.getElementById("txtBiografia");
const txtEmail = document.getElementById("txtEmail");
const txtSenha1 = document.getElementById("txtSenha1");
const txtSenha2 = document.getElementById("txtSenha2");
const btnProximo = document.querySelector(".btnProximo");
console.log("cadastro.js carregado com sucesso!");

if (btnProximo) {
    btnProximo.addEventListener("click", function (e) {
        e.preventDefault();
        console.log("clicou")
        if (txtNome.value === "") {
            document.querySelector(".mensagemErro").textContent = "Por favor, digite o campo de nome.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() => {
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
            console.log("Nome não preenchido");
            return;
        }

        if (txtDataNascimento.value === "") {
            document.querySelector(".mensagemErro").textContent = "Por favor, digite o campo de data de nascimento.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() => {
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
            return;
        }

        if (txtEmail.value === "") {
            document.querySelector(".mensagemErro").textContent = "Por favor, digite o campo de email.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() => {
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
            return;
        }
        if (txtSenha1.value === "") {
            document.querySelector(".mensagemErro").textContent = "Por favor, digite o campo de senha.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() => {
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
            return;
        }
        if (txtSenha2.value === "") {
            document.querySelector(".mensagemErro").textContent = "Por favor, digite o campo de confirmação de senha.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() => {
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
            return;
        }

        if (txtSenha1.value !== txtSenha2.value) {
            document.querySelector(".mensagemErro").textContent = "As senhas não coincidem.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() => {
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
            return;
        }

        
        let biografia = null;
        if (txtBiografia.value.trim() !== ""){
            biografia = txtBiografia.value.trim();
        }

        const nome = txtNome.value.trim(); 
        const dataNascimento = txtDataNascimento.value.trim();
        const email = txtEmail.value.trim();
        const senha = txtSenha1.value.trim();

        fetch("../api/cadastrar.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: nome, nascimento: dataNascimento, biografia: biografia, email: email, senha: senha})
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
            console.log(deuCerto)
            if (deuCerto) {              
                fetch("../api/buscarGeneros.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                })
                .then(function (resposta) {
                    return resposta.json();
                })
                .then(function (resultado) {
                    
                    let deuCerto = null;
                    if (resultado.status){
                        deuCerto = true
                    }else{
                        deuCerto = false;
                    }
                
                    if (deuCerto) {              
                        const generos = resultado.generos;
                        criarTelaGeneros(generos);
                    } else {
                        document.querySelector(".mensagemErro").textContent = "Erro no servidor.";
                        document.querySelector(".mensagemErro").classList.remove("escondido");
                        setTimeout(() =>{
                            document.querySelector(".mensagemErro").classList.add("escondido");
                        }, 5000);
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
            } else {
                document.querySelector(".mensagemErro").textContent = "Erro no servidor.";
                document.querySelector(".mensagemErro").classList.remove("escondido");
                setTimeout(() =>{
                    document.querySelector(".mensagemErro").classList.add("escondido");
                }, 5000);
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

function criarTelaGeneros() {

}