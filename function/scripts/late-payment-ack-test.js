/**
 * Webhook/callback acknowledgement tests for late-payment evidence.
 *
 * Drives the REAL paymentController.handleWebhook / handleCallback
 * with stubbed services (no database, no network, no secrets):
 * - orderService: getOrderById (fixture) + scripted markOrderAsPaid
 * - paymentService: scripted verifyPayment + signature flag
 * - emailService: records sends, never sends
 *
 * Each case asserts the exact HTTP response for a given persisted
 * outcome, i.e. that responses and durable state agree.
 *
 * Run: node function/scripts/late-payment-ack-test.js
 */

const path = require("path");

const root = path.join(__dirname, "..", "..");
const functionDir = path.join(root, "function");
const controllersDir = path.join(functionDir, "controllers");

let failures = 0;

function check(name, condition) {
    if (condition) {
        console.log(`PASS: ${name}`);
    } else {
        console.log(`FAIL: ${name}`);
        failures++;
    }
}

/* =========================================================
   FIXTURES + STUBS
========================================================= */

const ORDER_ID = "AFORDER-ACK-1";
const REFERENCE = "AFPAY-ACK-1";

const fixtureOrder = {
    id: ORDER_ID,
    status: "pending",
    paymentStatus: "unpaid",
    customer: { name: "Ack", email: "ack@example.com", phone: "080" },
    delivery: { address: "1 Test St" },
    items: [{ bookId: 1, title: "T", author: "A", quantity: 1, price: 4000, itemTotal: 4000 }],
    subtotal: 4000,
    deliveryFee: 0,
    total: 4000,
    currency: "NGN"
};

function verifiedPayment() {
    return {
        reference: REFERENCE,
        status: "success",
        amount: 400000,
        currency: "NGN",
        paid_at: new Date().toISOString(),
        channel: "card",
        metadata: { orderId: ORDER_ID }
    };
}

let payBehavior = { mode: "return", value: null };
let signatureValid = true;
const payCalls = [];
const emailCalls = [];

const orderServiceStub = {
    async getOrderById() {
        return JSON.parse(JSON.stringify(fixtureOrder));
    },
    async markOrderAsPaid(id, paymentData) {
        payCalls.push({ id, paymentData });
        if (payBehavior.mode === "throw") {
            throw new Error(payBehavior.message || "stub payment failure");
        }
        return payBehavior.value;
    },
    async markPaymentFailed() {
        throw new Error("not exercised");
    },
    async prepareOrderForPayment() {
        throw new Error("not exercised");
    }
};

const paymentServiceStub = {
    async verifyPayment() {
        return verifiedPayment();
    },
    verifyWebhookSignature() {
        return signatureValid;
    },
    toKobo(amount) {
        return Math.round(Number(amount) * 100);
    },
    async initializePayment() {
        throw new Error("not exercised");
    }
};

function stubEmail(name) {
    return async (...args) => {
        emailCalls.push({ fn: name, args });
        return { sent: true };
    };
}

const emailServiceStub = {
    sendPaymentConfirmedEmail: stubEmail("sendPaymentConfirmedEmail"),
    sendPaymentFailedEmail: stubEmail("sendPaymentFailedEmail"),
    sendOrderCancellationEmail: stubEmail("sendOrderCancellationEmail")
};

function seedStub(requestPath, exportsObject) {
    const resolved = require.resolve(requestPath, { paths: [controllersDir] });
    require.cache[resolved] = {
        id: resolved,
        filename: resolved,
        loaded: true,
        exports: exportsObject
    };
}

seedStub("../services/orderService", orderServiceStub);
seedStub("../services/paymentService", paymentServiceStub);
seedStub("../services/emailService", emailServiceStub);

const controllerPath = path.join(controllersDir, "paymentController.js");
delete require.cache[require.resolve(controllerPath)];
const controller = require(controllerPath);

/* =========================================================
   FAKE TRANSPORT
========================================================= */

function fakeRes() {
    return {
        statusCode: 200,
        body: null,
        redirected: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
        redirect(url) {
            this.redirected = url;
            return this;
        }
    };
}

function webhookReq(event = "charge.success") {
    return {
        rawBody: Buffer.from(JSON.stringify({
            event,
            data: { reference: REFERENCE }
        })),
        headers: { "x-paystack-signature": "sig" }
    };
}

function reset() {
    payCalls.length = 0;
    emailCalls.length = 0;
    signatureValid = true;
    payBehavior = { mode: "return", value: null };
}

/* =========================================================
   CASES A–G
========================================================= */

async function webhookCases() {
    reset();
    payBehavior = {
        mode: "return",
        value: { status: "paid", order: { ...fixtureOrder, paymentStatus: "paid", transactionReference: REFERENCE } }
    };
    let res = fakeRes();
    await controller.handleWebhook(webhookReq(), res);
    check("A: applied payment → 200 + confirmation email", res.statusCode === 200 && res.body.received === true && emailCalls.length === 1);
    check("A: payment source tagged webhook", payCalls.length === 1 && payCalls[0].paymentData.source === "webhook");

    reset();
    payBehavior = { mode: "return", value: { status: "already_paid", order: fixtureOrder } };
    res = fakeRes();
    await controller.handleWebhook(webhookReq(), res);
    check("B: repeat delivery → 200, no duplicate email", res.statusCode === 200 && emailCalls.length === 0);

    reset();
    payBehavior = { mode: "return", value: { status: "duplicate_paid", order: fixtureOrder } };
    res = fakeRes();
    await controller.handleWebhook(webhookReq(), res);
    check("B2: duplicate reference → 200, no confirmation email", res.statusCode === 200 && emailCalls.length === 0);

    reset();
    payBehavior = {
        mode: "return",
        value: { status: "reservation_expired", evidence: "recorded", order: { ...fixtureOrder, status: "cancelled" } }
    };
    res = fakeRes();
    await controller.handleWebhook(webhookReq(), res);
    check("C: cancelled + evidence durable → 200, no paid email", res.statusCode === 200 && res.body.received === true && emailCalls.length === 0);

    reset();
    payBehavior = {
        mode: "return",
        value: { status: "reservation_expired", evidence: "failed", order: { ...fixtureOrder, status: "cancelled" } }
    };
    res = fakeRes();
    await controller.handleWebhook(webhookReq(), res);
    check(
        "D: cancelled + evidence NOT durable → 503, not acknowledged",
        res.statusCode === 503 && res.body.success === false && emailCalls.length === 0
    );

    reset();
    payBehavior = { mode: "throw", message: "Unable to update order payment status." };
    res = fakeRes();
    await controller.handleWebhook(webhookReq(), res);
    check("F/G: losing payment → 503 so Paystack retries", res.statusCode === 503);

    reset();
    signatureValid = false;
    res = fakeRes();
    await controller.handleWebhook(webhookReq(), res);
    check("invalid signature → 401, payment never attempted", res.statusCode === 401 && payCalls.length === 0);

    reset();
    res = fakeRes();
    await controller.handleWebhook(webhookReq("charge.failed"), res);
    check("non-success event → 200 without touching payment", res.statusCode === 200 && payCalls.length === 0 && emailCalls.length === 0);
}

async function callbackCases() {
    reset();
    payBehavior = {
        mode: "return",
        value: { status: "paid", order: { ...fixtureOrder, paymentStatus: "paid", transactionReference: REFERENCE } }
    };
    let res = fakeRes();
    await controller.handleCallback({ query: { reference: REFERENCE } }, res);
    check("callback applied → success redirect + email", res.redirected === `/order-success?order=${ORDER_ID}` && emailCalls.length === 1);
    check("callback payment source tagged callback", payCalls.length === 1 && payCalls[0].paymentData.source === "callback");

    for (const evidence of ["recorded", "failed"]) {
        reset();
        payBehavior = {
            mode: "return",
            value: { status: "reservation_expired", evidence, order: { ...fixtureOrder, status: "cancelled" } }
        };
        res = fakeRes();
        await controller.handleCallback({ query: { reference: REFERENCE } }, res);
        check(
            `callback cancelled (evidence ${evidence}) → expiry redirect, no email`,
            res.redirected === `/payment-failed?reason=reservation_expired&order=${ORDER_ID}` && emailCalls.length === 0
        );
    }

    reset();
    payBehavior = { mode: "throw", message: "Unable to update order payment status." };
    res = fakeRes();
    await controller.handleCallback({ query: { reference: REFERENCE } }, res);
    check("callback losing path → generic failed redirect", res.redirected === "/payment-failed");
}

(async () => {
    await webhookCases();
    await callbackCases();
    console.log(failures === 0 ? "\nAll late-payment acknowledgement tests passed." : `\n${failures} check(s) failed.`);
    process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
    console.error("Test harness error:", e && e.message);
    process.exit(1);
});
