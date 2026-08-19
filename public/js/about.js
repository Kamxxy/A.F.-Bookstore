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


if (searchBtn && searchOverlay) {

    searchBtn.addEventListener(
        "click",
        () => {

            searchOverlay.classList.add(
                "active"
            );

            setTimeout(() => {

                if (searchInput) {
                    searchInput.focus();
                }

            }, 300);

        }
    );

}


if (closeSearch && searchOverlay) {

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


/* =========================================================
   SEARCH BOOKS
========================================================= */

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
                    searchResults.innerHTML = "";
                }

                return;

            }


            if (
                typeof books === "undefined"
            ) {
                return;
            }


            const results =
                books.filter(book =>

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


            if (!searchResults) {
                return;
            }


            if (results.length === 0) {

                searchResults.innerHTML = `
                    <p class="search-no-results">
                        No books found.
                    </p>
                `;

                return;

            }


            searchResults.innerHTML =
                results
                    .map(book => `

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

                        </div>

                    `)
                    .join("");


            searchResults
                .querySelectorAll(
                    ".search-result"
                )
                .forEach(result => {

                    result.addEventListener(
                        "click",
                        () => {

                            window.location.href =
                                `/book?id=${encodeURIComponent(
                                    result.dataset.bookId
                                )}`;

                        }
                    );

                });

        }
    );

}


/* =========================================================
   MOBILE MENU
========================================================= */

const menuBtn =
    document.getElementById("menuBtn");

const mobileMenu =
    document.getElementById("mobileMenu");

const closeMenu =
    document.getElementById("closeMenu");


if (menuBtn && mobileMenu) {

    menuBtn.addEventListener(
        "click",
        () => {

            mobileMenu.classList.add(
                "active"
            );

        }
    );

}


if (closeMenu && mobileMenu) {

    closeMenu.addEventListener(
        "click",
        () => {

            mobileMenu.classList.remove(
                "active"
            );

        }
    );

}


document
    .querySelectorAll(".mobile-links a")
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


/* =========================================================
   CART
========================================================= */

if (
    typeof renderCart === "function"
) {

    renderCart();

}