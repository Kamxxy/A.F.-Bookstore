/* =========================================================
   A.F. BOOKSTORE
   Main JavaScript
========================================================= */


/* ================= BOOK DATA ================= */

const books = [
    {
        id: 1,
        title: "The Silent Patient",
        author: "Alex Michaelides",
        price: 8500,
        category: "Mystery",
        color: "#d7d3c8"
    },

    {
        id: 2,
        title: "The Midnight Library",
        author: "Matt Haig",
        price: 7500,
        category: "Fiction",
        color: "#b8b5ad"
    },

    {
        id: 3,
        title: "Normal People",
        author: "Sally Rooney",
        price: 9000,
        category: "Romance",
        color: "#c8c2b7"
    },

    {
        id: 4,
        title: "The Secret History",
        author: "Donna Tartt",
        price: 10500,
        category: "Fiction",
        color: "#a9a49a"
    }
];


/* ================= CART ================= */

let cart = JSON.parse(localStorage.getItem("afCart")) || [];


/* ================= ELEMENTS ================= */

const booksGrid = document.getElementById("booksGrid");

const cartBtn = document.getElementById("cartBtn");
const cartSidebar = document.getElementById("cartSidebar");
const closeCart = document.getElementById("closeCart");

const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");

const overlay = document.getElementById("overlay");

const searchBtn = document.getElementById("searchBtn");
const searchOverlay = document.getElementById("searchOverlay");
const closeSearch = document.getElementById("closeSearch");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const closeMenu = document.getElementById("closeMenu");


/* ================= DISPLAY BOOKS ================= */

function displayBooks(bookList = books) {

    booksGrid.innerHTML = "";

    bookList.forEach(book => {

        const card = document.createElement("article");

        card.classList.add("book-card");

        card.innerHTML = `

            <div class="book-image">

                <div
                    class="book-placeholder"
                    style="background: ${book.color}"
                >
                    ${book.title}
                </div>

                <div class="book-overlay">

                    <button
                        class="quick-add"
                        onclick="addToCart(${book.id})"
                    >
                        Add to cart
                    </button>

                </div>

            </div>

            <div class="book-info">

                <div>

                    <h3>
                        ${book.title}
                    </h3>

                    <p class="book-author">
                        ${book.author}
                    </p>

                </div>

                <span class="book-price">
                    ₦${book.price.toLocaleString()}
                </span>

            </div>

        `;

        booksGrid.appendChild(card);

    });

}


/* ================= ADD TO CART ================= */

function addToCart(id) {

    const book = books.find(book => book.id === id);

    const existingBook = cart.find(item => item.id === id);

    if (existingBook) {

        existingBook.quantity++;

    } else {

        cart.push({
            ...book,
            quantity: 1
        });

    }

    saveCart();

    openCart();

}


/* ================= REMOVE FROM CART ================= */

function removeFromCart(id) {

    cart = cart.filter(book => book.id !== id);

    saveCart();

}


/* ================= CHANGE QUANTITY ================= */

function changeQuantity(id, amount) {

    const book = cart.find(item => item.id === id);

    if (!book) return;

    book.quantity += amount;

    if (book.quantity <= 0) {

        removeFromCart(id);

        return;

    }

    saveCart();

}


/* ================= SAVE CART ================= */

function saveCart() {

    localStorage.setItem(
        "afCart",
        JSON.stringify(cart)
    );

    renderCart();

}


/* ================= RENDER CART ================= */

function renderCart() {

    cartItems.innerHTML = "";

    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                <span>◌</span>

                <p>
                    Your cart is empty.
                </p>

            </div>

        `;

    } else {

        cart.forEach(book => {

            const item = document.createElement("div");

            item.style.cssText = `
                display:flex;
                gap:15px;
                padding:20px 0;
                border-bottom:1px solid #292929;
            `;

            item.innerHTML = `

                <div
                    style="
                        width:70px;
                        height:90px;
                        background:${book.color};
                        display:grid;
                        place-items:center;
                        color:#111;
                        padding:8px;
                        text-align:center;
                        font-family:var(--serif);
                        font-size:13px;
                    "
                >
                    ${book.title}
                </div>

                <div style="flex:1">

                    <h3
                        style="
                            font-family:var(--serif);
                            font-size:19px;
                            font-weight:400;
                        "
                    >
                        ${book.title}
                    </h3>

                    <p
                        style="
                            color:#666;
                            font-size:9px;
                            margin-top:3px;
                        "
                    >
                        ₦${book.price.toLocaleString()}
                    </p>

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:12px;
                            margin-top:12px;
                        "
                    >

                        <button
                            onclick="changeQuantity(${book.id}, -1)"
                        >
                            −
                        </button>

                        <span>
                            ${book.quantity}
                        </span>

                        <button
                            onclick="changeQuantity(${book.id}, 1)"
                        >
                            +
                        </button>

                        <button
                            onclick="removeFromCart(${book.id})"
                            style="
                                margin-left:auto;
                                color:#666;
                                font-size:9px;
                            "
                        >
                            REMOVE
                        </button>

                    </div>

                </div>

            `;

            cartItems.appendChild(item);

        });

    }


    /* Count */

    const quantity = cart.reduce(
        (total, book) => total + book.quantity,
        0
    );

    cartCount.textContent = quantity;


    /* Total */

    const total = cart.reduce(
        (sum, book) =>
            sum + (book.price * book.quantity),
        0
    );

    cartTotal.textContent =
        `₦${total.toLocaleString()}`;

}


/* ================= OPEN CART ================= */

function openCart() {

    cartSidebar.classList.add("active");
    overlay.classList.add("active");

}


/* ================= CLOSE CART ================= */

function closeCartSidebar() {

    cartSidebar.classList.remove("active");
    overlay.classList.remove("active");

}


/* ================= CART EVENTS ================= */

cartBtn.addEventListener(
    "click",
    openCart
);

closeCart.addEventListener(
    "click",
    closeCartSidebar
);

overlay.addEventListener(
    "click",
    closeCartSidebar
);


/* ================= SEARCH ================= */

searchBtn.addEventListener(
    "click",
    () => {

        searchOverlay.classList.add("active");

        setTimeout(() => {
            searchInput.focus();
        }, 300);

    }
);


closeSearch.addEventListener(
    "click",
    () => {

        searchOverlay.classList.remove("active");

    }
);


searchInput.addEventListener(
    "input",
    () => {

        const query =
            searchInput.value
                .toLowerCase()
                .trim();

        if (!query) {

            searchResults.innerHTML = "";

            return;

        }

        const results =
            books.filter(book =>
                book.title
                    .toLowerCase()
                    .includes(query) ||
                book.author
                    .toLowerCase()
                    .includes(query)
            );


        if (results.length === 0) {

            searchResults.innerHTML = `

                <p
                    style="
                        margin-top:30px;
                        color:#555;
                        font-family:var(--serif);
                        font-size:25px;
                    "
                >
                    No books found.
                </p>

            `;

            return;

        }


        searchResults.innerHTML =
            results.map(book => `

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        padding:20px 0;
                        border-bottom:1px solid #292929;
                    "
                >

                    <div>

                        <h3
                            style="
                                font-family:var(--serif);
                                font-size:25px;
                                font-weight:400;
                            "
                        >
                            ${book.title}
                        </h3>

                        <small style="color:#666">
                            ${book.author}
                        </small>

                    </div>

                    <button
                        onclick="addToCart(${book.id})"
                        style="
                            padding:10px 15px;
                            border:1px solid #444;
                            font-size:9px;
                            letter-spacing:1px;
                        "
                    >
                        ADD
                    </button>

                </div>

            `).join("");

    }
);


/* ================= MOBILE MENU ================= */

menuBtn.addEventListener(
    "click",
    () => {

        mobileMenu.classList.add("active");

    }
);


closeMenu.addEventListener(
    "click",
    () => {

        mobileMenu.classList.remove("active");

    }
);


/* Close mobile menu when clicking a link */

document
    .querySelectorAll(".mobile-links a")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {
                mobileMenu.classList.remove("active");
            }
        );

    });


/* ================= INITIALIZE ================= */

displayBooks();

renderCart();