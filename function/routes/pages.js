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
   EXPORT
========================================================= */

module.exports = router;