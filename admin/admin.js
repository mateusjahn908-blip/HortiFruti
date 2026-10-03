(() => {
    'use strict';

    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];

    const estado = { produtos: [], categorias: [], unidades: [], filtroEstoque: 'todos', editandoId: null, promoEditandoId: null, movendoId: null };

    // ---------- helpers ----------
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const brl = n => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const dataBr = iso => (iso ? iso.split('-').reverse().slice(0, 2).join('/') : '');
    const semAcento = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const lerNumero = s => Number(String(s).trim().replace(',', '.'));
    const mostrar = (el, msg) => { el.textContent = msg || ''; el.hidden = !msg; };

    function toast(msg, ehErro = false) {
        const t = $('#toast');
        t.textContent = msg;
        t.classList.toggle('erro', ehErro);
        t.classList.add('show');
        clearTimeout(toast.t);
        toast.t = setTimeout(() => t.classList.remove('show'), ehErro ? 4200 : 2200);
    }

    async function api(metodo, url, corpo) {
        const r = await fetch('/api/admin' + url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: corpo === undefined ? (metodo === 'GET' ? undefined : '{}') : JSON.stringify(corpo)
        });
        let json = {};
        try { json = await r.json(); } catch { /* sem corpo */ }
        if (r.status === 401 && !url.startsWith('/login')) {
            mostrarLogin(url === '/me' ? '' : 'Sua sessão expirou. Entre novamente.');
            throw new Error('sessão expirada');
        }
        if (!r.ok) throw new Error(json.erro || 'Algo deu errado. Tente de novo.');
        return json;
    }

    function confirmar(titulo, texto, rotulo = 'Confirmar') {
        const d = $('#dlgConfirma');
        $('#cTitulo').textContent = titulo;
        $('#cTexto').textContent = texto;
        $('#cOk').textContent = rotulo;
        d.returnValue = '';
        d.showModal();
        return new Promise(res => d.addEventListener('close', () => res(d.returnValue === 'sim'), { once: true }));
    }

    // fecha modais pelo botão "Cancelar" e clicando fora
    $$('dialog').forEach(d => {
        d.addEventListener('click', e => { if (e.target === d) d.close(); });
        $$('[data-fechar]', d).forEach(b => b.addEventListener('click', () => d.close()));
    });

    // ---------- login / sessão ----------
    function mostrarLogin(msg) {
        $('#appView').hidden = true;
        $('#loginView').hidden = false;
        mostrar($('#loginErro'), msg);
        $$('dialog[open]').forEach(d => d.close());
        $('#loginSenha').value = '';
        $('#loginUsuario').focus();
    }

    async function entrar() {
        const me = await api('GET', '/me');
        estado.categorias = me.categorias;
        estado.unidades = me.unidades;
        $('#quem').textContent = me.usuario;
        $('#loginView').hidden = true;
        $('#appView').hidden = false;
        montarSelects();
        await carregar();
    }

    $('#loginForm').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = $('#loginBtn');
        btn.disabled = true;
        mostrar($('#loginErro'), '');
        try {
            await api('POST', '/login', { usuario: $('#loginUsuario').value, senha: $('#loginSenha').value });
            await entrar();
        } catch (err) {
            mostrar($('#loginErro'), err.message);
        } finally { btn.disabled = false; }
    });

    $('#btnSair').addEventListener('click', async () => {
        try { await api('POST', '/logout', {}); } catch { /* já saiu */ }
        mostrarLogin('');
    });

    $('#btnSenha').addEventListener('click', () => {
        $('#formSenha').reset();
        mostrar($('#sErro'), '');
        $('#dlgSenha').showModal();
    });
    $('#formSenha').addEventListener('submit', async e => {
        e.preventDefault();
        try {
            await api('POST', '/senha', { atual: $('#sAtual').value, nova: $('#sNova').value });
            $('#dlgSenha').close();
            toast('Senha alterada.');
        } catch (err) { mostrar($('#sErro'), err.message); }
    });

    // ---------- dados ----------
    async function carregar() {
        const [{ produtos }, { movimentos }] = await Promise.all([api('GET', '/produtos'), api('GET', '/movimentos?limite=40')]);
        estado.produtos = produtos;
        renderTudo();
        renderHistorico(movimentos);
    }

    async function recarregarHistorico() {
        const { movimentos } = await api('GET', '/movimentos?limite=40');
        renderHistorico(movimentos);
    }

    function montarSelects() {
        const opcoes = lista => lista.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
        $('#pCategoria').innerHTML = '<option value="">Todas as categorias</option>' + opcoes(estado.categorias);
        $('#fCategoria').innerHTML = opcoes(estado.categorias);
        $('#fUnidade').innerHTML = opcoes(estado.unidades);
    }

    const situacaoEstoque = p => (p.estoque === 0 ? 'zerado' : p.estoque <= p.estoqueMinimo ? 'baixo' : 'ok');
    const badgeEstoque = p => {
        const s = situacaoEstoque(p);
        return s === 'zerado' ? '<span class="badge bad">Esgotado</span>' : s === 'baixo' ? '<span class="badge warn">Baixo</span>' : '<span class="badge">Ok</span>';
    };
    const thumb = p => (p.imagem ? `<img class="thumb" src="${esc(p.imagem)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<div class="thumb"></div>');

    function renderTudo() {
        renderStats();
        renderProdutos();
        renderPromoSelect();
        renderPromos();
        renderEstoque();
    }

    // ---------- resumo ----------
    function renderStats() {
        const ativos = estado.produtos.filter(p => p.ativo);
        const itens = [
            { n: ativos.length, t: 'Produtos no site', cls: '' },
            { n: estado.produtos.filter(p => p.emPromocao).length, t: 'Em promoção', cls: '', ir: 'promocoes' },
            { n: ativos.filter(p => situacaoEstoque(p) === 'baixo').length, t: 'Estoque baixo', cls: 'warn', ir: 'estoque', f: 'baixo' },
            { n: ativos.filter(p => situacaoEstoque(p) === 'zerado').length, t: 'Esgotados', cls: 'bad', ir: 'estoque', f: 'zerado' }
        ];
        $('#stats').innerHTML = itens.map(i => i.ir
            ? `<button type="button" class="stat ${i.cls}" data-ir="${i.ir}" data-f="${i.f || ''}"><strong>${i.n}</strong><span>${i.t}</span></button>`
            : `<div class="stat ${i.cls}"><strong>${i.n}</strong><span>${i.t}</span></div>`).join('');
    }
    $('#stats').addEventListener('click', e => {
        const b = e.target.closest('[data-ir]');
        if (!b) return;
        if (b.dataset.f) definirFiltroEstoque(b.dataset.f);
        irParaAba(b.dataset.ir);
    });

    // ---------- abas ----------
    function irParaAba(nome) {
        $$('.tab').forEach(t => { const on = t.dataset.tab === nome; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
        ['produtos', 'promocoes', 'estoque'].forEach(n => { $('#tab-' + n).hidden = n !== nome; });
    }
    $$('.tab').forEach(t => t.addEventListener('click', () => irParaAba(t.dataset.tab)));

    // ---------- produtos ----------
    function renderProdutos() {
        const termo = semAcento($('#pBusca').value.trim());
        const cat = $('#pCategoria').value;
        const st = $('#pStatus').value;
        const lista = estado.produtos.filter(p =>
            (!termo || semAcento(p.nome).includes(termo)) && (!cat || p.categoria === cat) &&
            (!st || (st === 'ativo') === p.ativo));

        const t = $('#tabelaProdutos');
        if (!lista.length) { t.innerHTML = `<tbody><tr><td class="empty">${estado.produtos.length ? 'Nenhum produto com esse filtro.' : 'Nenhum produto ainda. Clique em “Novo produto”.'}</td></tr></tbody>`; return; }
        t.innerHTML = `<thead><tr><th></th><th>Produto</th><th>Preço</th><th>Estoque</th><th>No site</th><th></th></tr></thead><tbody>${lista.map(p => `
            <tr class="com-img" data-id="${p.id}">
                <td class="c-img">${thumb(p)}</td>
                <td class="c-nome nome"><strong>${esc(p.nome)}</strong><small>${esc(p.categoria)} · por ${esc(p.unidade)}</small></td>
                <td data-label="Preço" class="preco">${p.emPromocao ? `<s>${brl(p.preco)}</s><b>${brl(p.promoPreco)}</b> <span class="badge promo">Promo</span>` : brl(p.preco)}</td>
                <td data-label="Estoque"><span class="qtd">${p.estoque}</span> ${badgeEstoque(p)}</td>
                <td data-label="No site"><label class="switch" title="${p.ativo ? 'Visível no site' : 'Oculto'}"><input type="checkbox" data-acao="ativo" ${p.ativo ? 'checked' : ''} aria-label="Mostrar ${esc(p.nome)} no site"><span></span></label></td>
                <td class="c-acoes"><div class="row-actions">
                    <button class="btn ghost small" data-acao="editar" type="button">Editar</button>
                    <button class="btn danger-ghost small" data-acao="excluir" type="button">Excluir</button>
                </div></td>
            </tr>`).join('')}</tbody>`;
    }
    ['pBusca', 'pCategoria', 'pStatus'].forEach(id => $('#' + id).addEventListener('input', renderProdutos));

    $('#tabelaProdutos').addEventListener('click', async e => {
        const el = e.target.closest('[data-acao]');
        const tr = e.target.closest('tr[data-id]');
        if (!el || !tr) return;
        const p = estado.produtos.find(x => x.id === Number(tr.dataset.id));
        if (el.dataset.acao === 'editar') abrirProduto(p);
        if (el.dataset.acao === 'excluir') {
            if (!await confirmar('Excluir produto?', `“${p.nome}” e o histórico de estoque dele serão apagados. Para só tirar do site, use a chave “No site”.`, 'Excluir')) return;
            try { await api('DELETE', `/produtos/${p.id}`); toast('Produto excluído.'); await carregar(); } catch (err) { toast(err.message, true); }
        }
    });
    $('#tabelaProdutos').addEventListener('change', async e => {
        if (e.target.dataset.acao !== 'ativo') return;
        const id = Number(e.target.closest('tr').dataset.id);
        try {
            await api('PUT', `/produtos/${id}`, { ativo: e.target.checked });
            toast(e.target.checked ? 'Produto visível no site.' : 'Produto oculto do site.');
            await carregar();
        } catch (err) { e.target.checked = !e.target.checked; toast(err.message, true); }
    });

    // formulário de produto
    function atualizarPreview(url) {
        const box = $('#fPreview');
        box.hidden = !url;
        if (url) { const img = $('img', box); img.referrerPolicy = 'no-referrer'; img.src = url; }
    }

    function abrirProduto(p) {
        estado.editandoId = p ? p.id : null;
        $('#formProduto').reset();
        mostrar($('#fErro'), '');
        $('#fArquivoMsg').textContent = 'JPG, PNG, WEBP ou GIF, até 2 MB.';
        $('#dlgProdutoTitulo').textContent = p ? 'Editar produto' : 'Novo produto';
        $('#fEstoqueBox').hidden = !!p;   // estoque de produto existente muda na aba Estoque (fica no histórico)
        if (p) {
            $('#fNome').value = p.nome;
            $('#fCategoria').value = p.categoria;
            $('#fUnidade').value = p.unidade;
            $('#fPreco').value = String(p.preco).replace('.', ',');
            $('#fMinimo').value = p.estoqueMinimo;
            $('#fImagem').value = p.imagem;
            $('#fAtivo').checked = p.ativo;
        }
        atualizarPreview(p ? p.imagem : '');
        $('#dlgProduto').showModal();
        $('#fNome').focus();
    }
    $('#btnNovo').addEventListener('click', () => abrirProduto(null));
    $('#fImagem').addEventListener('change', e => atualizarPreview(e.target.value.trim()));

    $('#fArquivo').addEventListener('change', async e => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) { mostrar($('#fErro'), 'A imagem passa de 2 MB. Escolha um arquivo menor.'); e.target.value = ''; return; }
        mostrar($('#fErro'), '');
        $('#fArquivoMsg').textContent = 'Enviando...';
        try {
            const dataUrl = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(new Error('Não consegui ler o arquivo.')); r.readAsDataURL(f); });
            const { url } = await api('POST', '/upload', { dataUrl });
            $('#fImagem').value = url;
            atualizarPreview(url);
            $('#fArquivoMsg').textContent = 'Imagem enviada.';
        } catch (err) {
            $('#fArquivoMsg').textContent = '';
            mostrar($('#fErro'), err.message);
        } finally { e.target.value = ''; }
    });

    $('#formProduto').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = $('#fSalvar');
        btn.disabled = true;
        mostrar($('#fErro'), '');
        const dados = {
            nome: $('#fNome').value, categoria: $('#fCategoria').value, unidade: $('#fUnidade').value,
            preco: lerNumero($('#fPreco').value), estoqueMinimo: lerNumero($('#fMinimo').value || 0),
            imagem: $('#fImagem').value.trim(), ativo: $('#fAtivo').checked
        };
        try {
            if (estado.editandoId) await api('PUT', `/produtos/${estado.editandoId}`, dados);
            else await api('POST', '/produtos', { ...dados, estoque: lerNumero($('#fEstoque').value || 0) });
            $('#dlgProduto').close();
            toast(estado.editandoId ? 'Produto atualizado.' : 'Produto cadastrado.');
            await carregar();
        } catch (err) { mostrar($('#fErro'), err.message); }
        finally { btn.disabled = false; }
    });

    // ---------- promoções ----------
    function proximoDomingo() {
        const d = new Date();
        d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const hojeIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

    function renderPromoSelect() {
        const sel = $('#promoProduto');
        const atual = sel.value;
        const editando = estado.promoEditandoId;
        const candidatos = estado.produtos.filter(p => p.ativo && (editando ? p.id === editando : !p.emPromocao));
        sel.disabled = !!editando;
        sel.innerHTML = '<option value="">Escolha um produto...</option>' +
            candidatos.map(p => `<option value="${p.id}">${esc(p.nome)} (${brl(p.preco)})</option>`).join('');
        if (atual && candidatos.some(p => String(p.id) === atual)) sel.value = atual;
        if (editando) sel.value = String(editando);
        atualizarPrevia();
    }

    const produtoPromo = () => estado.produtos.find(p => String(p.id) === $('#promoProduto').value);

    function atualizarPrevia() {
        const p = produtoPromo();
        const preco = lerNumero($('#promoPreco').value);
        const prev = $('#promoPrevia');
        if (!p) { prev.textContent = 'Escolha um produto para ver como fica.'; return; }
        if (!preco || preco <= 0) { prev.textContent = `Preço normal: ${brl(p.preco)}. Digite o preço ou o desconto.`; return; }
        if (preco >= p.preco) { prev.textContent = `O preço promocional precisa ser menor que ${brl(p.preco)}.`; return; }
        prev.textContent = `No site: de ${brl(p.preco)} por ${brl(preco)} (-${Math.round((1 - preco / p.preco) * 100)}%).`;
    }

    $('#promoProduto').addEventListener('change', () => { $('#promoPreco').value = ''; $('#promoPct').value = ''; atualizarPrevia(); });
    $('#promoPreco').addEventListener('input', () => {
        const p = produtoPromo(), v = lerNumero($('#promoPreco').value);
        $('#promoPct').value = p && v > 0 && v < p.preco ? Math.round((1 - v / p.preco) * 100) : '';
        atualizarPrevia();
    });
    $('#promoPct').addEventListener('input', () => {
        const p = produtoPromo(), pct = lerNumero($('#promoPct').value);
        if (p && pct > 0 && pct < 100) $('#promoPreco').value = (Math.round(p.preco * (1 - pct / 100) * 100) / 100).toFixed(2).replace('.', ',');
        else $('#promoPreco').value = '';
        atualizarPrevia();
    });

    function limparPromoForm() {
        estado.promoEditandoId = null;
        $('#promoForm').reset();
        $('#promoAte').min = hojeIso();
        $('#promoAte').value = proximoDomingo();
        $('#promoTitulo').textContent = 'Colocar produto em promoção';
        $('#promoSalvar').textContent = 'Colocar em promoção';
        $('#promoCancelar').hidden = true;
        mostrar($('#promoErro'), '');
        renderPromoSelect();
    }
    $('#promoCancelar').addEventListener('click', limparPromoForm);

    function renderPromos() {
        const lista = estado.produtos.filter(p => p.promoPreco != null).sort((a, b) => Number(b.emPromocao) - Number(a.emPromocao) || a.nome.localeCompare(b.nome));
        $('#btnEncerrarTodas').hidden = !lista.length;
        $('#listaPromos').innerHTML = lista.length ? lista.map(p => {
            const pct = Math.round((1 - p.promoPreco / p.preco) * 100);
            const estado_ = p.promoExpirada ? '<span class="badge off">Vencida</span>' : !p.ativo ? '<span class="badge off">Produto oculto</span>' : '<span class="badge promo">No site</span>';
            return `<div class="promo-item ${p.promoExpirada ? 'vencida' : ''}" data-id="${p.id}">
                ${thumb(p)}
                <div class="info"><strong>${esc(p.nome)}</strong>
                    <span class="de-por"><s>${brl(p.preco)}</s><b>${brl(p.promoPreco)}</b> (-${pct}%)</span><br>
                    <span>${p.promoAte ? 'Vale até ' + dataBr(p.promoAte) : 'Sem data final'}</span> ${estado_}</div>
                <div class="row-actions">
                    <button class="btn ghost small" data-acao="editar" type="button">${p.promoExpirada ? 'Renovar' : 'Editar'}</button>
                    <button class="btn danger-ghost small" data-acao="remover" type="button">Remover</button>
                </div></div>`;
        }).join('') : '<div class="card empty">Nenhuma promoção por enquanto. Use o formulário ao lado para escolher os destaques da semana.</div>';
    }

    $('#listaPromos').addEventListener('click', async e => {
        const el = e.target.closest('[data-acao]');
        const item = e.target.closest('[data-id]');
        if (!el || !item) return;
        const p = estado.produtos.find(x => x.id === Number(item.dataset.id));
        if (el.dataset.acao === 'editar') {
            estado.promoEditandoId = p.id;
            renderPromoSelect();
            $('#promoPreco').value = String(p.promoPreco).replace('.', ',');
            $('#promoPct').value = Math.round((1 - p.promoPreco / p.preco) * 100);
            $('#promoAte').value = p.promoAte && p.promoAte >= hojeIso() ? p.promoAte : proximoDomingo();
            $('#promoTitulo').textContent = `${p.promoExpirada ? 'Renovar' : 'Editar'} promoção`;
            $('#promoSalvar').textContent = 'Salvar promoção';
            $('#promoCancelar').hidden = false;
            atualizarPrevia();
            $('#promoPreco').focus();
        }
        if (el.dataset.acao === 'remover') {
            try { await api('DELETE', `/produtos/${p.id}/promocao`); toast('Promoção removida.'); if (estado.promoEditandoId === p.id) limparPromoForm(); await carregar(); }
            catch (err) { toast(err.message, true); }
        }
    });

    $('#promoForm').addEventListener('submit', async e => {
        e.preventDefault();
        mostrar($('#promoErro'), '');
        const p = produtoPromo();
        if (!p) return mostrar($('#promoErro'), 'Escolha o produto da promoção.');
        try {
            await api('PUT', `/produtos/${p.id}/promocao`, { preco: lerNumero($('#promoPreco').value), ate: $('#promoAte').value || null });
            toast('Promoção publicada no site.');
            limparPromoForm();
            await carregar();
        } catch (err) { mostrar($('#promoErro'), err.message); }
    });

    $('#btnEncerrarTodas').addEventListener('click', async () => {
        if (!await confirmar('Encerrar todas as promoções?', 'Todos os produtos voltam ao preço normal no site. Use isso para começar uma nova semana do zero.', 'Encerrar todas')) return;
        try { const r = await api('DELETE', '/promocoes', {}); toast(`${r.removidas} promoção(ões) encerrada(s).`); limparPromoForm(); await carregar(); }
        catch (err) { toast(err.message, true); }
    });

    // ---------- estoque ----------
    function definirFiltroEstoque(f) {
        estado.filtroEstoque = f;
        $$('#eFiltro .chip').forEach(c => c.classList.toggle('active', c.dataset.f === f));
        renderEstoque();
    }
    $('#eFiltro').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) definirFiltroEstoque(c.dataset.f); });
    $('#eBusca').addEventListener('input', renderEstoque);

    function renderEstoque() {
        const termo = semAcento($('#eBusca').value.trim());
        const f = estado.filtroEstoque;
        const lista = estado.produtos
            .filter(p => (!termo || semAcento(p.nome).includes(termo)) && (f === 'todos' || (f === 'baixo' ? situacaoEstoque(p) === 'baixo' : situacaoEstoque(p) === 'zerado')))
            .sort((a, b) => a.estoque - b.estoque || a.nome.localeCompare(b.nome));
        const t = $('#tabelaEstoque');
        if (!lista.length) { t.innerHTML = `<tbody><tr><td class="empty">${f === 'todos' ? 'Nenhum produto encontrado.' : 'Nenhum produto nessa situação. 🎉'}</td></tr></tbody>`; return; }
        t.innerHTML = `<thead><tr><th>Produto</th><th class="num">Em estoque</th><th class="num">Mínimo</th><th></th></tr></thead><tbody>${lista.map(p => `
            <tr data-id="${p.id}">
                <td class="c-nome nome"><strong>${esc(p.nome)}</strong><small>${esc(p.categoria)}${p.ativo ? '' : ' · oculto no site'}</small></td>
                <td class="num" data-label="Em estoque"><span class="qtd">${p.estoque}</span> <small>${esc(p.unidade)}</small> ${badgeEstoque(p)}</td>
                <td class="num" data-label="Mínimo">${p.estoqueMinimo}</td>
                <td class="c-acoes"><div class="row-actions"><button class="btn primary small" data-acao="mover" type="button">Movimentar</button></div></td>
            </tr>`).join('')}</tbody>`;
    }

    $('#tabelaEstoque').addEventListener('click', e => {
        const b = e.target.closest('[data-acao="mover"]');
        if (!b) return;
        abrirEstoque(estado.produtos.find(p => p.id === Number(b.closest('tr').dataset.id)));
    });

    const ROTULO_QTD = { entrada: 'Quantidade que chegou', saida: 'Quantidade que saiu', ajuste: 'Quantidade contada agora' };

    function resultadoEstoque() {
        const p = estado.produtos.find(x => x.id === estado.movendoId);
        const tipo = $('input[name="eTipo"]:checked').value;
        const q = lerNumero($('#eQtd').value);
        const r = $('#eResultado');
        if (!p || !Number.isInteger(q) || q < 0) { r.textContent = ''; return; }
        const novo = tipo === 'entrada' ? p.estoque + q : tipo === 'saida' ? p.estoque - q : q;
        r.textContent = novo < 0 ? `Só há ${p.estoque} em estoque.` : `Estoque passa de ${p.estoque} para ${novo}.`;
    }

    function abrirEstoque(p) {
        estado.movendoId = p.id;
        $('#formEstoque').reset();
        mostrar($('#eErro'), '');
        $('#eTitulo').textContent = p.nome;
        $('#eAtual').textContent = `Em estoque agora: ${p.estoque} (${p.unidade}). Avisa abaixo de ${p.estoqueMinimo}.`;
        $('#eQtdLabel').textContent = ROTULO_QTD.entrada;
        $('#eResultado').textContent = '';
        $('#dlgEstoque').showModal();
        $('#eQtd').focus();
    }
    $$('input[name="eTipo"]').forEach(r => r.addEventListener('change', () => { $('#eQtdLabel').textContent = ROTULO_QTD[r.value]; resultadoEstoque(); }));
    $('#eQtd').addEventListener('input', resultadoEstoque);

    $('#formEstoque').addEventListener('submit', async e => {
        e.preventDefault();
        mostrar($('#eErro'), '');
        try {
            await api('PATCH', `/produtos/${estado.movendoId}/estoque`, {
                tipo: $('input[name="eTipo"]:checked').value, quantidade: lerNumero($('#eQtd').value), motivo: $('#eMotivo').value.trim()
            });
            $('#dlgEstoque').close();
            toast('Estoque atualizado.');
            await carregar();
        } catch (err) { mostrar($('#eErro'), err.message); }
    });

    function renderHistorico(movs) {
        const rot = { inicial: 'Estoque inicial', entrada: 'Entrada', saida: 'Saída', ajuste: 'Contagem' };
        $('#historico').innerHTML = movs.length ? movs.map(m => {
            const quando = new Date(m.criado_em.replace(' ', 'T') + 'Z').toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const sinal = m.quantidade > 0 ? `<span class="mais">+${m.quantidade}</span>` : m.quantidade < 0 ? `<span class="menos">${m.quantidade}</span>` : '<span>0</span>';
            return `<li><strong>${esc(m.produto)}</strong>${rot[m.tipo] || esc(m.tipo)} ${sinal} → ${m.estoque_apos}<br><small>${quando} · ${esc(m.usuario)}${m.motivo ? ' · ' + esc(m.motivo) : ''}</small></li>`;
        }).join('') : '<li class="muted">Nenhuma movimentação ainda.</li>';
    }

    // ---------- início ----------
    limparPromoForm();
    entrar().catch(() => mostrarLogin(''));
})();
