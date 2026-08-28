const jwt =
    require("jsonwebtoken");


const {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook
} = require(
    "../services/bookService"
);


/* =========================================================
   ADMIN LOGIN
========================================================= */

function login(
    req,
    res
) {

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
                    "Username and password are required"

            });

        }


        if (
            username !==
                process.env.ADMIN_USERNAME ||

            password !==
                process.env.ADMIN_PASSWORD
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid admin credentials"

            });

        }


        const token =
            jwt.sign(

                {
                    username,
                    role: "admin"
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "2h"
                }

            );


        res.cookie(

            "adminToken",

            token,

            {

                httpOnly: true,

                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite: "lax",

                maxAge:
                    2 * 60 * 60 * 1000

            }

        );


        return res.json({

            success: true,

            message:
                "Admin login successful"

        });

    }

    catch (error) {

        console.error(
            "Admin login error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Login failed"

        });

    }

}


/* =========================================================
   ADMIN LOGOUT
========================================================= */

function logout(
    req,
    res
) {

    try {

        /*
           Remove the HTTP-only JWT cookie.

           The cookie options should match the
           options used when the cookie was created.
        */

        res.clearCookie(
            "adminToken",
            {
                httpOnly: true,

                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite: "lax"
            }
        );


        return res.json({

            success: true,

            message:
                "Admin logged out successfully"

        });

    }

    catch (error) {

        console.error(
            "Admin logout error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Logout failed"

        });

    }

}


/* =========================================================
   GET ALL BOOKS
========================================================= */

async function getBooks(
    req,
    res
) {

    try {

        const books =
            await getAllBooks();


        return res.json({

            success: true,

            books

        });

    }

    catch (error) {

        console.error(
            "Admin book loading error:",
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
   GET BOOK
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


        return res.json({

            success: true,

            book

        });

    }

    catch (error) {

        console.error(
            "Admin book loading error:",
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
   CREATE BOOK
========================================================= */

async function create(
    req,
    res
) {

    try {

        const {

            title,
            author,
            price,
            category,
            description,
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

            if (req.file) {

                const fs =
                    require("fs");

                fs.unlink(
                    req.file.path,
                    () => {}
                );

            }


            return res.status(400).json({

                success: false,

                message:
                    "Title, author, price and category are required"

            });

        }


        const cover =
            req.file
                ? `/uploads/covers/${req.file.filename}`
                : "";


        const newBook =
            await createBook({

                title,
                author,
                price,
                category,
                description,
                rating,
                stockStatus,
                stockNumber,
                cover

            });


        return res.status(201).json({

            success: true,

            message:
                "Book created successfully",

            book:
                newBook

        });

    }

    catch (error) {

        console.error(
            "Admin book creation error:",
            error
        );


        if (req.file) {

            const fs =
                require("fs");

            fs.unlink(
                req.file.path,
                () => {}
            );

        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to create book"

        });

    }

}


/* =========================================================
   UPDATE BOOK
========================================================= */

async function update(
    req,
    res
) {

    try {

        const updateData = {
            ...req.body
        };


        if (req.file) {

            updateData.cover =
                `/uploads/covers/${req.file.filename}`;

        }


        const updatedBook =
            await updateBook(

                req.params.id,

                updateData

            );


        if (!updatedBook) {

            if (req.file) {

                const fs =
                    require("fs");

                fs.unlink(
                    req.file.path,
                    () => {}
                );

            }


            return res.status(404).json({

                success: false,

                message:
                    "Book not found"

            });

        }


        return res.json({

            success: true,

            message:
                "Book updated successfully",

            book:
                updatedBook

        });

    }

    catch (error) {

        console.error(
            "Admin book update error:",
            error
        );


        if (req.file) {

            const fs =
                require("fs");

            fs.unlink(
                req.file.path,
                () => {}
            );

        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to update book"

        });

    }

}


/* =========================================================
   DELETE BOOK
========================================================= */

async function remove(
    req,
    res
) {

    try {

        const deletedBook =
            await deleteBook(
                req.params.id
            );


        if (!deletedBook) {

            return res.status(404).json({

                success: false,

                message:
                    "Book not found"

            });

        }


        return res.json({

            success: true,

            message:
                "Book deleted successfully",

            book:
                deletedBook

        });

    }

    catch (error) {

        console.error(
            "Admin book deletion error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to delete book"

        });

    }

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    login,

    logout,

    getBooks,

    getBook,

    create,

    update,

    remove

};