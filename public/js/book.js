/* =========================================================
   A.F. BOOKSTORE
   Book Details JavaScript
========================================================= */


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


/* ================= LOAD BOOK ================= */

async function loadBook() {

    try {

        await loadBooksData();


        const book =
            getBookById(bookId);


        if (!book) {

            showNotFound();

            return;

        }


        renderBook(book);

        renderRelated(book);

    }

    catch (error) {

        console.error(
            "Book details loading error:",
            error
        );


        if (bookDetails) {

            bookDetails.innerHTML = `

                <div class="book-loading">

                    Unable to load this book.

                </div>

            `;

        }

    }

}


/* ================= RENDER BOOK ================= */

function renderBook(book) {

    document.title =
        `${book.title} — A.F. Bookstore`;


    if (!bookDetails) return;


    bookDetails.innerHTML = `

        <div class="book-cover-area">

            <div
                class="book-cover-large"
                style="
                    background:
                    ${getBookColor(book.id)};
                "
            >

                ${
                    book.cover
                        ? `
                            <img
                                src="${book.cover}"
                                alt="${book.title} by ${book.author}"
                            >
                        `
                        : `
                            <span>
                                ${book.title}
                            </span>
                        `
                }

            </div>

        </div>


        <div class="product-info">

            <span class="product-category">

                ${book.category}

            </span>


            <h1 class="product-title">

                ${book.title}

            </h1>


            <p class="product-author">

                By ${book.author}

            </p>


            <div class="product-rating">

                ${getStars(book.rating)}

                <span>
                    ${book.rating}/5
                </span>

            </div>


            <div class="product-price">

                ${formatPrice(book.price)}

            </div>


            <p class="product-description">

                ${book.description || ""}

            </p>


            <div class="purchase-row">

                <div class="quantity">

                    <button
                        type="button"
                        id="decreaseQuantity"
                        aria-label="Decrease quantity"
                    >

                        −

                    </button>


                    <span id="quantity">

                        1

                    </span>


                    <button
                        type="button"
                        id="increaseQuantity"
                        aria-label="Increase quantity"
                    >

                        +

                    </button>

                </div>


                <button
                    type="button"
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

                        ${book.stockStatus}

                    </span>

                </div>

                <div class="meta-item">

                    <span class="meta-label">

                        Stock

                    </span>
                    

                    <span class="meta-value">
                    
                        ${book.stockNumber}
                
                    </span>

                </div>

            </div>

        </div>

    `;


    setupQuantity(book);

}


/* ================= STARS ================= */

function getStars(rating) {

    const value =
        Number(rating) || 0;


    return "★".repeat(
        Math.max(
            0,
            Math.round(value)
        )
    );

}


/* ================= QUANTITY ================= */

function setupQuantity(book) {

    let quantity = 1;


    const quantityDisplay =
        document.getElementById(
            "quantity"
        );


    const increaseButton =
        document.getElementById(
            "increaseQuantity"
        );


    const decreaseButton =
        document.getElementById(
            "decreaseQuantity"
        );


    const addButton =
        document.getElementById(
            "addBookBtn"
        );

    const stock =
    Number(book.stockNumber) || 0;


if (stock <= 0) {

    addButton.disabled = true;

    addButton.textContent =
        "Out of Stock";

}


    if (
        !quantityDisplay ||
        !increaseButton ||
        !decreaseButton ||
        !addButton
    ) {

        return;

    }


    /* ================= INCREASE ================= */

    increaseButton.addEventListener(
    "click",
    () => {

        if (quantity >= stock) {
            return;
        }


        quantity++;


        quantityDisplay.textContent =
            quantity;

    }
);


    /* ================= DECREASE ================= */

    decreaseButton.addEventListener(
        "click",
        () => {

            if (quantity > 1) {

                quantity--;


                quantityDisplay.textContent =
                    quantity;

            }

        }
    );


    /* ================= ADD TO CART ================= */

    addButton.addEventListener(
        "click",
        () => {

            addToCart(
                book,
                quantity
            );

        }
    );

}


/* ================= RELATED BOOKS ================= */

function renderRelated(currentBook) {

    if (!relatedGrid) return;


    /*
        First get books from the same category.
    */

    const related =
        books
            .filter(
                book =>
                    Number(book.id) !==
                        Number(currentBook.id) &&

                    book.category ===
                        currentBook.category
            )
            .slice(0, 4);


    /*
        If there are fewer than four
        related books, fill the remaining
        slots with other books.
    */

    if (related.length < 4) {

        const additional =
            books
                .filter(
                    book =>
                        Number(book.id) !==
                            Number(currentBook.id) &&

                        !related.some(
                            item =>
                                Number(item.id) ===
                                Number(book.id)
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


    /*
        Clear existing cards.
    */

    relatedGrid.innerHTML = "";


    /*
        Render cards using the SAME
        structure as the homepage.
    */

    related.forEach(book => {

        const card =
            document.createElement(
                "article"
            );


        card.className =
            "book-card";


        card.innerHTML = `

            <div class="book-image">

                <a
                    href="${getBookUrl(book.id)}"
                    class="book-image-link"
                    aria-label="View ${book.title}"
                >

                    <div
                        class="book-placeholder"
                        style="
                            background:
                            ${getBookColor(book.id)};
                        "
                    >

                        ${
                            book.cover
                                ? `
                                    <img
                                        src="${book.cover}"
                                        alt="${book.title} by ${book.author}"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <span>
                                        ${book.title}
                                    </span>
                                `
                        }

                    </div>

                </a>


                <div class="book-overlay">

                    <button
                        class="quick-add"
                        type="button"
                        data-book-id="${book.id}"
                    >

                        Add to cart

                    </button>

                </div>

            </div>


            <div class="home-book-info">

                <div>

                    <h3>

                        <a
                            href="${getBookUrl(book.id)}"
                        >

                            ${book.title}

                        </a>

                    </h3>


                    <p class="home-book-author">

                        ${book.author}

                    </p>

                </div>


                <span class="home-book-price">

                    ${formatPrice(book.price)}

                </span>

            </div>

        `;


        /* ================= ADD TO CART ================= */

        const addButton =
            card.querySelector(
                ".quick-add"
            );


        if (addButton) {

            addButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    addToCart(book);

                }
            );

        }


        relatedGrid.appendChild(card);

    });

}


/* ================= NOT FOUND ================= */

function showNotFound() {

    if (bookDetails) {

        bookDetails.innerHTML = `

            <div class="book-loading">

                Book not found.

                <br>

                <a
                    href="/shop"
                    style="
                        display:inline-block;
                        margin-top:20px;
                        color:#aaa;
                        font-family:
                            Inter,sans-serif;
                        font-size:10px;
                        font-style:normal;
                    "
                >

                    ← Return to collection

                </a>

            </div>

        `;

    }


    if (relatedGrid) {

        relatedGrid.innerHTML = "";

    }

}


/* ================= MOBILE MENU ================= 

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


if (
    menuBtn &&
    mobileMenu
) {

    menuBtn.addEventListener(
        "click",
        () => {

            mobileMenu.classList.add(
                "active"
            );

        }
    );

}


if (
    closeMenu &&
    mobileMenu
) {

    closeMenu.addEventListener(
        "click",
        () => {

            mobileMenu.classList.remove(
                "active"
            );

        }
    );

}


/* ================= MOBILE LINKS ================= 

document
    .querySelectorAll(
        ".mobile-links a"
    )
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                if (mobileMenu) {

                    mobileMenu.classList.remove(
                        "active"
                    );

                }

            }
        );

    });


/* ================= START ================= */

loadBook();