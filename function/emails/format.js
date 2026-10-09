/* =========================================================
   EMAIL FORMATTING HELPERS
   Shared by all locally generated transactional emails.
   Every dynamic value inserted into HTML must pass
   through escapeHtml first.
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function formatNaira(
    value
) {

    const numeric =
        Number(value) || 0;

    return `₦${numeric.toLocaleString("en-NG")}`;

}


function formatDateTime(
    value
) {

    if (
        !value
    ) {

        return "";

    }

    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleString(
        "en-NG"
    );

}


function pickText(
    value
) {

    return typeof value === "string"
        ? value.trim()
        : "";

}


/* =========================================================
   DELIVERY ADDRESS
   Returns "" when no usable address exists so templates
   can omit the block entirely. Never emits "undefined",
   "null", or stray separators.
========================================================= */

function formatDeliveryAddress(
    delivery
) {

    if (
        !delivery ||
        typeof delivery !== "object"
    ) {

        return "";

    }


    const composed =
        pickText(delivery.address);

    const city =
        pickText(delivery.city);

    const state =
        pickText(delivery.state);

    const lga =
        pickText(delivery.lga);

    const area =
        pickText(delivery.area);

    const street =
        pickText(delivery.street);

    const houseNumber =
        pickText(delivery.houseNumber);

    const details =
        pickText(delivery.details);


    let base =
        "";


    if (
        composed
    ) {

        base =
            composed;

        for (
            const extra of [lga, state, city]
        ) {

            if (
                extra &&
                !base
                    .toLowerCase()
                    .includes(
                        extra.toLowerCase()
                    )
            ) {

                base += `, ${extra}`;

            }

        }

    } else {

        base =
            [
                houseNumber,
                street,
                area,
                lga,
                state,
                city
            ]
                .filter(Boolean)
                .join(", ");

    }


    if (
        !base
    ) {

        return "";

    }


    if (
        details
    ) {

        return `${base} — ${details}`;

    }


    return base;

}


/* =========================================================
   ORDER ITEMS
   Normalized rows: { title, quantity, unitPrice, lineTotal }
========================================================= */

function normalizeItems(
    items
) {

    if (
        !Array.isArray(items)
    ) {

        return [];

    }


    return items.map(item => {

        const title =
            pickText(item?.title) ||
            "Book";

        const quantity =
            Number(item?.quantity) || 1;

        const unitPrice =
            Number(item?.price) || 0;

        const lineTotal =
            Number(item?.itemTotal) ||
            unitPrice * quantity;


        return {
            title,
            quantity,
            unitPrice,
            lineTotal
        };

    });

}


module.exports = {
    escapeHtml,
    formatNaira,
    formatDateTime,
    formatDeliveryAddress,
    normalizeItems
};
