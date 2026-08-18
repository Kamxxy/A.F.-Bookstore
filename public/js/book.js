/* =========================================================
   A.F. BOOKSTORE
   Book Details JavaScript
========================================================= */


/* ================= STATE ================= */

let books = [];

let cart =
    JSON.parse(
        localStorage.getItem("afCart")
    ) || [];


/* ================= GET BOOK ID ================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const bookId =
    Number(
        params.get("id")
    );


/* ================= ELEMENTS ================= */

const bookDetails =
    document.getElementById(
        "bookDetails"
    );


const relatedGrid =
    document.getElementById(
        "relatedGrid"
    );


/* ================= CART ================= */

const cartBtn =
    document.getElementById(
        "cartBtn"
    );


const cartSidebar =
    document.getElementById(
        "cartSidebar"
    );


const closeCart =
    document.getElementById(
        "closeCart"
    );


const cartItems =
    document.getElementById(
        "cartItems"
    );


const cartCount =
    document.getElementById(
        "cartCount"
    );


const cartTotal =
    document.getElementById(
        "cartTotal"
    );


const overlay =
    document.getElementById(
        "overlay"
    );


/* ================= LOAD BOOKS ================= */

async function loadBook() {

    try {

        const response =
            await fetch(
                "data/books.json"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load books."
            );

        }


        books =
            await response.json();


        const book =
            books.find(
                item =>
                    item.id === bookId
            );


        if (!book) {

            showNotFound();

            return;

        }


        renderBook(book);

        renderRelated(book);

        updateCart();

    }

    catch (error) {

        console.error(error);

        bookDetails.innerHTML = `

            <div class="book-loading">

                Unable to load this book.

            </div>

        `;

    }

}


/* ================= RENDER BOOK ================= */

function renderBook(book) {

    document.title =
        `${book.title} — A.F. Bookstore`;


    bookDetails.innerHTML = `

        <div class="book-cover-area">

            <div
                class="book-cover-large"
                style="
                    background:
                    ${getBookColor(book.id)};
                "
            >

                ${book.title}

            </div>

        </div>


        <div class="book-info">

            <span class="book-category">

                ${book.category}

            </span>


            <h1 class="book-title">

                ${book.title}

            </h1>


            <p class="book-author">

                By ${book.author}

            </p>


            <div class="book-rating">

                ${getStars(book.rating)}

                <span>
                    ${book.rating}/5
                </span>

            </div>


            <div class="book-price">

                ₦${book.price.toLocaleString()}

            </div>


            <p class="book-description">

                ${book.description}

            </p>


            <div class="purchase-row">

                <div class="quantity">

                    <button
                        id="decreaseQuantity"
                    >
                        −
                    </button>


                    <span id="quantity">
                        1
                    </span>


                    <button
                        id="increaseQuantity"
                    >
                        +
                    </button>

                </div>


                <button
                    class="book-add-btn"
                    id="addBookBtn"
                >

                    Add to cart

                </button>

            </div>


            <div class="book-meta">

                <div class="meta-item">

                    <span class="meta-label">
                        Category
                    </span>

                    <span class="meta-value">
                        ${book.category}
                    </span>

                </div>


                <div class="meta-item">

                    <span class="meta-label">
                        Format
                    </span>

                    <span class="meta-value">
                        Paperback
                    </span>

                </div>


                <div class="meta-item">

                    <span class="meta-label">
                        Availability
                    </span>

                    <span class="meta-value">
                        In stock
                    </span>

                </div>

            </div>

        </div>

    `;


    setupQuantity(book);

}


/* ================= STARS ================= */

function getStars(rating) {

    return "★".repeat(rating);

}


/* ================= QUANTITY ================= */

function setupQuantity(book) {

    let quantity = 1;


    const quantityDisplay =
        document.getElementById(
            "quantity"
        );


    document
        .getElementById(
            "increaseQuantity"
        )
        .addEventListener(
            "click",
            () => {

                quantity++;

                quantityDisplay.textContent =
                    quantity;

            }
        );


    document
        .getElementById(
            "decreaseQuantity"
        )
        .addEventListener(
            "click",
            () => {

                if (quantity > 1) {

                    quantity--;

                    quantityDisplay
                        .textContent =
                        quantity;

                }

            }
        );


    document
        .getElementById(
            "addBookBtn"
        )
        .addEventListener(
            "click",
            () => {

                addToCart(
                    book,
                    quantity
                );

            }
        );

}


/* ================= ADD TO CART ================= */

function addToCart(
    book,
    quantity
) {

    const existing =
        cart.find(
            item =>
                item.id === book.id
        );


    if (existing) {

        existing.quantity +=
            quantity;

    }

    else {

        cart.push({

            ...book,

            quantity

        });

    }


    saveCart();

    openCart();

}


/* ================= SAVE CART ================= */

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
                document.createElement(
                    "div"
                );


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


    const quantity =
        cart.reduce(
            (total, book) =>
                total + book.quantity,
            0
        );


    cartCount.textContent =
        quantity;


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


/* ================= CART QUANTITY ================= */

function changeQuantity(
    id,
    amount
) {

    const book =
        cart.find(
            item =>
                item.id === id
        );


    if (!book) return;


    book.quantity += amount;


    if (book.quantity <= 0) {

        removeFromCart(id);

        return;

    }


    saveCart();

}


/* ================= REMOVE ================= */

function removeFromCart(id) {

    cart =
        cart.filter(
            book =>
                book.id !== id
        );


    saveCart();

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


/* ================= RELATED BOOKS ================= */

function renderRelated(currentBook) {

    const related =
        books
            .filter(
                book =>
                    book.id !==
                    currentBook.id &&
                    book.category ===
                    currentBook.category
            )
            .slice(0, 4);


    /*
        If there aren't enough books
        in the same category, fill
        the remaining slots with
        other books.
    */

    if (related.length < 4) {

        const additional =
            books
                .filter(
                    book =>
                        book.id !==
                        currentBook.id &&
                        !related.some(
                            item =>
                                item.id ===
                                book.id
                        )
                )
                .slice(
                    0,
                    4 - related.length
                );


        related.push(
            ...additional
        );

    }


    relatedGrid.innerHTML =
        related.map(
            book => `

                <article
                    class="related-card"
                    onclick="
                        window.location.href =
                        'book.html?id=${book.id}'
                    "
                >

                    <div
                        class="related-cover"
                        style="
                            background:
                            ${getBookColor(
                                book.id
                            )};
                        "
                    >

                        ${book.title}

                    </div>


                    <div class="related-info">

                        <h3
                            class="related-title"
                        >

                            ${book.title}

                        </h3>


                        <p
                            class="related-author"
                        >

                            ${book.author}

                        </p>


                        <p
                            class="related-price"
                        >

                            ₦${book.price.toLocaleString()}

                        </p>

                    </div>

                </article>

            `
        )
        .join("");

}


/* ================= COLORS ================= */

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
        (id - 1) %
        colors.length
    ];

}


/* ================= NOT FOUND ================= */

function showNotFound() {

    bookDetails.innerHTML = `

        <div class="book-loading">

            Book not found.

            <br>

            <a
                href="shop.html"
                style="
                    display:inline-block;
                    margin-top:20px;
                    color:#aaa;
                    font-family:Inter,sans-serif;
                    font-size:10px;
                    font-style:normal;
                "
            >

                ← Return to collection

            </a>

        </div>

    `;

}


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

loadBook();