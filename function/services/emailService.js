/* =========================================================
   EMAIL SERVICE — BREVO TRANSACTIONAL BOUNDARY
   Sole Brevo boundary for the application. Renders
   email content locally (function/emails) and delivers
   it through Brevo's transactional API. No hosted
   Brevo templates are used.
   Controllers call these functions fire-and-forget
   AFTER the authoritative business state commits.
   Email failure NEVER throws and NEVER rolls back
   order/payment/status operations.
========================================================= */

const {
    claimOrderEmailNotification,
    markOrderEmailSent
} = require("./orderService");

const {
    RENDERERS
} = require("../emails");


/* =========================================================
   BREVO CLIENT (LAZY)
========================================================= */

let cachedClient =
    null;

let cachedApiKey =
    null;


function getBrevoClient() {

    const apiKey =
        process.env.BREVO_API_KEY;


    if (
        !apiKey
    ) {

        return null;

    }


    if (
        cachedClient &&
        cachedApiKey === apiKey
    ) {

        return cachedClient;

    }


    const {
        BrevoClient
    } = require("@getbrevo/brevo");


    cachedClient =
        new BrevoClient({
            apiKey: apiKey
        });

    cachedApiKey =
        apiKey;


    return cachedClient;

}


/* =========================================================
   URL CONTEXT (from existing APP_URL configuration)
========================================================= */

function getAppBaseUrl() {

    const raw =
        process.env.APP_URL || "";


    return String(raw)
        .trim()
        .replace(/\/$/, "");

}


function getTrackingUrl(
    order
) {

    const base =
        getAppBaseUrl();

    const encoded =
        encodeURIComponent(
            String(order?.id || "")
        );


    if (
        !base
    ) {

        return `/order-tracking?order=${encoded}`;

    }


    return `${base}/order-tracking?order=${encoded}`;

}


function getStoreUrl() {

    const base =
        getAppBaseUrl();

    return base || "/";

}


function buildContext(
    order,
    extra = {}
) {

    const trackingUrl =
        getTrackingUrl(order);


    return {
        trackingUrl,
        paymentUrl: trackingUrl,
        storeUrl: getStoreUrl(),
        ...extra
    };

}


/* =========================================================
   SAFE ERROR MESSAGE
========================================================= */

function sanitizeErrorMessage(
    error
) {

    const message =
        error?.message ||
        String(error || "Unknown email error");


    return String(message)
        .replace(/[\r\n]+/g, " ")
        .slice(0, 200);

}


/* =========================================================
   CORE DELIVERY
========================================================= */

async function deliverEmail({
    event,
    order,
    toEmail,
    toName,
    context = {}
}) {

    const orderId =
        order?.id
            ? String(order.id)
            : "unknown";


    try {

        /* =============================================
           RECIPIENT CHECK (before claim — avoids
           polluting the tracker when disabled)
        ============================================= */

        if (
            !toEmail ||
            typeof toEmail !== "string" ||
            toEmail.trim() === ""
        ) {

            console.error(
                `[email] event=${event} order=${orderId} disabled (missing recipient)`
            );

            return {
                sent: false,
                reason: "missing_recipient"
            };

        }


        /* =============================================
           RENDERER CHECK
        ============================================= */

        const render =
            RENDERERS[event];


        if (
            typeof render !== "function"
        ) {

            console.error(
                `[email] event=${event} order=${orderId} disabled (missing renderer)`
            );

            return {
                sent: false,
                reason: "disabled"
            };

        }


        /* =============================================
           CONFIG CHECK (before claim)
        ============================================= */

        const client =
            getBrevoClient();

        const senderEmail =
            process.env.BREVO_SENDER_EMAIL;


        if (
            !client ||
            !senderEmail
        ) {

            console.error(
                `[email] event=${event} order=${orderId} disabled (missing configuration)`
            );

            return {
                sent: false,
                reason: "disabled"
            };

        }


        /* =============================================
           ATOMIC CLAIM (after business commit,
           before Brevo request)
        ============================================= */

        const claim =
            await claimOrderEmailNotification(
                orderId,
                event
            );


        if (
            !claim.claimed
        ) {

            return {
                sent: false,
                reason: "already_claimed"
            };

        }


        /* =============================================
           LOCAL RENDER
        ============================================= */

        const rendered =
            render(order, context);


        if (
            !rendered ||
            typeof rendered.subject !== "string" ||
            typeof rendered.html !== "string" ||
            typeof rendered.text !== "string" ||
            rendered.subject.trim() === "" ||
            rendered.html.trim() === "" ||
            rendered.text.trim() === ""
        ) {

            console.error(
                `[email] event=${event} order=${orderId} failed: email rendering produced empty content`
            );

            return {
                sent: false,
                reason: "send_failed"
            };

        }


        /* =============================================
           BREVO REQUEST (code-generated content)
        ============================================= */

        const senderName =
            process.env.BREVO_SENDER_NAME ||
            "A.F. Bookstore";


        const response =
            await client.transactionalEmails.sendTransacEmail({

                sender: {
                    email: senderEmail,
                    name: senderName
                },

                to: [
                    {
                        email: toEmail.trim(),
                        name: (toName || "").trim() || undefined
                    }
                ],

                subject: rendered.subject,

                htmlContent: rendered.html,

                textContent: rendered.text

            });


        const messageId =
            response?.messageId ||
            response?.body?.messageId ||
            response?.data?.messageId ||
            (Array.isArray(response?.messageIds)
                ? response.messageIds[0]
                : undefined) ||
            response?.body?.messageIds?.[0] ||
            null;


        await markOrderEmailSent(
            orderId,
            event,
            messageId
        );


        console.log(
            `[email] event=${event} order=${orderId} sent` +
            (messageId ? ` messageId=${messageId}` : "")
        );


        return {
            sent: true,
            messageId: messageId
        };

    } catch (error) {

        console.error(
            `[email] event=${event} order=${orderId} failed: ` +
            sanitizeErrorMessage(error)
        );


        return {
            sent: false,
            reason: "send_failed"
        };

    }

}


/* =========================================================
   1. ORDER RECEIVED
========================================================= */

async function sendOrderReceivedEmail(
    order
) {

    if (
        !order?.id
    ) {

        return {
            sent: false,
            reason: "missing_order"
        };

    }


    return deliverEmail({

        event: "orderReceived",

        order: order,

        toEmail: order?.customer?.email,

        toName: order?.customer?.name,

        context: buildContext(order)

    });

}


/* =========================================================
   2. PAYMENT CONFIRMED (CUSTOMER)
========================================================= */

async function sendPaymentConfirmedEmail(
    order
) {

    if (
        !order?.id
    ) {

        return {
            sent: false,
            reason: "missing_order"
        };

    }


    return deliverEmail({

        event: "paymentConfirmed",

        order: order,

        toEmail: order?.customer?.email,

        toName: order?.customer?.name,

        context: buildContext(order)

    });

}


/* =========================================================
   3. PAYMENT FAILED
========================================================= */

async function sendPaymentFailedEmail(
    order,
    reason = null
) {

    if (
        !order?.id
    ) {

        return {
            sent: false,
            reason: "missing_order"
        };

    }


    return deliverEmail({

        event: "paymentFailed",

        order: order,

        toEmail: order?.customer?.email,

        toName: order?.customer?.name,

        context: buildContext(
            order,
            { reason }
        )

    });

}


/* =========================================================
   4-5. STATUS EMAILS (shipped / delivered)
========================================================= */

const STATUS_LABELS = {
    shipped: "Shipped",
    delivered: "Delivered"
};


async function sendOrderStatusEmail(
    order,
    status
) {

    if (
        !STATUS_LABELS[status]
    ) {

        return {
            sent: false,
            reason: "unsupported_status"
        };

    }


    if (
        !order?.id
    ) {

        return {
            sent: false,
            reason: "missing_order"
        };

    }


    return deliverEmail({

        event: status,

        order: order,

        toEmail: order?.customer?.email,

        toName: order?.customer?.name,

        context: buildContext(order)

    });

}


/* =========================================================
   6. ORDER CANCELLED
   Sent only after cancelOrder() commits. The initiator
   ("buyer" or "admin") selects the wording. Never sent
   for failed cancellations or idempotent repeats.
========================================================= */

async function sendOrderCancellationEmail(
    order,
    initiator = "buyer"
) {

    if (
        !order?.id
    ) {

        return {
            sent: false,
            reason: "missing_order"
        };

    }


    return deliverEmail({

        event: "cancelled",

        order: order,

        toEmail: order?.customer?.email,

        toName: order?.customer?.name,

        context: buildContext(
            order,
            { initiator }
        )

    });

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    sendOrderReceivedEmail,

    sendPaymentConfirmedEmail,

    sendPaymentFailedEmail,

    sendOrderStatusEmail,

    sendOrderCancellationEmail

};
