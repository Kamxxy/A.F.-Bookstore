const express =
    require("express");

const {
    create,
    getOrder,
    getOrders,
    updateStatus,
    trackOrder
} = require(
    "../controllers/orderController"
);

const adminAuth =
    require("../middleware/adminAuth");


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
   PUBLIC ORDER TRACKING
========================================================= */

router.get(
    "/track/:id",
    trackOrder
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
    adminAuth,
    updateStatus
);


module.exports =
    router;