(() => {
    const chave = 'quote.tema';
    const normalizar = valor => valor === 'escuro' ? 'escuro' : 'claro';
    let atual = 'claro';
    try { atual = normalizar(localStorage.getItem(chave)); } catch (_) {}

    function aplicar(tema, salvo, sincronizado = false) {
        atual = normalizar(tema);
        document.documentElement.dataset.tema = atual;
        document.documentElement.style.colorScheme = atual === 'escuro' ? 'dark' : 'light';
        window.dispatchEvent(new CustomEvent('tema:alterado', { detail: { tema: atual, salvo, sincronizado } }));
    }

    // Executado no head antes das folhas de estilo, inclusive ao recarregar.
    aplicar(atual, true);
    window.TemaQuote = Object.freeze({
        obter: () => atual,
        definir(valor) {
            const tema = normalizar(valor);
            let salvo = false;
            try { localStorage.setItem(chave, tema); salvo = true; } catch (_) {}
            aplicar(tema, salvo);
            return salvo;
        }
    });
    window.addEventListener('storage', evento => {
        try { if (evento.storageArea !== localStorage) return; } catch (_) { return; }
        if (evento.key === chave || evento.key === null) aplicar(evento.newValue, true, true);
    });
})();
