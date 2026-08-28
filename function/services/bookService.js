const fs =
    require("fs");

const path =
    require("path");

const {
    isMongoConnected
} = require("../config/databaseState");

const Book =
    require("../models/Book");


/* =========================================================
   JSON DATA PATH
========================================================= */

const booksPath =
    path.join(
        __dirname,
        "../data/books.json"
    );


/* =========================================================
   JSON HELPERS
========================================================= */

function readBooksFromJSON() {

    try {

        const data =
            fs.readFileSync(
                booksPath,
                "utf8"
            );

        return JSON.parse(data);

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


function saveBooksToJSON(
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
   GET ALL BOOKS
========================================================= */

async function getAllBooks() {

    if (
        isMongoConnected()
    ) {

        try {

            return await Book
                .find()
                .sort({ id: 1 })
                .lean();

        }

        catch (error) {

            console.error(
                "MongoDB getAllBooks failed:",
                error.message
            );

            throw error;

        }

    }


    return readBooksFromJSON();

}


/* =========================================================
   GET BOOK BY ID
========================================================= */

async function getBookById(
    id,
    session = null
) {

    const bookId =
        Number(id);


    if (
        !Number.isInteger(bookId) ||
        bookId <= 0
    ) {

        return null;

    }


    /* =====================================================
       MONGODB
    ===================================================== */

    if (
        isMongoConnected()
    ) {

        try {

            const query =
                Book.findOne({
                    id: bookId
                });


            if (
                session
            ) {

                query.session(
                    session
                );

            }


            return await query.lean();

        }

        catch (error) {

            console.error(
                "MongoDB getBookById failed:",
                error.message
            );

            throw error;

        }

    }


    /* =====================================================
       JSON
    ===================================================== */

    const books =
        readBooksFromJSON();

    return books.find(

        book =>
            Number(book.id) ===
            bookId

    );

}


/* =========================================================
   ADJUST BOOK STOCK
========================================================= */

async function adjustBookStock(
    id,
    quantityChange,
    session = null
) {

    const bookId =
        Number(id);

    const change =
        Number(quantityChange);


    if (
        !Number.isInteger(bookId) ||
        bookId <= 0
    ) {

        throw new Error(
            "Invalid book ID"
        );

    }


    if (
        !Number.isInteger(change)
    ) {

        throw new Error(
            "Stock adjustment must be a whole number"
        );

    }


    /* =====================================================
       MONGODB
    ===================================================== */

    if (
        isMongoConnected()
    ) {

        try {

            /*
             * Atomic stock update.
             *
             * For a deduction:
             *
             * stockNumber + change >= 0
             *
             * This prevents two simultaneous orders
             * from reducing stock below zero.
             */

            const query = {

                id: bookId

            };


            if (
                change < 0
            ) {

                query.stockNumber = {

                    $gte:
                        Math.abs(change)

                };

            }


            const options = {

                new: true,

                session

            };


            const updatedBook =
                await Book.findOneAndUpdate(

                    query,

                    {

                        $inc: {

                            stockNumber:
                                change

                        }

                    },

                    options

                ).lean();


            if (
                !updatedBook
            ) {

                const existingBook =
                    await getBookById(
                        bookId,
                        session
                    );


                if (
                    !existingBook
                ) {

                    return null;

                }


                if (
                    change < 0 &&
                    Number(
                        existingBook.stockNumber
                    ) <
                    Math.abs(change)
                ) {

                    throw new Error(

                        `Insufficient stock for "${existingBook.title}"`

                    );

                }


                throw new Error(
                    "Unable to adjust book stock"
                );

            }


            return updatedBook;

        }

        catch (error) {

            console.error(
                "MongoDB adjustBookStock failed:",
                error.message
            );

            throw error;

        }

    }


    /* =====================================================
       JSON
    ===================================================== */

    const books =
        readBooksFromJSON();


    const index =
        books.findIndex(

            book =>
                Number(book.id) ===
                bookId

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


    books[index].stockStatus =
        newStock > 0
            ? "In Stock"
            : "Out of Stock";


    saveBooksToJSON(
        books
    );


    return books[index];

}


/* =========================================================
   CREATE BOOK
========================================================= */

async function createBook(
    bookData
) {

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


    /* =====================================================
       MONGODB
    ===================================================== */

    if (
        isMongoConnected()
    ) {

        try {

            const lastBook =
                await Book
                    .findOne()
                    .sort({ id: -1 })
                    .lean();


            const newId =
                lastBook
                    ? Number(lastBook.id) + 1
                    : 1;


            const newBook =
                await Book.create({

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

                    stockNumber

                });


            return newBook.toObject();

        }

        catch (error) {

            console.error(
                "MongoDB createBook failed:",
                error.message
            );

            throw error;

        }

    }


    /* =====================================================
       JSON
    ===================================================== */

    const books =
        readBooksFromJSON();


    const newId =
        books.length > 0

            ? Math.max(
                ...books.map(
                    book =>
                        Number(book.id)
                )
            ) + 1

            : 1;


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

        stockStatus:
            stockNumber > 0
                ? "In Stock"
                : "Out of Stock",

        stockNumber

    };


    books.push(
        newBook
    );


    saveBooksToJSON(
        books
    );


    return newBook;

}


/* =========================================================
   UPDATE BOOK
========================================================= */

async function updateBook(
    id,
    bookData,
    session = null
) {

    const bookId =
        Number(id);


    /* =====================================================
       MONGODB
    ===================================================== */

    if (
        isMongoConnected()
    ) {

        try {

            const query =
                Book.findOne({
                    id: bookId
                });


            if (
                session
            ) {

                query.session(
                    session
                );

            }


            const book =
                await query;


            if (
                !book
            ) {

                return null;

            }


            if (
                bookData.title !== undefined
            ) {

                book.title =
                    bookData.title;

            }


            if (
                bookData.author !== undefined
            ) {

                book.author =
                    bookData.author;

            }


            if (
                bookData.price !== undefined
            ) {

                book.price =
                    Number(
                        bookData.price
                    );

            }


            if (
                bookData.category !== undefined
            ) {

                book.category =
                    bookData.category;

            }


            if (
                bookData.rating !== undefined
            ) {

                book.rating =
                    Number(
                        bookData.rating
                    );

            }


            if (
                bookData.description !== undefined
            ) {

                book.description =
                    bookData.description;

            }


            if (
                bookData.cover !== undefined
            ) {

                book.cover =
                    bookData.cover;

            }


            if (
                bookData.stockNumber !== undefined &&
                bookData.stockNumber !== ""
            ) {

                const stockNumber =
                    Number(
                        bookData.stockNumber
                    );


                if (
                    !Number.isInteger(stockNumber) ||
                    stockNumber < 0
                ) {

                    throw new Error(
                        "Stock must be a whole number greater than or equal to 0"
                    );

                }


                book.stockNumber =
                    stockNumber;

            }


            if (
                session
            ) {

                await book.save({
                    session
                });

            }

            else {

                await book.save();

            }


            return book.toObject();

        }

        catch (error) {

            console.error(
                "MongoDB updateBook failed:",
                error.message
            );

            throw error;

        }

    }


    /* =====================================================
       JSON
    ===================================================== */

    const books =
        readBooksFromJSON();


    const index =
        books.findIndex(

            book =>
                Number(book.id) ===
                bookId

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
            bookData.title !== undefined
                ? bookData.title
                : currentBook.title,

        author:
            bookData.author !== undefined
                ? bookData.author
                : currentBook.author,

        price:
            bookData.price !== undefined
                ? Number(
                    bookData.price
                )
                : currentBook.price,

        category:
            bookData.category !== undefined
                ? bookData.category
                : currentBook.category,

        rating:
            bookData.rating !== undefined
                ? Number(
                    bookData.rating
                )
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
            stockNumber > 0
                ? "In Stock"
                : "Out of Stock",

        stockNumber

    };


    books[index] =
        updatedBook;


    saveBooksToJSON(
        books
    );


    return updatedBook;

}


/* =========================================================
   DELETE BOOK
========================================================= */

async function deleteBook(
    id
) {

    const bookId =
        Number(id);


    if (
        isMongoConnected()
    ) {

        try {

            return await Book
                .findOneAndDelete({
                    id: bookId
                })
                .lean();

        }

        catch (error) {

            console.error(
                "MongoDB deleteBook failed:",
                error.message
            );

            throw error;

        }

    }


    const books =
        readBooksFromJSON();


    const index =
        books.findIndex(

            book =>
                Number(book.id) ===
                bookId

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


    saveBooksToJSON(
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