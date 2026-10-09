/**
 * Email render + delivery-shape tests (no network, no database, no secrets).
 * Run: node function/scripts/email-render-test.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");

let failures = 0;

function check(name, condition) {
    if (condition) {
        console.log(`PASS: ${name}`);
    } else {
        console.log(`FAIL: ${name}`);
        failures++;
    }
}

/* ---------- deterministic env: Brevo disabled by default ---------- */

for (const key of [
    "BREVO_API_KEY",
    "BREVO_SENDER_EMAIL",
    "BREVO_SENDER_NAME",
    "APP_URL"
]) {
    delete process.env[key];
}
process.env.APP_URL = "https://example-books.test";

/* ---------- 1. six renderers: non-empty subject/html/text ---------- */

const { RENDERERS } = require("../emails");

const EVENTS = [
    "orderReceived",
    "paymentConfirmed",
    "paymentFailed",
    "shipped",
    "delivered",
    "cancelled"
];

check(
    "renderer registry holds exactly the six active events",
    Object.keys(RENDERERS).sort().join(",") === [...EVENTS].sort().join(",")
);

const sampleOrder = {
    id: "AFORDER-1791071348318-5698",
    status: "pending",
    paymentStatus: "paid",
    transactionReference: "AFPAY-1791071348318-123456",
    paidAt: "2026-10-09T10:00:00.000Z",
    reservationExpiresAt: "2026-10-09T10:30:00.000Z",
    customer: { name: "Ada Reader", email: "ada@example.com", phone: "08012345678" },
    delivery: {
        houseNumber: "12",
        street: "Allen Avenue",
        area: "Ikeja",
        lga: "Ikeja",
        state: "Lagos",
        details: "Call on arrival",
        address: "12, Allen Avenue, Ikeja",
        city: "Ikeja"
    },
    items: [
        { bookId: 1, title: "The Silent Patient", author: "Alex Michaelides", quantity: 2, price: 8500, itemTotal: 17000 },
        { bookId: 2, title: "Homegoing", author: "Yaa Gyasi", quantity: 1, price: 9200, itemTotal: 9200 }
    ],
    subtotal: 26200,
    deliveryFee: 2000,
    total: 28200,
    currency: "NGN"
};

const ctx = {
    trackingUrl: "https://example-books.test/order-tracking?order=AFORDER-1791071348318-5698",
    paymentUrl: "https://example-books.test/order-tracking?order=AFORDER-1791071348318-5698",
    storeUrl: "https://example-books.test"
};

const rendered = {};

for (const event of EVENTS) {
    const extra = event === "cancelled" ? { initiator: "buyer" } : undefined;
    const out = RENDERERS[event](sampleOrder, { ...ctx, ...extra });
    rendered[event] = out;
    check(
        `${event} renders non-empty subject/html/text`,
        out && typeof out.subject === "string" && out.subject.trim() !== "" &&
        typeof out.html === "string" && out.html.includes("<html") && out.html.includes(sampleOrder.id) &&
        typeof out.text === "string" && out.text.includes(sampleOrder.id)
    );
}

/* ---------- 2. escaping ---------- */

const evilOrder = {
    ...sampleOrder,
    customer: { name: "<script>alert(1)</script>", email: "evil@example.com", phone: "080" },
    items: [{ bookId: 9, title: "<img src=x onerror=alert(2)>", author: "Evil", quantity: 1, price: 100, itemTotal: 100 }],
    delivery: { street: "<b>bold</b>", area: "X", lga: "Y", state: "Z" }
};

let escapeOk = true;
for (const event of EVENTS) {
    const extra = event === "cancelled" ? { initiator: "buyer" } : undefined;
    const out = RENDERERS[event](evilOrder, { ...ctx, ...extra });
    if (out.html.includes("<script>alert(1)</script>") || out.html.includes("<img src=x onerror=alert(2)>") || out.html.includes("<b>bold</b>")) {
        escapeOk = false;
    }
    if (!out.html.includes("&lt;script&gt;")) {
        escapeOk = false;
    }
    /* paymentFailed renders totals only (no item list), so the
       item-escaping assertion applies to the other five. */
    if (event !== "paymentFailed" && !out.html.includes("&lt;img")) {
        escapeOk = false;
    }
}
check("dynamic HTML values are escaped", escapeOk);

/* ---------- 3. missing address parts ---------- */

let addressOk = true;
for (const delivery of [null, undefined, {}, { state: "" }, { street: "Only Street" }]) {
    for (const event of EVENTS) {
        const extra = event === "cancelled" ? { initiator: "buyer" } : undefined;
        const out = RENDERERS[event]({ ...sampleOrder, delivery }, { ...ctx, ...extra });
        if (out.html.includes("undefined") || out.html.includes("null") || out.html.includes(", ,") || out.html.includes(", <") || /, <\/p>/.test(out.html)) {
            addressOk = false;
        }
        if (out.text.includes("undefined") || /null/.test(out.text.replace(/unsuccessful/g, ""))) {
            addressOk = false;
        }
    }
}
check("missing address parts stay clean (no undefined/null/stray separators)", addressOk);

/* ---------- 4. required content per type ---------- */

check(
    "orderReceived has reservation + payment link",
    rendered.orderReceived.html.includes("reserved until") &&
    rendered.orderReceived.html.includes("continue payment") &&
    rendered.orderReceived.text.includes(ctx.paymentUrl)
);
check(
    "paymentConfirmed has AFPAY reference + paid timestamp",
    rendered.paymentConfirmed.html.includes(sampleOrder.transactionReference) &&
    rendered.paymentConfirmed.text.includes(sampleOrder.transactionReference) &&
    rendered.paymentConfirmed.html.includes("Paid on")
);
check(
    "paymentFailed explains failure, offers retry, claims no refund",
    rendered.paymentFailed.text.includes(ctx.paymentUrl) &&
    !/refund/i.test(rendered.paymentFailed.html) &&
    !/refund/i.test(rendered.paymentFailed.text)
);
for (const event of ["shipped", "delivered"]) {
    check(
        `${event} has status message + tracking link`,
        rendered[event].html.includes(ctx.trackingUrl) &&
        rendered[event].text.includes(ctx.trackingUrl)
    );
}

/* ---------- 5. cancellation variants ---------- */

const unpaidOrder = { ...sampleOrder, paymentStatus: "unpaid", transactionReference: undefined, paidAt: null };
const buyerCancel = RENDERERS.cancelled(unpaidOrder, { ...ctx, initiator: "buyer" });
const adminCancel = RENDERERS.cancelled(unpaidOrder, { ...ctx, initiator: "admin" });
const paidCancel = RENDERERS.cancelled(sampleOrder, { ...ctx, initiator: "admin" });

check(
    "buyer cancellation names the buyer + tracking link",
    buyerCancel.html.includes("cancelled by you") &&
    buyerCancel.text.includes(ctx.trackingUrl)
);
check(
    "admin cancellation names the store team, not the buyer",
    adminCancel.html.includes("cancelled by our team") &&
    !adminCancel.html.includes("cancelled by you")
);
check(
    "unpaid cancellation confirms no payment was taken",
    buyerCancel.html.includes("No payment was taken for this order") &&
    !/refund/i.test(buyerCancel.html) &&
    !/refund/i.test(buyerCancel.text)
);
check(
    "paid cancellation directs to the bookstore without claiming a refund",
    paidCancel.html.includes("already paid") &&
    paidCancel.html.includes("contact the bookstore") &&
    !/refund/i.test(paidCancel.html) &&
    !/refund/i.test(paidCancel.text)
);

/* ---------- 6. removed notifications stay removed ---------- */

const es = require("../services/emailService");

check("admin paid-order email export is removed", es.sendAdminPaidOrderEmail === undefined);
check("cancellation email export exists", typeof es.sendOrderCancellationEmail === "function");

let outputsClean = true;
for (const event of EVENTS) {
    const flat = JSON.stringify(rendered[event]);
    if (flat.includes("templateId") || flat.includes("BREVO_TEMPLATE")) {
        outputsClean = false;
    }
}
check("renderer outputs require no hosted template IDs", outputsClean);

const emailServiceSrc = fs.readFileSync(path.join(root, "function", "services", "emailService.js"), "utf8");
check("emailService has no adminPaidOrder references", !emailServiceSrc.includes("adminPaidOrder"));
check("emailService has no processing email references", !emailServiceSrc.includes("STATUS_LABELS") || !/processing:\s*"Processing"/.test(emailServiceSrc));
check("emailService sends code-generated content", emailServiceSrc.includes("htmlContent") && emailServiceSrc.includes("textContent") && emailServiceSrc.includes("subject"));

/* ---------- 7-8. delivery shape via stubbed SDK (no network) ---------- */

async function deliveryTests() {
    const sdkPath = require.resolve("@getbrevo/brevo", { paths: [path.join(root, "function")] });
    const captured = [];
    let failMode = false;

    require.cache[sdkPath] = {
        id: sdkPath,
        filename: sdkPath,
        loaded: true,
        exports: {
            BrevoClient: class {
                constructor(opts) { this.opts = opts; }
                get transactionalEmails() {
                    return {
                        sendTransacEmail: async (payload) => {
                            captured.push(payload);
                            if (failMode) {
                                throw new Error("brevo down");
                            }
                            return { messageId: "test-msg-1" };
                        }
                    };
                }
            }
        }
    };

    process.env.BREVO_API_KEY = "dummy-test-key";
    process.env.BREVO_SENDER_EMAIL = "sender@example.com";

    check(
        "processing email is rejected as unsupported",
        (await es.sendOrderStatusEmail(sampleOrder, "processing")).reason === "unsupported_status"
    );

    const ok = await es.sendPaymentConfirmedEmail(sampleOrder);
    check("successful send returns messageId", ok.sent === true && ok.messageId === "test-msg-1");
    check(
        "customer email uses saved order address",
        captured.length === 1 && captured[0].to[0].email === "ada@example.com"
    );
    check(
        "payload is code-generated (subject+html+text, no templateId)",
        captured[0] && typeof captured[0].subject === "string" &&
        typeof captured[0].htmlContent === "string" && captured[0].htmlContent.includes("<html") &&
        typeof captured[0].textContent === "string" && !("templateId" in captured[0]) &&
        captured[0].sender.email === "sender@example.com"
    );

    const cancel = await es.sendOrderCancellationEmail(unpaidOrder, "buyer");
    check(
        "cancellation email uses the saved customer address",
        cancel.sent === true && captured[1].to[0].email === "ada@example.com" &&
        captured[1].subject.includes("cancelled")
    );

    failMode = true;
    const failed = await es.sendPaymentConfirmedEmail({ ...sampleOrder, id: "AFORDER-FAIL-1" });
    check("API errors resolve (never reject) with send_failed", failed.sent === false && failed.reason === "send_failed");

    const failCancel = await es.sendOrderCancellationEmail({ ...unpaidOrder, id: "AFORDER-FAIL-2" }, "admin");
    check("cancel-email API errors also resolve safely", failCancel.sent === false && failCancel.reason === "send_failed");

    delete process.env.BREVO_API_KEY;
    const disabled = await es.sendOrderReceivedEmail(sampleOrder);
    check("missing config disables sending safely", disabled.sent === false && disabled.reason === "disabled");
}

/* ---------- 9. historical order validity + claim sanity ---------- */

async function modelTests() {
    const Order = require("../models/Order");
    const hist = new Order({
        id: "AF-1787912770485-8492",
        customer: { name: "H", email: "h@x.com", phone: "1" },
        items: [{ bookId: 1, title: "T", author: "A", quantity: 1, price: 100, itemTotal: 100 }],
        subtotal: 100,
        deliveryFee: 2000,
        total: 2100
    });
    const err = await hist.validate().then(() => null).catch(e => e);
    check("historical orders without tracker remain valid", err === null);

    const os = require("../services/orderService");
    let threw = false;
    try {
        await os.claimOrderEmailNotification("x", "bogus-event");
    } catch {
        threw = true;
    }
    check("invalid notification events are rejected", threw);

    let processingRejected = false;
    let adminRejected = false;
    try {
        await os.claimOrderEmailNotification("x", "processing");
    } catch {
        processingRejected = true;
    }
    try {
        await os.claimOrderEmailNotification("x", "adminPaidOrder");
    } catch {
        adminRejected = true;
    }
    check("removed processing/adminPaidOrder events are rejected", processingRejected && adminRejected);

    let cancelledAccepted = true;
    try {
        await os.claimOrderEmailNotification("x", "cancelled");
    } catch {
        cancelledAccepted = false;
    }
    /* Without Mongo this returns {claimed:true,persistent:false}; with
       Mongo and a missing order it returns {claimed:false}. Either way
       it must NOT throw for the valid new event. */
    check("cancelled is a valid claimable event", cancelledAccepted);
    check(
        "claim + stale policy exports intact",
        typeof os.claimOrderEmailNotification === "function" &&
        typeof os.markOrderEmailSent === "function" &&
        typeof os.cancelOrder === "function" &&
        os.EMAIL_CLAIM_STALE_MS === 5 * 60 * 1000
    );
}

(async () => {
    await deliveryTests();
    await modelTests();
    console.log(failures === 0 ? "\nAll email render tests passed." : `\n${failures} check(s) failed.`);
    process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
    console.error("Test harness error:", e && e.message);
    process.exit(1);
});
