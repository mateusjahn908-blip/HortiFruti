// Os produtos, preços, promoções e estoque vêm do painel admin (GET /api/produtos).
const WHATSAPP = "5541987131976";
const CHAVE_CARRINHO = "hortifruti_carrinho";
const PRODUTOS_POR_SLIDE = 4;
const OFERTAS_VISIVEIS = 4;

const estado = {
    produtos: [],
    carrinho: [],          // [{ id, quantidade }] — nome/preço sempre vêm do produto atual
    categoria: "Todos",
    slide: 0,
    totalSlides: 0,
    verTodasOfertas: false,
    autoplay: null
};

const elementos = {
    ofertas: document.getElementById("offersGrid"),
    secaoOfertas: document.getElementById("ofertas"),
    infoOfertas: document.getElementById("offersInfo"),
    verTodas: document.getElementById("verTodasOfertas"),
    catalogo: document.getElementById("catalogGrid"),
    busca: document.getElementById("searchInput"),
    mensagemVazia: document.getElementById("emptyMessage"),
    contadorCarrinho: document.getElementById("cartCount"),
    toast: document.getElementById("toast"),
    modalCarrinho: document.getElementById("cartModal"),
    itensCarrinho: document.getElementById("cartItems"),
    totalCarrinho: document.getElementById("cartTotal"),
    heroCarousel: document.getElementById("heroCarousel"),
    heroDots: document.getElementById("heroDots"),
    prevSlide: document.getElementById("prevSlide"),
    nextSlide: document.getElementById("nextSlide")
};

/* ---------- utilidades ---------- */
const esc = valor => String(valor ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const formatarPreco = valor => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatarData = iso => (iso ? iso.split("-").reverse().slice(0, 2).join("/") : "");
const semAcento = texto => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ICONES = { Frutas: "🍎", Verduras: "🥬", Legumes: "🥕", Mercearia: "🍞", Bebidas: "🥤", "Laticínios": "🧀" };

const imagemProduto = (produto, classe = "") => produto.imagem
    ? `<img src="${esc(produto.imagem)}" alt="${esc(produto.nome)}" loading="lazy" referrerpolicy="no-referrer" ${classe}>`
    : `<span class="no-photo" aria-hidden="true">${ICONES[produto.categoria] || "🛒"}</span>`;

// Se uma foto não carregar (link quebrado), troca por um ícone em vez de mostrar imagem partida.
document.addEventListener("error", evento => {
    const img = evento.target;
    if (!(img instanceof HTMLImageElement) || !img.closest(".product-image, .hero-product-image")) return;
    const produto = estado.produtos.find(p => p.nome === img.alt);
    img.replaceWith(Object.assign(document.createElement("span"), {
        className: "no-photo", textContent: ICONES[produto?.categoria] || "🛒"
    }));
}, true);

const mostrarToast = mensagem => {
    elementos.toast.textContent = mensagem;
    elementos.toast.classList.add("show");
    clearTimeout(mostrarToast.timer);
    mostrarToast.timer = setTimeout(() => elementos.toast.classList.remove("show"), 2200);
};

/* ---------- cartão de produto ---------- */
const montarCardProduto = produto => {
    const selo = !produto.disponivel
        ? '<span class="product-badge out">Esgotado</span>'
        : produto.emPromocao ? `<span class="product-badge">-${produto.desconto}%</span>` : "";

    return `
  <article class="product ${produto.disponivel ? "" : "is-out"}">
    ${selo}
    <div class="product-image">${imagemProduto(produto)}</div>
    <p class="product-category">${esc(produto.categoria)}</p>
    <h3>${esc(produto.nome)}</h3>
    <div class="old-price">${produto.precoAntigo ? formatarPreco(produto.precoAntigo) : "&nbsp;"}</div>
    <div class="price">${formatarPreco(produto.preco)} <small>/${esc(produto.unidade)}</small></div>
    <p class="promo-until">${produto.emPromocao && produto.promoAte ? `Oferta até ${formatarData(produto.promoAte)}` : "&nbsp;"}</p>
    <button class="add-button" data-id="${produto.id}" type="button" ${produto.disponivel ? "" : "disabled"}>${produto.disponivel ? "Adicionar" : "Indisponível"}</button>
  </article>`;
};

const produtoPorId = id => estado.produtos.find(p => p.id === Number(id));
const emOferta = () => estado.produtos.filter(p => p.emPromocao);

/* ---------- carrossel do topo ---------- */
const montarSlides = () => {
    const promos = emOferta().filter(p => p.disponivel);
    if (promos.length) {
        const grupos = [];
        for (let i = 0; i < promos.length; i += PRODUTOS_POR_SLIDE) grupos.push(promos.slice(i, i + PRODUTOS_POR_SLIDE));
        const maior = Math.max(...promos.map(p => p.desconto));
        return grupos.map((itens, i) => ({
            rotulo: "Ofertas da semana", titulo: `Até ${maior}% OFF`, tag: `${i + 1}/${grupos.length}`, itens
        }));
    }
    // sem promoções: mostra os produtos disponíveis
    const disponiveis = estado.produtos.filter(p => p.disponivel).slice(0, PRODUTOS_POR_SLIDE * 2);
    const grupos = [];
    for (let i = 0; i < disponiveis.length; i += PRODUTOS_POR_SLIDE) grupos.push(disponiveis.slice(i, i + PRODUTOS_POR_SLIDE));
    return grupos.map((itens, i) => ({
        rotulo: "Fresquinhos de hoje", titulo: "Direto do campo", tag: grupos.length > 1 ? `${i + 1}/${grupos.length}` : "Novidades", itens
    }));
};

const cardHero = item => `
    <div class="hero-product-card">
        <div class="hero-product-image">${imagemProduto(item)}</div>
        <div class="hero-product-content">
            <span class="hero-product-category">${esc(item.categoria)}</span>
            <strong title="${esc(item.nome)}">${esc(item.nome)}</strong>
            <div class="hero-product-prices">
                ${item.precoAntigo ? `<span class="hero-product-old">${formatarPreco(item.precoAntigo)}</span>` : ""}
                <span class="hero-product-price">${formatarPreco(item.preco)}<small>/${esc(item.unidade)}</small></span>
            </div>
            ${item.emPromocao ? `<span class="hero-product-badge">-${item.desconto}%</span>` : ""}
        </div>
    </div>`;

const renderizarCarrosselHero = () => {
    if (!elementos.heroCarousel || !elementos.heroDots) return;
    const slides = montarSlides();
    estado.totalSlides = slides.length;
    estado.slide = Math.min(estado.slide, Math.max(slides.length - 1, 0));

    document.querySelector(".hero-carousel").hidden = !slides.length;
    document.querySelector(".carousel-buttons").hidden = slides.length < 2;

    elementos.heroCarousel.innerHTML = slides.map((s, i) => `
        <article class="hero-slide" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${slides.length}">
            <div class="hero-slide-header">
                <div>
                    <span class="hero-slide-label">${esc(s.rotulo)}</span>
                    <h3>${esc(s.titulo)}</h3>
                </div>
                <span class="hero-slide-tag">${esc(s.tag)}</span>
            </div>
            <div class="hero-slide-grid">${s.itens.map(cardHero).join("")}</div>
        </article>`).join("");

    elementos.heroDots.innerHTML = slides.length > 1 ? slides.map((_, i) => `
        <button class="carousel-dot" data-index="${i}" type="button" aria-label="Ir para o slide ${i + 1}"></button>`).join("") : "";

    irParaSlide(estado.slide, false);
    iniciarAutoplay();
};

const irParaSlide = (indice, animar = true) => {
    if (!estado.totalSlides) return;
    estado.slide = (indice + estado.totalSlides) % estado.totalSlides;
    elementos.heroCarousel.style.transition = animar && !reduzirMovimento ? "" : "none";
    elementos.heroCarousel.style.transform = `translateX(-${estado.slide * 100}%)`;
    elementos.heroDots.querySelectorAll(".carousel-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === estado.slide);
        dot.setAttribute("aria-current", i === estado.slide ? "true" : "false");
    });
};

const iniciarAutoplay = () => {
    clearInterval(estado.autoplay);
    if (reduzirMovimento || estado.totalSlides < 2) return;
    estado.autoplay = setInterval(() => { if (!document.hidden) irParaSlide(estado.slide + 1); }, 5000);
};
const pararAutoplay = () => clearInterval(estado.autoplay);

const configurarCarrossel = () => {
    const area = document.querySelector(".hero-carousel");
    elementos.prevSlide?.addEventListener("click", () => { irParaSlide(estado.slide - 1); iniciarAutoplay(); });
    elementos.nextSlide?.addEventListener("click", () => { irParaSlide(estado.slide + 1); iniciarAutoplay(); });
    elementos.heroDots?.addEventListener("click", evento => {
        const dot = evento.target.closest(".carousel-dot");
        if (dot) { irParaSlide(Number(dot.dataset.index)); iniciarAutoplay(); }
    });
    area?.addEventListener("mouseenter", pararAutoplay);
    area?.addEventListener("mouseleave", iniciarAutoplay);
    area?.addEventListener("focusin", pararAutoplay);
    area?.addEventListener("focusout", iniciarAutoplay);

    // arrastar com o dedo (celular)
    let inicioX = null;
    area?.addEventListener("pointerdown", e => { inicioX = e.clientX; });
    area?.addEventListener("pointerup", e => {
        if (inicioX === null) return;
        const dx = e.clientX - inicioX;
        inicioX = null;
        if (Math.abs(dx) > 40) { irParaSlide(estado.slide + (dx < 0 ? 1 : -1)); iniciarAutoplay(); }
    });
    area?.addEventListener("pointercancel", () => { inicioX = null; });
};

/* ---------- ofertas e catálogo ---------- */
const renderizarOfertas = () => {
    const ofertas = emOferta();
    elementos.secaoOfertas.hidden = !ofertas.length;
    const cta = document.querySelector('.hero .main-button');
    if (cta) cta.setAttribute("href", ofertas.length ? "#ofertas" : "#produtos");
    if (!ofertas.length) { elementos.ofertas.innerHTML = ""; return; }

    const visiveis = estado.verTodasOfertas ? ofertas : ofertas.slice(0, OFERTAS_VISIVEIS);
    elementos.ofertas.innerHTML = visiveis.map(montarCardProduto).join("");

    const datas = ofertas.map(p => p.promoAte).filter(Boolean).sort();
    elementos.infoOfertas.textContent = datas.length ? `Preços especiais até ${formatarData(datas[datas.length - 1])}, ou enquanto durar o estoque.` : "Preços especiais enquanto durar o estoque.";

    elementos.verTodas.hidden = ofertas.length <= OFERTAS_VISIVEIS;
    elementos.verTodas.textContent = estado.verTodasOfertas ? "Ver menos" : `Ver todas (${ofertas.length})`;
    elementos.verTodas.setAttribute("aria-expanded", String(estado.verTodasOfertas));
};

const renderizarCatalogo = () => {
    const termo = semAcento(elementos.busca.value.trim());
    const filtrados = estado.produtos.filter(produto =>
        (estado.categoria === "Todos" || produto.categoria === estado.categoria) &&
        (!termo || semAcento(produto.nome).includes(termo)));

    elementos.catalogo.innerHTML = filtrados.map(montarCardProduto).join("");
    elementos.mensagemVazia.textContent = "Nenhum produto encontrado.";
    elementos.mensagemVazia.style.display = filtrados.length ? "none" : "block";
};

const renderizarTudo = () => {
    renderizarCarrosselHero();
    renderizarOfertas();
    renderizarCatalogo();
    reconciliarCarrinho();
};

const mostrarErroCarregamento = () => {
    elementos.catalogo.innerHTML = "";
    elementos.mensagemVazia.innerHTML = 'Não foi possível carregar os produtos agora. <button class="outline-button" id="tentarDeNovo" type="button">Tentar de novo</button>';
    elementos.mensagemVazia.style.display = "block";
    elementos.secaoOfertas.hidden = true;
    document.querySelector(".hero-carousel").hidden = true;
    document.querySelector(".carousel-buttons").hidden = true;
};

const carregarProdutos = async () => {
    const resposta = await fetch("/api/produtos", { cache: "no-store" });
    if (!resposta.ok) throw new Error("falha ao carregar");
    estado.produtos = (await resposta.json()).produtos;
};

/* ---------- carrinho ---------- */
const salvarCarrinho = () => {
    try { localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(estado.carrinho)); } catch { /* navegação privada */ }
};

const carregarCarrinhoSalvo = () => {
    try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) || "[]");
        estado.carrinho = Array.isArray(salvo)
            ? salvo.filter(i => Number.isInteger(i?.id) && Number.isInteger(i?.quantidade) && i.quantidade > 0)
            : [];
    } catch { estado.carrinho = []; }
};

// Ajusta o carrinho ao que existe agora (produto removido, esgotado ou com menos estoque).
const reconciliarCarrinho = () => {
    let ajustou = false;
    estado.carrinho = estado.carrinho.flatMap(item => {
        const produto = produtoPorId(item.id);
        if (!produto || !produto.disponivel) { ajustou = true; return []; }
        if (item.quantidade > produto.estoque) { ajustou = true; return [{ ...item, quantidade: produto.estoque }]; }
        return [item];
    });
    salvarCarrinho();
    atualizarCarrinho();
    return ajustou;
};

const adicionarAoCarrinho = id => {
    const produto = produtoPorId(id);
    if (!produto || !produto.disponivel) return;
    const item = estado.carrinho.find(i => i.id === produto.id);
    if (item && item.quantidade >= produto.estoque) {
        mostrarToast(`Só temos ${produto.estoque} de ${produto.nome} no momento.`);
        return;
    }
    if (item) item.quantidade += 1; else estado.carrinho.push({ id: produto.id, quantidade: 1 });
    salvarCarrinho();
    atualizarCarrinho();
    mostrarToast(`${produto.nome} adicionado ao carrinho!`);
};

const alterarQuantidade = (id, delta) => {
    const item = estado.carrinho.find(i => i.id === Number(id));
    const produto = produtoPorId(id);
    if (!item || !produto) return;
    if (delta > 0 && item.quantidade >= produto.estoque) { mostrarToast(`Só temos ${produto.estoque} de ${produto.nome} no momento.`); return; }
    item.quantidade += delta;
    if (item.quantidade <= 0) estado.carrinho = estado.carrinho.filter(i => i !== item);
    salvarCarrinho();
    atualizarCarrinho();
};

const removerDoCarrinho = id => {
    const produto = produtoPorId(id);
    estado.carrinho = estado.carrinho.filter(i => i.id !== Number(id));
    salvarCarrinho();
    atualizarCarrinho();
    if (produto) mostrarToast(`${produto.nome} removido do carrinho.`);
};

const limparCarrinho = () => {
    if (!estado.carrinho.length) return;
    estado.carrinho = [];
    salvarCarrinho();
    atualizarCarrinho();
    mostrarToast("Carrinho limpo!");
};

const linhasCarrinho = () => estado.carrinho.map(i => ({ ...i, produto: produtoPorId(i.id) })).filter(l => l.produto);

const atualizarCarrinho = () => {
    const linhas = linhasCarrinho();
    elementos.contadorCarrinho.textContent = linhas.reduce((t, l) => t + l.quantidade, 0);

    elementos.itensCarrinho.innerHTML = linhas.length ? linhas.map(({ produto, quantidade }) => `
      <div class="cart-line">
        <div class="cart-product">
          <div>
            <span>${esc(produto.nome)} <small>(${formatarPreco(produto.preco)}/${esc(produto.unidade)})</small></span>
            <button class="remove-item" data-id="${produto.id}" type="button" aria-label="Remover ${esc(produto.nome)}">Remover</button>
          </div>
          <div class="qty" role="group" aria-label="Quantidade de ${esc(produto.nome)}">
            <button type="button" data-qtd="-1" data-id="${produto.id}" aria-label="Diminuir">−</button>
            <b>${quantidade}</b>
            <button type="button" data-qtd="1" data-id="${produto.id}" aria-label="Aumentar">+</button>
          </div>
        </div>
        <strong>${formatarPreco(produto.preco * quantidade)}</strong>
      </div>`).join("") : '<p style="color:#777">Seu carrinho está vazio.</p>';

    elementos.totalCarrinho.textContent = formatarPreco(linhas.reduce((t, l) => t + l.produto.preco * l.quantidade, 0));
};

// "Continuar": confere preço/estoque atuais e abre o pedido pronto no WhatsApp da loja.
const finalizarPedido = async () => {
    if (!estado.carrinho.length) { mostrarToast("Seu carrinho está vazio."); return; }
    try { await carregarProdutos(); } catch { mostrarToast("Sem conexão. Tente de novo em instantes."); return; }
    const ajustou = reconciliarCarrinho();
    renderizarTudo();
    if (ajustou) {
        mostrarToast("Alguns itens mudaram de estoque. Confira o carrinho antes de continuar.");
        return;
    }
    const linhas = linhasCarrinho();
    const total = linhas.reduce((t, l) => t + l.produto.preco * l.quantidade, 0);
    const texto = [
        "Olá! Gostaria de fazer este pedido:", "",
        ...linhas.map(({ produto, quantidade }) => `• ${quantidade}x ${produto.nome} (${produto.unidade}) — ${formatarPreco(produto.preco * quantidade)}`),
        "", `Total: ${formatarPreco(total)}`
    ].join("\n");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
};

/* ---------- menu lateral ---------- */
const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");

const fecharMenu = () => {
    sideMenu?.classList.remove("open");
    menuToggle?.classList.remove("active");
    menuToggle?.setAttribute("aria-expanded", "false");
};

menuToggle?.addEventListener("click", () => {
    const aberto = sideMenu.classList.toggle("open");
    menuToggle.classList.toggle("active", aberto);
    menuToggle.setAttribute("aria-expanded", String(aberto));
});
sideMenu?.querySelectorAll("a").forEach(link => link.addEventListener("click", fecharMenu));

/* ---------- eventos ---------- */
document.addEventListener("click", evento => {
    const alvo = evento.target;

    const adicionar = alvo.closest(".add-button");
    if (adicionar) return adicionarAoCarrinho(adicionar.dataset.id);

    const quantidade = alvo.closest("[data-qtd]");
    if (quantidade) return alterarQuantidade(quantidade.dataset.id, Number(quantidade.dataset.qtd));

    const remover = alvo.closest(".remove-item");
    if (remover) return removerDoCarrinho(remover.dataset.id);

    if (alvo.closest("#clearCart")) return limparCarrinho();
    if (alvo.closest(".checkout")) return finalizarPedido();
    if (alvo.closest("#tentarDeNovo")) return iniciar();

    const filtro = alvo.closest(".filter");
    if (filtro) {
        document.querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b === filtro));
        estado.categoria = filtro.dataset.category;
        return renderizarCatalogo();
    }

    if (!alvo.closest("#menuToggle") && !alvo.closest("#sideMenu")) fecharMenu();
});

document.addEventListener("keydown", evento => {
    if (evento.key !== "Escape") return;
    fecharMenu();
    elementos.modalCarrinho.classList.remove("open");
});

elementos.verTodas.addEventListener("click", () => {
    estado.verTodasOfertas = !estado.verTodasOfertas;
    renderizarOfertas();
});

elementos.busca.addEventListener("input", renderizarCatalogo);
document.getElementById("searchButton").addEventListener("click", () => {
    document.querySelector(".catalog").scrollIntoView({ behavior: reduzirMovimento ? "auto" : "smooth" });
    renderizarCatalogo();
});

document.getElementById("cartButton").addEventListener("click", () => elementos.modalCarrinho.classList.add("open"));
document.getElementById("closeModal").addEventListener("click", () => elementos.modalCarrinho.classList.remove("open"));
elementos.modalCarrinho.addEventListener("click", evento => {
    if (evento.target === elementos.modalCarrinho) elementos.modalCarrinho.classList.remove("open");
});

// Ao voltar para a aba, atualiza preços e estoque (o admin pode ter mudado algo).
document.addEventListener("visibilitychange", async () => {
    if (document.hidden || !estado.produtos.length) return;
    try { await carregarProdutos(); renderizarTudo(); } catch { /* mantém o que já está na tela */ }
});

/* ---------- início ---------- */
async function iniciar() {
    try {
        await carregarProdutos();
        renderizarTudo();
    } catch {
        mostrarErroCarregamento();
    }
}

configurarCarrossel();
carregarCarrinhoSalvo();
atualizarCarrinho();
iniciar();
