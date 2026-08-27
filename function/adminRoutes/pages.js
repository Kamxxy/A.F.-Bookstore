const express =
    require("express");

const path =
    require("path");


const adminPageAuth =
    require("../middleware/adminPageAuth");


const router =
    express.Router();


const adminPagesPath =
    path.join(
        __dirname,
        "../../admin/pages"
    );


/* =========================================================
   LOGIN
   PUBLIC
========================================================= */

router.get(
    "/login",
    (req, res) => {

        res.sendFile(
            path.join(
                adminPagesPath,
                "login.html"
            )
        );

    }
);


/* =========================================================
   PROTECTED ADMIN PAGES
========================================================= */

router.use(
    adminPageAuth
);


/* =========================================================
   DISABLE ADMIN PAGE CACHING
========================================================= */

router.use(
    (req, res, next) => {

        res.set(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, private"
        );

        res.set(
            "Pragma",
            "no-cache"
        );

        res.set(
            "Expires",
            "0"
        );

        next();

    }
);


/* =========================================================
   DASHBOARD
========================================================= */

router.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                adminPagesPath,
                "index.html"
            )
        );

    }
);


/* =========================================================
   BOOKS
========================================================= */

router.get(
    "/books",
    (req, res) => {

        res.sendFile(
            path.join(
                adminPagesPath,
                "books.html"
            )
        );

    }
);


/* =========================================================
   ORDERS
========================================================= */

router.get(
    "/orders",
    (req, res) => {

        res.sendFile(
            path.join(
                adminPagesPath,
                "orders.html"
            )
        );

    }
);


module.exports =
    router;