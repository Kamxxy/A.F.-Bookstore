/* =========================================================
   ORDER DELIVERED EMAIL
   Sent only on a genuine transition into "delivered"
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
    itemsText,
    totalsText
} = require("./_orderBlocks");


function buildOrderDeliveredEmail(
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
        `Your order was delivered — ${orderId}`;


    const html =
        baseLayout({
            preheader: `Order ${orderId} has been delivered. Enjoy your books.`,
            title: subject,
            heading: `Delivered. Enjoy, ${escapeHtml(customerName)}.`,
            introHtml: `Order <strong>${escapeHtml(orderId)}</strong> has been <strong>delivered</strong>. Thank you for shopping with A.F. Bookstore.`,
            bodyHtml:
                orderMetaRows(order) +
                itemsTableHtml(order) +
                totalsTableHtml(order),
            ctaUrl: trackingUrl,
            ctaLabel: "View your order"
        });


    const text = [
        `Hi ${customerName},`,
        ``,
        `Order ${orderId} has been delivered. Thank you for shopping with A.F. Bookstore.`,
        ``,
        itemsText(order),
        ``,
        totalsText(order),
        ``,
        `View your order: ${trackingUrl}`
    ].join("\n");


    return { subject, html, text };

}


module.exports = {
    buildOrderDeliveredEmail
};
