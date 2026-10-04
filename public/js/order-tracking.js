/* =========================================================
   A.F. BOOKSTORE
   ORDER TRACKING JAVASCRIPT
======================================================== */


/* =========================================================
   CONFIGURATION
======================================================== */

const API_BASE_URL =
    "";


const TRACK_ORDER_URL =
    `${API_BASE_URL}/api/orders/track`;



/* =========================================================
   ELEMENTS
======================================================== */

const trackingForm =
    document.getElementById(
        "trackingForm"
    );


const orderIdInput =
    document.getElementById(
        "orderId"
    );


const trackingError =
    document.getElementById(
        "trackingError"
    );


const trackOrderBtn =
    document.getElementById(
        "trackOrderBtn"
    );


const trackingLoading =
    document.getElementById(
        "trackingLoading"
    );


const orderResult =
    document.getElementById(
        "orderResult"
    );


const trackingNotFound =
    document.getElementById(
        "trackingNotFound"
    );


const trackAnotherBtn =
    document.getElementById(
        "trackAnotherBtn"
    );

const cancelledOrderMessage =
    document.getElementById(
        "cancelledOrderMessage"
    );


const paymentStatusIndicator =
    document.getElementById(
        "paymentStatusIndicator"
    );


const paymentStatusIcon =
    document.getElementById(
        "paymentStatusIcon"
    );


const paymentStatusTitle =
    document.getElementById(
        "paymentStatusTitle"
    );


const paymentStatusDescription =
    document.getElementById(
        "paymentStatusDescription"
    );


const paymentAction =
    document.getElementById(
        "paymentAction"
    );


const paymentActionNote =
    document.getElementById(
        "paymentActionNote"
    );


const paymentActionBtn =
    document.getElementById(
        "paymentActionBtn"
    );


const paymentActionError =
    document.getElementById(
        "paymentActionError"
    );


const paymentActionShopLink =
    document.getElementById(
        "paymentActionShopLink"
    );


/*
    The order currently displayed on the
    tracking page. Reused for payment retry.
*/

let currentOrder = null;



/* =========================================================
   FORMAT PRICE
======================================================== */

function formatPrice(value) {

    return `₦${Number(
        value || 0
    ).toLocaleString(
        "en-NG"
    )}`;

}



/* =========================================================
   ESCAPE HTML
======================================================== */

function escapeHtml(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}



/* =========================================================
   STATUS LABEL
======================================================== */

function getStatusLabel(
    status
) {

    const labels = {

        pending:
            "Pending",

        pending_payment:
            "Pending Payment",

        processing:
            "Processing",

        shipped:
            "Shipped",

        delivered:
            "Delivered",

        cancelled:
            "Cancelled"

    };


    return (
        labels[status] ||
        status ||
        "Unknown"
    );

}



/* =========================================================
   STATUS ORDER
======================================================== */

const statusOrder = [

    "pending",

    "pending_payment",

    "processing",

    "shipped",

    "delivered"

];



/* =========================================================
   UPDATE STATUS TIMELINE
======================================================== */

function updateTimeline(
    currentStatus
) {

    const timeline =
        document.querySelector(
            ".status-timeline"
        );


    /* =============================================
       CANCELLED ORDER
       ============================================== */

    if (
        currentStatus === "cancelled"
    ) {

        document
            .querySelectorAll(
                ".status-step"
            )
            .forEach(
                step => {

                    step.classList.remove(
                        "active",
                        "completed"
                    );

                }
            );


        if (timeline) {

            timeline.hidden =
                true;

        }


        if (cancelledOrderMessage) {

            cancelledOrderMessage.hidden =
                false;

        }


        return;

    }


    /* =============================================
       NORMAL ORDER
       ============================================== */

    if (timeline) {

        timeline.hidden =
            false;

    }


    if (cancelledOrderMessage) {

        cancelledOrderMessage.hidden =
            true;

    }


    const currentIndex =
        statusOrder.indexOf(
            currentStatus
        );


    document
        .querySelectorAll(
            ".status-step"
        )
        .forEach(
            step => {

                const stepStatus =
                    step.dataset.status;


                const stepIndex =
                    statusOrder.indexOf(
                        stepStatus
                    );


                step.classList.remove(
                    "active",
                    "completed"
                );


                if (
                    currentIndex === -1
                ) {

                    return;

                }


                if (
                    stepIndex <
                    currentIndex
                ) {

                    step.classList.add(
                        "completed"
                    );

                }


                if (
                    stepIndex ===
                    currentIndex
                ) {

                    step.classList.add(
                        "active"
                    );

                }

            }
        );

}



/* =========================================================
   UPDATE PAYMENT STATUS
   Displays payment status separately from order status.
======================================================== */

function updatePaymentStatus(
    order
) {

    if (!paymentStatusIndicator) {

        return;

    }

    const paymentStatus =
        order.paymentStatus;

    const windowExpired =
        paymentStatus === "unpaid" &&
        order.reservationExpiresAt &&
        new Date(
            order.reservationExpiresAt
        ) <= new Date();

    const reservationExpired =
        paymentStatus === "unpaid" &&
        (
            order.status === "cancelled" ||
            !!order.reservationReleasedAt ||
            windowExpired
        );


    /*
        Reset classes.
    */

    paymentStatusIndicator.className =
        "payment-status-indicator";


    /*
        Update based on payment status.
    */

    if (paymentStatus === "paid") {

        paymentStatusIndicator.classList.add(
            "paid"
        );


        if (paymentStatusIcon) {

            paymentStatusIcon.textContent =
                "✓";

        }


        if (paymentStatusTitle) {

            paymentStatusTitle.textContent =
                "Paid";

        }


        if (paymentStatusDescription) {

            paymentStatusDescription.textContent =
                "Payment has been confirmed.";

        }


    } else if (paymentStatus === "failed") {

        paymentStatusIndicator.classList.add(
            "failed"
        );


        if (paymentStatusIcon) {

            paymentStatusIcon.textContent =
                "×";

        }


        if (paymentStatusTitle) {

            paymentStatusTitle.textContent =
                "Failed";

        }


        if (paymentStatusDescription) {

            paymentStatusDescription.textContent =
                "The previous payment attempt was unsuccessful.";

        }


    } else {

        /*
            unpaid
        */

        paymentStatusIndicator.classList.add(
            "unpaid"
        );


        if (paymentStatusIcon) {

            paymentStatusIcon.textContent =
                "◌";

        }


        if (paymentStatusTitle) {

            paymentStatusTitle.textContent =
                reservationExpired
                    ? "Payment window expired"
                    : "Payment not completed";

        }


        if (paymentStatusDescription) {

            paymentStatusDescription.textContent =
                reservationExpired
                    ? "The reservation for this order has expired and the reserved stock has been released."
                    : "This order has been created, but payment has not yet been confirmed.";

        }

    }


    /*
        Payment recovery action — reused the SAME
        order, never creates a new one.
    */

    if (!paymentAction) {

        return;

    }


    if (paymentStatus === "unpaid") {

        if (reservationExpired) {

            paymentAction.hidden =
                false;

            if (paymentActionNote) {

                paymentActionNote.textContent =
                    "The payment window for this order has expired and the reserved stock has been released. Please place a new order from the shop.";

            }

            if (paymentActionBtn) {

                paymentActionBtn.hidden =
                    true;

            }

            if (paymentActionShopLink) {

                paymentActionShopLink.hidden =
                    false;

            }

            return;

        }

        paymentAction.hidden =
            false;


        if (paymentActionNote) {

            paymentActionNote.textContent =
                order.reservationExpiresAt
                    ? `Your order is reserved until ${new Date(order.reservationExpiresAt).toLocaleString()}. Complete your payment to proceed.`
                    : "Your order has been created, but payment has not yet been confirmed. Complete your payment to proceed.";

        }


        if (paymentActionBtn) {

            paymentActionBtn.hidden =
                false;

            paymentActionBtn.textContent =
                "Complete Payment";

        }

        if (paymentActionShopLink) {

            paymentActionShopLink.hidden =
                true;

        }


    } else if (paymentStatus === "failed") {

        paymentAction.hidden =
            false;


        if (paymentActionNote) {

            paymentActionNote.textContent =
                "The previous payment attempt was unsuccessful. You can try again using the same order.";

        }


        if (paymentActionBtn) {

            paymentActionBtn.hidden =
                false;

            paymentActionBtn.textContent =
                "Try Again";

        }

        if (paymentActionShopLink) {

            paymentActionShopLink.hidden =
                true;

        }


    } else {

        /*
            paid — no payment recovery action.
        */

        paymentAction.hidden =
            true;

        if (paymentActionError) {

            paymentActionError.textContent =
                "";

        }

    }

}



/* =========================================================
   SHOW LOADING
======================================================== */

function showLoading(
    loading
) {

    trackingLoading.hidden =
        !loading;


    trackOrderBtn.disabled =
        loading;


    if (loading) {

        orderResult.hidden =
            true;


        trackingNotFound.hidden =
            true;

    }

}



/* =========================================================
   SHOW ERROR
======================================================== */

function showError(
    message
) {

    trackingError.textContent =
        message;

}



/* =========================================================
   CLEAR ERROR
======================================================== */

function clearError() {

    trackingError.textContent =
        "";

}



/* =========================================================
   RENDER ORDER
======================================================== */

function renderOrder(
    order
) {

    currentOrder =
        order;


    /* =============================================
       HEADER
       ============================================== */

    document.getElementById(
        "displayOrderId"
    ).textContent =
        order.id;


    const statusBadge =
        document.getElementById(
            "orderStatusBadge"
        );


    statusBadge.textContent =
        getStatusLabel(
            order.status
        );



    /* =============================================
       STATUS
       ============================================== */

    updateTimeline(
        order.status
    );



    /* =============================================
       PAYMENT STATUS
       ============================================== */

    updatePaymentStatus(
        order
    );



    /* =============================================
       CUSTOMER
       ============================================== */

    document.getElementById(
        "customerName"
    ).textContent =
        `NAME: ${order.customer?.name || "—"}`;


    document.getElementById(
        "customerEmail"
    ).textContent =
        `EMAIL: ${order.customer?.email || "—"}`;


    document.getElementById(
        "customerPhone"
    ).textContent =
        `PHONE: ${order.customer?.phone || "—"}`;



    /* =============================================
       DELIVERY
       ============================================== */

    document.getElementById(
        "deliveryAddress"
    ).textContent =
        `DELIVERY ADDRESS: ${order.delivery?.address || "—"}`;


    document.getElementById(
        "deliveryLocation"
    ).textContent = `DELIVERY LOCATION: ${[

        order.delivery?.city,

        order.delivery?.state

    ]

        .filter(Boolean)

        .join(
            ", "
        ) || "—"}`;



    /* =============================================
       ITEMS
       ============================================== */

    const orderItems =
        document.getElementById(
            "orderItems"
        );


    orderItems.innerHTML =
        "";


    const items =
        Array.isArray(
            order.items
        )
            ? order.items
            : [];


    let itemCount = 0;


    items.forEach(
        item => {

            const quantity =
                Number(
                    item.quantity
                ) || 0;


            itemCount +=
                quantity;


            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "order-item";


            article.innerHTML = `

                <div class="order-item-info">

                    <h3>
                        ${escapeHtml(
                            item.title
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            item.author ||
                            ""
                        )}
                    </p>

                </div>


                <div class="order-item-meta">

                    <span>
                        QTY: ${quantity}
                    </span>

                    <strong class="order-item-total">
                        ${formatPrice(
                            item.itemTotal ??
                            (
                                Number(
                                    item.price
                                ) *
                                quantity
                            )
                        )}
                    </strong>

                </div>

            `;


            orderItems.appendChild(
                article
            );

        }
    );


    document.getElementById(
        "orderItemCount"
    ).textContent =

        `${itemCount} ${
            itemCount === 1
                ? "item"
                : "items"
        }`;



    /* =============================================
       TOTALS
       ============================================== */

    document.getElementById(
        "orderSubtotal"
    ).textContent =
        formatPrice(
            order.subtotal
        );


    document.getElementById(
        "orderDelivery"
    ).textContent =
        formatPrice(
            order.deliveryFee
        );


    document.getElementById(
        "orderTotal"
    ).textContent =
        formatPrice(
            order.total
        );



    /* =============================================
       SHOW RESULT
       ============================================== */

    orderResult.hidden =
        false;


    trackingNotFound.hidden =
        true;

}



/* =========================================================
   PAYMENT RETRY
   Reuses the existing order — never creates a new one.
======================================================== */

async function handlePaymentAction() {

    if (!currentOrder) {

        return;

    }

    const email =
        currentOrder.customer?.email;


    if (!email) {

        if (paymentActionError) {

            paymentActionError.textContent =
                "No customer email is associated with this order.";

        }

        return;

    }


    if (paymentActionBtn) {

        paymentActionBtn.disabled =
            true;

    }


    if (paymentActionError) {

        paymentActionError.textContent =
            "";

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/payments/initialize`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            orderId:
                                currentOrder.id,
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

        window.location.href =
            data.data.authorization_url;

    } catch (error) {

        console.error(
            "Payment initialization error:",
            error
        );

        if (paymentActionBtn) {

            paymentActionBtn.disabled =
                false;

        }

        if (paymentActionError) {

            paymentActionError.textContent =
                error.message ||
                "Unable to initialize payment. Please try again.";

        }

        if (
            error.code ===
            "reservation_expired"
        ) {

            if (paymentActionBtn) {

                paymentActionBtn.hidden =
                    true;

            }

            if (paymentActionShopLink) {

                paymentActionShopLink.hidden =
                    false;

            }

            if (paymentActionNote) {

                paymentActionNote.textContent =
                    "The payment window for this order has expired and the reserved stock has been released. Please place a new order from the shop.";

            }

        }

    }

}


if (paymentActionBtn) {

    paymentActionBtn.addEventListener(
        "click",
        handlePaymentAction
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
            `${TRACK_ORDER_URL}/${encodeURIComponent(
                orderId
            )}`
        );


    let data = null;


    try {

        data =
            await response.json();

    }

    catch (error) {

        data = null;

    }


    if (
        !response.ok
    ) {

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
   FORM SUBMISSION
======================================================== */

if (trackingForm) {

    trackingForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            clearError();


            const orderId =
                orderIdInput.value.trim();


            if (!orderId) {

                showError(
                    "Please enter your order ID."
                );


                orderIdInput.focus();

                return;

            }


            showLoading(
                true
            );


            try {

                const order =
                    await fetchOrder(
                        orderId
                    );


                renderOrder(
                    order
                );


            }

            catch (error) {

                console.error(
                    "Order tracking error:",
                    error
                );


                trackingNotFound.hidden =
                    false;


                orderResult.hidden =
                    true;


                showError(
                    error.message ||
                    "Unable to find this order."
                );


            }

            finally {

                showLoading(
                    false
                );

            }

        }
    );

}



/* =========================================================
   TRACK ANOTHER ORDER
======================================================== */

if (trackAnotherBtn) {

    trackAnotherBtn.addEventListener(
        "click",
        () => {

            orderResult.hidden =
                true;


            trackingNotFound.hidden =
                true;


            orderIdInput.value =
                "";


            clearError();


            orderIdInput.focus();


            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }
    );

}



/* =========================================================
   AUTO LOAD LAST ORDER
======================================================== */

const urlOrderId =
    new URLSearchParams(
        window.location.search
    ).get("order");


const lastOrderId =
    urlOrderId ||
    sessionStorage.getItem(
        "afLastOrderId"
    );



if (
    lastOrderId &&
    orderIdInput
) {

    orderIdInput.value =
        lastOrderId;


    /*
        When arriving with an order ID in the URL
        (e.g. from success/failed pages), load it
        immediately.
    */

    if (urlOrderId) {

        trackingForm?.requestSubmit();

    }

}
