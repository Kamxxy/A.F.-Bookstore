const express = require('express');

const {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook
} = require('../services/bookService');


const router = express.Router();


/* =========================================================
   GET ALL BOOKS
========================================================= */

router.get('/', (req, res) => {

    try {

        const books = getAllBooks();

        res.json(books);

    } catch (error) {

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

        const book = getBookById(
            req.params.id
        );


        if (!book) {

            return res.status(404).json({
                error: 'Book not found'
            });

        }


        res.json(book);

    } catch (error) {

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
   CREATE BOOK
========================================================= */

router.post('/', (req, res) => {

    try {

        const {
            title,
            author,
            price,
            category,
            description,
            cover,
            rating,
            stockStatus,
            stockNumber
        } = req.body;


        if (
            !title ||
            !author ||
            price === undefined ||
            !category
        ) {

            return res.status(400).json({
                error:
                    'Title, author, price and category are required'
            });

        }


        const newBook = createBook({

            title,
            author,
            price,
            category,
            description,
            cover,
            rating,
            stockStatus,
            stockNumber

        });


        res.status(201).json(newBook);

    } catch (error) {

        console.error(
            'Error creating book:',
            error
        );

        res.status(500).json({
            error: 'Failed to create book'
        });

    }

});


/* =========================================================
   UPDATE BOOK
========================================================= */

router.put('/:id', (req, res) => {

    try {

        const updatedBook = updateBook(
            req.params.id,
            req.body
        );


        if (!updatedBook) {

            return res.status(404).json({
                error: 'Book not found'
            });

        }


        res.json(updatedBook);

    } catch (error) {

        console.error(
            'Error updating book:',
            error
        );

        res.status(500).json({
            error: 'Failed to update book'
        });

    }

});


/* =========================================================
   DELETE BOOK
========================================================= */

router.delete('/:id', (req, res) => {

    try {

        const deletedBook = deleteBook(
            req.params.id
        );


        if (!deletedBook) {

            return res.status(404).json({
                error: 'Book not found'
            });

        }


        res.json({

            message:
                'Book deleted successfully',

            book:
                deletedBook

        });

    } catch (error) {

        console.error(
            'Error deleting book:',
            error
        );

        res.status(500).json({
            error: 'Failed to delete book'
        });

    }

});


module.exports = router;