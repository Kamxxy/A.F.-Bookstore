/**
 * Focused static checks for the payment-flow cleanup.
 * Run: node function/scripts/payment-flow-static-test.js
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');

function read(p) {
    return fs.readFileSync(path.join(root, p), 'utf8');
}

let failures = 0;

function check(name, condition) {
    if (condition) {
        console.log(`PASS: ${name}`);
    } else {
        console.log(`FAIL: ${name}`);
        failures++;
    }
}

/* ---------- SUCCESS PAGE ---------- */

const successHtml = read('public/order-success.html');
const successJs = read('public/js/order-success.js');

check(
    'Success page has no Complete Payment button',
    !/Complete Payment|Pay Now|Complete Order/i.test(successHtml)
);

check(
    'Success page has Track Order action',
    /id="trackOrderBtn"/.test(successHtml)
);

check(
    'Success page has Continue Shopping action',
    /id="continueShoppingBtn"/.test(successHtml)
);

check(
    'Success JS shows Payment Successful for paid',
    successJs.includes('"Payment Successful"')
);

check(
    'Success JS only clears cart after paid',
    successJs.includes('paymentStatus !== "paid"') &&
    successJs.includes('clearCart();') &&
    successJs.indexOf('window.location.replace(\n            `/order-tracking') <
        successJs.indexOf('clearCart();')
);

/* ---------- TRACKING PAGE ---------- */

const trackingHtml = read('public/order-tracking.html');
const trackingJs = read('public/js/order-tracking.js');

check(
    'Tracking page has payment action button',
    /id="paymentActionBtn"/.test(trackingHtml)
);

check(
    'Tracking JS uses POST /api/payments/initialize',
    trackingJs.includes('/api/payments/initialize') &&
    trackingJs.includes('method: "POST"')
);

check(
    'Tracking retry reuses existing order id',
    trackingJs.includes('currentOrder.id') &&
    !trackingJs.includes('/api/orders",\n') &&
    !/api\/orders"[^\n]*method: "POST"/.test(trackingJs)
);

check(
    'Tracking shows Complete Payment for unpaid',
    trackingJs.includes('"Complete Payment"')
);

check(
    'Tracking shows Try Again for failed',
    trackingJs.includes('"Try Again"')
);

check(
    'Tracking hides payment action for paid',
    trackingJs.includes('paid — no payment recovery action.')
);

check(
    'Tracking reads ?order= query param',
    trackingJs.includes('urlParams') === false &&
    trackingJs.includes('URLSearchParams') &&
    trackingJs.includes('"order"')
);

/* ---------- PAYMENT FAILED PAGE ---------- */

const failedHtml = read('public/payment-failed.html');
const failedJs = read('public/js/payment-failed.js');

check(
    'Failed page has Try Again button',
    /id="retryPaymentBtn"/.test(failedHtml) &&
    failedHtml.includes('Try Again')
);

check(
    'Failed page has Track Order link',
    /id="trackOrderBtn"/.test(failedHtml)
);

check(
    'Failed page has Continue Shopping link',
    /href="\/shop"/.test(failedHtml) &&
    failedHtml.includes('Continue Shopping')
);

check(
    'Failed JS reuses existing order for retry',
    failedJs.includes('currentOrderId') &&
    failedJs.includes('/api/payments/initialize') &&
    !/api\/orders"[\s\S]{0,200}method: "POST"/.test(failedJs)
);

check(
    'Failed Track Order targets same order',
    failedJs.includes('/order-tracking?order=')
);

/* ---------- BACKEND ---------- */

const paymentController = read('function/controllers/paymentController.js');

check(
    'Initialize rejects already-paid orders',
    paymentController.includes('order.paymentStatus === "paid"')
);

check(
    'Initialize validates order email',
    paymentController.includes('Email does not match this order')
);

check(
    'Callback marks failed only on definitive failure',
    paymentController.includes('verified.status === "failed"')
);

/* ---------- RESERVATION LIFECYCLE ---------- */

const orderModel = read('function/models/Order.js');
const orderService = read('function/services/orderService.js');
const serverJs = read('function/server.js');

check(
    'Order schema has reservationExpiresAt',
    orderModel.includes('reservationExpiresAt')
);

check(
    'Order schema has reservationReleasedAt (idempotency)',
    orderModel.includes('reservationReleasedAt')
);

check(
    '30-minute reservation constant exists',
    orderService.includes('PAYMENT_RESERVATION_MINUTES') &&
    orderService.includes('30')
);

check(
    'createOrder records reservationExpiresAt',
    orderService.includes('reservationExpiresAt:')
);

check(
    'prepareOrderForPayment rejects expired reservations',
    orderService.includes('prepareOrderForPayment') &&
    orderService.includes('"reservation_expired"')
);

check(
    'initialize route enforces expiration before Paystack',
    read('function/controllers/paymentController.js')
        .includes('prepareOrderForPayment')
);

check(
    'markPaymentFailed releases stock idempotently',
    orderService.includes('reservationReleasedAt: new Date()') &&
    orderService.includes('$or: [')
);

check(
    'cleanup mechanism exists',
    orderService.includes('cleanupExpiredReservations') &&
    serverJs.includes('cleanupExpiredReservations') &&
    serverJs.includes('setInterval')
);

check(
    'successful payment does not deduct stock again',
    !/markOrderAsPaid[\s\S]*adjustBookStock\([\s\S]*-/m.test(
        orderService.split('async function markOrderAsPaid')[1]?.split('/* ============')[0] || ''
    )
);

check(
    'retry reuses same order (no new order creation on retry)',
    trackingJs.includes('currentOrder.id') &&
    !/api\/orders"[\s\S]{0,200}method: "POST"/.test(trackingJs)
);

check(
    'tracking hides payment retry for expired reservation',
    trackingJs.includes('paymentActionBtn.hidden =\n                    true;') ||
    trackingJs.includes('reservationExpired')
);

check(
    'payment controller rejects expired initialization with 410',
    read('function/controllers/paymentController.js')
        .includes('410')
);

console.log(
    failures === 0
        ? '\nAll payment-flow static checks passed.'
        : `\n${failures} check(s) failed.`
);

process.exit(failures === 0 ? 0 : 1);
