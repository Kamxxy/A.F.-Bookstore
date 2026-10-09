/* =========================================================
   PAYMENT FAILED EMAIL
   Sent only after the definitive failure path commits.
   States that the payment was unsuccessful and offers
   a retry link. Makes no refund or deduction claims.
========================================================= */

const {
    escapeHtml
} = require("../format");

const {
    baseLayout
} = require("../layouts/baseLayout");

const {
    orderMetaRows,
    totalsTableHtml,
    totalsText
} = require("./_orderBlocks");


function buildPaymentFailedEmail(
    order,
    context = {}
) {

    const orderId =
        String(order?.id || "");

    const customerName =
        String(order?.customer?.name || "Reader");

    const trackingUrl =
        String(context.trackingUrl || "");

    const paymentUrl =
        String(context.paymentUrl || trackingUrl);


    const subject =
        `Payment unsuccessful — ${orderId}`;


    const html =
        baseLayout({
            preheader: `Your payment for order ${orderId} was not successful. You can try again.`,
            title: subject,
            heading: `Payment unsuccessful.`,
            introHtml: `Hi ${escapeHtml(customerName)} — your payment for order <strong>${escapeHtml(orderId)}</strong> was not successful, so the order has not been confirmed.`,
            bodyHtml:
                orderMetaRows(order) +
                totalsTableHtml(order) +
                `<p style="margin: 16px 0 0 0;">You can try again using the same order. Your books will be re-reserved when you retry.</p>`,
            ctaUrl: paymentUrl,
            ctaLabel: "Try payment again"
        });


    const text = [
        `Hi ${customerName},`,
        ``,
        `Your payment for order ${orderId} was not successful, so the order has not been confirmed.`,
        ``,
        totalsText(order),
        ``,
        `You can try again using the same order: ${paymentUrl}`,
        `Track your order: ${trackingUrl}`
    ].join("\n");


    return { subject, html, text };

}


module.exports = {
    buildPaymentFailedEmail
};
