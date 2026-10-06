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
        }
        if (email.value === "") {
            document.querySelector(".mensagemErro").textContent = "Por favor, digite o campo de email.";
            document.querySelector(".mensagemErro").classList.remove("escondido");
            setTimeout(() => {
                document.querySelector(".mensagemErro").classList.add("escondido");
            }, 5000);
        }   

    });
}


