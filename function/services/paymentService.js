const crypto = require("crypto");

const {
    isMongoConnected
} = require("../config/databaseState");

/* =========================================================
   PAYSTACK API BASE URL
========================================================= */

const PAYSTACK_API_BASE =
    "https://api.paystack.co";

/* =========================================================
   REQUEST TIMEOUT
========================================================= */

const REQUEST_TIMEOUT_MS =
    15000;

/* =========================================================
   INTERNAL HELPER — MONGO AVAILABILITY
========================================================= */

function assertMongoAvailable() {

    if (
        !isMongoConnected()
    ) {

        throw new Error(
            "Payment processing is temporarily unavailable. Please try again later."
        );

    }

}

/* =========================================================
   INTERNAL HELPER — SECRET KEY
========================================================= */

function getPaystackSecret() {

    const secret =
        process.env.PAYSTACK_SECRET_KEY;

    if (
        !secret
    ) {

        throw new Error(
            "Payment service is not configured."
        );

    }

    return secret;

}

/* =========================================================
   INTERNAL HELPER — AMOUNT CONVERSION
   NGN → kobo
========================================================= */

function toKobo(amount) {

    const numeric =
        Number(amount);

    if (
        !Number.isFinite(numeric)
    ) {

        throw new Error(
            "Invalid payment amount."
        );

    }

    if (
        numeric < 0
    ) {

        throw new Error(
            "Payment amount cannot be negative."
        );

    }

    return Math.round(
        numeric * 100
    );

}

/* =========================================================
   INTERNAL HELPER — REFERENCE GENERATION
========================================================= */

function generateReference() {

    const timestamp =
        Date.now();

    const random =
        Math.floor(
            1000 +
            Math.random() * 9000
        );

    return `AFPAY-${timestamp}-${random}`;

}

/* =========================================================
   INTERNAL HELPER — REFERENCE VALIDATION
========================================================= */

function isValidReference(reference) {

    if (
        typeof reference !== "string" ||
        reference.length === 0
    ) {

        return false;

    }

    return /^AFPAY-\d+-\d+$/.test(
        reference
    );

}

/* =========================================================
   INTERNAL HELPER — METADATA NORMALIZATION
========================================================= */

function normalizeMetadata(metadata) {

    if (
        metadata == null
    ) {

        return {};

    }

    if (
        typeof metadata === "object"
    ) {

        return metadata;

    }

    if (
        typeof metadata === "string"
    ) {

        try {

            const parsed =
                JSON.parse(metadata);

            if (
                parsed &&
                typeof parsed === "object"
            ) {

                return parsed;

            }

            return {};

        } catch {

            return {};

        }

    }

    return {};

}

/* =========================================================
   INTERNAL HELPER — HTTP REQUEST WITH TIMEOUT
========================================================= */

async function paystackRequest(
    method,
    path,
    body = null
) {

    const secret =
        getPaystackSecret();

    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT_MS
        );

    try {

        const options = {
            method,
            headers: {
                "Authorization": `Bearer ${secret}`,
                "Content-Type": "application/json"
            },
            signal: controller.signal
        };

        if (
            body !== null
        ) {

            options.body =
                JSON.stringify(body);

        }

        const response =
            await fetch(
                `${PAYSTACK_API_BASE}${path}`,
                options
            );

        const data =
            await response.json().catch(
                () => null
            );

        if (
            !response.ok
        ) {

            const message =
                data?.message ||
                `Paystack request failed with status ${response.status}`;

            throw new Error(message);

        }

        return data;

    } catch (error) {

        if (
            error.name === "AbortError"
        ) {

            throw new Error(
                "Payment verification timed out. Please try again."
            );

        }

        throw error;

    } finally {

        clearTimeout(timeoutId);

    }

}

/* =========================================================
   INITIALIZE PAYMENT
========================================================= */

async function initializePayment(
    order
) {

    assertMongoAvailable();

    if (
        !order
    ) {

        throw new Error(
            "Order is required to initialize payment."
        );

    }

    if (
        !order.customer?.email
    ) {

        throw new Error(
            "Customer email is required to initialize payment."
        );

    }

    if (
        !order.total
    ) {

        throw new Error(
            "Order total is required to initialize payment."
        );

    }

    const amountKobo =
        toKobo(order.total);

    const reference =
        generateReference();

    const callbackUrl =
        `${process.env.APP_URL}/api/payments/callback`;

    const payload = {
        email: order.customer.email,
        amount: amountKobo,
        currency: "NGN",
        reference: reference,
        callback_url: callbackUrl,
        metadata: JSON.stringify(
            {
                orderId: order.id
            }
        )
    };

    const result =
        await paystackRequest(
            "POST",
            "/transaction/initialize",
            payload
        );

    const authorizationUrl =
        result?.data?.authorization_url;

    if (
        !authorizationUrl
    ) {

        throw new Error(
            "Payment initialization failed. Please try again."
        );

    }

    return {
        authorization_url: authorizationUrl,
        reference: reference
    };

}

/* =========================================================
   VERIFY PAYMENT
========================================================= */

async function verifyPayment(
    reference
) {

    assertMongoAvailable();

    if (
        !isValidReference(reference)
    ) {

        throw new Error(
            "Invalid payment reference."
        );

    }

    const encodedReference =
        encodeURIComponent(reference);

    const result =
        await paystackRequest(
            "GET",
            `/transaction/verify/${encodedReference}`
        );

    const data =
        result?.data;

    if (
        !data
    ) {

        throw new Error(
            "Payment verification returned an unexpected response."
        );

    }

    const metadata =
        normalizeMetadata(data.metadata);

    return {
        reference: data.reference,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        paid_at: data.paid_at,
        channel: data.channel,
        metadata: metadata
    };

}

/* =========================================================
   VERIFY WEBHOOK SIGNATURE
========================================================= */

function verifyWebhookSignature(
    rawBody,
    signature
) {

    if (
        !signature ||
        typeof signature !== "string"
    ) {

        return false;

    }

    if (
        !rawBody
    ) {

        return false;

    }

    const secret =
        process.env.PAYSTACK_SECRET_KEY;

    if (
        !secret
    ) {

        return false;

    }

    const hash =
        crypto
            .createHmac(
                "sha512",
                secret
            )
            .update(rawBody)
            .digest("hex");

    const hashBuffer =
        Buffer.from(hash, "utf8");

    const signatureBuffer =
        Buffer.from(signature, "utf8");

    if (
        hashBuffer.length !==
        signatureBuffer.length
    ) {

        return false;

    }

    return crypto.timingSafeEqual(
        hashBuffer,
        signatureBuffer
    );

}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    initializePayment,
    verifyPayment,
    verifyWebhookSignature,
    assertMongoAvailable,

    /*
     * Shared payment utility — NGN to kobo conversion.
     * Exported for use by controllers that need to validate
     * Paystack amounts against local order totals.
     */
    toKobo
};
