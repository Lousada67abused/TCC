const txtEmail = document.getElementById("txtEmail");
const txtSenha = document.getElementById("txtSenha");
const btnEntrar = document.getElementById("btnEntrar");

if (btnEntrar) {
    btnEntrar.addEventListener("click", function (e) {
        e.preventDefault();

        if (txtSenha.value === "") {
            document.querySelector(".mensagemErro").textContent = "Por favor, digite o campo de senha.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() =>{
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
        
        const senha = txtSenha.value.trim();
        const email = txtEmail.value.trim();

        fetch("../api/acessar.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, senha: senha})
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
                const usuario = resultado.resultado[0];
                sessionStorage.setItem("codigo", usuario.id_usuario);
                window.location.href = "homepage.html";
                sessionStorage.setItem("usuario", JSON.stringify(usuario));
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


