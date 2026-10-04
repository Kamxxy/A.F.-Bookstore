const express =
    require("express");

const {
    initialize,
    handleCallback,
    handleWebhook
} = require(
    "../controllers/paymentController"
);


const router =
    express.Router();


/* =========================================================
   INITIALIZE PAYMENT
========================================================= */

router.post(
    "/initialize",
    initialize
);


/* =========================================================
   PAYSTACK CALLBACK
========================================================= */

router.get(
    "/callback",
    handleCallback
);


/* =========================================================
   PAYSTACK WEBHOOK
========================================================= */

router.post(
    "/webhook",
    handleWebhook
);


module.exports =
    router;
