(() => {
    const form = document.querySelector('.barraPesquisaDesktop');
    const campo = document.getElementById('txtPesquisaAmigos');
    const lista = document.querySelector('.listaUsuarios');
    const titulo = document.querySelector('.tituloAmigos');
    const estado = document.getElementById('estadoAmigos');
    const erro = document.querySelector('.mensagemErro');
    if (!form || !campo || !lista || !titulo || !estado || !erro) return;
    const codigoUsuario = sessionStorage.getItem('codigo');
    const autenticado = /^[1-9]\d*$/.test(codigoUsuario || '');
    let seguidos = new Set();
    let sequencia = 0;
    let alteracoesPendentes = 0;
    const finalizar = document.querySelector('.botaoFinalizar');

    function mostrarErro(mensagem) {
        erro.textContent = mensagem;
        erro.classList.remove('escondido');
    }
    async function pedir(url, options) {
        const response = await fetch(url, options);
        const resultado = await response.json();
        if (!response.ok || !(resultado.status === true || resultado.status === 'true')) throw new Error('Não foi possível acessar o servidor. Tente novamente.');
        return resultado;
    }
    function elemento(tag, classe, texto) {
        const el = document.createElement(tag);
        el.className = classe;
        if (texto !== undefined) el.textContent = texto;
        return el;
    }
    function criarCardLeitor(usuario) {
        const card = elemento('article', 'cardUsuario');
        const info = elemento('div', 'infoPerfilUsuario');
        const avatar = elemento('img', 'avatarUsuario');
        avatar.alt = 'Foto de ' + usuario.nm_usuario;
        avatar.addEventListener('error', () => { avatar.src = '../img/avatar.png'; }, { once: true });
        avatar.src = '../img/' + encodeURIComponent(usuario.id_usuario) + '.png';
        const detalhes = elemento('div', 'detalhesUsuario');
        detalhes.append(elemento('h2', 'nomeUsuario', usuario.nm_usuario));
        const stats = elemento('div', 'estatisticasUsuario');
        const valores = [['qtd_lidos', 'Lidos'], ['qtd_seguidores', 'Seguidores'], ['qtd_seguindo', 'Seguindo']];
        let seguidores;
        for (const [chave, label] of valores) {
            const item = elemento('div', 'itemEstatistica');
            const valor = elemento('strong', '', usuario[chave] == null ? '—' : String(usuario[chave]));
            if (chave === 'qtd_seguidores') seguidores = valor;
            item.append(valor, elemento('span', '', label));
            stats.append(item);
        }
        detalhes.append(stats);
        info.append(avatar, detalhes);
        const botao = elemento('button', 'botaoSeguir');
        botao.type = 'button';
        function atualizar() {
            const seguindo = seguidos.has(String(usuario.id_usuario));
            botao.classList.toggle('seguindo', seguindo);
            botao.setAttribute('aria-pressed', String(seguindo));
            botao.setAttribute('aria-label', (seguindo ? 'Deixar de seguir ' : 'Seguir ') + usuario.nm_usuario);
            botao.replaceChildren(elemento('span', 'material-symbols-outlined', seguindo ? 'person_check' : 'person_add'), document.createTextNode(seguindo ? 'seguindo' : 'seguir'));
            botao.disabled = !autenticado;
            if (!autenticado) botao.title = 'Entre na sua conta para seguir leitores';
        }
        atualizar();
        botao.addEventListener('click', async () => {
            if (!autenticado || botao.disabled) return;
            const seguindo = seguidos.has(String(usuario.id_usuario));
            botao.disabled = true;
            alteracoesPendentes++;
            erro.classList.add('escondido');
            try {
                await pedir('../api/' + (seguindo ? 'deixarDeSeguir.php' : 'seguirUsuario.php'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ codigoSeguidor: codigoUsuario, codigoSeguido: usuario.id_usuario })
                });
                if (seguindo) seguidos.delete(String(usuario.id_usuario));
                else seguidos.add(String(usuario.id_usuario));
                if (usuario.qtd_seguidores != null) {
                    usuario.qtd_seguidores = Math.max(0, Number(usuario.qtd_seguidores) + (seguindo ? -1 : 1));
                    seguidores.textContent = usuario.qtd_seguidores;
                }
                estado.textContent = seguindo ? 'Você deixou de seguir ' + usuario.nm_usuario + '.' : 'Agora você segue ' + usuario.nm_usuario + '.';
            } catch (_) {
                mostrarErro('Não foi possível atualizar o acompanhamento. Tente novamente.');
            } finally {
                alteracoesPendentes--;
                atualizar();
            }
        });
        card.append(info, botao);
        return card;
    }
    async function pesquisar() {
        const nome = campo.value.trim();
        if (!nome) { mostrarErro('Digite o nome de um amigo para pesquisar.'); campo.focus(); return; }
        if (alteracoesPendentes) { mostrarErro('Aguarde a atualização antes de pesquisar novamente.'); return; }
        const busca = ++sequencia;
        erro.classList.add('escondido');
        estado.textContent = 'Buscando leitores...';
        lista.setAttribute('aria-busy', 'true');
        lista.replaceChildren();
        try {
            const [usuarios, seguindo] = await Promise.all([
                pedir('../api/buscarUsuarioNome.php?nome=' + encodeURIComponent(nome)),
                autenticado ? pedir('../api/buscarSeguidosUsuario.php?codigoUsuario=' + encodeURIComponent(codigoUsuario)) : Promise.resolve({ resposta: [] })
            ]);
            if (busca !== sequencia) return;
            if (!Array.isArray(usuarios.resposta) || !Array.isArray(seguindo.resposta)) throw new Error();
            seguidos = new Set(seguindo.resposta.map(pessoa => String(pessoa.id_usuario)));
            const encontrados = usuarios.resposta.filter(pessoa => String(pessoa.id_usuario) !== String(codigoUsuario));
            lista.replaceChildren(...encontrados.map(criarCardLeitor));
            titulo.textContent = 'Exibindo resultados para “' + nome + '”';
            estado.textContent = encontrados.length ? (autenticado ? '' : 'Entre na sua conta para seguir leitores.') : 'Nenhum leitor encontrado.';
        } catch (_) {
            if (busca !== sequencia) return;
            estado.textContent = '';
            mostrarErro('Não foi possível carregar os leitores. Pesquise novamente para tentar outra vez.');
        } finally {
            if (busca === sequencia) lista.setAttribute('aria-busy', 'false');
        }
    }
    form.addEventListener('submit', event => { event.preventDefault(); pesquisar(); });
    finalizar.addEventListener('click', event => {
        if (alteracoesPendentes) { event.preventDefault(); mostrarErro('Aguarde a atualização antes de finalizar.'); }
    });
})();
