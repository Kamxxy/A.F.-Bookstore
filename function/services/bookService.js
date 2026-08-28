const fs =
    require("fs");

const path =
    require("path");


/* =========================================================
   BOOK DATA PATH
========================================================= */

const booksPath =
    path.join(
        __dirname,
        "../data/books.json"
    );


/* =========================================================
   READ BOOKS
========================================================= */

function getAllBooks() {

    try {

        const data =
            fs.readFileSync(
                booksPath,
                "utf8"
            );


        return JSON.parse(
            data
        );

    }

    catch (error) {

        console.error(
            "Error reading books.json:",
            error
        );


        throw new Error(
            "Unable to load book data"
        );

    }

}


/* =========================================================
   SAVE BOOKS
========================================================= */

function saveBooks(
    books
) {

    fs.writeFileSync(

        booksPath,

        JSON.stringify(
            books,
            null,
            4
        ),

        "utf8"

    );

}


/* =========================================================
   GET BOOK BY ID
========================================================= */

function getBookById(
    id
) {

    const books =
        getAllBooks();


    return books.find(

        book =>
            Number(book.id) ===
            Number(id)

    );

}


/* =========================================================
   ADJUST BOOK STOCK
========================================================= */

function adjustBookStock(
    id,
    quantityChange
) {

    const books =
        getAllBooks();


    const index =
        books.findIndex(

            book =>
                Number(book.id) ===
                Number(id)

        );


    if (
        index === -1
    ) {

        return null;

    }


    const currentStock =
        Number(
            books[index].stockNumber
        ) || 0;


    const change =
        Number(
            quantityChange
        );


    if (
        !Number.isInteger(change)
    ) {

        throw new Error(
            "Stock adjustment must be a whole number"
        );

    }


    const newStock =
        currentStock +
        change;


    if (
        newStock < 0
    ) {

        throw new Error(
            `Insufficient stock for "${books[index].title}"`
        );

    }


    books[index].stockNumber =
        newStock;


    /*
       Stock status is ALWAYS derived
       from stockNumber.
    */

    books[index].stockStatus =
        newStock > 0
            ? "In Stock"
            : "Out of Stock";


    saveBooks(
        books
    );


    return books[index];

}


/* =========================================================
   CREATE BOOK
========================================================= */

function createBook(
    bookData
) {

    const books =
        getAllBooks();


    const newId =
        books.length > 0

            ? Math.max(

                ...books.map(

                    book =>
                        Number(book.id)

                )

            ) + 1

            : 1;


    const stockNumber =
        bookData.stockNumber !== undefined &&
        bookData.stockNumber !== ""

            ? Number(
                bookData.stockNumber
            )

            : 0;


    if (
        !Number.isInteger(stockNumber) ||
        stockNumber < 0
    ) {

        throw new Error(
            "Stock must be a whole number greater than or equal to 0"
        );

    }


    const newBook = {

        id:
            newId,

        title:
            bookData.title,

        author:
            bookData.author,

        price:
            Number(
                bookData.price
            ),

        category:
            bookData.category,

        rating:
            bookData.rating !== undefined

                ? Number(
                    bookData.rating
                )

                : 0,

        description:
            bookData.description ||
            "",

        cover:
            bookData.cover ||
            "",

        /*
           Stock status is derived from
           the actual stock number.
        */

        stockStatus:
            stockNumber > 0
                ? "In Stock"
                : "Out of Stock",

        stockNumber

    };


    books.push(
        newBook
    );


    saveBooks(
        books
    );


    return newBook;

}


/* =========================================================
   UPDATE BOOK
========================================================= */

function updateBook(
    id,
    bookData
) {

    const books =
        getAllBooks();


    const index =
        books.findIndex(

            book =>
                Number(book.id) ===
                Number(id)

        );


    if (
        index === -1
    ) {

        return null;

    }


    const currentBook =
        books[index];


    let stockNumber =
        currentBook.stockNumber;


    if (
        bookData.stockNumber !== undefined &&
        bookData.stockNumber !== ""
    ) {

        stockNumber =
            Number(
                bookData.stockNumber
            );

    }


    if (
        stockNumber === undefined ||
        stockNumber === null ||
        stockNumber === ""
    ) {

        stockNumber = 0;

    }


    if (
        !Number.isInteger(stockNumber) ||
        stockNumber < 0
    ) {

        throw new Error(
            "Stock must be a whole number greater than or equal to 0"
        );

    }


    const updatedBook = {

        ...currentBook,


        title:
            bookData.title !==
            undefined

                ? bookData.title

                : currentBook.title,


        author:
            bookData.author !==
            undefined

                ? bookData.author

                : currentBook.author,


        price:
            bookData.price !==
            undefined

                ? Number(
                    bookData.price
                )

                : currentBook.price,


        category:
            bookData.category !==
            undefined

                ? bookData.category

                : currentBook.category,


        rating:
            bookData.rating !==
            undefined

                ? Number(
                    bookData.rating
                )

                : currentBook.rating,


        description:
            bookData.description !==
            undefined

                ? bookData.description

                : currentBook.description,


        /*
           Cover is only changed when
           a new cover was uploaded.
        */

        cover:
            bookData.cover !==
            undefined

                ? bookData.cover

                : currentBook.cover,


        /*
           Stock status is derived from
           stockNumber.
        */

        stockStatus:
            stockNumber > 0
                ? "In Stock"
                : "Out of Stock",


        stockNumber

    };


    books[index] =
        updatedBook;


    saveBooks(
        books
    );


    return updatedBook;

}


/* =========================================================
   DELETE BOOK
========================================================= */

function deleteBook(
    id
) {

    const books =
        getAllBooks();


    const index =
        books.findIndex(

            book =>
                Number(book.id) ===
                Number(id)

        );


    if (
        index === -1
    ) {

        return null;

    }


    const deletedBook =
        books.splice(
            index,
            1
        )[0];


    saveBooks(
        books
    );


    return deletedBook;

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    getAllBooks,

    getBookById,

    adjustBookStock,

    createBook,

    updateBook,

    deleteBook

};