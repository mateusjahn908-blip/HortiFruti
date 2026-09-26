/* =========================
   PRODUTOS
========================= */

const products = [

    {
        id: 1,
        name: "Banana Prata",
        category: "Frutas",
        price: 4.99,
        oldPrice: 6.49,
        icon: "🍌",
        offer: true
    },

    {
        id: 2,
        name: "Maçã Nacional",
        category: "Frutas",
        price: 7.99,
        oldPrice: 9.99,
        icon: "🍎",
        offer: true
    },

    {
        id: 3,
        name: "Tomate Italiano",
        category: "Legumes",
        price: 5.49,
        oldPrice: 7.29,
        icon: "🍅",
        offer: true
    },

    {
        id: 4,
        name: "Alface Crespa",
        category: "Verduras",
        price: 2.99,
        oldPrice: 4.49,
        icon: "🥬",
        offer: true
    },

    {
        id: 5,
        name: "Laranja",
        category: "Frutas",
        price: 4.79,
        icon: "🍊"
    },

    {
        id: 6,
        name: "Cenoura",
        category: "Legumes",
        price: 3.89,
        icon: "🥕"
    },

    {
        id: 7,
        name: "Brócolis",
        category: "Verduras",
        price: 6.49,
        icon: "🥦"
    },

    {
        id: 8,
        name: "Arroz 5kg",
        category: "Mercearia",
        price: 24.90,
        icon: "🍚"
    },

    {
        id: 9,
        name: "Feijão Carioca",
        category: "Mercearia",
        price: 8.99,
        icon: "🫘"
    },

    {
        id: 10,
        name: "Suco de Laranja",
        category: "Bebidas",
        price: 9.90,
        icon: "🧃"
    },

    {
        id: 11,
        name: "Abacaxi",
        category: "Frutas",
        price: 6.90,
        icon: "🍍"
    },

    {
        id: 12,
        name: "Batata",
        category: "Legumes",
        price: 4.29,
        icon: "🥔"
    }

];


/* =========================
   VARIÁVEIS
========================= */

let cart = [];

let currentCategory = "Todos";


const offersGrid =
    document.getElementById("offersGrid");

const catalogGrid =
    document.getElementById("catalogGrid");

const searchInput =
    document.getElementById("searchInput");

const emptyMessage =
    document.getElementById("emptyMessage");

const cartCount =
    document.getElementById("cartCount");

const toast =
    document.getElementById("toast");

const cartModal =
    document.getElementById("cartModal");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");


/* =========================
   FORMATAÇÃO DE PREÇO
========================= */

function formatPrice(price) {

    return price.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


/* =========================
   CARD DO PRODUTO
========================= */

function createProductCard(product) {

    return `

        <article class="product">

            ${
                product.offer
                ?
                `<span class="product-badge">
                    OFERTA
                </span>`
                :
                ""
            }


            <div class="product-image">

                ${product.icon}

            </div>


            <p class="product-category">

                ${product.category}

            </p>


            <h3>

                ${product.name}

            </h3>


            ${
                product.oldPrice
                ?
                `
                <div class="old-price">

                    ${formatPrice(
                        product.oldPrice
                    )}

                </div>
                `
                :
                `
                <div class="old-price">
                    &nbsp;
                </div>
                `
            }


            <div class="price">

                ${formatPrice(
                    product.price
                )}

            </div>


            <button
                class="add-button"
                data-id="${product.id}"
            >

                Adicionar

            </button>

        </article>

    `;

}


/* =========================
   OFERTAS
========================= */

function renderOffers() {

    const offers =
        products.filter(
            product => product.offer
        );


    offersGrid.innerHTML =
        offers
            .map(createProductCard)
            .join("");

}


/* =========================
   CATÁLOGO
========================= */

function renderCatalog() {

    const search =
        searchInput.value
            .toLowerCase()
            .trim();


    const filteredProducts =
        products.filter(product => {

            const categoryMatch =
                currentCategory === "Todos" ||
                product.category === currentCategory;


            const searchMatch =
                product.name
                    .toLowerCase()
                    .includes(search);


            return (
                categoryMatch &&
                searchMatch
            );

        });


    catalogGrid.innerHTML =
        filteredProducts
            .map(createProductCard)
            .join("");


    if (filteredProducts.length === 0) {

        emptyMessage.style.display =
            "block";

    } else {

        emptyMessage.style.display =
            "none";

    }

}


/* =========================
   ADICIONAR CARRINHO
========================= */

function addToCart(id) {

    const product =
        products.find(
            item => item.id === id
        );


    const existing =
        cart.find(
            item => item.id === id
        );


    if (existing) {

        existing.quantity++;

    } else {

        cart.push({

            ...product,

            quantity: 1

        });

    }


    updateCart();


    showToast(
        `${product.name} adicionado ao carrinho!`
    );

}


/* =========================
   ATUALIZAR CARRINHO
========================= */

function updateCart() {

    const quantity =
        cart.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );


    cartCount.textContent =
        quantity;


    if (cart.length === 0) {

        cartItems.innerHTML = `

            <p style="color:#777">

                Seu carrinho está vazio.

            </p>

        `;

    } else {

        cartItems.innerHTML =
            cart.map(item => `

                <div class="cart-line">

                    <span>

                        ${item.quantity}x
                        ${item.name}

                    </span>

                    <strong>

                        ${formatPrice(
                            item.price *
                            item.quantity
                        )}

                    </strong>

                </div>

            `).join("");

    }


    const total =
        cart.reduce(
            (sum, item) =>
                sum +
                item.price *
                item.quantity,
            0
        );


    cartTotal.textContent =
        formatPrice(total);

}


/* =========================
   TOAST
========================= */

function showToast(message) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 1800);

}


/* =========================
   BOTÕES DOS PRODUTOS
========================= */

document.addEventListener(
    "click",
    function(event) {


        const addButton =
            event.target.closest(
                ".add-button"
            );


        if (addButton) {

            const id =
                Number(
                    addButton.dataset.id
                );


            addToCart(id);

        }


        const filter =
            event.target.closest(
                ".filter"
            );


        if (filter) {

            document
                .querySelectorAll(
                    ".filter"
                )
                .forEach(button => {

                    button.classList.remove(
                        "active"
                    );

                });


            filter.classList.add(
                "active"
            );


            currentCategory =
                filter.dataset.category;


            renderCatalog();

        }

    }
);


/* =========================
   BUSCA
========================= */

searchInput.addEventListener(
    "input",
    renderCatalog
);


document
    .getElementById("searchButton")
    .addEventListener(
        "click",
        function() {

            document
                .querySelector(".catalog")
                .scrollIntoView({
                    behavior: "smooth"
                });

            renderCatalog();

        }
    );


/* =========================
   CARRINHO
========================= */

document
    .getElementById("cartButton")
    .addEventListener(
        "click",
        function() {

            cartModal.classList.add(
                "open"
            );

        }
    );


document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        function() {

            cartModal.classList.remove(
                "open"
            );

        }
    );


cartModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target ===
            cartModal
        ) {

            cartModal.classList.remove(
                "open"
            );

        }

    }
);


/* =========================
   INICIALIZAÇÃO
========================= */

renderOffers();

renderCatalog();

updateCart();