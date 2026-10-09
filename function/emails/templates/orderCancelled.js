/* =========================================================
   ORDER CANCELLED EMAIL
   Sent only after a buyer/admin cancellation commits
   via the shared cancelOrder() service. Wording
   distinguishes payment state without ever claiming
   that money was returned: unpaid orders confirm that
   no payment was taken; paid orders direct the customer
   to contact the bookstore about next steps.
========================================================= */

const {
    escapeHtml
} = require("../format");

const {
    baseLayout
} = require("../layouts/baseLayout");

const {
    orderMetaRows,
    itemsTableHtml,
    totalsTableHtml,
    itemsText,
    totalsText
} = require("./_orderBlocks");


const INITIATOR_LABELS = {
    buyer: "cancelled by you",
    admin: "cancelled by our team"
};


function buildOrderCancelledEmail(
    order,
    context = {}
) {

    const orderId =
        String(order?.id || "");

    const customerName =
        String(order?.customer?.name || "Reader");

    const trackingUrl =
        String(context.trackingUrl || "");

    const initiator =
        INITIATOR_LABELS[context.initiator] ||
        "cancelled";

    const paymentStatus =
        order?.paymentStatus || "unpaid";

    const wasPaid =
        paymentStatus === "paid";


    const paymentHtml = wasPaid
        ? `<p style="margin: 0 0 16px 0;">Because this order was already paid, please contact the bookstore so we can arrange next steps for your payment.</p>`
        : `<p style="margin: 0 0 16px 0;">No payment was taken for this order.</p>`;

    const paymentText = wasPaid
        ? `Because this order was already paid, please contact the bookstore so we can arrange next steps for your payment.`
        : `No payment was taken for this order.`;


    const subject =
        `Order cancelled — ${orderId}`;


    const html =
        baseLayout({
            preheader: `Order ${orderId} ${initiator}.`,
            title: subject,
            heading: `Order cancelled.`,
            introHtml: `Hi ${escapeHtml(customerName)} — order <strong>${escapeHtml(orderId)}</strong> was ${escapeHtml(initiator)}.`,
            bodyHtml:
                orderMetaRows(order) +
                paymentHtml +
                itemsTableHtml(order) +
                totalsTableHtml(order),
            ctaUrl: trackingUrl,
            ctaLabel: "Track your order"
        });


    const text = [
        `Hi ${customerName},`,
        ``,
        `Order ${orderId} was ${initiator}.`,
        ``,
        paymentText,
        ``,
        itemsText(order),
        ``,
        totalsText(order),
        ``,
        `Track your order: ${trackingUrl}`
    ].join("\n");


    return { subject, html, text };

}


module.exports = {
    buildOrderCancelledEmail
};
