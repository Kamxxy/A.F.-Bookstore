const express = require('express');

const {
    getBooks,
    getBook
} = require('../controllers/bookController');


const router = express.Router();


/* =========================================================
   GET ALL BOOKS
========================================================= */

router.get(
    '/',
    getBooks
);


/* =========================================================
   GET BOOK BY ID
========================================================= */

router.get(
    '/:id',
    getBook
);


module.exports = router;