/* =========================================================
   PAYMENT CONFIRMED EMAIL
   Sent only after markOrderAsPaid() commits with
   status === "paid". Uses the saved transaction
   reference and payment timestamp.
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


function buildPaymentConfirmedEmail(
    order,
    context = {}
) {

    const orderId =
        String(order?.id || "");

    const customerName =
        String(order?.customer?.name || "Reader");

    const reference =
        String(order?.transactionReference || "");

    const paidAt =
        formatDateTime(order?.paidAt);

    const trackingUrl =
        String(context.trackingUrl || "");


    const referenceHtml =
        reference
            ? `<p style="margin: 0 0 8px 0;">Payment reference: <strong>${escapeHtml(reference)}</strong></p>`
            : "";

    const paidAtHtml =
        paidAt
            ? `<p style="margin: 0 0 16px 0;">Paid on: <strong>${escapeHtml(paidAt)}</strong></p>`
            : "";

    const referenceText =
        reference
            ? `Payment reference: ${reference}\n`
            : "";

    const paidAtText =
        paidAt
            ? `Paid on: ${paidAt}\n`
            : "";


    const subject =
        `Payment confirmed — ${orderId}`;


    const html =
        baseLayout({
            preheader: `Payment confirmed for order ${orderId}.`,
            title: subject,
            heading: `Payment confirmed, ${escapeHtml(customerName)}.`,
            introHtml: `Your payment for order <strong>${escapeHtml(orderId)}</strong> was successful. We are getting your books ready.`,
            bodyHtml:
                orderMetaRows(order) +
                referenceHtml +
                paidAtHtml +
                itemsTableHtml(order) +
                totalsTableHtml(order) +
                addressBlockHtml(order),
            ctaUrl: trackingUrl,
            ctaLabel: "Track your order"
        });


    const lines = [
        `Hi ${customerName},`,
        ``,
        `Your payment for order ${orderId} was successful. We are getting your books ready.`,
        ``,
        referenceText,
        paidAtText,
        paidAtText || referenceText ? `` : null,
        itemsText(order),
        ``,
        totalsText(order),
        ``
    ];

    const addr =
        addressText(order);

    if (addr) {
        lines.push(addr, ``);
    }

    lines.push(`Track your order: ${trackingUrl}`);

    const text =
        lines
            .filter(part => part !== null)
            .join("\n");


    return { subject, html, text };

}


module.exports = {
    buildPaymentConfirmedEmail
};
