const {
    getAllBooks,
    getBookById
} = require("../services/bookService");


/* =========================================================
   GET ALL BOOKS
========================================================= */

async function getBooks(req, res) {

    try {

        const books =
            await getAllBooks();


        console.log(
            "BOOKS FROM SERVICE:",
            books
        );

        console.log(
            "BOOKS IS ARRAY:",
            Array.isArray(books)
        );

        console.log(
            "BOOKS TYPE:",
            typeof books
        );


        return res.json({

            success: true,

            books

        });

    }

    catch (error) {

        console.error(
            "Error loading books:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load books"

        });

    }

}


/* =========================================================
   GET BOOK BY ID
========================================================= */

async function getBook(
    req,
    res
) {

    try {

        const book =
            await getBookById(
                req.params.id
            );


        if (!book) {

            return res.status(404).json({

                success: false,

                message:
                    "Book not found"

            });

        }


        return res.json(
            book
        );

    }

    catch (error) {

        console.error(
            "Error loading book:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load book"

        });

    }

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    getBooks,

    getBook

};