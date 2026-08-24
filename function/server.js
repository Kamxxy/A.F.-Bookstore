const express = require('express');
const path = require('path');
const cors = require('cors');

const booksRouter = require('./routes/books');
const pagesRouter = require('./routes/pages');
const adminRouter = require('./adminRoutes/admin')


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

app.use(
    'api/admin',
    adminRouter
)

/* =========================================================
   404 PAGE
========================================================= */

app.use((req, res) => {
    res.status(404).sendFile(
        path.join(__dirname, '../public/404.html')
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