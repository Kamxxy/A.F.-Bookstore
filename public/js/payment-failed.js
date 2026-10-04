/* =========================================================
   A.F. BOOKSTORE
   PAYMENT FAILED PAGE JAVASCRIPT
======================================================== */


/* =========================================================
   CONFIGURATION
======================================================== */

const API_BASE_URL = "";

const PAYMENTS_API_URL =
    `${API_BASE_URL}/api/payments/initialize`;


/* =========================================================
   ELEMENTS
======================================================== */

const failedTitle =
    document.getElementById("failedTitle");

const failedMessage =
    document.getElementById("failedMessage");

const orderInfoBox =
    document.getElementById("orderInfoBox");

const failedOrderId =
    document.getElementById("failedOrderId");

const failedPaymentStatus =
    document.getElementById("failedPaymentStatus");

const emailSection =
    document.getElementById("emailSection");

const retryEmail =
    document.getElementById("retryEmail");

const retryEmailError =
    document.getElementById("retryEmailError");

const failedLoading =
    document.getElementById("failedLoading");

const retryPaymentBtn =
    document.getElementById("retryPaymentBtn");

const trackOrderBtn =
    document.getElementById("trackOrderBtn");


/* =========================================================
   STATE
======================================================== */

let currentOrderId = null;


/* =========================================================
   GET ORDER ID
======================================================== */

function getOrderId() {

    /*
        First check URL query parameter.
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
   FORMAT PRICE
======================================================== */

function formatPrice(value) {

    return `₦${Number(
        value || 0
    ).toLocaleString("en-NG")}`;

}


/* =========================================================
   SHOW LOADING
======================================================== */

function showLoading(
    loading
) {

    if (failedLoading) {

        failedLoading.hidden =
            !loading;

    }

    if (retryPaymentBtn) {

        retryPaymentBtn.disabled =
            loading;

    }

}


/* =========================================================
   SHOW ERROR
======================================================== */

function showError(
    message
) {

    if (retryEmailError) {

        retryEmailError.textContent =
            message;

    }

}


/* =========================================================
   CLEAR ERROR
======================================================== */

function clearError() {

    if (retryEmailError) {

        retryEmailError.textContent =
            "";

    }

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
        Show order info.
    */

    if (orderInfoBox) {

        orderInfoBox.hidden =
            false;

    }


    if (failedOrderId) {

        failedOrderId.textContent =
            order.id;

    }


    if (failedPaymentStatus) {

        failedPaymentStatus.textContent =
            paymentStatus.toUpperCase();

    }


    /*
        Point Track Order at the same order and
        prefill the stored customer email for retry.
    */

    if (trackOrderBtn) {

        trackOrderBtn.href =
            `/order-tracking?order=${encodeURIComponent(
                order.id
            )}`;

    }


    if (retryEmail && order.customer?.email) {

        retryEmail.value =
            order.customer.email;

    }


    /*
        Show email section and retry button
        for unpaid or failed orders.
    */

    const canRetry =
        paymentStatus === "unpaid" ||
        paymentStatus === "failed";


    if (emailSection) {

        emailSection.hidden =
            !canRetry;

    }


    if (retryPaymentBtn) {

        retryPaymentBtn.hidden =
            !canRetry;

    }


    /* ==============================================
       EXPIRED UNPAID RESERVATION
    ================================================= */

    const reservationExpired =
        paymentStatus === "unpaid" &&
        (
            order.status === "cancelled" ||
            !!order.reservationReleasedAt
        );


    if (reservationExpired) {

        if (failedTitle) {

            failedTitle.textContent =
                "Payment Window Expired";

        }

        if (failedMessage) {

            failedMessage.textContent =
                "The reservation for this order has expired and the reserved stock has been released.";

        }

        if (emailSection) {

            emailSection.hidden =
                true;

        }

        if (retryPaymentBtn) {

            retryPaymentBtn.hidden =
                true;

        }

        return;

    }


    /*
        Update title and message.
    */

    if (paymentStatus === "paid") {

        if (failedTitle) {

            failedTitle.textContent =
                "Payment Successful";

        }


        if (failedMessage) {

            failedMessage.textContent =
                "Your payment has been confirmed. Thank you for your order.";

        }

    } else if (paymentStatus === "failed") {

        if (failedTitle) {

            failedTitle.textContent =
                "Payment Failed";

        }


        if (failedMessage) {

            failedMessage.textContent =
                "Your payment could not be processed. Please try again or use a different payment method.";

        }

    } else {

        /*
            unpaid
        */

        if (failedTitle) {

            failedTitle.textContent =
                "Payment Not Completed";

        }


        if (failedMessage) {

            failedMessage.textContent =
                "Your order has been saved. Complete your payment to proceed with your order.";

        }

    }

}


/* =========================================================
   RETRY PAYMENT
======================================================== */

async function retryPayment() {

    clearError();


    /*
        Validate email.
    */

    const email =
        retryEmail.value.trim();


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

        showError(
            "Please enter a valid email address."
        );

        retryEmail.focus();

        return;

    }


    showLoading(true);


    try {

        const response =
            await fetch(
                PAYMENTS_API_URL,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            orderId:
                                currentOrderId,
                            email: email
                        })

                }
            );


        let data = null;


        try {

            data =
                await response.json();

        } catch (error) {

            data = null;

        }


        if (
            !response.ok ||
            !data?.success ||
            !data?.data?.authorization_url
        ) {

            const error =
                new Error(
                    data?.message ||
                    "Unable to initialize payment. Please try again."
                );

            error.code =
                data?.code;

            throw error;

        }


        /*
            Redirect to Paystack for payment.
        */

        window.location.href =
            data.data.authorization_url;


    } catch (error) {

        console.error(
            "Payment retry error:",
            error
        );


        showError(
            error.message ||
            "Unable to initialize payment. Please try again."
        );


        showLoading(false);


        if (
            error.code ===
            "reservation_expired"
        ) {

            if (failedMessage) {

                failedMessage.textContent =
                    "The payment window for this order has expired and the reserved stock has been released. Please place a new order from the shop.";

            }

            if (emailSection) {

                emailSection.hidden =
                    true;

            }

            if (retryPaymentBtn) {

                retryPaymentBtn.hidden =
                    true;

            }

        }

    }

}


/* =========================================================
   INITIALIZE
======================================================== */

async function init() {

    currentOrderId =
        getOrderId();


    const urlReason =
        new URLSearchParams(
            window.location.search
        ).get("reason");


    if (
        urlReason ===
        "reservation_expired"
    ) {

        if (failedTitle) {

            failedTitle.textContent =
                "Payment Window Expired";

        }

        if (failedMessage) {

            failedMessage.textContent =
                "The payment window for this order has expired and the reserved stock has been released.";

        }

        if (emailSection) {

            emailSection.hidden =
                true;

        }

        if (retryPaymentBtn) {

            retryPaymentBtn.hidden =
                true;

        }

    }


    if (!currentOrderId) {

        /*
            No order ID available.
        */

        if (failedTitle) {

            failedTitle.textContent =
                "Payment Not Completed";

        }


        if (failedMessage) {

            failedMessage.textContent =
                "We could not find your order. Please track your order using your order ID.";

        }


        if (trackOrderBtn) {

            trackOrderBtn.href =
                `/order-tracking?order=${encodeURIComponent(
                    currentOrderId
                )}`;

        }


        return;

    }


    /*
        Fetch order details.
    */

    showLoading(true);


    try {

        const order =
            await fetchOrder(
                currentOrderId
            );


        updateUI(order);


    } catch (error) {

        console.error(
            "Failed page order fetch error:",
            error
        );


        if (failedMessage) {

            failedMessage.textContent =
                error.message ||
                "Unable to load your order details.";

        }


        /*
            Still show retry if we have an order ID.
        */

        if (emailSection) {

            emailSection.hidden =
                false;

        }


        if (retryPaymentBtn) {

            retryPaymentBtn.hidden =
                false;

        }


        if (orderInfoBox) {

            orderInfoBox.hidden =
                false;

        }


        if (failedOrderId) {

            failedOrderId.textContent =
                currentOrderId;

        }


        if (failedPaymentStatus) {

            failedPaymentStatus.textContent =
                "UNKNOWN";

        }


    } finally {

        showLoading(false);

    }

}


/* =========================================================
   EVENT LISTENERS
======================================================== */

if (retryPaymentBtn) {

    retryPaymentBtn.addEventListener(
        "click",
        retryPayment
    );

}


if (retryEmail) {

    retryEmail.addEventListener(
        "input",
        clearError
    );

}


/* =========================================================
   START
======================================================== */

init();
