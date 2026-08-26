/* =========================================================
   A.F. BOOKSTORE
   Shared Book Data & Utilities
========================================================= */


/* ================= API ================= */

const BOOKS_API_URL = "/api/books";


/* ================= BOOK DATA ================= */

let books = [];


/* ================= LOAD BOOKS ================= */

async function loadBooksData() {

    try {

        const response =
            await fetch(BOOKS_API_URL);


        if (!response.ok) {

            throw new Error(
                `Unable to load books. Server returned ${response.status}`
            );

        }


        books =
            await response.json();


        return books;

    } catch (error) {

        console.error(
            "Book loading error:",
            error
        );

        throw error;

    }

}


/* ================= FIND BOOK ================= */

/*function getBookById(id) {

    return books.find(
        book =>
            Number(book.id) === Number(id)
    );

}*/

function getBookById(id) {

    return books.find(
        book =>
            String(book.id) === String(id)
    );

}


/* ================= BOOK URL ================= */

function getBookUrl(id) {

    return `/book?id=${encodeURIComponent(id)}`;

}


/* ================= BOOK COLOR ================= */

/*
    Temporary fallback colors.

    These are only used if a cover image
    fails to load or a placeholder is needed.
*/

/*function getBookColor(id) {

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
        (Number(id) - 1) % colors.length
    ];

}*/


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


    const stringId =
        String(id);


    let hash = 0;


    for (let i = 0; i < stringId.length; i++) {

        hash =
            ((hash << 5) - hash) +
            stringId.charCodeAt(i);

        hash |= 0;

    }


    const index =
        Math.abs(hash) % colors.length;


    return colors[index];

}

/* ================= FORMAT PRICE ================= */

function formatPrice(price) {

    return `₦${Number(price).toLocaleString("en-NG")}`;

}


/* ================= BOOK IMAGE ================= */

function createBookImage(
    book,
    className = ""
) {

    const image =
        document.createElement("img");


    image.className =
        className;


    image.src =
        book.cover;


    image.alt =
        `${book.title} by ${book.author}`;


    image.loading =
        "lazy";


    image.addEventListener(
        "error",
        () => {

            image.style.display =
                "none";


            if (image.parentElement) {

                image.parentElement.style.background =
                    getBookColor(book.id);


                image.parentElement.classList.add(
                    "image-fallback"
                );

            }

        }
    );


    return image;

}