/* =========================================================
   BASE EMAIL LAYOUT
   Single branded wrapper for every transactional email.
   Table-based with inline CSS for email-client support.
   All inputs are expected to be pre-escaped HTML,
   except ctaUrl which is escaped here.
========================================================= */

const {
    escapeHtml
} = require("../format");

const {
    BRAND,
    FONT_STACK,
    SANS_STACK
} = require("../styles");


function baseLayout({
    preheader = "",
    title = BRAND.name,
    heading = "",
    introHtml = "",
    bodyHtml = "",
    ctaUrl = "",
    ctaLabel = "",
    footerText = "This is an automated message from A.F. Bookstore. Please do not reply directly to this email."
} = {}) {

    const safeTitle =
        escapeHtml(title);

    const safeCtaUrl =
        escapeHtml(ctaUrl);

    const ctaHtml =
        ctaUrl && ctaLabel
            ? `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0 8px 0;">
                <tr>
                    <td align="center" bgcolor="${BRAND.accent}" style="border-radius: 6px;">
                        <a href="${safeCtaUrl}" style="display: inline-block; padding: 13px 28px; font-family: ${SANS_STACK}; font-size: 15px; font-weight: bold; color: ${BRAND.buttonText}; text-decoration: none; border-radius: 6px;">
                            ${escapeHtml(ctaLabel)}
                        </a>
                    </td>
                </tr>
            </table>`
            : "";


    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.background};">
<div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${BRAND.background};">
<tr>
<td align="center" style="padding: 28px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">
<tr>
<td style="padding: 0 0 16px 4px; font-family: ${FONT_STACK}; font-size: 22px; font-weight: bold; color: ${BRAND.ink};">
${escapeHtml(BRAND.name)} <span style="font-size: 12px; font-weight: normal; color: ${BRAND.muted};">${escapeHtml(BRAND.tagline)}</span>
</td>
</tr>
<tr>
<td bgcolor="${BRAND.card}" style="background-color: ${BRAND.card}; border: 1px solid ${BRAND.border}; border-radius: 8px; padding: 32px 30px; font-family: ${SANS_STACK}; font-size: 15px; line-height: 1.6; color: ${BRAND.ink};">
${heading ? `<h1 style="margin: 0 0 12px 0; font-family: ${FONT_STACK}; font-size: 24px; line-height: 1.3; color: ${BRAND.ink};">${heading}</h1>` : ""}
${introHtml ? `<p style="margin: 0 0 16px 0;">${introHtml}</p>` : ""}
${bodyHtml}
${ctaHtml}
</td>
</tr>
<tr>
<td style="padding: 16px 4px 0 4px; font-family: ${SANS_STACK}; font-size: 12px; line-height: 1.5; color: ${BRAND.muted};">
${escapeHtml(footerText)}
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

}


module.exports = {
    baseLayout
};
