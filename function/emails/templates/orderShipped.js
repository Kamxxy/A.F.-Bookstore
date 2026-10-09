/* =========================================================
   ORDER SHIPPED EMAIL
   Sent only on a genuine transition into "shipped"
   confirmed by updateOrderStatus().
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
    addressBlockHtml,
    itemsText,
    totalsText,
    addressText
} = require("./_orderBlocks");


function buildOrderShippedEmail(
    order,
    context = {}
) {

    const orderId =
        String(order?.id || "");

    const customerName =
        String(order?.customer?.name || "Reader");

    const trackingUrl =
        String(context.trackingUrl || "");


    const subject =
        `Your order has shipped — ${orderId}`;


    const html =
        baseLayout({
            preheader: `Order ${orderId} is on its way.`,
            title: subject,
            heading: `On its way, ${escapeHtml(customerName)}.`,
            introHtml: `Order <strong>${escapeHtml(orderId)}</strong> has <strong>shipped</strong> and is on its way to you.`,
            bodyHtml:
                orderMetaRows(order) +
                itemsTableHtml(order) +
                totalsTableHtml(order) +
                addressBlockHtml(order),
            ctaUrl: trackingUrl,
            ctaLabel: "Track your order"
        });


    const lines = [
        `Hi ${customerName},`,
        ``,
        `Order ${orderId} has shipped and is on its way to you.`,
        ``,
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
        lines.join("\n");


    return { subject, html, text };

}


module.exports = {
    buildOrderShippedEmail
};
