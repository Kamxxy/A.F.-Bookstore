/**
 * Payment-vs-cancellation race tests.
 *
 * HOW THEY RUN (read before citing results):
 * - No live MongoDB is used. The Order model, bookService,
 *   paymentService and databaseState are replaced with
 *   in-memory fakes via the require cache, then the REAL
 *   orderService.js functions execute against them.
 * - The fake applies each findOneAndUpdate filter+mutation
 *   synchronously, so Promise.all runs exercise branch
 *   interleavings of the real code but CANNOT prove
 *   MongoDB-level atomicity. Atomicity itself is covered
 *   by static filter-shape assertions below.
 * - No network, no Paystack calls, no emails, no secrets.
 *
 * Run: node function/scripts/payment-cancel-race-test.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const functionDir = path.join(root, "function");
const servicesDir = path.join(functionDir, "services");

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
   MINI FILTER EVALUATOR (supports the operators used by
   the exercised service functions)
========================================================= */

function getPathAll(doc, dotted) {
    let curs = [doc];
    for (const part of dotted.split(".")) {
        const next = [];
        for (const current of curs) {
            if (current === null || current === undefined) {
                continue;
            }
            const value = current[part];
            if (Array.isArray(value)) {
                next.push(...value);
            } else if (value !== undefined) {
                next.push(value);
            }
        }
        curs = next;
    }
    return curs;
}

function isOperatorObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !(value instanceof Date) &&
        !Array.isArray(value) &&
        Object.keys(value).some(key => key.startsWith("$"))
    );
}

function valuesEqual(a, b) {
    if (a instanceof Date || b instanceof Date) {
        return new Date(a).getTime() === new Date(b).getTime();
    }
    return a === b;
}

function matchCondition(values, condition) {
    if (isOperatorObject(condition)) {
        return Object.entries(condition).every(([op, expected]) => {
            if (op === "$ne") {
                return !values.some(value => valuesEqual(value, expected));
            }
            if (op === "$in") {
                return values.some(value => expected.some(item => valuesEqual(value, item)));
            }
            if (op === "$exists") {
                return expected ? values.length > 0 : values.length === 0;
            }
            if (op === "$lt") {
                return values.some(value => value < expected);
            }
            if (op === "$lte") {
                return values.some(value => value <= expected);
            }
            if (op === "$gt") {
                return values.some(value => value > expected);
            }
            if (op === "$gte") {
                return values.some(value => value >= expected);
            }
            throw new Error(`unsupported operator in fake: ${op}`);
        });
    }
    if (condition === null) {
        return values.length === 0 || values.some(value => value === null);
    }
    return values.some(value => valuesEqual(value, condition));
}

function matchFilter(doc, filter) {
    return Object.entries(filter || {}).every(([key, condition]) => {
        if (key === "$or") {
            return condition.some(sub => matchFilter(doc, sub));
        }
        if (key === "$and") {
            return condition.every(sub => matchFilter(doc, sub));
        }
        return matchCondition(getPathAll(doc, key), condition);
    });
}

function setDotted(doc, dotted, value) {
    const parts = dotted.split(".");
    let current = doc;
    for (let i = 0; i < parts.length - 1; i++) {
        if (typeof current[parts[i]] !== "object" || current[parts[i]] === null) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

function clone(value) {
    if (value === undefined || value === null) {
        return value;
    }
    return structuredClone(value);
}

/* =========================================================
   FAKE STORE + MODEL
========================================================= */

const store = new Map();
const stockCalls = [];
const bookStocks = new Map();

/* Write-failure injection: when true, findOneAndUpdate
   throws while reads keep working. Reset by reset(). */
let failUpdates = false;

function fakeQuery(result) {
    return {
        session() {
            return this;
        },
        select() {
            return this;
        },
        async lean() {
            return clone(result);
        }
    };
}

const fakeOrderModel = {
    findOne(filter) {
        for (const doc of store.values()) {
            if (matchFilter(doc, filter)) {
                return fakeQuery(doc);
            }
        }
        return fakeQuery(null);
    },
    findOneAndUpdate(filter, update, options = {}) {
        if (failUpdates) {
            throw new Error("fake write failure");
        }
        let matchedKey = null;
        let matchedDoc = null;
        for (const [key, doc] of store.entries()) {
            if (matchFilter(doc, filter)) {
                matchedKey = key;
                matchedDoc = doc;
                break;
            }
        }
        const before = clone(matchedDoc);
        if (matchedDoc) {
            if (update.$set) {
                for (const [dotted, value] of Object.entries(update.$set)) {
                    setDotted(matchedDoc, dotted, clone(value));
                }
            }
            if (update.$push) {
                for (const [dotted, value] of Object.entries(update.$push)) {
                    const parts = dotted.split(".");
                    let current = matchedDoc;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (typeof current[parts[i]] !== "object" || current[parts[i]] === null) {
                            current[parts[i]] = {};
                        }
                        current = current[parts[i]];
                    }
                    const leaf = parts[parts.length - 1];
                    if (!Array.isArray(current[leaf])) {
                        current[leaf] = [];
                    }
                    current[leaf].push(clone(value));
                }
            }
            if (update.$unset) {
                for (const dotted of Object.keys(update.$unset)) {
                    const parts = dotted.split(".");
                    let current = matchedDoc;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (typeof current[parts[i]] !== "object" || current[parts[i]] === null) {
                            current = null;
                            break;
                        }
                        current = current[parts[i]];
                    }
                    if (current) {
                        delete current[parts[parts.length - 1]];
                    }
                }
            }
            store.set(matchedKey, matchedDoc);
        }
        const result = options.new ? clone(matchedDoc) : before;
        return fakeQuery(result);
    }
};

const fakeBookService = {
    async getBookById(bookId) {
        return { id: Number(bookId), title: "T", stockNumber: bookStocks.get(Number(bookId)) ?? 50 };
    },
    async adjustBookStock(bookId, delta) {
        stockCalls.push({ bookId: Number(bookId), delta: Number(delta) });
        const current = bookStocks.get(Number(bookId)) ?? 50;
        bookStocks.set(Number(bookId), current + Number(delta));
    },
    async updateBook() {
        return null;
    }
};

const fakePaymentService = {
    toKobo(amount) {
        return Math.round(Number(amount) * 100);
    }
};

const fakeDatabaseState = {
    isMongoConnected() {
        return true;
    }
};

function seed(path2, exportsObject) {
    const resolved = require.resolve(path2, { paths: [servicesDir] });
    require.cache[resolved] = {
        id: resolved,
        filename: resolved,
        loaded: true,
        exports: exportsObject
    };
}

seed("../models/Order", fakeOrderModel);
seed("./bookService", fakeBookService);
seed("./paymentService", fakePaymentService);
seed("../config/databaseState", fakeDatabaseState);

const servicePath = path.join(servicesDir, "orderService.js");
delete require.cache[require.resolve(servicePath)];
const os = require(servicePath);

/* =========================================================
   FIXTURES
========================================================= */

const ORDER_ID = "AFORDER-RACE-1";

function seedOrder(overrides = {}) {
    const order = {
        id: ORDER_ID,
        status: "pending",
        paymentStatus: "unpaid",
        paymentMethod: null,
        paidAt: null,
        reservationExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        reservationReleasedAt: null,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        customer: { name: "Racer", email: "racer@example.com", phone: "08000000000" },
        delivery: { address: "1 Test St" },
        items: [{ bookId: 1, title: "T", author: "A", quantity: 2, price: 1000, itemTotal: 2000 }],
        subtotal: 2000,
        deliveryFee: 2000,
        total: 4000,
        currency: "NGN",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
    store.set(ORDER_ID, clone(order));
    bookStocks.set(1, 50);
}

function reset() {
    store.clear();
    stockCalls.length = 0;
    bookStocks.clear();
    failUpdates = false;
}

function payData(reference, source) {
    return {
        reference,
        amount: 400000,
        currency: "NGN",
        channel: "card",
        paidAt: new Date().toISOString(),
        source
    };
}

function restores() {
    return stockCalls.filter(call => call.delta > 0);
}

function current() {
    return clone(store.get(ORDER_ID));
}

/* =========================================================
   SCENARIOS (mocked model, real service code)
========================================================= */

async function scenarioCancelThenCallback() {
    reset();
    seedOrder();

    const cancel = await os.cancelOrder(ORDER_ID, { actor: "buyer", email: "racer@example.com", reason: "changed mind" });
    check("cancel-first: cancellation commits", cancel.status === "cancelled" && cancel.order.status === "cancelled");
    check("cancel-first: stock restored exactly once", restores().length === 1 && restores()[0].delta === 2);

    const pay = await os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R1", "callback"));
    check("cancel-first: late payment is not applied", pay.status === "reservation_expired");
    const doc = current();
    check("cancel-first: order stays cancelled+unpaid", doc.status === "cancelled" && doc.paymentStatus === "unpaid");
    check("cancel-first: no resurrection, no reference overwrite", doc.transactionReference === undefined);
    check(
        "cancel-first: payment evidence recorded once",
        Array.isArray(doc.latePayments) && doc.latePayments.length === 1 &&
        doc.latePayments[0].reference === "AFPAY-R1" && doc.latePayments[0].amount === 400000 &&
        doc.latePayments[0].source === "callback" && doc.latePayments[0].receivedAt instanceof Date
    );
    check("cancel-first: late path restores no further stock", restores().length === 1);

    const again = await os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R1", "webhook"));
    check("cancel-first: duplicate callback+webhook deduplicated", again.status === "reservation_expired");
    check("cancel-first: evidence entry not duplicated", current().latePayments.length === 1);

    const second = await os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R2", "webhook"));
    check("cancel-first: second distinct payment also preserved", second.status === "reservation_expired");
    const refs = current().latePayments.map(entry => entry.reference).sort();
    check(
        "cancel-first: both references inspectable, stock untouched",
        refs.join(",") === "AFPAY-R1,AFPAY-R2" && restores().length === 1
    );
}

async function scenarioPayThenCancel() {
    reset();
    seedOrder();

    const pay = await os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R1", "callback"));
    check("pay-first: payment commits", pay.status === "paid");

    const cancel = await os.cancelOrder(ORDER_ID, { actor: "buyer", email: "racer@example.com" });
    const doc = current();
    check("pay-first: paid cancellation keeps payment state", cancel.status === "cancelled" && doc.paymentStatus === "paid");
    check("pay-first: reference preserved, no evidence array", doc.transactionReference === "AFPAY-R1" && doc.latePayments === undefined);
    check("pay-first: no stock restoration on paid cancel", restores().length === 0);

    const dup = await os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R1", "webhook"));
    check("pay-first: same-ref webhook is already_paid", dup.status === "already_paid" && current().latePayments === undefined);
}

async function scenarioConcurrent() {
    for (const payFirst of [true, false]) {
        reset();
        seedOrder();
        const payPromise = os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R1", "callback"));
        const cancelPromise = os.cancelOrder(ORDER_ID, { actor: "buyer", email: "racer@example.com" });
        const [paySettled, cancelSettled] = payFirst
            ? await Promise.allSettled([payPromise, cancelPromise])
            : await Promise.allSettled([cancelPromise, payPromise]);

        const doc = current();
        const label = payFirst ? "pay-called-first" : "cancel-called-first";
        check(`${label}: order never resurrected`, doc.status === "cancelled");
        check(`${label}: stock restored at most once`, restores().length <= 1);
        const paidOutcome = doc.paymentStatus === "paid" && doc.transactionReference === "AFPAY-R1" && !doc.latePayments;
        const evidenceOutcome =
            doc.paymentStatus === "unpaid" &&
            Array.isArray(doc.latePayments) && doc.latePayments.length === 1 &&
            doc.latePayments[0].reference === "AFPAY-R1";
        check(`${label}: exactly one coherent outcome (paid OR evidenced)`, paidOutcome !== evidenceOutcome);
        void paySettled;
        void cancelSettled;
    }
}

/* Cancel commits in the exact gap between markOrderAsPaid's
   CASE-A read and its atomic update. Exercises the real
   losing-payment path (re-read → record → throw). */
async function scenarioCancelWinsRace() {
    reset();
    seedOrder();

    const realFindOneAndUpdate = fakeOrderModel.findOneAndUpdate;
    let intercepted = false;
    fakeOrderModel.findOneAndUpdate = function (filter, update, options) {
        if (
            !intercepted &&
            update && update.$set &&
            update.$set.paymentStatus === "paid"
        ) {
            intercepted = true;
            const doc = store.get(ORDER_ID);
            doc.status = "cancelled";
            doc.cancelledAt = new Date();
            doc.cancelledBy = "buyer";
            doc.reservationReleasedAt = new Date();
            doc.updatedAt = new Date();
        }
        return realFindOneAndUpdate.call(this, filter, update, options);
    };

    let threw = false;
    try {
        await os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R1", "callback"));
    } catch (error) {
        threw = error.message === "Unable to update order payment status.";
    } finally {
        fakeOrderModel.findOneAndUpdate = realFindOneAndUpdate;
    }

    const doc = current();
    check("race: losing payment fails closed", threw && intercepted);
    check("race: order stays cancelled+unpaid", doc.status === "cancelled" && doc.paymentStatus !== "paid");
    check(
        "race: evidence recorded on the losing path",
        Array.isArray(doc.latePayments) && doc.latePayments.length === 1 &&
        doc.latePayments[0].reference === "AFPAY-R1"
    );
    check("race: no stock movement on the losing path", stockCalls.length === 0);
}

async function scenarioExpiryThenPay() {    reset();
    seedOrder({ reservationExpiresAt: new Date(Date.now() - 60 * 1000) });

    const expired = await os.expireOrderReservation(ORDER_ID);
    check("expiry: reservation expires with system metadata", expired && expired.status === "cancelled" && expired.cancelledBy === "system");
    check("expiry: stock restored once", restores().length === 1);

    const pay = await os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R1", "webhook"));
    const doc = current();
    check("expiry: late payment not applied", pay.status === "reservation_expired" && doc.paymentStatus === "unpaid");
    check(
        "expiry: late evidence recorded, no double restore",
        doc.latePayments.length === 1 && doc.latePayments[0].reference === "AFPAY-R1" && restores().length === 1
    );
}

async function scenarioFailedThenCancel() {
    reset();
    seedOrder();

    await os.markPaymentFailed(ORDER_ID);
    check("failed-then-cancel: failure releases reservation once", restores().length === 1);

    const cancel = await os.cancelOrder(ORDER_ID, { actor: "buyer", email: "racer@example.com" });
    const doc = current();
    check(
        "failed-then-cancel: cancel commits without second restore",
        cancel.status === "cancelled" && doc.status === "cancelled" && restores().length === 1
    );
}

async function scenarioPaidAdminCancelThenWebhook() {
    reset();
    seedOrder();

    await os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R1", "callback"));
    const cancel = await os.cancelOrder(ORDER_ID, { actor: "admin", reason: "duplicate" });
    check("admin paid cancel preserves paid state", cancel.status === "cancelled" && current().paymentStatus === "paid");
    check("admin paid cancel restores no stock", restores().length === 0);

    const dup = await os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R1", "webhook"));
    check("admin paid cancel: same-ref webhook already_paid, no evidence", dup.status === "already_paid" && current().latePayments === undefined);
}

async function scenarioEvidenceUnit() {
    reset();
    seedOrder();

    const first = await os.recordLatePayment(ORDER_ID, {
        reference: "AFPAY-E1", amount: 400000, channel: "card",
        paidAt: new Date().toISOString(), source: "webhook"
    });
    check("record: first write persists with recorded status", first.status === "recorded");

    const second = await os.recordLatePayment(ORDER_ID, {
        reference: "AFPAY-E1", amount: 400000, channel: "card",
        paidAt: new Date().toISOString(), source: "callback"
    });
    check(
        "record: sequential duplicate is already_recorded, single entry",
        second.status === "already_recorded" && current().latePayments.length === 1
    );

    const third = await os.recordLatePayment(ORDER_ID, {
        reference: "AFPAY-E2", amount: 400000, channel: "transfer",
        paidAt: new Date().toISOString(), source: "webhook"
    });
    check(
        "record: distinct reference appends",
        third.status === "recorded" && current().latePayments.length === 2
    );
    check(
        "record: touches no status, payment state, or stock",
        current().status === "pending" && current().paymentStatus === "unpaid" &&
        stockCalls.length === 0
    );

    const missing = await os.recordLatePayment("AFORDER-NOPE", {
        reference: "AFPAY-E9", amount: 1, channel: "card", paidAt: null, source: "callback"
    });
    check("record: missing order reports failed", missing.status === "failed");

    const invalid = await os.recordLatePayment(ORDER_ID, { amount: 1 });
    check("record: invalid reference reports failed", invalid.status === "failed");
}

async function scenarioEvidenceWriteFailure() {
    reset();
    seedOrder();

    await os.cancelOrder(ORDER_ID, { actor: "buyer", email: "racer@example.com" });
    check("write-fail: precondition cancelled", current().status === "cancelled");

    failUpdates = true;
    const pay = await os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R1", "callback"));
    failUpdates = false;

    check(
        "write-fail: payment still not applied, outcome flagged",
        pay.status === "reservation_expired" && pay.evidence === "failed"
    );
    const doc = current();
    check(
        "write-fail: no state mutation, no stock movement, no phantom evidence",
        doc.status === "cancelled" && doc.paymentStatus === "unpaid" &&
        doc.latePayments === undefined && stockCalls.length === 1
    );

    const retry = await os.markOrderAsPaid(ORDER_ID, payData("AFPAY-R1", "webhook"));
    check(
        "write-fail: retry after recovery persists evidence",
        retry.status === "reservation_expired" && retry.evidence === "recorded" &&
        current().latePayments.length === 1
    );
}

async function scenarioConcurrentRecords() {
    /* The in-memory fake applies each update synchronously, so this
       cannot establish real MongoDB concurrency behaviour (see report).
       It verifies the only guarantee the fake can show: evidence is
       preserved at least once with no side effects. */
    reset();
    seedOrder();
    await os.cancelOrder(ORDER_ID, { actor: "buyer", email: "racer@example.com" });

    await Promise.all([
        os.recordLatePayment(ORDER_ID, { reference: "AFPAY-R1", amount: 400000, channel: "card", paidAt: null, source: "callback" }),
        os.recordLatePayment(ORDER_ID, { reference: "AFPAY-R1", amount: 400000, channel: "card", paidAt: null, source: "webhook" })
    ]);

    const entries = current().latePayments || [];
    check(
        "concurrent: evidence preserved with no state or stock effects",
        entries.length >= 1 && entries.every(entry => entry.reference === "AFPAY-R1") &&
        current().status === "cancelled" && stockCalls.length === 1
    );
}

/* =========================================================
   STATIC GUARANTEES
========================================================= */

function staticTests() {
    const serviceSrc = fs.readFileSync(path.join(servicesDir, "orderService.js"), "utf8");
    const orderSrc = fs.readFileSync(path.join(functionDir, "models", "Order.js"), "utf8");
    const paymentSrc = fs.readFileSync(path.join(functionDir, "controllers", "paymentController.js"), "utf8");

    check(
        "latePayments tracker is optional on the schema",
        orderSrc.includes("latePayments: {") && orderSrc.includes("latePaymentSchema") &&
        orderSrc.includes("reference: {")
    );
    check(
        "evidence write is push-only and reference-idempotent",
        serviceSrc.includes("async function recordLatePayment") &&
        serviceSrc.includes("$push") &&
        serviceSrc.includes('"latePayments.reference"')
    );
    const recordSlice = serviceSrc.slice(
        serviceSrc.indexOf("async function recordLatePayment"),
        serviceSrc.indexOf("MARK ORDER AS PAID")
    );
    check("evidence write touches no fulfilment/payment state", !recordSlice.includes("$set"));
    check("expired-reservation path records evidence", serviceSrc.includes("await recordLatePayment("));
    check(
        "both payment entry points tag evidence source",
        paymentSrc.includes('source: "callback"') && paymentSrc.includes('source: "webhook"')
    );
    const publicSlice = serviceSrc.slice(
        serviceSrc.indexOf("async function getPublicOrderById"),
        serviceSrc.indexOf("const EMAIL_NOTIFICATION_EVENTS")
    );
    check("public tracking view exposes no late-payment evidence", !publicSlice.includes("latePayments"));
}

/* ========================================================= */

(async () => {
    await scenarioCancelThenCallback();
    await scenarioPayThenCancel();
    await scenarioConcurrent();
    await scenarioCancelWinsRace();
    await scenarioExpiryThenPay();
    await scenarioFailedThenCancel();
    await scenarioPaidAdminCancelThenWebhook();
    await scenarioEvidenceUnit();
    await scenarioEvidenceWriteFailure();
    await scenarioConcurrentRecords();
    staticTests();
    console.log(failures === 0 ? "\nAll payment/cancellation race tests passed." : `\n${failures} check(s) failed.`);
    process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
    console.error("Test harness error:", e && e.message);
    process.exit(1);
});
