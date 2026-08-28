require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require("express-rate-limit");
const cookieParser = require('cookie-parser');

const connectDatabase =
    require('./config/database');

const booksRouter = require('./routes/books');

const pagesRouter = require('./routes/pages');

const adminRouter =
    require('./adminRoutes/admin');

const adminRoutes =
    require('./adminRoutes/pages');

const ordersRouter =
    require('./routes/orders');



const app = express();

const PORT = process.env.PORT || 3000;


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(express.json());

app.use(cookieParser());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);

// ========================
// RATE LIMITERS
// ========================

// Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', globalLimiter);


/* =========================================================
   STATIC FILES
========================================================= */

app.use(
    express.static(
        path.join(__dirname, '../public')
    )
);

/* =========================================================
   ADMIN FILES
========================================================= */

app.use(
    '/admin-assets',
    express.static(
        path.join(__dirname, '../admin/assets')
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
    '/admin',
    adminRoutes
);

app.use(
    '/api/books',
    booksRouter
);

app.use(
    '/api/orders',
    ordersRouter
);

app.use(
    '/api/admin',
    adminRouter
);

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

async function startServer() {

const mongoConnected =
    await connectDatabase();


/* =====================================================
   DATABASE MODE
===================================================== */

if (mongoConnected) {

    console.log(
        "Database mode: MongoDB"
    );

} else {

    console.log(
        "Database mode: JSON"
    );

}


/* =====================================================
   START SERVER
===================================================== */

app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

    console.log(
        `Open http://localhost:${PORT} in your browser to view the bookstore`
    );

});

}

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

    /* =====================================================
       START SERVER FIRST
    ===================================================== */

    app.listen(PORT, () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

        console.log(
            `Open http://localhost:${PORT} in your browser to view the bookstore`
        );

    });


    /* =====================================================
       TRY MONGODB IN BACKGROUND
    ===================================================== */

    const mongoConnected =
        await connectDatabase();


    /* =====================================================
       DATABASE MODE
    ===================================================== */

    if (mongoConnected) {

        console.log(
            "Database mode: MongoDB"
        );

    }

    else {

        console.log(
            "Database mode: JSON"
        );

    }

}


startServer();
