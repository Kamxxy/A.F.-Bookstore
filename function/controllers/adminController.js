const jwt = require('jsonwebtoken');

const {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook
} = require('../services/bookService');


/* =========================================================
   ADMIN LOGIN
========================================================= */

function login(req, res) {

    try {

        const {
            username,
            password
        } = req.body;


        if (
            !username ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Username and password are required'
            });

        }


        if (
            username !== process.env.ADMIN_USERNAME ||
            password !== process.env.ADMIN_PASSWORD
        ) {

            return res.status(401).json({
                success: false,
                message:
                    'Invalid admin credentials'
            });

        }


        const token = jwt.sign(
            {
                username,
                role: 'admin'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '2h'
            }
        );


        res.json({

            success: true,

            message:
                'Admin login successful',

            token

        });

    }

    catch (error) {

        console.error(
            'Admin login error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Login failed'
        });

    }

}


/* =========================================================
   GET ALL BOOKS
========================================================= */

function getBooks(req, res) {

    try {

        const books =
            getAllBooks();


        res.json({
            success: true,
            books
        });

    }

    catch (error) {

        console.error(
            'Admin book loading error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Failed to load books'
        });

    }

}


/* =========================================================
   GET BOOK
========================================================= */

function getBook(req, res) {

    try {

        const book =
            getBookById(
                req.params.id
            );


        if (!book) {

            return res.status(404).json({
                success: false,
                message:
                    'Book not found'
            });

        }


        res.json({
            success: true,
            book
        });

    }

    catch (error) {

        console.error(
            'Admin book loading error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Failed to load book'
        });

    }

}


/* =========================================================
   CREATE BOOK
========================================================= */

function create(req, res) {

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
                success: false,
                message:
                    'Title, author, price and category are required'
            });

        }


        const newBook =
            createBook({

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


        res.status(201).json({

            success: true,

            message:
                'Book created successfully',

            book:
                newBook

        });

    }

    catch (error) {

        console.error(
            'Admin book creation error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Failed to create book'
        });

    }

}


/* =========================================================
   UPDATE BOOK
========================================================= */

function update(req, res) {

    try {

        const updatedBook =
            updateBook(
                req.params.id,
                req.body
            );


        if (!updatedBook) {

            return res.status(404).json({
                success: false,
                message:
                    'Book not found'
            });

        }


        res.json({

            success: true,

            message:
                'Book updated successfully',

            book:
                updatedBook

        });

    }

    catch (error) {

        console.error(
            'Admin book update error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Failed to update book'
        });

    }

}


/* =========================================================
   DELETE BOOK
========================================================= */

function remove(req, res) {

    try {

        const deletedBook =
            deleteBook(
                req.params.id
            );


        if (!deletedBook) {

            return res.status(404).json({
                success: false,
                message:
                    'Book not found'
            });

        }


        res.json({

            success: true,

            message:
                'Book deleted successfully',

            book:
                deletedBook

        });

    }

    catch (error) {

        console.error(
            'Admin book deletion error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Failed to delete book'
        });

    }

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    login,

    getBooks,

    getBook,

    create,

    update,

    remove

};