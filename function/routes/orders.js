const express =
    require("express");

const rateLimit =
    require("express-rate-limit");

const {
    create,
    getOrder,
    getOrders,
    updateStatus,
    cancelByBuyer,
    trackOrder
} = require(
    "../controllers/orderController"
);

const adminAuth =
    require("../middleware/adminAuth");


const router =
    express.Router();


/* =========================================================
   BUYER CANCELLATION LIMITER
   Dedicated stricter budget for the public cancellation
   endpoint (ownership-guessing protection), on top of
   the global /api limiter.
========================================================= */

const cancelLimiter =
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 30,
        message: {
            success: false,
            message: "Too many cancellation attempts, please try again later."
        },
        standardHeaders: true,
        legacyHeaders: false
    });


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
   BUYER ORDER CANCELLATION
   Guest ownership check (order ID + saved email),
   enforced again inside the shared service.
========================================================= */

router.post(
    "/:id/cancel",
    cancelLimiter,
    cancelByBuyer
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