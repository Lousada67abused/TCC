(() => {
    document.querySelectorAll('.perfilMenuContainer, .areaUsuario').forEach((container, indice) => {
        const menu = container.querySelector('.menuDropdownPerfil, .menuPerfil');
        if (!menu || container.hasAttribute('data-menu-perfil')) return;
        let botao = container.querySelector(':scope > .btnAvatar, :scope > .botaoAvatarPerfil');
        if (!botao) {
            const avatar = container.querySelector(':scope > .avatarHeader');
            if (!avatar) return;
            botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'botaoAvatarPerfil';
            avatar.replaceWith(botao);
            avatar.removeAttribute('tabindex');
            botao.append(avatar);
        }
        botao.type = 'button';
        botao.setAttribute('aria-label', 'Abrir menu do perfil');
        if (!menu.id) menu.id = 'menuPerfilHeader' + indice;
        botao.setAttribute('aria-controls', menu.id);
        menu.classList.remove('escondido');
        menu.setAttribute('aria-label', 'Menu do perfil');
        menu.querySelectorAll('a.btnSair, a.itemSair').forEach(link => {
            link.href = '../index.html';
            link.addEventListener('click', () => {
                try {
                    sessionStorage.removeItem('codigo');
                    sessionStorage.removeItem('usuario');
                } catch (_) { /* A navegação de saída continua se o armazenamento estiver indisponível. */ }
            });
        });
        container.setAttribute('data-menu-perfil', '');
        let fixado = false;
        let ponteiroDentro = false;
        let fechadoExplicitamente = false;

        function mostrar(aberto) {
            menu.hidden = !aberto;
            botao.setAttribute('aria-expanded', String(aberto));
            botao.setAttribute('aria-label', aberto ? 'Fechar menu do perfil' : 'Abrir menu do perfil');
        }
        function fechar() {
            fixado = false;
            fechadoExplicitamente = true;
            mostrar(false);
        }
        mostrar(false);
        botao.addEventListener('click', () => {
            if (fixado) fechar();
            else {
                fixado = true;
                fechadoExplicitamente = false;
                mostrar(true);
            }
        });
        botao.addEventListener('keydown', evento => {
            if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return;
            evento.preventDefault();
            fixado = true;
            fechadoExplicitamente = false;
            mostrar(true);
            const links = menu.querySelectorAll('a[href], button:not(:disabled)');
            (evento.key === 'ArrowUp' ? links[links.length - 1] : links[0])?.focus();
        });
        container.addEventListener('pointerenter', evento => {
            if (evento.pointerType !== 'mouse') return;
            ponteiroDentro = true;
            fechadoExplicitamente = false;
            mostrar(true);
        });
        container.addEventListener('pointerleave', evento => {
            if (evento.pointerType !== 'mouse') return;
            ponteiroDentro = false;
            if (!fixado && !container.contains(document.activeElement)) mostrar(false);
        });
        container.addEventListener('focusin', () => {
            if (!fechadoExplicitamente) mostrar(true);
        });
        container.addEventListener('focusout', () => {
            queueMicrotask(() => {
                if (container.contains(document.activeElement)) return;
                fechadoExplicitamente = false;
                if (!fixado && !ponteiroDentro) mostrar(false);
            });
        });
        document.addEventListener('keydown', evento => {
            if (evento.key !== 'Escape' || menu.hidden) return;
            evento.preventDefault();
            const devolverFoco = container.contains(document.activeElement);
            fechar();
            if (devolverFoco) botao.focus();
        });
        document.addEventListener('pointerdown', evento => {
            if (!container.contains(evento.target)) fechar();
        });
        menu.addEventListener('click', evento => {
            if (evento.target.closest('a[href]')) fechar();
        });
    });
})();
