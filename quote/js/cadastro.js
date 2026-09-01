const txtNome = document.querySelector("#txtNome");
const btnConfirmar = document.querySelector(".btnConfirmar");
console.log(btnConfirmar);

btnConfirmar.addEventListener('click', function(e){
    e.preventDefault;
    let nome = txtNome.value;
    console.log(nome);
    validarCampo(nome);
})

function validarCampo(campoDeTexto){
    if(campoDeTexto == "" || !campoDeTexto){
        console.log("Erro");
    }
}