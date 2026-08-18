/* =========================================================
   A.F. BOOKSTORE
   Shop JavaScript
========================================================= */


/* ================= STATE ================= */

let books = [];

let cart =
    JSON.parse(
        localStorage.getItem("afCart")
    ) || [];


/* ================= ELEMENTS ================= */

const shopGrid =
    document.getElementById("shopGrid");

const categoryFilter =
    document.getElementById("categoryFilter");

const sortFilter =
    document.getElementById("sortFilter");

const bookCount =
    document.getElementById("bookCount");

const noResults =
    document.getElementById("noResults");


/* ================= CART ELEMENTS ================= */

const cartBtn =
    document.getElementById("cartBtn");

const cartSidebar =
    document.getElementById("cartSidebar");

const closeCart =
    document.getElementById("closeCart");

const cartItems =
    document.getElementById("cartItems");

const cartCount =
    document.getElementById("cartCount");

const cartTotal =
    document.getElementById("cartTotal");

const overlay =
    document.getElementById("overlay");


/* ================= LOAD BOOKS ================= */

async function loadBooks() {

    try {

        const response =
            await fetch("data/books.json");


        if (!response.ok) {

            throw new Error(
                "Could not load books."
            );

        }


        books =
            await response.json();


        renderBooks(books);

        updateCart();

    }

    catch (error) {

        console.error(error);

        shopGrid.innerHTML = `

            <div class="loading">

                Unable to load the collection.

                <br>

                <small
                    style="
                        color:#444;
                        font-family:Inter,sans-serif;
                        font-size:9px;
                    "
                >
                    Make sure you're running the
                    website through a local server.
                </small>

            </div>

        `;

    }

}


/* ================= RENDER BOOKS ================= */

function renderBooks(bookList) {

    shopGrid.innerHTML = "";


    bookCount.textContent =
        bookList.length;


    if (bookList.length === 0) {

        noResults.classList.add("visible");

        return;

    }


    noResults.classList.remove("visible");


    bookList.forEach(book => {

        const card =
            document.createElement("article");


        card.className =
            "shop-book-card";


        /*
            We're intentionally using a styled
            placeholder for now.

            When actual cover images are added,
            this can become an <img>.
        */

        card.innerHTML = `

            <div class="shop-book-image">

                <div
                    class="shop-book-cover"
                    style="
                        background:
                        ${getBookColor(book.id)};
                    "
                >

                    ${book.title}

                </div>


                <div class="shop-book-overlay">

                    <button
                        class="add-cart-btn"
                        data-id="${book.id}"
                    >

                        Add to cart

                    </button>

                </div>

            </div>


            <div class="shop-book-info">

                <div>

                    <h2 class="shop-book-title">

                        ${book.title}

                    </h2>


                    <p class="shop-book-author">

                        ${book.author}

                    </p>


                    <span class="shop-book-category">

                        ${book.category}

                    </span>

                </div>


                <span class="shop-book-price">

                    ₦${book.price.toLocaleString()}

                </span>

            </div>

        `;


        /*
            Add to cart button
        */

        const addButton =
            card.querySelector(".add-cart-btn");


        addButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                addToCart(book.id);

            }
        );


        /*
            Clicking the book itself
            will eventually take us
            to the book details page.
        */

        card.addEventListener(
            "click",
            event => {

                if (
                    !event.target.closest(
                        ".add-cart-btn"
                    )
                ) {

                    openBook(book.id);

                }

            }
        );


        shopGrid.appendChild(card);

    });

}


/* ================= BOOK COLORS ================= */

function getBookColor(id) {

    const colors = [

        "#d7d3c8",
        "#b8b5ad",
        "#c8c2b7",
        "#a9a49a",
        "#d0cbc0",
        "#b2afa8",
        "#dad6cd",
        "#aaa59b",
        "#c4beb3",
        "#d1ccc1",
        "#bcb7ae",
        "#cec9bf"

    ];

    return colors[
        (id - 1) % colors.length
    ];

}


/* ================= FILTER ================= */

function filterBooks() {

    const category =
        categoryFilter.value;


    const sort =
        sortFilter.value;


    let filtered =
        [...books];


    /*
        CATEGORY
    */

    if (category !== "all") {

        filtered =
            filtered.filter(
                book =>
                    book.category === category
            );

    }


    /*
        SORTING
    */

    if (sort === "price-low") {

        filtered.sort(
            (a, b) =>
                a.price - b.price
        );

    }


    if (sort === "price-high") {

        filtered.sort(
            (a, b) =>
                b.price - a.price
        );

    }


    if (sort === "title") {

        filtered.sort(
            (a, b) =>
                a.title.localeCompare(
                    b.title
                )
        );

    }


    renderBooks(filtered);

}


/* ================= FILTER EVENTS ================= */

categoryFilter.addEventListener(
    "change",
    filterBooks
);

sortFilter.addEventListener(
    "change",
    filterBooks
);


/* ================= ADD TO CART ================= */

function addToCart(id) {

    const book =
        books.find(
            item => item.id === id
        );


    if (!book) return;


    const existing =
        cart.find(
            item => item.id === id
        );


    if (existing) {

        existing.quantity++;

    }

    else {

        cart.push({

            ...book,

            quantity: 1

        });

    }


    saveCart();

    openCart();

}


/* ================= REMOVE ================= */

function removeFromCart(id) {

    cart =
        cart.filter(
            book => book.id !== id
        );


    saveCart();

}


/* ================= QUANTITY ================= */

function changeQuantity(
    id,
    amount
) {

    const book =
        cart.find(
            item => item.id === id
        );


    if (!book) return;


    book.quantity += amount;


    if (book.quantity <= 0) {

        removeFromCart(id);

        return;

    }


    saveCart();

}


/* ================= SAVE ================= */

function saveCart() {

    localStorage.setItem(
        "afCart",
        JSON.stringify(cart)
    );


    updateCart();

}


/* ================= UPDATE CART ================= */

function updateCart() {

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

    }

    else {

        cart.forEach(book => {

            const item =
                document.createElement("div");


            item.style.cssText = `

                display:flex;

                gap:15px;

                padding:20px 0;

                border-bottom:
                    1px solid #292929;

            `;


            item.innerHTML = `

                <div
                    style="
                        width:70px;
                        height:90px;
                        background:
                            ${getBookColor(book.id)};
                        display:grid;
                        place-items:center;
                        color:#111;
                        padding:8px;
                        text-align:center;
                        font-family:
                            var(--serif);
                        font-size:13px;
                    "
                >

                    ${book.title}

                </div>


                <div style="flex:1">

                    <h3
                        style="
                            font-family:
                                var(--serif);
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
                            onclick="
                                changeQuantity(
                                    ${book.id},
                                    -1
                                )
                            "
                        >
                            −
                        </button>


                        <span>
                            ${book.quantity}
                        </span>


                        <button
                            onclick="
                                changeQuantity(
                                    ${book.id},
                                    1
                                )
                            "
                        >
                            +
                        </button>


                        <button
                            onclick="
                                removeFromCart(
                                    ${book.id}
                                )
                            "
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


    /*
        CART COUNT
    */

    const quantity =
        cart.reduce(
            (total, book) =>
                total + book.quantity,
            0
        );


    cartCount.textContent =
        quantity;


    /*
        CART TOTAL
    */

    const total =
        cart.reduce(
            (sum, book) =>
                sum +
                (
                    book.price *
                    book.quantity
                ),
            0
        );


    cartTotal.textContent =
        `₦${total.toLocaleString()}`;

}


/* ================= CART UI ================= */

function openCart() {

    cartSidebar.classList.add(
        "active"
    );

    overlay.classList.add(
        "active"
    );

}


function closeCartSidebar() {

    cartSidebar.classList.remove(
        "active"
    );

    overlay.classList.remove(
        "active"
    );

}


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


/* ================= BOOK DETAILS ================= */

function openBook(id) {

    /*
        We'll build book.html next.

        For now, store the selected
        book so the details page can
        retrieve it later.
    */

    localStorage.setItem(
        "selectedBook",
        id
    );


    window.location.href =
        `book.html?id=${id}`;

}


/* ================= SEARCH ================= */

const searchBtn =
    document.getElementById(
        "searchBtn"
    );

const searchOverlay =
    document.getElementById(
        "searchOverlay"
    );

const closeSearch =
    document.getElementById(
        "closeSearch"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const searchResults =
    document.getElementById(
        "searchResults"
    );


searchBtn.addEventListener(
    "click",
    () => {

        searchOverlay.classList.add(
            "active"
        );


        setTimeout(
            () =>
                searchInput.focus(),
            300
        );

    }
);


closeSearch.addEventListener(
    "click",
    () => {

        searchOverlay.classList.remove(
            "active"
        );

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

            searchResults.innerHTML =
                "";

            return;

        }


        const results =
            books.filter(
                book =>
                    book.title
                        .toLowerCase()
                        .includes(query) ||

                    book.author
                        .toLowerCase()
                        .includes(query) ||

                    book.category
                        .toLowerCase()
                        .includes(query)
            );


        if (results.length === 0) {

            searchResults.innerHTML = `

                <p
                    style="
                        margin-top:30px;
                        color:#555;
                        font-family:
                            var(--serif);
                        font-size:25px;
                    "
                >

                    No books found.

                </p>

            `;

            return;

        }


        searchResults.innerHTML =
            results.map(
                book => `

                    <div
                        style="
                            display:flex;
                            justify-content:
                                space-between;
                            align-items:center;
                            padding:20px 0;
                            border-bottom:
                                1px solid #292929;
                        "
                    >

                        <div>

                            <h3
                                style="
                                    font-family:
                                        var(--serif);
                                    font-size:25px;
                                    font-weight:400;
                                "
                            >

                                ${book.title}

                            </h3>

                            <small
                                style="
                                    color:#666;
                                "
                            >

                                ${book.author}

                            </small>

                        </div>


                        <button
                            onclick="
                                addToCart(
                                    ${book.id}
                                )
                            "
                            style="
                                padding:
                                    10px 15px;
                                border:
                                    1px solid #444;
                                font-size:9px;
                                letter-spacing:1px;
                            "
                        >

                            ADD

                        </button>

                    </div>

                `
            )
            .join("");

    }
);


/* ================= MOBILE MENU ================= */

const menuBtn =
    document.getElementById(
        "menuBtn"
    );

const mobileMenu =
    document.getElementById(
        "mobileMenu"
    );

const closeMenu =
    document.getElementById(
        "closeMenu"
    );


menuBtn.addEventListener(
    "click",
    () => {

        mobileMenu.classList.add(
            "active"
        );

    }
);


closeMenu.addEventListener(
    "click",
    () => {

        mobileMenu.classList.remove(
            "active"
        );

    }
);


/* ================= START ================= */

loadBooks();