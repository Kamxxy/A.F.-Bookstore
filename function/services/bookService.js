const fs = require('fs');
const path = require('path');


/* =========================================================
   BOOK DATA PATH
========================================================= */

const booksPath = path.join(
    __dirname,
    '../data/books.json'
);


/* =========================================================
   READ BOOKS
========================================================= */

function getAllBooks() {

    const data = fs.readFileSync(
        booksPath,
        'utf8'
    );

    return JSON.parse(data);

}


/* =========================================================
   SAVE BOOKS
========================================================= */

function saveBooks(books) {

    fs.writeFileSync(
        booksPath,
        JSON.stringify(
            books,
            null,
            4
        ),
        'utf8'
    );

}


/* =========================================================
   GET BOOK BY ID
========================================================= */

function getBookById(id) {

    const books = getAllBooks();

    return books.find(
        book =>
            Number(book.id) === Number(id)
    );

}


/* =========================================================
   CREATE BOOK
========================================================= */

function createBook(bookData) {

    const books = getAllBooks();


    const newId =
        books.length > 0
            ? Math.max(
                ...books.map(
                    book => Number(book.id)
                )
            ) + 1
            : 1;


    const newBook = {

        id: newId,

        title: bookData.title,

        author: bookData.author,

        price: Number(bookData.price),

        category: bookData.category,

        rating:
            bookData.rating !== undefined
                ? Number(bookData.rating)
                : 0,

        description:
            bookData.description || '',

        cover:
            bookData.cover || '',

        stockStatus:
            bookData.stockStatus === 'out-of-stock'
                ? 'out-of-stock'
                : 'in-stock'

    };


    books.push(newBook);

    saveBooks(books);

    return newBook;

}


/* =========================================================
   UPDATE BOOK
========================================================= */

function updateBook(id, bookData) {

    const books = getAllBooks();


    const index =
        books.findIndex(
            book =>
                Number(book.id) === Number(id)
        );


    if (index === -1) {

        return null;

    }


    const currentBook =
        books[index];


    const updatedBook = {

        ...currentBook,

        title:
            bookData.title !== undefined
                ? bookData.title
                : currentBook.title,

        author:
            bookData.author !== undefined
                ? bookData.author
                : currentBook.author,

        price:
            bookData.price !== undefined
                ? Number(bookData.price)
                : currentBook.price,

        category:
            bookData.category !== undefined
                ? bookData.category
                : currentBook.category,

        rating:
            bookData.rating !== undefined
                ? Number(bookData.rating)
                : currentBook.rating,

        description:
            bookData.description !== undefined
                ? bookData.description
                : currentBook.description,

        cover:
            bookData.cover !== undefined
                ? bookData.cover
                : currentBook.cover,

        stockStatus:
            bookData.stockStatus === 'out-of-stock'
                ? 'out-of-stock'
                : 'in-stock'

    };


    books[index] = updatedBook;

    saveBooks(books);

    return updatedBook;

}


/* =========================================================
   DELETE BOOK
========================================================= */

function deleteBook(id) {

    const books = getAllBooks();


    const index =
        books.findIndex(
            book =>
                Number(book.id) === Number(id)
        );


    if (index === -1) {

        return null;

    }


    const deletedBook =
        books.splice(
            index,
            1
        )[0];


    saveBooks(books);

    return deletedBook;

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    getAllBooks,

    getBookById,

    createBook,

    updateBook,

    deleteBook

};