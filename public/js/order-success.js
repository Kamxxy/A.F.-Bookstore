/* =========================================================
   A.F. BOOKSTORE
   ORDER SUCCESS PAGE JAVASCRIPT
======================================================== */


/* =========================================================
   CONFIGURATION
======================================================== */

const API_BASE_URL = "";


/* =========================================================
   ELEMENTS
======================================================== */

const orderIdElement =
    document.getElementById("orderId");

const successTitle =
    document.getElementById("successTitle");

const successMessage =
    document.getElementById("successMessage");

const paymentStatusBadge =
    document.getElementById("paymentStatusBadge");

const paymentMessage =
    document.getElementById("paymentMessage");

const successDetails =
    document.getElementById("successDetails");

const trackOrderBtn =
    document.getElementById("trackOrderBtn");

const continueShoppingBtn =
    document.getElementById("continueShoppingBtn");

const successIcon =
    document.querySelector(".success-icon");

const successEyebrow =
    document.querySelector(".success-eyebrow");



/* =========================================================
   GET ORDER ID
======================================================== */

function getOrderId() {

    /*
        First check URL query parameter.
        The payment callback redirects here with ?order=ID.
    */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const urlOrderId =
        urlParams.get("order");

    if (urlOrderId) {

        return urlOrderId;

    }


    /*
        Fall back to sessionStorage.
    */

    return sessionStorage.getItem(
        "afLastOrderId"
    );

}


/* =========================================================
   FETCH ORDER
======================================================== */

async function fetchOrder(
    orderId
) {

    const response =
        await fetch(
            `${API_BASE_URL}/api/orders/track/${encodeURIComponent(
                orderId
            )}`
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        data = null;

    }


    if (!response.ok) {

        throw new Error(

            data?.message ||
            "Unable to find this order."

        );

    }


    if (
        !data ||
        data.success !== true ||
        !data.order
    ) {

        throw new Error(
            "The server returned an unexpected response."
        );

    }


    return data.order;

}


/* =========================================================
   UPDATE UI BASED ON PAYMENT STATUS
======================================================== */

function updateUI(
    order
) {

    if (!order) {

        return;

    }


    const paymentStatus =
        order.paymentStatus;


    /*
        The success page is only for confirmed,
        successful payments. Unpaid or failed
        orders belong on the tracking page (or
        payment-failed page) where payment
        recovery is handled.
    */

    if (paymentStatus === "failed") {

        window.location.replace(
            `/payment-failed?order=${encodeURIComponent(
                order.id
            )}`
        );

        return;

    }


    if (paymentStatus !== "paid") {

        window.location.replace(
            `/order-tracking?order=${encodeURIComponent(
                order.id
            )}`
        );

        return;

    }


    /*
        Update order ID.
    */

    if (orderIdElement) {

        orderIdElement.textContent =
            order.id;

    }


    /*
        Update payment status badge.
    */

    if (paymentStatusBadge) {

        paymentStatusBadge.textContent =
            paymentStatus.toUpperCase();

        paymentStatusBadge.className =
            `payment-status-badge ${paymentStatus}`;

    }


    /*
        Point Track Order at the same order.
    */

    if (trackOrderBtn) {

        trackOrderBtn.href =
            `/order-tracking?order=${encodeURIComponent(
                order.id
            )}`;

    }


    /*
        PAYMENT SUCCESSFUL
    */

    if (successTitle) {

        successTitle.textContent =
            "Payment Successful";

    }


    if (successMessage) {

        successMessage.textContent =
            "Your payment has been confirmed. Thank you for your order.";

    }


    if (successEyebrow) {

        successEyebrow.textContent =
            "Payment Confirmation";

    }


    if (successIcon) {

        successIcon.textContent =
            "✓";

    }


    if (paymentMessage) {

        paymentMessage.textContent =
            "payment confirmed — your order is being processed and will be shipped soon.";

    }


    if (successDetails) {

        successDetails.hidden =
            false;

    }


    if (continueShoppingBtn) {

        continueShoppingBtn.hidden =
            false;

    }


    /*
        Clear cart ONLY after confirmed payment.
    */

    clearCart();

}


/* =========================================================
   CLEAR CART
   Only called after confirmed payment.
======================================================== */

function clearCart() {

    localStorage.removeItem(
        "afCart"
    );

    sessionStorage.removeItem(
        "afLastOrderId"
    );

    sessionStorage.removeItem(
        "afLastOrderEmail"
    );

}


/* =========================================================
   INITIALIZE
======================================================== */

async function init() {

    const orderId =
        getOrderId();


    if (!orderId) {

        /*
            No order ID available.
        */

        if (successTitle) {

            successTitle.textContent =
                "Order Not Found";

        }


        if (successMessage) {

            successMessage.textContent =
                "We could not find your order. Please track your order using your order ID.";

        }


        if (paymentStatusBadge) {

            paymentStatusBadge.textContent =
                "N/A";

        }


        if (paymentMessage) {

            paymentMessage.textContent =
                "Use the tracking page to find your order.";

        }


        if (successDetails) {

            successDetails.hidden =
                true;

        }


        if (trackOrderBtn) {

            trackOrderBtn.hidden =
                true;

        }


        if (continueShoppingBtn) {

            continueShoppingBtn.hidden =
                true;

        }


        return;

    }


    /*
        Fetch order details from backend.
    */

    try {

        const order =
            await fetchOrder(
                orderId
            );


        updateUI(order);


    } catch (error) {

        console.error(
            "Order success page error:",
            error
        );


        if (successTitle) {

            successTitle.textContent =
                "Order Not Found";

        }


        if (successMessage) {

            successMessage.textContent =
                error.message ||
                "Unable to load your order details.";

        }


        if (paymentStatusBadge) {

            paymentStatusBadge.textContent =
                "N/A";

        }


        if (paymentMessage) {

            paymentMessage.textContent =
                "Please try again later or contact support.";

        }


        if (successDetails) {

            successDetails.hidden =
                true;

        }


        if (trackOrderBtn) {

            trackOrderBtn.hidden =
                true;

        }


        if (continueShoppingBtn) {

            continueShoppingBtn.hidden =
                true;

        }

    }

}


/* =========================================================
   START
======================================================== */

init();
