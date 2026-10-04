const {
    getOrderById,
    markOrderAsPaid,
    markPaymentFailed,
    prepareOrderForPayment
} = require("../services/orderService");

const {
    initializePayment,
    verifyPayment,
    verifyWebhookSignature,
    toKobo
} = require("../services/paymentService");

/* =========================================================
   HELPER — VALIDATE VERIFIED TRANSACTION
   Shared between callback and webhook handlers.
   Returns { valid, order, reason }.
========================================================= */

async function validateVerifiedTransaction(
    verified
) {

    /* =====================================================
       STATUS
    ===================================================== */

    if (
        verified.status !== "success"
    ) {

        return {
            valid: false,
            reason: "Transaction was not successful."
        };

    }

    /* =====================================================
       CURRENCY
    ===================================================== */

    if (
        verified.currency !== "NGN"
    ) {

        return {
            valid: false,
            reason: "Transaction currency mismatch."
        };

    }

    /* =====================================================
       METADATA — ORDER ID
    ===================================================== */

    const orderId =
        verified.metadata?.orderId;

    if (
        !orderId
    ) {

        return {
            valid: false,
            reason: "Transaction metadata missing order ID."
        };

    }

    /* =====================================================
       LOCAL ORDER
    ===================================================== */

    const order =
        await getOrderById(
            orderId
        );

    if (
        !order
    ) {

        return {
            valid: false,
            reason: "Order not found."
        };

    }

    /* =====================================================
       AMOUNT
    ===================================================== */

    const expectedKobo =
        toKobo(order.total);

    if (
        verified.amount !== expectedKobo
    ) {

        return {
            valid: false,
            reason: "Transaction amount mismatch."
        };

    }

    return {
        valid: true,
        order: order
    };

}

/* =========================================================
   INITIALIZE PAYMENT
   POST /api/payments/initialize
========================================================= */

async function initialize(
    req,
    res
) {

    try {

        const {
            orderId,
            email
        } = req.body;

        /* =================================================
           INPUT VALIDATION
        ================================================= */

        if (
            !orderId
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Order ID is required"

            });

        }

        if (
            !email
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Customer email is required"

            });

        }

        /* =================================================
           LOOKUP ORDER
        ================================================= */

        const order =
            await getOrderById(
                orderId
            );

        if (
            !order
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

            });

        }

        /* =================================================
           OWNERSHIP CHECK
           Verify the supplied email matches the order's
           stored customer email.
        ================================================= */

        if (
            order.customer.email.toLowerCase() !==
            String(email).toLowerCase()
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Email does not match this order"

            });

        }

        /* =================================================
           PREVENT RE-INITIALIZATION OF PAID ORDERS
        ================================================= */

        if (
            order.paymentStatus === "paid"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This order has already been paid"

            });

        }

        /* =================================================
           RESERVATION WINDOW ENFORCEMENT
           - unpaid + active reservation → proceed
           - unpaid + expired reservation → reject,
             release stock, cancel order
           - failed → re-reserve stock on the SAME
             order, then allow a fresh payment attempt
        ================================================= */

        let payableOrder;

        try {

            payableOrder =
                await prepareOrderForPayment(
                    orderId
                );

        } catch (prepError) {

            const statusCode =
                prepError.code === "reservation_expired"
                    ? 410
                    : prepError.code === "stock_unavailable"
                        ? 409
                        : prepError.code === "already_paid"
                            ? 400
                            : 500;

            return res.status(statusCode).json({

                success: false,

                code:
                    prepError.code ||
                    "payment_unavailable",

                message:
                    prepError.message

            });

        }

        /* =================================================
           INITIALIZE PAYSTACK
        ================================================= */

        const payment =
            await initializePayment(
                payableOrder
            );

        /* =================================================
           RESPONSE
        ================================================= */

        return res.json({

            success: true,

            data: {
                authorization_url:
                    payment.authorization_url,

                reference:
                    payment.reference
            }

        });

    }
    catch (error) {

        console.error(
            "Payment initialization error:",
            error.message
        );

        const statusCode =
            error.message?.includes("temporarily unavailable")
                ? 503
                : 400;

        return res.status(statusCode).json({

            success: false,

            message:
                error.message ||
                "Unable to initialize payment"

        });

    }

}

/* =========================================================
   PAYSTACK CALLBACK
   GET /api/payments/callback
========================================================= */

async function handleCallback(
    req,
    res
) {

    try {

        const {
            reference
        } = req.query;

        /* =================================================
           REFERENCE VALIDATION
        ================================================= */

        if (
            !reference
        ) {

            return res.redirect(
                "/payment-failed"
            );

        }

        /* =================================================
           VERIFY WITH PAYSTACK
        ================================================= */

        const verified =
            await verifyPayment(
                reference
            );

        /* =================================================
           HANDLE DEFINITIVE PAYSTACK FAILURE
           Only mark as failed if Paystack definitively
           reports status === "failed" AND the transaction
           belongs to this order with valid amount/currency.
        ================================================= */

        if (
            verified.status === "failed"
        ) {

            const failureResult =
                await validateVerifiedTransaction(
                    {
                        ...verified,
                        status: "success"
                    }
                );

            if (
                failureResult.valid
            ) {

                await markPaymentFailed(
                    failureResult.order.id
                );

                console.log(
                    `Payment marked as failed for order ${failureResult.order.id}`
                );

                return res.redirect(
                    `/payment-failed?reason=payment_failed&order=${failureResult.order.id}`
                );

            }

            return res.redirect(
                "/payment-failed?reason=payment_failed"
            );

        }

        /* =================================================
           VALIDATE TRANSACTION
        ================================================= */

        const result =
            await validateVerifiedTransaction(
                verified
            );

        if (
            !result.valid
        ) {

            console.error(
                "Callback validation failed:",
                result.reason
            );

            return res.redirect(
                "/payment-failed"
            );

        }

        /* =================================================
           MARK ORDER AS PAID
        ================================================= */

        const paymentResult =
            await markOrderAsPaid(
                result.order.id,
                {
                    reference: verified.reference,
                    amount: verified.amount,
                    currency: verified.currency,
                    channel: verified.channel,
                    paidAt: verified.paid_at
                }
            );

        if (
            paymentResult.status === "duplicate_paid"
        ) {

            console.error(
                `Duplicate payment detected for order ${result.order.id}. ` +
                `Existing: ${paymentResult.order.transactionReference}. ` +
                `New: ${verified.reference}. Manual review required.`
            );

        }

        if (
            paymentResult.status === "reservation_expired"
        ) {

            return res.redirect(
                `/payment-failed?reason=reservation_expired&order=${result.order.id}`
            );

        }

        /* =================================================
           SUCCESS — REDIRECT
           Order ID comes from verified Paystack metadata,
           NOT from the query string.
        ================================================= */

        return res.redirect(
            `/order-success?order=${result.order.id}`
        );

    }
    catch (error) {

        console.error(
            "Payment callback error:",
            error.message
        );

        return res.redirect(
            "/payment-failed"
        );

    }

}

/* =========================================================
   PAYSTACK WEBHOOK
   POST /api/payments/webhook
========================================================= */

async function handleWebhook(
    req,
    res
) {

    try {

        /* =================================================
           RAW BODY + SIGNATURE
        ================================================= */

        const rawBody =
            req.rawBody;

        const signature =
            req.headers["x-paystack-signature"];

        if (
            !rawBody
        ) {

            console.error(
                "Webhook missing raw body"
            );

            return res.status(400).json({
                success: false,
                message: "Missing request body"
            });

        }

        /* =================================================
           SIGNATURE VERIFICATION
        ================================================= */

        const isValid =
            verifyWebhookSignature(
                rawBody,
                signature
            );

        if (
            !isValid
        ) {

            console.error(
                "Webhook signature verification failed"
            );

            return res.status(401).json({
                success: false,
                message: "Invalid signature"
            });

        }

        /* =================================================
           PARSE EVENT
        ================================================= */

        let event;

        try {

            event =
                JSON.parse(
                    rawBody.toString()
                );

        }
        catch (parseError) {

            console.error(
                "Webhook JSON parse error:",
                parseError.message
            );

            return res.status(400).json({
                success: false,
                message: "Invalid JSON"
            });

        }

        /* =================================================
           EVENT TYPE CHECK
        ================================================= */

        if (
            event.event !== "charge.success"
        ) {

            console.log(
                `Unhandled Paystack event: ${event.event}`
            );

            return res.status(200).json({
                received: true
            });

        }

        /* =================================================
           EXTRACT REFERENCE
        ================================================= */

        const reference =
            event.data?.reference;

        if (
            !reference
        ) {

            console.error(
                "Webhook missing reference"
            );

            return res.status(400).json({
                success: false,
                message: "Missing reference"
            });

        }

        /* =================================================
           VERIFY TRANSACTION WITH PAYSTACK
        ================================================= */

        const verified =
            await verifyPayment(
                reference
            );

        /* =================================================
           VALIDATE TRANSACTION
        ================================================= */

        const result =
            await validateVerifiedTransaction(
                verified
            );

        if (
            !result.valid
        ) {

            console.error(
                "Webhook validation failed:",
                result.reason
            );

            return res.status(400).json({
                success: false,
                message: result.reason
            });

        }

        /* =================================================
           MARK ORDER AS PAID
        ================================================= */

        const paymentResult =
            await markOrderAsPaid(
                result.order.id,
                {
                    reference: verified.reference,
                    amount: verified.amount,
                    currency: verified.currency,
                    channel: verified.channel,
                    paidAt: verified.paid_at
                }
            );

        if (
            paymentResult.status === "duplicate_paid"
        ) {

            console.error(
                `Duplicate payment detected for order ${result.order.id}. ` +
                `Existing: ${paymentResult.order.transactionReference}. ` +
                `New: ${verified.reference}. Manual review required.`
            );

        }

        if (
            paymentResult.status === "reservation_expired"
        ) {

            console.error(
                `Webhook: payment success arrived for order ${result.order.id} ` +
                `after reservation expiry (reference ${verified.reference}). ` +
                `NOT marked paid. Manual review/refund required.`
            );

        }

        /* =================================================
           SUCCESS
        ================================================= */

        return res.status(200).json({
            received: true
        });

    }
    catch (error) {

        console.error(
            "Webhook processing error:",
            error.message
        );

        return res.status(503).json({
            success: false,
            message: "Webhook processing failed"
        });

    }

}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    initialize,
    handleCallback,
    handleWebhook
};
