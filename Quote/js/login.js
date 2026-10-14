const txtEmail = document.getElementById("txtEmail");
const txtSenha = document.getElementById("txtSenha");
const btnEntrar = document.getElementById("btnEntrar");
const mensagemErro = document.querySelector(".mensagemErro");

function mostrarErro(texto) {
    mensagemErro.textContent = texto;
    mensagemErro.classList.remove("escondido");
    setTimeout(() => mensagemErro.classList.add("escondido"), 5000);
}

if (btnEntrar) {
    btnEntrar.addEventListener("click", function (e) {
        e.preventDefault();

        const email = txtEmail.value.trim();
        const senha = txtSenha.value.trim();

        if (email === "") {
            mostrarErro("Por favor, digite o campo de email.");
            return;
        }
        if (senha === "") {
            mostrarErro("Por favor, digite o campo de senha.");
            return;
        }

        fetch("../api/acessar.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, senha: senha })
        })
        .then(resposta => resposta.json())
        .then(resultado => {
            if (resultado.status !== "true") {
                mostrarErro(resultado.mensagem || "Erro no servidor.");
                return;
            }

            const usuario = resultado.resultado[0];
            if (!usuario) {
                mostrarErro("Email ou senha incorretos.");
                return;
            }

            sessionStorage.setItem("codigo", usuario.id_usuario);
            sessionStorage.setItem("usuario", JSON.stringify(usuario));
            window.location.href = "homepage.html";
        })
        .catch(erro => {
            console.error(erro);
            mostrarErro("Não foi possível acessar o servidor. Por favor, tente novamente mais tarde.");
        });
    });
}