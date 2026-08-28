const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dns = require("dns");

const Book = require("../models/Book");

require("dotenv").config();


/* =========================================================
   DNS CONFIGURATION
========================================================= */

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);


/* =========================================================
   FILE PATH
========================================================= */

const booksPath =
    path.join(
        __dirname,
        "../data/books.json"
    );


/* =========================================================
   READ JSON
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
            "Failed to read books.json:",
            error.message
        );

        process.exit(1);

    }

}


/* =========================================================
   MIGRATE BOOKS
========================================================= */

async function migrateBooks() {

    if (!process.env.MONGODB_URI) {

        console.error(
            "MONGODB_URI is not defined in .env"
        );

        process.exit(1);

    }


    try {

        /* ================================================
           CONNECT TO MONGODB
        ================================================ */

        console.log(
            "Connecting to MongoDB..."
        );

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log(
            "MongoDB connected."
        );


        /* ================================================
           READ JSON DATA
        ================================================ */

        const books =
            readBooksFromJSON();


        if (
            !Array.isArray(books) ||
            books.length === 0
        ) {

            console.log(
                "No books found in books.json."
            );

            return;

        }


        console.log(
            `Found ${books.length} books in books.json.`
        );


        /* ================================================
           MIGRATE EACH BOOK
        ================================================ */

        for (
            const book of books
        ) {

            const stockNumber =
                book.stockNumber === "" ||
                book.stockNumber === null ||
                book.stockNumber === undefined

                    ? 0

                    : Number(
                        book.stockNumber
                    );


            if (
                !Number.isInteger(stockNumber) ||
                stockNumber < 0
            ) {

                throw new Error(
                    `Invalid stock for book ID ${book.id}: ${book.stockNumber}`
                );

            }


            const bookData = {

                id:
                    Number(book.id),

                title:
                    book.title,

                author:
                    book.author,

                price:
                    Number(book.price),

                category:
                    book.category,

                rating:
                    book.rating !== undefined
                        ? Number(book.rating)
                        : 0,

                description:
                    book.description || "",

                cover:
                    book.cover || "",

                stockNumber

            };


            /* =========================================
               UPSERT BOOK
            ========================================= */

            const result =
                await Book.findOneAndUpdate(

                    {
                        id:
                            bookData.id
                    },

                    {
                        $set:
                            bookData
                    },

                    {
                        upsert: true,
                        new: true,
                        runValidators: true
                    }

                );


            console.log(
                `Migrated: #${result.id} - ${result.title} (${result.stockNumber} in stock)`
            );

        }


        console.log(
            "\nBook migration completed successfully."
        );

    }

    catch (error) {

        console.error(
            "\nBook migration failed:",
            error.message
        );

        process.exitCode = 1;

    }

    finally {

        await mongoose.disconnect();

        console.log(
            "MongoDB connection closed."
        );

    }

}


/* =========================================================
   RUN
========================================================= */

migrateBooks();