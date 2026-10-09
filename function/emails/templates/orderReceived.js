/* =========================================================
   ORDER RECEIVED EMAIL
   Sent after an order is successfully persisted,
   before Paystack initialization. Links to the
   tracking page, where payment can be continued.
========================================================= */

const {
    escapeHtml,
    formatDateTime
} = require("../format");

const {
    baseLayout
} = require("../layouts/baseLayout");

const {
    orderMetaRows,
    itemsTableHtml,
    totalsTableHtml,
    addressBlockHtml,
    itemsText,
    totalsText,
    addressText
} = require("./_orderBlocks");


function buildOrderReceivedEmail(
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

    const reservation =
        formatDateTime(order?.reservationExpiresAt);

    const reservationHtml =
        reservation
            ? `<p style="margin: 0 0 16px 0;">Your books are reserved until <strong>${escapeHtml(reservation)}</strong>. Please complete payment before then so your order can proceed.</p>`
            : "";

    const reservationText =
        reservation
            ? `Your books are reserved until ${reservation}. Please complete payment before then.\n\n`
            : "";


    const subject =
        `Order received — ${orderId}`;


    const html =
        baseLayout({
            preheader: `Order ${orderId} received. Complete payment to confirm your books.`,
            title: subject,
            heading: `Thank you, ${escapeHtml(customerName)}.`,
            introHtml: `Your order <strong>${escapeHtml(orderId)}</strong> has been received and is awaiting payment.`,
            bodyHtml:
                orderMetaRows(order) +
                reservationHtml +
                itemsTableHtml(order) +
                totalsTableHtml(order) +
                addressBlockHtml(order),
            ctaUrl: paymentUrl,
            ctaLabel: "Track order & continue payment"
        });


    const parts = [
        `Hi ${customerName},`,
        ``,
        `Your order ${orderId} has been received and is awaiting payment.`,
        ``,
        reservationText,
        itemsText(order),
        ``,
        totalsText(order),
        ``,
        addressText(order),
        addressText(order) ? `` : null,
        `Track your order and continue payment: ${trackingUrl}`
    ].filter(part => part !== null);

    const text =
        parts.join("\n");


    return { subject, html, text };

}


module.exports = {
    buildOrderReceivedEmail
};
