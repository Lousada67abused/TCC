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

        const dados = new FormData();
        dados.append("email", email.value);
        dados.append("senha", senha.value);

        fetch("../api/acessar.php",{method: "POST",body: dados,})
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error("Erro no servidor: " + resposta.status);
            }
            return resposta.json();
        })
        .then(function (resultado) {
            if (resultado.sucesso) {
                // window.location.href = "home.html";
                console.log("Login bem-sucedido!");
            } else {
                console.error(erro);
            document.querySelector(".mensagemErro").textContent = "Não foi possível conectar ao servidor. Tente novamente.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() =>{
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
            }
        })
        .catch(function (erro) {
            console.error(erro);
            document.querySelector(".mensagemErro").textContent = "Não foi possível conectar ao servidor. Tente novamente.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() =>{
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
        });
    });

}


