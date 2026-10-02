const produtos = [
    { id: "Banana30cm", nome: "Banana30cm", categoria: "Frutas", preco: 4.99, precoAntigo: 6.49, icone: '<img src="https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=600&q=80" alt="Banana">', oferta: true },
    { id: "MaçaGorda", nome: "MaçaGorda", categoria: "Frutas", preco: 3.99, precoAntigo: 5.49, icone: '<img src="https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=600&q=80" alt="Maça">', oferta: true },
    { id: "LaranjaAlaranjada", nome: "LaranjaAlaranjada", categoria: "Frutas", preco: 2.99, precoAntigo: 4.49, icone: '<img src="https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80" alt="Laranja">', oferta: true },
    { id: "TomateSuculento", nome: "TomateSuculento", categoria: "Legumes", preco: 5.99, precoAntigo: 7.49, icone: '<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxxaOpMXDTRKj1Z0zZ_Y0pMGXmLR7tQ1YlPhUHEM6ISw&s=10" alt="Tomate">', oferta: true },
    { id: "AlfaceVerde", nome: "AlfaceVerde", categoria: "Verduras", preco: 3.49, icone: '<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3ZRWdTKY61SqP2EiduTm84qEMp3X_A63I1giu0BTRhA&s=10" alt="Alface">', oferta: false },
    { id: "Morango", nome: "Morango", categoria: "Frutas", preco: 10.99, icone: '<img src="https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80" alt="Morango">', oferta: false },
    { id: "Abacaxi", nome: "Abacaxi", categoria: "Frutas", preco: 12.99, icone: '<img src="https://www.estadao.com.br/resizer/v2/GEUVV5EDH5FUVEQJ6YYTV3JERA.jpeg?quality=80&auth=06f90ffbbfbc0d6a8ccc45f21a493500fce0cef5a6b0fe2a2d50dfc3d0226b1d&width=708&height=456&focal=2100,1390" alt="Abacaxi">', oferta: false },
    { id: "Pimentao", nome: "Pimentão", categoria: "Legumes", preco: 7.49, icone: '<img src="https://s2.glbimg.com/DV0BJoVaIEax1qzAhCWwNWOk158=/620x466/smart/e.glbimg.com/og/ed/f/original/2021/04/14/como-plantar-pimentao-em-casa-getty-images-1.jpg" alt="Pimentão">', oferta: false },
    { id: "Cenoura", nome: "Cenoura", categoria: "Legumes", preco: 5.99, icone: '<img src="https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=600&q=80" alt="Cenoura">', oferta: false },
    { id: "Limao", nome: "Limão", categoria: "Frutas", preco: 4.79, icone: '<img src="https://img.drogaraia.com.br/uploads/2024/04/adobestock_8188882_easy-resize-c.jpg" alt="Limão">', oferta: false },
    { id: "PaoDeForma", nome: "Pão de Forma", categoria: "Mercearia", preco: 6.99, icone: '<img src="https://cdn.awsli.com.br/600x700/2738/2738802/produto/285843036/forma-tradidional-1-3cdu1vu0sr.png" alt="Pão de Forma">', oferta: false },
    { id: "PaoDequeijo", nome: "Pão de Queijo", categoria: "Laticínios", preco: 7.99, icone: '<img src="https://static.itdg.com.br/images/640-400/dfc5a3f918dc30f32747b44cd3a18712/pao-de-queijo-facil-e-delicioso-3-.jpg" alt="Pão de Queijo">', oferta: false },
    { id: "PaoFrances", nome: "Pão Francês", categoria: "Mercearia", preco: 4.99, icone: '<img src="https://www.redchameleon.com.br/storage/images/cache/forno-turbo-pao-de-sal-crocante-1280-fb6adcfa.jpg" alt="Pão Francês">', oferta: false },
    { id: "LeiteIntegral", nome: "Leite Integral", categoria: "Laticínios", preco: 4.49, icone: '<img src="https://assets.ibecom.com.br/ib.item.image.large/l-c54acdc6d1da4f50a37252efe847bbd7.jpeg" alt="Leite Integral">', oferta: false },
    { id: "QueijoPrato", nome: "Queijo Prato", categoria: "Laticínios", preco: 19.99, icone: '<img src="https://images.tcdn.com.br/img/img_prod/1049139/queijo_prato_fatiado_150g_d_or_603_1_d9a6770e63d8bc4319f8a61771adfb1d.jpg" alt="Queijo Prato">', oferta: false },
    { id: "presunto", nome: "Presunto", categoria: "Laticínios", preco: 3.49, icone: '<img src="https://vitat.com.br/wp-content/uploads/2023/04/tipos-de-presunto-scaled.jpg" alt="Presunto">', oferta: false }
];

const ofertasDaSemana = [
    [
        { nome: "Banana", categoria: "Frutas", preco: 4.99, precoAntigo: 6.49, imagem: "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=600&q=80", desconto: "-23%" },
        { nome: "Tomate", categoria: "Legumes", preco: 5.99, precoAntigo: 7.49, imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxxaOpMXDTRKj1Z0zZ_Y0pMGXmLR7tQ1YlPhUHEM6ISw&s=10", desconto: "-20%" },
        { nome: "Maçã", categoria: "Frutas", preco: 3.99, precoAntigo: 5.49, imagem: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=600&q=80", desconto: "-27%" },
        { nome: "Alface", categoria: "Verduras", preco: 3.49, imagem: "https://images.unsplash.com/photo-1582515073490-399813c1f8b6?auto=format&fit=crop&w=600&q=80", desconto: "-29%" }
    ],
    [
        { nome: "Morango", categoria: "Frutas", preco: 8.99, imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGGDTikXHUyYImtbzBwlaW7Xu3W-gWOs4Vaar31DH2BA&s=10", desconto: "-22%" },
        { nome: "Pimentão", categoria: "Legumes", preco: 5.79, imagem: "https://s2.glbimg.com/DV0BJoVaIEax1qzAhCWwNWOk158=/620x466/smart/e.glbimg.com/og/ed/f/original/2021/04/14/como-plantar-pimentao-em-casa-getty-images-1.jpg", desconto: "-26%" },
        { nome: "Abacaxi", categoria: "Frutas", preco: 9.99, imagem: "https://www.estadao.com.br/resizer/v2/GEUVV5EDH5FUVEQJ6YYTV3JERA.jpeg?quality=80&auth=06f90ffbbfbc0d6a8ccc45f21a493500fce0cef5a6b0fe2a2d50dfc3d0226b1d&width=708&height=456&focal=2100,1390", desconto: "-25%" },
        { nome: "Cenoura", categoria: "Legumes", preco: 4.49, imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTY6o1Bl8mStaVEB7vPe2QyoJR_ohiCFNn9TXWwZfZDA&s=10", desconto: "-27%" }
    ],
    [
        { nome: "Limão", categoria: "Frutas", preco: 3.79, imagem: "https://img.drogaraia.com.br/uploads/2024/04/adobestock_8188882_easy-resize-c.jpg", desconto: "-26%" },
        { nome: "Ervilha", categoria: "Legumes", preco: 4.89, precoAntigo: 6.19, imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-ZBlaXW3ltuaIrXTICxLyV5LC8Igdrup2mBFPOKmiFw&s=10", desconto: "-21%" },
        { nome: "Manga", categoria: "Frutas", preco: 5.99, precoAntigo: 7.49, imagem: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80", desconto: "-20%" },
        { nome: "Rúcula", categoria: "Verduras", preco: 3.19, precoAntigo: 4.29, imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVMQZpgBDno8Qke8hZVkLngyUg1uH_5WOpsLsdyAG4wQ&s=10", desconto: "-25%" }
    ],
    [
        {nome: "pao de queijo", categoria: "Laticínios", preco: 7.99, imagem: "https://static.itdg.com.br/images/640-400/dfc5a3f918dc30f32747b44cd3a18712/pao-de-queijo-facil-e-delicioso-3-.jpg", desconto: "-22%"},
        { nome: "Queijo Prato", categoria: "Laticínios", preco: 19.99, imagem: "https://images.tcdn.com.br/img/img_prod/1049139/queijo_prato_fatiado_150g_d_or_603_1_d9a6770e63d8bc4319f8a61771adfb1d.jpg", desconto: "-22%" },
        { nome: "Presunto", categoria: "Laticínios", preco: 3.49, imagem: "https://vitat.com.br/wp-content/uploads/2023/04/tipos-de-presunto-scaled.jpg", desconto: "-25%" },
        { nome: "Leite Integral", categoria: "Laticínios", preco: 4.49, imagem: "https://assets.ibecom.com.br/ib.item.image.large/l-c54acdc6d1da4f50a37252efe847bbd7.jpeg", desconto: "-23%" },

    ],
    [
        {nome: "Pão de Forma", categoria: "Mercearia", preco: 6.99, imagem: "https://cdn.awsli.com.br/600x700/2738/2738802/produto/285843036/forma-tradidional-1-3cdu1vu0sr.png", desconto: "-20%"},
        {nome: "Pão Francês", categoria: "Mercearia", preco: 4.99, imagem: "https://www.redchameleon.com.br/storage/images/cache/forno-turbo-pao-de-sal-crocante-1280-fb6adcfa.jpg", desconto: "-25%"},

 ],
];
let carrinho = [];
let categoriaAtual = "Todos";
let indexCarousel = 0;

const elementos = {
    ofertas: document.getElementById("offersGrid"),
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

const formatarPreco = valor => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const montarCardProduto = produto => `
  <article class="product">
    ${produto.oferta ? '<span class="product-badge">OFERTA</span>' : ""}
    <div class="product-image">${produto.icone}</div>
    <p class="product-category">${produto.categoria}</p>
    <h3>${produto.nome}</h3>
    ${produto.precoAntigo ? `<div class="old-price">${formatarPreco(produto.precoAntigo)}</div>` : '<div class="old-price">&nbsp;</div>'}
    <div class="price">${formatarPreco(produto.preco)}</div>
    <button class="add-button" data-id="${produto.id}">Adicionar</button>
  </article>
`;

const semanaAtual = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)) % ofertasDaSemana.length;
const ofertasAtuais = ofertasDaSemana[semanaAtual];

const renderizarCarrosselHero = () => {
    if (!elementos.heroCarousel || !elementos.heroDots) return;

    const slides = ofertasDaSemana.map((grupo, grupoIndex) => `
        <article class="hero-slide">
            <div class="hero-slide-header">
                <div>
                    <span class="hero-slide-label">Ofertas da semana</span>
                    <h3>Até 30% OFF</h3>
                </div>
                <span class="hero-slide-tag">Semana ${grupoIndex + 1}</span>
            </div>

            <div class="hero-slide-grid">
                ${grupo.map(item => `
                    <div class="hero-product-card">
                        <div class="hero-product-image">
                            <img src="${item.imagem}" alt="${item.nome}">
                        </div>
                        <div class="hero-product-content">
                            <span class="hero-product-category">${item.categoria}</span>
                            <strong>${item.nome}</strong>
                            <div class="hero-product-prices">
                                <span class="hero-product-old">${formatarPreco(item.precoAntigo)}</span>
                                <span class="hero-product-price">${formatarPreco(item.preco)}</span>
                            </div>
                            <span class="hero-product-badge">${item.desconto}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </article>
    `).join("");

    elementos.heroCarousel.innerHTML = slides;
    elementos.heroCarousel.style.transform = `translateX(-${indexCarousel * 100}%)`;
    elementos.heroDots.innerHTML = ofertasDaSemana.map((_, i) => `
        <button class="carousel-dot ${i === indexCarousel ? "active" : ""}" data-index="${i}" type="button" aria-label="Ir para o slide ${i + 1}"></button>
    `).join("");
};

const avancarCarrosselHero = () => {
    if (!elementos.heroCarousel || !elementos.heroDots) return;
    indexCarousel = (indexCarousel + 1) % ofertasDaSemana.length;
    renderizarCarrosselHero();
};

const retrocederCarrosselHero = () => {
    if (!elementos.heroCarousel || !elementos.heroDots) return;
    indexCarousel = (indexCarousel - 1 + ofertasDaSemana.length) % ofertasDaSemana.length;
    renderizarCarrosselHero();
};

const iniciarCarrosselHero = () => {
    if (!elementos.heroCarousel || !elementos.heroDots) return;
    renderizarCarrosselHero();
    setInterval(avancarCarrosselHero, 3500);
};

const renderizarOfertas = () => {
    elementos.ofertas.innerHTML = produtos
        .filter(produto => produto.oferta)
        .slice(0, 4)
        .map(montarCardProduto)
        .join("");
};

const renderizarCatalogo = () => {
    const termoBusca = elementos.busca.value.toLowerCase().trim();

    const produtosFiltrados = produtos.filter(produto => {
        const bateCategoria = categoriaAtual === "Todos" || produto.categoria === categoriaAtual;
        const bateBusca = produto.nome.toLowerCase().includes(termoBusca);
        return bateCategoria && bateBusca;
    });

    elementos.catalogo.innerHTML = produtosFiltrados.map(montarCardProduto).join("");
    elementos.mensagemVazia.style.display = produtosFiltrados.length ? "none" : "block";
};

const adicionarAoCarrinho = id => {
    const produto = produtos.find(item => item.id === id);
    if (!produto) return;

    const itemExistente = carrinho.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ ...produto, quantidade: 1 });
    }

    atualizarCarrinho();
    mostrarToast(`${produto.nome} adicionado ao carrinho!`);
};

const atualizarCarrinho = () => {
    const quantidadeTotal = carrinho.reduce((total, item) => total + item.quantidade, 0);
    elementos.contadorCarrinho.textContent = quantidadeTotal;

    if (!carrinho.length) {
        elementos.itensCarrinho.innerHTML = '<p style="color:#777">Seu carrinho está vazio.</p>';
    } else {
        elementos.itensCarrinho.innerHTML = carrinho.map(item => `
      <div class="cart-line">
        <span>${item.quantidade}x ${item.nome}</span>
        <strong>${formatarPreco(item.preco * item.quantidade)}</strong>
      </div>
    `).join("");
    }

    const total = carrinho.reduce((acumulador, item) => acumulador + item.preco * item.quantidade, 0);
    elementos.totalCarrinho.textContent = formatarPreco(total);
};

const mostrarToast = mensagem => {
    elementos.toast.textContent = mensagem;
    elementos.toast.classList.add("show");
    clearTimeout(mostrarToast.timer);
    mostrarToast.timer = setTimeout(() => elementos.toast.classList.remove("show"), 1800);
};

document.addEventListener("click", event => {
    const botaoAdicionar = event.target.closest(".add-button");
    if (botaoAdicionar) {
        return adicionarAoCarrinho(botaoAdicionar.dataset.id);
    }

    const filtro = event.target.closest(".filter");
    if (!filtro) return;

    document.querySelectorAll(".filter").forEach(botao => {
        botao.classList.toggle("active", botao === filtro);
    });

    categoriaAtual = filtro.dataset.category;
    renderizarCatalogo();
});

elementos.busca.addEventListener("input", renderizarCatalogo);

document.getElementById("searchButton").addEventListener("click", () => {
    document.querySelector(".catalog").scrollIntoView({ behavior: "smooth" });
    renderizarCatalogo();
});

if (elementos.prevSlide) {
    elementos.prevSlide.addEventListener("click", retrocederCarrosselHero);
}

if (elementos.nextSlide) {
    elementos.nextSlide.addEventListener("click", avancarCarrosselHero);
}

document.addEventListener("click", event => {
    const dot = event.target.closest(".carousel-dot");
    if (dot) {
        indexCarousel = Number(dot.dataset.index);
        renderizarCarrosselHero();
    }
});

document.getElementById("cartButton").addEventListener("click", () => elementos.modalCarrinho.classList.add("open"));
document.getElementById("closeModal").addEventListener("click", () => elementos.modalCarrinho.classList.remove("open"));

elementos.modalCarrinho.addEventListener("click", event => {
    if (event.target === elementos.modalCarrinho) {
        elementos.modalCarrinho.classList.remove("open");
    }
});

renderizarOfertas();
renderizarCatalogo();
atualizarCarrinho();
iniciarCarrosselHero();