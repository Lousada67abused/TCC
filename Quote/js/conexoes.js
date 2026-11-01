(() => {
    const main = document.querySelector('.conteudoConexoes');
    const lista = document.getElementById('listaConexoes');
    const campo = document.getElementById('buscarConexoes');
    const estado = document.getElementById('estadoConexoes');
    const repetir = document.getElementById('tentarConexoes');
    if (!main || !lista || !campo || !estado || !repetir) return;

    const parametros = new URLSearchParams(location.search);
    let sessao = null;
    try { sessao = sessionStorage.getItem('codigo'); } catch (_) {}
    const codigo = parametros.has('codigoUsuario') ? parametros.get('codigoUsuario') : sessao;
    const tipo = parametros.get('lista') || 'seguidores';
    const idValido = valor => /^[1-9]\d{0,9}$/.test(valor || '') && Number(valor) <= 2147483647;
    const perfil = id => String(id) === sessao ? 'perfil.html' : 'perfilPublico.html?codigoUsuario=' + encodeURIComponent(id);
    const normalizar = valor => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    const numero = new Intl.NumberFormat('pt-BR');
    let usuarios = [];
    let carregando = false;
    const titulo = tipo === 'seguindo' ? 'Seguindo' : 'Seguidores';
    document.getElementById('tituloConexoes').textContent = titulo;
    lista.setAttribute('aria-label', titulo);
    campo.placeholder = tipo === 'seguindo' ? 'Buscar entre quem segue' : 'Buscar seguidores';
    if (idValido(codigo)) {
        document.getElementById('voltarPerfilConexoes').href = perfil(codigo);
        ['seguidores', 'seguindo'].forEach((nome, indice) => {
            const aba = document.getElementById(indice ? 'abaSeguindo' : 'abaSeguidores');
            aba.href = 'conexoes.html?codigoUsuario=' + encodeURIComponent(codigo) + '&lista=' + nome;
            if (tipo === nome) aba.setAttribute('aria-current', 'page');
            else aba.removeAttribute('aria-current');
        });
    }

    function elemento(tag, classe, texto) {
        const no = document.createElement(tag);
        if (classe) no.className = classe;
        if (texto !== undefined) no.textContent = texto;
        return no;
    }
    function leitor(usuario) {
        const item = elemento('li');
        const link = elemento('a', 'leitorConexao');
        link.href = perfil(usuario.id_usuario);
        const foto = elemento('img', 'fotoLeitorConexao');
        foto.alt = '';
        foto.loading = 'lazy';
        foto.addEventListener('error', () => { foto.src = '../img/avatar.jpg'; }, { once: true });
        foto.src = '../img/' + encodeURIComponent(usuario.id_usuario) + '.png';
        const nome = elemento('strong', 'nomeLeitorConexao', usuario.nm_usuario);
        const seta = elemento('span', 'material-symbols-outlined', 'chevron_right');
        seta.setAttribute('aria-hidden', 'true');
        link.append(foto, nome, seta);
        item.append(link);
        return item;
    }
    function filtrar() {
        const termo = normalizar(campo.value.trim());
        const encontrados = usuarios.filter(usuario => normalizar(usuario.nm_usuario).includes(termo));
        lista.replaceChildren(...encontrados.map(leitor));
        lista.hidden = !encontrados.length;
        if (!usuarios.length) {
            estado.textContent = tipo === 'seguindo' ? 'Este perfil ainda não segue nenhum leitor.' : 'Este perfil ainda não tem seguidores.';
        } else if (!encontrados.length) {
            estado.textContent = 'Nenhum leitor encontrado nesta lista.';
        } else {
            estado.textContent = numero.format(encontrados.length) + (encontrados.length === 1 ? ' leitor' : ' leitores') + (termo ? ' nesta busca.' : ' nesta lista.');
        }
    }
    async function pedir(url) {
        const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
        const resultado = await resposta.json();
        if (!resposta.ok || ![true, 'true'].includes(resultado.status)) {
            const erro = new Error(resultado.mensagem || 'Não foi possível carregar esta lista.');
            erro.status = resposta.status;
            throw erro;
        }
        return resultado.resposta;
    }
    async function carregar() {
        if (carregando) return;
        carregando = true;
        main.setAttribute('aria-busy', 'true');
        campo.disabled = true;
        lista.hidden = true;
        repetir.hidden = true;
        estado.textContent = 'Carregando leitores...';
        try {
            const api = tipo === 'seguindo' ? 'buscarSeguidosUsuario.php' : 'buscarSeguidoresUsuario.php';
            const [pessoas, dados] = await Promise.all([
                pedir('../api/' + api + '?codigoUsuario=' + encodeURIComponent(codigo)),
                pedir('../api/buscarPerfilPublico.php?codigoUsuario=' + encodeURIComponent(codigo))
            ]);
            if (!Array.isArray(pessoas) || pessoas.some(pessoa => !pessoa || !idValido(String(pessoa.id_usuario)) || typeof pessoa.nm_usuario !== 'string') ||
                String(dados?.usuario?.id_usuario) !== codigo) throw new Error('Não foi possível carregar esta lista.');
            usuarios = pessoas;
            const usuario = dados.usuario;
            document.title = titulo + ' de ' + usuario.nm_usuario + ' - Quote';
            const dono = document.getElementById('donoConexoes');
            dono.href = perfil(codigo);
            document.getElementById('nomeDonoConexoes').textContent = usuario.nm_usuario;
            const foto = document.getElementById('fotoDonoConexoes');
            foto.onerror = () => { foto.onerror = null; foto.src = '../img/avatar.jpg'; };
            foto.src = '../img/' + encodeURIComponent(codigo) + '.png';
            dono.hidden = false;
            const seguidores = tipo === 'seguidores' ? pessoas.length : usuario.qtd_seguidores;
            const seguindo = tipo === 'seguindo' ? pessoas.length : usuario.qtd_seguindo;
            document.getElementById('totalSeguidores').textContent = numero.format(Math.max(0, Number(seguidores) || 0));
            document.getElementById('totalSeguindo').textContent = numero.format(Math.max(0, Number(seguindo) || 0));
            campo.disabled = false;
            filtrar();
        } catch (erro) {
            estado.textContent = erro.status === 404 ? 'Perfil não encontrado.' : 'Não foi possível carregar esta lista. Tente novamente.';
            repetir.hidden = erro.status === 404;
        } finally {
            carregando = false;
            main.setAttribute('aria-busy', 'false');
        }
    }
    campo.addEventListener('input', filtrar);
    document.getElementById('formBuscaConexoes').addEventListener('submit', evento => evento.preventDefault());
    repetir.addEventListener('click', carregar);
    if (!idValido(codigo) || !['seguidores', 'seguindo'].includes(tipo)) {
        main.setAttribute('aria-busy', 'false');
        estado.textContent = !codigo ? 'Entre na sua conta ou abra esta lista pelo perfil de um leitor.' : 'Lista inválida. Abra a lista pelo perfil do leitor.';
        return;
    }
    window.addEventListener('pageshow', evento => { if (evento.persisted) carregar(); });
    carregar();
})();
