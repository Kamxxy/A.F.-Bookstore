/* =========================================================
   A.F. BOOKSTORE
   About Page JavaScript
========================================================= */


/* =========================================================
   SEARCH
========================================================= */

const searchBtn =
    document.getElementById("searchBtn");

const searchOverlay =
    document.getElementById("searchOverlay");

const closeSearch =
    document.getElementById("closeSearch");

const searchInput =
    document.getElementById("searchInput");

const searchResults =
    document.getElementById("searchResults");


/* ================= SEARCH ================= */

function performSearch(query) {

    const normalizedQuery =
        query.toLowerCase().trim();


    if (!normalizedQuery) {

        searchResults.innerHTML = "";

        return;

    }


    const results =
        books.filter(book =>

            book.title
                .toLowerCase()
                .includes(normalizedQuery)

            ||

            book.author
                .toLowerCase()
                .includes(normalizedQuery)

            ||

            book.category
                .toLowerCase()
                .includes(normalizedQuery)

        );


    if (results.length === 0) {

        searchResults.innerHTML = `

            <div class="search-no-results">

                <p>
                    No books found.
                </p>

            </div>

        `;

        return;

    }


    searchResults.innerHTML = results
        .map(book => `

            <div class="search-result">

                <a
                    href="${getBookUrl(book.id)}"
                    class="search-result-link"
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

                    <strong>
                        ${formatPrice(book.price)}
                    </strong>

                </a>


                <button
                    type="button"
                    class="search-add-btn"
                    data-book-id="${book.id}"
                >
                    ADD
                </button>

            </div>

        `)
        .join("");


    /* ================= SEARCH ADD BUTTONS ================= */

    searchResults
        .querySelectorAll(".search-add-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    const id =
                        Number(
                            button.dataset.bookId
                        );

                    const book =
                        books.find(
                            item =>
                                Number(item.id) === id
                        );

                    if (book) {

                        addToCart(book);

                    }

                }
            );

        });

}


/* ================= SEARCH EVENTS ================= */

if (searchBtn) {

    searchBtn.addEventListener(
        "click",
        () => {

            searchOverlay.classList.add("active");

            setTimeout(
                () => searchInput.focus(),
                300
            );

        }
    );

}


if (closeSearch) {

    closeSearch.addEventListener(
        "click",
        () => {

            searchOverlay.classList.remove("active");

            searchInput.value = "";

            searchResults.innerHTML = "";

        }
    );

}


if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            performSearch(
                searchInput.value
            );

        }
    );

}


/* =========================================================
   CART
========================================================= */

if (
    typeof renderCart === "function"
) {

    renderCart();

}