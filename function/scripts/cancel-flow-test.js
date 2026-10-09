/**
 * Buyer/admin cancellation flow tests (no database, no network).
 * Stubs orderService + emailService via the require cache, then
 * drives orderController.cancelByBuyer / updateStatus with
 * fake req/res objects.
 * Run: node function/scripts/cancel-flow-test.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const functionDir = path.join(root, "function");

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
   STUBS
========================================================= */

const serviceCalls = [];
const emailCalls = [];

let cancelScenario = { mode: "success" };
let emailShouldReject = false;

const baseOrder = {
    id: "AFORDER-TEST-1",
    status: "pending",
    paymentStatus: "unpaid",
    customer: { name: "Buyer", email: "buyer@example.com", phone: "08011111111" },
    delivery: { address: "1 Test St", city: "Lagos", state: "Lagos" },
    items: [{ bookId: 1, title: "T", author: "A", quantity: 1, price: 1000, itemTotal: 1000 }],
    subtotal: 1000,
    deliveryFee: 2000,
    total: 3000,
    currency: "NGN",
    reservationExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
};

function cancelledOrder(actor) {
    return {
        ...baseOrder,
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancelledBy: actor
    };
}

const orderServiceStub = {
    createOrder: async () => { throw new Error("not used"); },
    getOrderById: async () => ({ ...baseOrder }),
    getAllOrders: async () => [],
    updateOrderStatus: async (id, status) => {
        serviceCalls.push({ fn: "updateOrderStatus", id, status });
        if (status === "missing") {
            return null;
        }
        return { ...baseOrder, status };
    },
    cancelOrder: async (id, opts) => {
        serviceCalls.push({ fn: "cancelOrder", id, opts });
        if (cancelScenario.mode === "success") {
            const paymentStatus = cancelScenario.paymentStatus || "unpaid";
            const order = {
                ...cancelledOrder(opts.actor),
                paymentStatus,
                ...(paymentStatus === "paid" ? { transactionReference: "AFPAY-TEST-1" } : {})
            };
            return { order, status: "cancelled" };
        }
        if (cancelScenario.mode === "already") {
            return { order: cancelledOrder("buyer"), status: "already_cancelled" };
        }
        const error = new Error(cancelScenario.message || "stub failure");
        error.code = cancelScenario.code;
        throw error;
    },
    getPublicOrderById: async () => null
};

function stubEmail(name) {
    return async (...args) => {
        emailCalls.push({ fn: name, args });
        if (emailShouldReject) {
            throw new Error("brevo down");
        }
        return { sent: true, messageId: "test-1" };
    };
}

const emailServiceStub = {
    sendOrderReceivedEmail: stubEmail("sendOrderReceivedEmail"),
    sendPaymentConfirmedEmail: stubEmail("sendPaymentConfirmedEmail"),
    sendPaymentFailedEmail: stubEmail("sendPaymentFailedEmail"),
    sendOrderStatusEmail: stubEmail("sendOrderStatusEmail"),
    sendOrderCancellationEmail: stubEmail("sendOrderCancellationEmail")
};

function seedStub(requestPath, exportsObject) {
    const resolved = require.resolve(requestPath, { paths: [path.join(functionDir, "controllers")] });
    require.cache[resolved] = {
        id: resolved,
        filename: resolved,
        loaded: true,
        exports: exportsObject
    };
}

seedStub("../services/orderService", orderServiceStub);
seedStub("../services/emailService", emailServiceStub);

const controllerPath = path.join(functionDir, "controllers", "orderController.js");
delete require.cache[require.resolve(controllerPath)];
const controller = require(controllerPath);

/* =========================================================
   FAKE REQ/RES
========================================================= */

function fakeRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
}

function reset() {
    serviceCalls.length = 0;
    emailCalls.length = 0;
    cancelScenario = { mode: "success" };
    emailShouldReject = false;
}

/* =========================================================
   BUYER TESTS
========================================================= */

async function buyerTests() {
    reset();
    let res = fakeRes();
    await controller.cancelByBuyer(
        { params: { id: "AFORDER-TEST-1" }, body: { email: "buyer@example.com", reason: "changed mind" } },
        res
    );
    check("buyer success returns 200 with cancelled order", res.statusCode === 200 && res.body.success === true && res.body.order.status === "cancelled");
    check(
        "buyer path uses shared service with actor + ownership email",
        serviceCalls.length === 1 && serviceCalls[0].fn === "cancelOrder" &&
        serviceCalls[0].opts.actor === "buyer" && serviceCalls[0].opts.email === "buyer@example.com"
    );
    check(
        "cancellation email sent once to saved customer address",
        emailCalls.length === 1 && emailCalls[0].fn === "sendOrderCancellationEmail" &&
        emailCalls[0].args[1] === "buyer"
    );
    check("buyer response exposes no customer PII", res.body.order.customer === undefined && res.body.order.items === undefined);

    reset();
    cancelScenario = { mode: "success", paymentStatus: "failed" };
    res = fakeRes();
    await controller.cancelByBuyer(
        { params: { id: "AFORDER-TEST-1" }, body: { email: "buyer@example.com", reason: "" } },
        res
    );
    check(
        "pending+failed buyer cancellation succeeds",
        res.statusCode === 200 && res.body.success === true && res.body.order.paymentStatus === "failed"
    );

    reset();
    cancelScenario = { mode: "success", paymentStatus: "paid" };
    res = fakeRes();
    await controller.cancelByBuyer(
        { params: { id: "AFORDER-TEST-1" }, body: { email: "buyer@example.com", reason: "no longer needed" } },
        res
    );
    check(
        "pending+paid buyer cancellation succeeds",
        res.statusCode === 200 && res.body.success === true && res.body.order.status === "cancelled"
    );
    check("paid cancellation preserves paymentStatus paid", res.body.order.paymentStatus === "paid");
    check(
        "paid cancellation still notifies the saved customer once",
        emailCalls.length === 1 && emailCalls[0].fn === "sendOrderCancellationEmail" &&
        emailCalls[0].args[1] === "buyer"
    );

    reset();
    res = fakeRes();
    await controller.cancelByBuyer(
        { params: { id: "AFORDER-TEST-1" }, body: { email: "not-an-email", reason: "" } },
        res
    );
    check("malformed email rejected with 400", res.statusCode === 400 && res.body.success === false);
    check("malformed email never reaches service or email", serviceCalls.length === 0 && emailCalls.length === 0);

    reset();
    res = fakeRes();
    await controller.cancelByBuyer({ params: { id: "AFORDER-TEST-1" }, body: undefined }, res);
    check("missing body rejected with 400", res.statusCode === 400);

    for (const [code, expectedStatus, label] of [
        ["forbidden", 403, "ownership mismatch"],
        ["ineligible", 409, "ineligible order"],
        ["not_found", 404, "missing order"],
        ["invalid_reason", 400, "overlong reason"]
    ]) {
        reset();
        cancelScenario = { mode: "throw", code, message: `${code} happened` };
        res = fakeRes();
        await controller.cancelByBuyer(
            { params: { id: "AFORDER-TEST-1" }, body: { email: "buyer@example.com", reason: "x" } },
            res
        );
        check(
            `${label} fails with ${expectedStatus} and sends no email`,
            res.statusCode === expectedStatus && res.body.success === false && emailCalls.length === 0
        );
    }

    reset();
    cancelScenario = { mode: "throw", code: undefined, message: "boom" };
    res = fakeRes();
    await controller.cancelByBuyer(
        { params: { id: "AFORDER-TEST-1" }, body: { email: "buyer@example.com" } },
        res
    );
    check("failed cancellation sends no email", res.statusCode === 400 && emailCalls.length === 0);

    reset();
    cancelScenario = { mode: "already" };
    res = fakeRes();
    await controller.cancelByBuyer(
        { params: { id: "AFORDER-TEST-1" }, body: { email: "buyer@example.com" } },
        res
    );
    check(
        "repeated cancellation is idempotent without a second email",
        res.statusCode === 200 && res.body.success === true && res.body.already === true && emailCalls.length === 0
    );

    reset();
    emailShouldReject = true;
    res = fakeRes();
    await controller.cancelByBuyer(
        { params: { id: "AFORDER-TEST-1" }, body: { email: "buyer@example.com" } },
        res
    );
    check("Brevo failure keeps the cancellation successful", res.statusCode === 200 && res.body.order.status === "cancelled");
}

/* =========================================================
   ADMIN TESTS (shared service)
========================================================= */

async function adminTests() {
    reset();
    let res = fakeRes();
    await controller.updateStatus(
        { params: { id: "AFORDER-TEST-1" }, body: { status: "cancelled", reason: "out of stock" } },
        res
    );
    check("admin cancellation succeeds", res.statusCode === 200 && res.body.success === true && res.body.order.status === "cancelled");
    check(
        "admin cancellation uses the same shared service",
        serviceCalls.some(call => call.fn === "cancelOrder" && call.opts.actor === "admin" && call.opts.reason === "out of stock")
    );
    check(
        "admin cancellation sends the customer email with admin initiator",
        emailCalls.some(call => call.fn === "sendOrderCancellationEmail" && call.args[1] === "admin")
    );

    reset();
    cancelScenario = { mode: "already" };
    res = fakeRes();
    await controller.updateStatus(
        { params: { id: "AFORDER-TEST-1" }, body: { status: "cancelled" } },
        res
    );
    check("admin repeat cancellation is idempotent without email", res.body.message.includes("already") && emailCalls.length === 0);

    reset();
    cancelScenario = { mode: "throw", code: "not_found", message: "Order not found." };
    res = fakeRes();
    await controller.updateStatus(
        { params: { id: "AFORDER-NOPE" }, body: { status: "cancelled" } },
        res
    );
    check("admin cancellation of missing order is 404", res.statusCode === 404);

    reset();
    res = fakeRes();
    await controller.updateStatus(
        { params: { id: "AFORDER-TEST-1" }, body: { status: "shipped" } },
        res
    );
    check(
        "non-cancel statuses still use updateOrderStatus",
        serviceCalls.some(call => call.fn === "updateOrderStatus" && call.status === "shipped") &&
        !serviceCalls.some(call => call.fn === "cancelOrder")
    );

    reset();
    res = fakeRes();
    await controller.updateStatus(
        { params: { id: "AFORDER-TEST-1" }, body: { status: "processing" } },
        res
    );
    check("processing updates send no email", emailCalls.length === 0);
}

/* =========================================================
   STATIC SAFEGUARDS
========================================================= */

function staticTests() {
    const routesSrc = fs.readFileSync(path.join(functionDir, "routes", "orders.js"), "utf8");
    check("buyer cancel route exists with limiter", routesSrc.includes("/:id/cancel") && routesSrc.includes("cancelLimiter") && routesSrc.includes("cancelByBuyer"));
    check(
        "admin PUT keeps authentication",
        /router\.put\(\s*"\/:id",\s*adminAuth,\s*updateStatus/s.test(routesSrc)
    );

    const serviceSrc = fs.readFileSync(path.join(functionDir, "services", "orderService.js"), "utf8");
    check("cancellation uses an atomic single-winner claim", serviceSrc.includes("async function cancelOrder") && serviceSrc.includes("status:") && serviceSrc.includes("$ne: \"cancelled\""));
    check("buyer claim filter covers paid orders", serviceSrc.includes('$in: ["unpaid", "failed", "paid"]'));
    check("stock release re-checks payment atomically", serviceSrc.includes('$in: ["unpaid", "failed"]'));
    check(
        "markOrderAsPaid cannot revive cancelled orders",
        /paymentStatus:\s*\{\s*\$ne:\s*"paid"\s*\},\s*status:\s*\{\s*\$ne:\s*"cancelled"\s*\}/s.test(serviceSrc) &&
        serviceSrc.includes("after cancellation (reference")
    );
    check("reservation release is claimed exactly once", serviceSrc.includes("reservationReleasedAt: null") && serviceSrc.includes("Reserved stock released"));
    check("buyer ownership uses constant-time email comparison", serviceSrc.includes("timingSafeEqual"));
    check("paid orders keep payment state on admin cancel", serviceSrc.includes("Manual refund handling required"));

    const orderSrc = fs.readFileSync(path.join(functionDir, "models", "Order.js"), "utf8");
    check(
        "schema has cancellation metadata + cancelled tracker",
        orderSrc.includes("cancelledAt") && orderSrc.includes("cancelledBy") &&
        orderSrc.includes("cancellationReason") && orderSrc.includes("cancelled: {")
    );
    check(
        "obsolete tracker fields removed",
        !orderSrc.includes("processing: {") && !orderSrc.includes("adminPaidOrder: {")
    );

    const controllerSrc = fs.readFileSync(path.join(functionDir, "controllers", "orderController.js"), "utf8");
    check("removed admin mailer has no controller references", !controllerSrc.includes("sendAdminPaidOrderEmail"));
    const paymentSrc = fs.readFileSync(path.join(functionDir, "controllers", "paymentController.js"), "utf8");
    check("payment controller sends confirmation without admin mail", paymentSrc.includes("sendPaymentConfirmedEmail") && !paymentSrc.includes("sendAdminPaidOrderEmail"));

    const exampleSrc = fs.readFileSync(path.join(functionDir, ".env.example"), "utf8");
    check(
        "env example drops obsolete email config",
        !exampleSrc.includes("ADMIN_NOTIFICATION_EMAIL") && !exampleSrc.includes("BREVO_TEMPLATE") &&
        exampleSrc.includes("BREVO_API_KEY=") && exampleSrc.includes("BREVO_SENDER_EMAIL=")
    );

    const trackingJs = fs.readFileSync(path.join(root, "public", "js", "order-tracking.js"), "utf8");
    check(
        "tracking page derives cancel eligibility from server order",
        trackingJs.includes("isBuyerCancellable") && trackingJs.includes("/cancel") &&
        trackingJs.includes("updateCancelSection")
    );
    check(
        "pending+paid tracking offers action without promising a refund",
        trackingJs.includes("does not automatically refund") &&
        !trackingJs.includes("already been paid and cannot be")
    );
    const trackingHtml = fs.readFileSync(path.join(root, "public", "order-tracking.html"), "utf8");
    check("tracking page has cancel section with confirmation", trackingHtml.includes("cancelSection") && trackingHtml.includes("confirmCancelBtn"));

    const adminJs = fs.readFileSync(path.join(root, "admin", "assets", "js", "order.js"), "utf8");
    check("admin modal shows cancellation metadata", adminJs.includes("formatCancelledBy") && adminJs.includes("orderCancelReason"));
}

(async () => {
    await buyerTests();
    await adminTests();
    staticTests();
    console.log(failures === 0 ? "\nAll cancellation flow tests passed." : `\n${failures} check(s) failed.`);
    process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
    console.error("Test harness error:", e && e.message);
    process.exit(1);
});
