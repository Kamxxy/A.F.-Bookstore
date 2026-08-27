const express =
    require("express");

const {
    create,
    getOrder,
    getOrders,
    updateStatus
} = require(
    "../controllers/orderController"
);


const router =
    express.Router();


/* =========================================================
   CREATE ORDER
========================================================= */

router.post(
    "/",
    create
);

/* =========================================================
   GET ALL ORDERS
========================================================= */

router.get(
    "/",
    getOrders
);


/* =========================================================
   GET ORDER
========================================================= */

router.get(
    "/:id",
    getOrder
);

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

router.put(
    "/:id",
    updateStatus
);


module.exports =
    router;