/* =========================================================
   A.F. BOOKSTORE
   Homepage JavaScript
========================================================= */


/* ================= ELEMENTS ================= */

const booksGrid = document.getElementById("booksGrid");

/*const searchBtn = document.getElementById("searchBtn");
const searchOverlay = document.getElementById("searchOverlay");
const closeSearch = document.getElementById("closeSearch");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const closeMenu = document.getElementById("closeMenu");*/


/* ================= DISPLAY BOOKS ================= */

function displayBooks(bookList) {

    if (!booksGrid) return;

    booksGrid.innerHTML = "";

    bookList.forEach(book => {

        const card = document.createElement("article");

        card.className = "book-card";

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

                        <img
                            src="${book.cover}"
                            alt="${book.title} by ${book.author}"
                            loading="lazy"
                        >

                    </div>

                </a>


                <div class="book-overlay">

                    <button
    class="quick-add"
    type="button"
    data-book-id="${book.id}"
    ${Number(book.stockNumber) <= 0 ? "disabled" : ""}
>
    ${Number(book.stockNumber) <= 0 ? "Out of Stock" : "Add to cart"}
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
            card.querySelector(".quick-add");


        addButton.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                addToCart(book);

            }
        );


        booksGrid.appendChild(card);

    });

}


/* ================= CATEGORY LINKS ================= */

function setupCategoryLinks() {

    const categoryCards =
        document.querySelectorAll(
            ".category-card"
        );


    categoryCards.forEach(card => {

        const category =
            card
                .querySelector("h3")
                ?.textContent
                .trim();


        if (!category) return;


        card.href =
            `/shop?category=${encodeURIComponent(category)}#shopGrid`;

    });

}


/* ================= LOAD BOOKS ================= */

async function initializeHomepage() {

    try {

        await loadBooksData();

        /*
            Display the first four books
            as the homepage featured collection.
        */

        displayBooks(
            books.slice(0, 4)
        );

        setupCategoryLinks();

    }

    catch (error) {

        console.error(error);

        if (booksGrid) {

            booksGrid.innerHTML = `

                <div class="loading">

                    Unable to load the
                    book collection.

                </div>

            `;

        }

    }

}


/* ================= START ================= */

initializeHomepage();