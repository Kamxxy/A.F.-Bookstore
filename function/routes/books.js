const express = require('express');

const {
    getAllBooks,
    getBookById
} = require('../services/bookService');


const router = express.Router();


/* =========================================================
   GET ALL BOOKS
========================================================= */

router.get('/', (req, res) => {

    try {

        const books =
            getAllBooks();

        res.json(books);

    }

    catch (error) {

        console.error(
            'Error loading books:',
            error
        );

        res.status(500).json({
            error: 'Failed to load books'
        });

    }

});


/* =========================================================
   GET BOOK BY ID
========================================================= */

router.get('/:id', (req, res) => {

    try {

        const book =
            getBookById(
                req.params.id
            );


        if (!book) {

            return res.status(404).json({
                error: 'Book not found'
            });

        }


        res.json(book);

    }

    catch (error) {

        console.error(
            'Error loading book:',
            error
        );

        res.status(500).json({
            error: 'Failed to load book'
        });

    }

});


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;