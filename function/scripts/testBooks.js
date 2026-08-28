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
   TEST
========================================================= */

async function test() {

    try {

        console.log(
            "Connecting to MongoDB..."
        );


        await mongoose.connect(
            process.env.MONGODB_URI
        );


        console.log(
            "MongoDB connected."
        );


        const books =
            await Book
                .find()
                .sort({
                    id: 1
                })
                .lean();


        console.log(
            "Books:",
            books
        );


        console.log(
            "Is array:",
            Array.isArray(books)
        );


        console.log(
            "Count:",
            books.length
        );

    }

    catch (error) {

        console.error(
            "MongoDB test failed:",
            error
        );

    }

    finally {

        await mongoose.connection.close();

        console.log(
            "MongoDB connection closed."
        );

    }

}


test();