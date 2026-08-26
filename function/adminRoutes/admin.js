const express = require('express');

const adminAuth =
    require('../middleware/adminAuth');

const {
    login,
    getBooks,
    getBook,
    create,
    update,
    remove
} = require('../controllers/adminController');


const router = express.Router();


/* =========================================================
   ADMIN LOGIN
========================================================= */

router.post(
    '/login',
    login
);


/* =========================================================
   PROTECTED ADMIN ROUTES
========================================================= */

router.use(adminAuth);


/* =========================================================
   BOOK MANAGEMENT
========================================================= */

router.get(
    '/books',
    getBooks
);


router.get(
    '/books/:id',
    getBook
);


router.post(
    '/books',
    create
);


router.put(
    '/books/:id',
    update
);


router.delete(
    '/books/:id',
    remove
);


module.exports = router;