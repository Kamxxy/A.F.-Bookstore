/* =========================================================
   EMAIL RENDERER REGISTRY
   Maps each notification event to its local builder.
   Each builder: (order, context) => { subject, html, text }
   Context: { trackingUrl, paymentUrl, storeUrl, reason }
========================================================= */

const {
    buildOrderReceivedEmail
} = require("./templates/orderReceived");

const {
    buildPaymentConfirmedEmail
} = require("./templates/paymentConfirmed");

const {
    buildPaymentFailedEmail
} = require("./templates/paymentFailed");

const {
    buildOrderShippedEmail
} = require("./templates/orderShipped");

const {
    buildOrderDeliveredEmail
} = require("./templates/orderDelivered");

const {
    buildOrderCancelledEmail
} = require("./templates/orderCancelled");


const RENDERERS = {
    orderReceived: buildOrderReceivedEmail,
    paymentConfirmed: buildPaymentConfirmedEmail,
    paymentFailed: buildPaymentFailedEmail,
    shipped: buildOrderShippedEmail,
    delivered: buildOrderDeliveredEmail,
    cancelled: buildOrderCancelledEmail
};


module.exports = {
    RENDERERS
};
