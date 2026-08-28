/* =========================================================
   A.F. BOOKSTORE
   ADMIN BOOK MANAGEMENT
========================================================= */

if (!requireAdminAuth()) {

    window.location.href =
        "/admin/login";

}


/* ================= API ================= */

const API_URL =
    "/api/admin/books";


/* ================= DOM ELEMENTS ================= */

const formContainer =
    document.getElementById(
        "bookFormContainer"
    );

const bookForm =
    document.getElementById(
        "bookForm"
    );

const tableBody =
    document.getElementById(
        "booksTableBody"
    );

const message =
    document.getElementById(
        "message"
    );

const imageInput =
    document.getElementById(
        "image"
    );

const currentCover =
    document.getElementById(
        "currentCover"
    );


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
            await fetch(
                API_URL,
                {
                    headers:
                        getAdminHeaders()
                }
            );


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


        console.log("API result:", result);
        console.log("result.books:", result.books);
        console.log("Is result.books an array?", Array.isArray(result.books));
        
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


    currentCover.innerHTML = "";


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


    currentCover.innerHTML = "";

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


    /*
       Browsers do not allow JavaScript
       to assign an existing file to
       a file input.

       Therefore the input is cleared
       when editing.
    */

    imageInput.value = "";


    if (book.cover) {

        currentCover.innerHTML = `
            <div class="current-cover-label">
                Current Cover
            </div>

            <img
                src="${escapeHTML(book.cover)}"
                class="current-cover-image"
                alt="Current book cover"
            >

            <small>
                Choose a new image only if you want
                to replace the current cover.
            </small>
        `;

    }

    else {

        currentCover.innerHTML = "";

    }


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


/* ================= IMAGE PREVIEW ================= */

imageInput.addEventListener(
    "change",
    function () {

        const file =
            imageInput.files[0];


        if (!file) {

            return;

        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            showMessage(
                "Please select a valid image file."
            );

            imageInput.value = "";

            return;

        }


        /*
           Prevent unnecessarily large
           client-side previews.
        */

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            showMessage(
                "Image must be smaller than 5MB."
            );

            imageInput.value = "";

            return;

        }


        const imageURL =
            URL.createObjectURL(file);


        currentCover.innerHTML = `
            <div class="current-cover-label">
                New Cover Preview
            </div>

            <img
                src="${imageURL}"
                class="current-cover-image"
                alt="New book cover preview"
            >

            <small>
                This image will replace the current
                cover when the book is saved.
            </small>
        `;


        /*
           Release the temporary object URL
           after the image has loaded.
        */

        const previewImage =
            currentCover.querySelector(
                ".current-cover-image"
            );


        if (previewImage) {

            previewImage.onload =
                () => {

                    URL.revokeObjectURL(
                        imageURL
                    );

                };

        }

    }
);


/* ================= SAVE BOOK ================= */

bookForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const id =
            document.getElementById(
                "bookId"
            ).value;


        /*
           FormData handles:

           - Text fields
           - Uploaded image
        */

        const formData =
            new FormData();


        formData.append(
            "title",
            document.getElementById(
                "title"
            ).value.trim()
        );


        formData.append(
            "author",
            document.getElementById(
                "author"
            ).value.trim()
        );


        formData.append(
            "price",
            document.getElementById(
                "price"
            ).value
        );


        formData.append(
            "category",
            document.getElementById(
                "category"
            ).value.trim()
        );


        formData.append(
            "stockNumber",
            document.getElementById(
                "stock"
            ).value
        );


        formData.append(
            "description",
            document.getElementById(
                "description"
            ).value.trim()
        );


        /*
           Only send an image when one
           was actually selected.
        */

        if (
            imageInput.files &&
            imageInput.files.length > 0
        ) {

            formData.append(
                "image",
                imageInput.files[0]
            );

        }


        try {

            let response;


            /* ================= UPDATE ================= */

            if (id !== "") {

                response =
                    await fetch(
                        `${API_URL}/${encodeURIComponent(id)}`,
                        {

                            method: "PUT",

                            headers:
                                getAdminHeaders(),

                            body: formData

                        }
                    );

            }


            /* ================= CREATE ================= */

            else {

                response =
                    await fetch(
                        API_URL,
                        {

                            method: "POST",

                            headers:
                                getAdminHeaders(),

                            body: formData

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
                error.message ||
                "Failed to save book."
            );

        }

    }
);


/* ================= DELETE BOOK ================= */

async function deleteBook(id) {

    const book =
        books.find(
            book =>
                String(book.id) ===
                String(id)
        );


    if (!book) {

        showMessage(
            "Book not found."
        );

        return;

    }


    const confirmed =
        confirm(
            `Are you sure you want to delete "${book.title}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/${encodeURIComponent(id)}`,
                {
                    method: "DELETE",

                    headers:
                        getAdminHeaders()
                }
            );


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
            `"${book.title}" deleted successfully.`
        );


        await loadBooks();

    }

    catch (error) {

        console.error(
            "Book deletion error:",
            error
        );


        showMessage(
            error.message ||
            "Failed to delete book."
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