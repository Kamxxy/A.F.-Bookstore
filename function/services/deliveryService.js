/* =========================================================
   DELIVERY ADDRESS HELPERS

   Validates structured Nigerian delivery addresses against
   the bundled administrative dataset and composes the
   backward-compatible address/city fields stored on orders.

   Dataset: open-admin-data/nigeria-administrative-divisions
   License: CC-BY-4.0
   ========================================================= */

const divisions =
    require("../data/nigeria-divisions.json");


const MAX_FIELD_LENGTH = 300;


function findState(stateName) {

    return divisions.states.find(
        (state) =>
            state.name.toLowerCase() ===
            String(stateName).trim().toLowerCase()
    );

}


function stateHasLga(state, lgaName) {

    return state.lgas.some(
        (lga) =>
            lga.toLowerCase() ===
            String(lgaName).trim().toLowerCase()
    );

}


/*
 * Returns { valid: boolean, message: string }.
 * `delivery` must contain the structured fields.
 */

function validateStructuredDelivery(delivery) {

    if (
        !delivery ||
        typeof delivery !== "object"
    ) {

        return {
            valid: false,
            message: "Delivery information is required"
        };

    }

    const state =
        typeof delivery.state === "string"
            ? delivery.state.trim()
            : "";

    const lga =
        typeof delivery.lga === "string"
            ? delivery.lga.trim()
            : "";

    const area =
        typeof delivery.area === "string"
            ? delivery.area.trim()
            : "";

    const street =
        typeof delivery.street === "string"
            ? delivery.street.trim()
            : "";

    const houseNumber =
        typeof delivery.houseNumber === "string"
            ? delivery.houseNumber.trim()
            : "";

    const details =
        typeof delivery.details === "string"
            ? delivery.details.trim()
            : "";

    if (!state) {

        return {
            valid: false,
            message: "State is required"
        };

    }

    const matchedState =
        findState(state);

    if (!matchedState) {

        return {
            valid: false,
            message: "Invalid state selected"
        };

    }

    if (!lga) {

        return {
            valid: false,
            message: "LGA is required"
        };

    }

    if (!stateHasLga(matchedState, lga)) {

        return {
            valid: false,
            message:
                "Selected LGA does not belong to the selected state"
        };

    }

    if (!area) {

        return {
            valid: false,
            message: "Area / district is required"
        };

    }

    if (!street) {

        return {
            valid: false,
            message: "Street / road is required"
        };

    }

    /*
        houseNumber is intentionally optional — many
        Nigerian addresses rely on street/landmark
        identification instead of a formal house number.
    */

    const lengths = [
        state, lga, area, street, houseNumber, details
    ];

    if (
        lengths.some(
            (value) =>
                value.length > MAX_FIELD_LENGTH
        )
    ) {

        return {
            valid: false,
            message:
                "Delivery address fields are too long"
        };

    }

    return {
        valid: true,
        message: ""
    };

}


/*
 * Builds the full delivery object stored on new orders:
 * structured fields plus backend-composed compatibility
 * fields (address, city).
 */

function buildDeliveryRecord(delivery) {

    const state =
        delivery.state.trim();

    const lga =
        delivery.lga.trim();

    const area =
        delivery.area.trim();

    const street =
        delivery.street.trim();

    const houseNumber =
        typeof delivery.houseNumber === "string"
            ? delivery.houseNumber.trim()
            : "";

    const details =
        typeof delivery.details === "string"
            ? delivery.details.trim()
            : "";

    const address =
        [
            houseNumber || "",
            street,
            area
        ]
            .filter(Boolean)
            .join(", ");

    return {
        state,
        lga,
        area,
        street,
        houseNumber,
        details,
        address,
        city: lga
    };

}


module.exports = {
    validateStructuredDelivery,
    buildDeliveryRecord
};
