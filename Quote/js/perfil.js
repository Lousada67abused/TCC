const abas = document.querySelectorAll(".abasPerfil button");
const conteudosAba = document.querySelectorAll(".conteudoAba");
const filtrosEstante = document.querySelectorAll("#estante .filtros button");
const avatar = document.getElementById("avatar");
const avatarMenu = document.querySelector(".cabecalhoDropdown img");
console.log(sessionStorage.getItem("codigo"));
avatar.src=`../img/${sessionStorage.getItem("codigo")}.png`;
avatarMenu.src=`../img/${sessionStorage.getItem("codigo")}.png`;

function abrirAba(nomeAba) {
    // Se a aba não existir (ex.: #qualquercoisa), abre a principal.
    if (!document.getElementById(nomeAba)) {
        nomeAba = "principal";
    }

    for (let i = 0; i < abas.length; i++) {
        abas[i].classList.toggle("ativo", abas[i].dataset.aba === nomeAba);
    }
    for (let i = 0; i < conteudosAba.length; i++) {
        conteudosAba[i].classList.toggle("escondido", conteudosAba[i].id !== nomeAba);
    }
}

for (let i = 0; i < abas.length; i++) {
    abas[i].addEventListener("click", function () {
        // Troca o # da URL para o link do menu do perfil (perfil.html#metas) funcionar.
        history.replaceState(null, "", "#" + this.dataset.aba);
        abrirAba(this.dataset.aba);
    });
}

// Os links do menu do avatar mudam só o # quando já estamos no perfil.
window.addEventListener("hashchange", function () {
    abrirAba(location.hash.replace("#", ""));
});

abrirAba(location.hash.replace("#", ""));

for (let i = 0; i < filtrosEstante.length; i++) {
    filtrosEstante[i].addEventListener("click", function () {
        for (let j = 0; j < filtrosEstante.length; j++) {
            filtrosEstante[j].classList.remove("ativo");
        }
        this.classList.add("ativo");
    });
}

// Nome e biografia do usuário logado (salvos no login).
if (usuarioLogado) {
    document.querySelector(".nomePerfil").textContent = usuarioLogado.nm_usuario;
    if (usuarioLogado.bio) {
        document.querySelector(".bioPerfil").textContent = "“" + usuarioLogado.bio + "”";
    }
}
