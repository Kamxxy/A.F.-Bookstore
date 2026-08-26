/* =========================================================
   A.F. BOOKSTORE
   ADMIN BOOK MANAGEMENT
========================================================= */
if (!requireAdminAuth()) {
    window.location.href = "/admin/login";
}

/* ================= API ================= */

const API_URL = "/api/admin/books";


/* ================= DOM ELEMENTS ================= */

const formContainer =
    document.getElementById("bookFormContainer");

const bookForm =
    document.getElementById("bookForm");

const tableBody =
    document.getElementById("booksTableBody");

const message =
    document.getElementById("message");


/* ================= BOOK DATA ================= */

let books = [];


/* ================= LOAD BOOKS ================= */

document.addEventListener(
    "DOMContentLoaded",
    loadBooks
);


async function loadBooks() {

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                Loading books...
            </td>
        </tr>
    `;

    try {

        const response =
            await fetch(API_URL, {
                headers: getAdminHeaders()
            });


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to load books"
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Failed to load books"
            );

        }


        books =
            result.books;


        renderBooks();

    }

    catch (error) {

        console.error(
            "Book loading error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    Failed to load books.
                </td>
            </tr>
        `;

    }

}


/* ================= RENDER BOOKS ================= */

function renderBooks() {

    if (
        !books ||
        books.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    No books found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        books.map(book => {

            return `
                <tr>

                    <td>
                        ${
                            book.cover
                                ? `
                                    <img
                                        src="${escapeHTML(book.cover)}"
                                        class="book-image"
                                        alt="${escapeHTML(
                                            book.title ||
                                            "Book"
                                        )}"
                                    >
                                  `
                                : `
                                    <div class="book-image"></div>
                                  `
                        }
                    </td>


                    <td>
                        ${escapeHTML(
                            book.title || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            book.author || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            book.category || "-"
                        )}
                    </td>


                    <td>
                        ₦${Number(
                            book.price || 0
                        ).toLocaleString()}
                    </td>


                    <td>
                        ${book.stockNumber ?? 0}
                    </td>


                    <td>

                        <div class="actions">

                            <button
                                class="edit-btn"
                                onclick="editBook('${escapeHTML(
                                    String(book.id)
                                )}')"
                            >
                                Edit
                            </button>


                            <button
                                class="delete-btn"
                                onclick="deleteBook('${escapeHTML(
                                    String(book.id)
                                )}')"
                            >
                                Delete
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");

}


/* ================= OPEN ADD FORM ================= */

function openAddForm() {

    bookForm.reset();


    document.getElementById(
        "bookId"
    ).value = "";


    document.getElementById(
        "formTitle"
    ).textContent =
        "Add New Book";


    formContainer.classList.add(
        "show"
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* ================= CLOSE FORM ================= */

function closeForm() {

    formContainer.classList.remove(
        "show"
    );


    bookForm.reset();


    document.getElementById(
        "bookId"
    ).value = "";

}


/* ================= EDIT BOOK ================= */

function editBook(id) {

    const book =
        books.find(
            b =>
                String(b.id) ===
                String(id)
        );


    if (!book) {

        showMessage(
            "Book not found."
        );

        return;

    }


    document.getElementById(
        "bookId"
    ).value =
        book.id;


    document.getElementById(
        "title"
    ).value =
        book.title || "";


    document.getElementById(
        "author"
    ).value =
        book.author || "";


    document.getElementById(
        "price"
    ).value =
        book.price || "";


    document.getElementById(
        "category"
    ).value =
        book.category || "";


    document.getElementById(
        "stock"
    ).value =
        book.stockNumber ?? 0;


    document.getElementById(
        "image"
    ).value =
        book.cover || "";


    document.getElementById(
        "description"
    ).value =
        book.description || "";


    document.getElementById(
        "formTitle"
    ).textContent =
        "Edit Book";


    formContainer.classList.add(
        "show"
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* ================= SAVE BOOK ================= */

bookForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const id =
            document.getElementById(
                "bookId"
            ).value;


        const bookData = {

            title:
                document.getElementById(
                    "title"
                ).value.trim(),

            author:
                document.getElementById(
                    "author"
                ).value.trim(),

            price:
                Number(
                    document.getElementById(
                        "price"
                    ).value
                ),

            category:
                document.getElementById(
                    "category"
                ).value.trim(),

            stockNumber:
                Number(
                    document.getElementById(
                        "stock"
                    ).value
                ),

            cover:
                document.getElementById(
                    "image"
                ).value.trim(),

            description:
                document.getElementById(
                    "description"
                ).value.trim()

        };


        try {

            let response;


            /* ================= UPDATE ================= */

            if (id !== "") {

                response = await fetch(
                    `${API_URL}/${encodeURIComponent(id)}`,
                    {
                        method: "PUT",
                
                        headers: getAdminHeaders({
                            "Content-Type": "application/json"
                        }),
                
                        body: JSON.stringify(bookData)
                    }
                );

            }


            /* ================= CREATE ================= */

            else {

                response = await fetch(
                    API_URL,
                    {
                        method: "POST",
                
                        headers: getAdminHeaders({
                            "Content-Type": "application/json"
                        }),
                
                        body: JSON.stringify(bookData)
                    }
                );

            }


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Failed to save book"
                );

            }


            if (!result.success) {

                throw new Error(
                    result.message ||
                    "Failed to save book"
                );

            }


            showMessage(
                id !== ""
                    ? "Book updated successfully."
                    : "Book added successfully."
            );


            closeForm();


            await loadBooks();

        }

        catch (error) {

            console.error(
                "Book save error:",
                error
            );


            showMessage(
                error.message
            );

        }

    }
);


/* ================= DELETE BOOK ================= */

async function deleteBook(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this book?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
            method: "DELETE",

            headers: getAdminHeaders()
        });


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to delete book"
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Failed to delete book"
            );

        }


        showMessage(
            "Book deleted successfully."
        );


        await loadBooks();

    }

    catch (error) {

        console.error(
            "Book deletion error:",
            error
        );


        showMessage(
            error.message
        );

    }

}


/* ================= MESSAGE ================= */

function showMessage(text) {

    message.textContent =
        text;


    message.classList.add(
        "show"
    );


    setTimeout(() => {

        message.classList.remove(
            "show"
        );

    }, 4000);

}


/* ================= ESCAPE HTML ================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}