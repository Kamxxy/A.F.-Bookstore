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
   GET ALL BOOKS
========================================================= */

function getAllBooks() {

    const data = fs.readFileSync(
        booksPath,
        'utf8'
    );

    return JSON.parse(data);

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
   EXPORT
========================================================= */

module.exports = {
    getAllBooks,
    getBookById
};