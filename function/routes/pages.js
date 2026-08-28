const express = require('express');
const path = require('path');

const router = express.Router();


/* =========================================================
   HOME PAGE
========================================================= */

router.get('/', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../../public/index.html'
        )
    );

});


/* =========================================================
   SHOP PAGE
========================================================= */

router.get('/shop', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../../public/shop.html'
        )
    );

});

/* =========================================================
   ABOUT PAGE
========================================================= */

router.get('/about', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../../public/about.html'
        )
    );

});

/* =========================================================
   BOOK PAGE
========================================================= */

router.get('/book', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../../public/book.html')
    );
});

/* =========================================================
   CHECKOUT PAGE
========================================================= */

router.get('/checkout', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../../public/checkout.html')
    );
});

/* =========================================================
   ORDER TRACKING PAGE
========================================================= */

router.get('/order-tracking', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../../public/order-tracking.html')
    );
});

/* =========================================================
   ORDER SUCCESS PAGE
========================================================= */

router.get('/order-success', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../../public/order-success.html')
    );
});

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;