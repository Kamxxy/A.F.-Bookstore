/* =========================================================
   SHARED ORDER BLOCKS
   Reusable HTML/text fragments for order emails.
   All dynamic values are escaped here.
========================================================= */

const {
    escapeHtml,
    formatNaira,
    formatDeliveryAddress,
    normalizeItems
} = require("../format");

const {
    BRAND,
    SANS_STACK
} = require("../styles");


function orderMetaRows(
    order
) {

    return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 16px 0; font-family: ${SANS_STACK}; font-size: 14px; color: ${BRAND.ink};">
        <tr>
            <td style="padding: 6px 0; color: ${BRAND.muted};">Order number</td>
            <td align="right" style="padding: 6px 0; font-weight: bold;">${escapeHtml(String(order?.id || ""))}</td>
        </tr>
    </table>`;

}


function itemsTableHtml(
    order
) {

    const rows =
        normalizeItems(order?.items);


    if (
        rows.length === 0
    ) {

        return "";

    }


    const body =
        rows
            .map(row => `
        <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid ${BRAND.border};">${escapeHtml(row.title)}<br><span style="color: ${BRAND.muted}; font-size: 13px;">Qty: ${row.quantity} &times; ${escapeHtml(formatNaira(row.unitPrice))}</span></td>
            <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${BRAND.border}; font-weight: bold;">${escapeHtml(formatNaira(row.lineTotal))}</td>
        </tr>`)
            .join("");


    return `
    <h2 style="margin: 20px 0 8px 0; font-size: 16px; color: ${BRAND.ink};">Your books</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family: ${SANS_STACK}; font-size: 14px; color: ${BRAND.ink};">
        ${body}
    </table>`;

}


function totalsTableHtml(
    order
) {

    return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 12px 0 4px 0; font-family: ${SANS_STACK}; font-size: 14px; color: ${BRAND.ink};">
        <tr>
            <td style="padding: 4px 0; color: ${BRAND.muted};">Subtotal</td>
            <td align="right" style="padding: 4px 0;">${escapeHtml(formatNaira(order?.subtotal))}</td>
        </tr>
        <tr>
            <td style="padding: 4px 0; color: ${BRAND.muted};">Delivery</td>
            <td align="right" style="padding: 4px 0;">${escapeHtml(formatNaira(order?.deliveryFee))}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0 0 0; font-weight: bold; font-size: 16px;">Total</td>
            <td align="right" style="padding: 8px 0 0 0; font-weight: bold; font-size: 16px;">${escapeHtml(formatNaira(order?.total))}</td>
        </tr>
    </table>`;

}


function addressBlockHtml(
    order
) {

    const address =
        formatDeliveryAddress(order?.delivery);


    if (
        !address
    ) {

        return "";

    }


    return `
    <h2 style="margin: 20px 0 8px 0; font-size: 16px; color: ${BRAND.ink};">Delivery address</h2>
    <p style="margin: 0 0 16px 0;">${escapeHtml(address)}</p>`;

}


function itemsText(
    order
) {

    const rows =
        normalizeItems(order?.items);


    if (
        rows.length === 0
    ) {

        return "";

    }


    return rows
        .map(row =>
            `- ${row.title} x ${row.quantity} — ${formatNaira(row.lineTotal)}`
        )
        .join("\n");

}


function totalsText(
    order
) {

    return [
        `Subtotal: ${formatNaira(order?.subtotal)}`,
        `Delivery: ${formatNaira(order?.deliveryFee)}`,
        `Total: ${formatNaira(order?.total)}`
    ].join("\n");

}


function addressText(
    order
) {

    const address =
        formatDeliveryAddress(order?.delivery);


    if (
        !address
    ) {

        return "";

    }


    return `Delivery address: ${address}`;

}


module.exports = {
    orderMetaRows,
    itemsTableHtml,
    totalsTableHtml,
    addressBlockHtml,
    itemsText,
    totalsText,
    addressText
};
