const express =
    require("express");


const adminAuth =
    require("../middleware/adminAuth");


const upload =
    require("../middleware/upload");


const {

    login,
    logout,
    getBooks,
    getBook,
    create,
    update,
    remove

} = require(
    "../controllers/adminController"
);


const router =
    express.Router();


/* =========================================================
   ADMIN LOGIN
   PUBLIC
========================================================= */

router.post(
    "/login",
    login
);


/* =========================================================
   ADMIN LOGOUT
   PUBLIC
========================================================= */

router.post(
    "/logout",
    logout
);


/* =========================================================
   PROTECTED ADMIN API ROUTES
========================================================= */

router.use(
    adminAuth
);


/* =========================================================
   CHECK ADMIN AUTHENTICATION
========================================================= */

router.get(
    "/auth",
    (req, res) => {

        res.json({

            success: true,

            admin:
                req.admin

        });

    }
);


/* =========================================================
   BOOK MANAGEMENT
========================================================= */

router.get(
    "/books",
    getBooks
);


router.get(
    "/books/:id",
    getBook
);


/* =========================================================
   CREATE BOOK
========================================================= */

router.post(
    "/books",
    upload.single("image"),
    create
);


/* =========================================================
   UPDATE BOOK
========================================================= */

router.put(
    "/books/:id",
    upload.single("image"),
    update
);


/* =========================================================
   DELETE BOOK
========================================================= */

router.delete(
    "/books/:id",
    remove
);


module.exports =
    router;