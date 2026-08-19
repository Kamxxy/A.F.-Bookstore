/* =========================================================
   A.F. BOOKSTORE
   Shop JavaScript
========================================================= */


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


/* ================= LOAD BOOKS ================= 

async function loadShopBooks() {

    try {

        await loadBooksData();

        renderBooks(books);

    }

    catch (error) {

        console.error(
            "Shop book loading error:",
            error
        );


        if (shopGrid) {

            shopGrid.innerHTML = `

                <div class="loading">

                    Unable to load the collection.

                </div>

            `;

        }

    }

}*/


/* ================= RENDER BOOKS ================= */

function renderBooks(bookList) {

    if (!shopGrid) return;


    shopGrid.innerHTML = "";


    /* ================= BOOK COUNT ================= */

    if (bookCount) {

        bookCount.textContent =
            bookList.length;

    }


    /* ================= NO RESULTS ================= */

    if (bookList.length === 0) {

        if (noResults) {

            noResults.classList.add(
                "visible"
            );

        }

        return;

    }


    if (noResults) {

        noResults.classList.remove(
            "visible"
        );

    }


    /* ================= BOOK CARDS ================= */

    bookList.forEach(book => {

        const card =
            document.createElement(
                "article"
            );


        /*
            IMPORTANT:

            The shop now uses the EXACT
            same card structure as the
            homepage.

            This means the homepage and
            shop page can share the same
            book-card CSS.
        */

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


        /* ================= APPEND ================= */

        shopGrid.appendChild(card);

    });

}


/* ================= FILTER ================= */

function filterBooks() {

    const category =
        categoryFilter
            ? categoryFilter.value
            : "all";


    const sort =
        sortFilter
            ? sortFilter.value
            : "default";


    let filtered =
        [...books];


    /* ================= CATEGORY ================= */

    if (category !== "all") {

        filtered =
            filtered.filter(
                book =>
                    book.category === category
            );

    }


    /* ================= SORT ================= */

    if (sort === "price-low") {

        filtered.sort(
            (a, b) =>
                Number(a.price) -
                Number(b.price)
        );

    }


    if (sort === "price-high") {

        filtered.sort(
            (a, b) =>
                Number(b.price) -
                Number(a.price)
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


/* ================= URL CATEGORY FILTER ================= */

function applyUrlCategoryFilter() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const category =
        params.get("category");


    if (
        !category ||
        !categoryFilter
    ) {

        return false;

    }


    const matchingOption =
        [
            ...categoryFilter.options
        ].find(
            option =>
                option.value
                    .toLowerCase() ===
                category.toLowerCase()
        );


    if (!matchingOption) {

        return false;

    }


    categoryFilter.value =
        matchingOption.value;


    filterBooks();


    return true;

}


/* ================= FILTER EVENTS ================= */

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        filterBooks
    );

}


if (sortFilter) {

    sortFilter.addEventListener(
        "change",
        filterBooks
    );

}


/* ================= BOOK DETAILS ================= */

function openBook(id) {

    window.location.href =
        `/book?id=${encodeURIComponent(id)}`;

}

/* =========================================================
   BUILD CATEGORY FILTER
========================================================= */

function buildCategoryFilter() {

    if (!categoryFilter) return;

    const categories =
        [...new Set(
            books
                .map(book => book.category)
                .filter(Boolean)
        )]
        .sort((a, b) =>
            a.localeCompare(b)
        );


    categoryFilter.innerHTML = `

        <option value="all">
            All books
        </option>

    `;


    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;

        option.textContent = category;

        categoryFilter.appendChild(option);

    });

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


/* ================= OPEN SEARCH ================= */

if (
    searchBtn &&
    searchOverlay
) {

    searchBtn.addEventListener(
        "click",
        () => {

            searchOverlay.classList.add(
                "active"
            );


            setTimeout(
                () => {

                    if (searchInput) {

                        searchInput.focus();

                    }

                },
                300
            );

        }
    );

}


/* ================= CLOSE SEARCH ================= */

if (
    closeSearch &&
    searchOverlay
) {

    closeSearch.addEventListener(
        "click",
        () => {

            searchOverlay.classList.remove(
                "active"
            );


            if (searchInput) {

                searchInput.value = "";

            }


            if (searchResults) {

                searchResults.innerHTML = "";

            }

        }
    );

}


/* ================= SEARCH INPUT ================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const query =
                searchInput.value
                    .toLowerCase()
                    .trim();


            if (!query) {

                if (searchResults) {

                    searchResults.innerHTML =
                        "";

                }

                return;

            }


            const results =
                books.filter(
                    book =>

                        book.title
                            .toLowerCase()
                            .includes(query)

                        ||

                        book.author
                            .toLowerCase()
                            .includes(query)

                        ||

                        book.category
                            .toLowerCase()
                            .includes(query)

                );


            if (!searchResults) return;


            /* ================= NO RESULTS ================= */

            if (results.length === 0) {

                searchResults.innerHTML = `

                    <p
                        class="search-no-results"
                    >

                        No books found.

                    </p>

                `;

                return;

            }


            /* ================= RESULTS ================= */

            searchResults.innerHTML =
                results
                    .map(
                        book => `

                            <div
                                class="search-result"
                                data-book-id="${book.id}"
                            >

                                <div>

                                    <h3>

                                        ${book.title}

                                    </h3>


                                    <small>

                                        ${book.author}

                                    </small>


                                    <span>

                                        ${book.category}

                                    </span>

                                </div>


                                <button
                                    type="button"
                                    class="search-add-btn"
                                    data-id="${book.id}"
                                >

                                    ADD

                                </button>

                            </div>

                        `
                    )
                    .join("");


            /* ================= SEARCH RESULT EVENTS ================= */

            searchResults
                .querySelectorAll(
                    ".search-result"
                )
                .forEach(result => {

                    result.addEventListener(
                        "click",
                        event => {

                            if (
                                event.target.closest(
                                    ".search-add-btn"
                                )
                            ) {

                                return;

                            }


                            openBook(
                                result.dataset.bookId
                            );

                        }
                    );

                });


            /* ================= SEARCH ADD BUTTONS ================= */

            searchResults
                .querySelectorAll(
                    ".search-add-btn"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            event.stopPropagation();


                            const book =
                                getBookById(
                                    button.dataset.id
                                );


                            if (book) {

                                addToCart(book);

                            }

                        }
                    );

                });

        }
    );

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


/* ================= MOBILE LINKS ================= */

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

async function initializeShop() {

    try {

        await loadBooksData();


        buildCategoryFilter();


        const hasCategoryFilter =
            applyUrlCategoryFilter();


        if (!hasCategoryFilter) {

            renderBooks(books);

        }


        if (
            typeof renderCart ===
            "function"
        ) {

            renderCart();

        }

    }

    catch (error) {

        console.error(
            "Shop initialization error:",
            error
        );


        if (shopGrid) {

            shopGrid.innerHTML = `

                <div class="loading">

                    Unable to load the collection.

                </div>

            `;

        }

    }

}


initializeShop();