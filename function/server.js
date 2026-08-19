const express = require('express');
const path = require('path');
const cors = require('cors');

const booksRouter = require('./routes/books');
const pagesRouter = require('./routes/pages');


const app = express();

const PORT = process.env.PORT || 3000;


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


/* =========================================================
   STATIC FILES
========================================================= */

app.use(
    express.static(
        path.join(__dirname, '../public')
    )
);


/* =========================================================
   ROUTES
========================================================= */

app.use(
    '/',
    pagesRouter
);

app.use(
    '/api/books',
    booksRouter
);


// =========================================================
// PAGE ROUTES
// =========================================================

// Home
app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../public/index.html')
    );
});


// Shop
app.get('/shop', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../public/shop.html')
    );
});


// About
app.get('/about', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../public/about.html')
    );
});

app.get('/book', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../public/book.html')
    );
});

// Contact
app.get('/contact', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../public/contact.html')
    );
});


// FAQ
app.get('/faq', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../public/faq.html')
    );
});


/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

    console.log(
        `Open http://localhost:${PORT} in your browser to view the bookstore`
    );

});