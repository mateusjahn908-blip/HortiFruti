const produtos = [
    { id: 1, nome: "Banana30cm", categoria: "Frutas", preco: 4.99, precoAntigo: 6.49, icone: '<img src="https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=600&q=80" alt="Banana">', oferta: true }
];

let carrinho = [];
let categoriaAtual = "Todos";

const elementos = {
    ofertas: document.getElementById("offersGrid"),
    catalogo: document.getElementById("catalogGrid"),
    busca: document.getElementById("searchInput"),
    mensagemVazia: document.getElementById("emptyMessage"),
    contadorCarrinho: document.getElementById("cartCount"),
    toast: document.getElementById("toast"),
    modalCarrinho: document.getElementById("cartModal"),
    itensCarrinho: document.getElementById("cartItems"),
    totalCarrinho: document.getElementById("cartTotal")
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

const renderizarOfertas = () => {
    elementos.ofertas.innerHTML = produtos.filter(produto => produto.oferta).map(montarCardProduto).join("");
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