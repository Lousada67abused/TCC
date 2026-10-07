const email = document.getElementById("txtEmail");
const senha = document.getElementById("txtSenha");
const btnEntrar = document.getElementById("btnEntrar");

if (btnEntrar) {
    btnEntrar.addEventListener("click", function (e) {
        e.preventDefault();
        
        if (senha.value === "") {
            document.querySelector(".mensagemErro").textContent = "Por favor, digite o campo de senha.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() =>{
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
            return;
        }
        if (email.value === "") {
            document.querySelector(".mensagemErro").textContent = "Por favor, digite o campo de email.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() => {
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
            return;
        }   
        
        fetch("../api/acessar.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.value, senha: senha.value })
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
                console.log("Login bem-sucedido!");
                 // window.location.href = "homepage.html";
                 console.log(resultado);
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
            mostrarErro("Não foi possível conectar ao servidor. Tente novamente.");
        });
    });
}


