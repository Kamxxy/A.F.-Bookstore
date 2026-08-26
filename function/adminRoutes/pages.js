const express = require('express');
const path = require('path');

const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

const adminPath = path.join(
    __dirname,
    '../../public/admin'
);


/* =========================================================
   ADMIN LOGIN PAGE
========================================================= */

router.get('/login', (req, res) => {

    res.sendFile(
        path.join(
            adminPath,
            'login.html'
        )
    );

});


/* =========================================================
   PROTECTED ADMIN PAGES
========================================================= */

router.use(adminAuth);


/* =========================================================
   DASHBOARD
========================================================= */

router.get('/', (req, res) => {

    res.sendFile(
        path.join(
            adminPath,
            'index.html'
        )
    );

});


/* =========================================================
   BOOKS
========================================================= */

router.get('/books', (req, res) => {

    res.sendFile(
        path.join(
            adminPath,
            'books.html'
        )
    );

});


/* =========================================================
   ORDERS
========================================================= */

router.get('/orders', (req, res) => {

    res.sendFile(
        path.join(
            adminPath,
            'orders.html'
        )
    );

});


module.exports = router;