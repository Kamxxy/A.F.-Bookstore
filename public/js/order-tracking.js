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


const cancelSection =
    document.getElementById(
        "cancelSection"
    );


const cancelInfo =
    document.getElementById(
        "cancelInfo"
    );


const cancelActionNote =
    document.getElementById(
        "cancelActionNote"
    );


const cancelActionWrap =
    document.getElementById(
        "cancelActionWrap"
    );


const cancelEmail =
    document.getElementById(
        "cancelEmail"
    );


const cancelReason =
    document.getElementById(
        "cancelReason"
    );


const cancelBtn =
    document.getElementById(
        "cancelBtn"
    );


const cancelConfirmWrap =
    document.getElementById(
        "cancelConfirmWrap"
    );


const confirmCancelBtn =
    document.getElementById(
        "confirmCancelBtn"
    );


const keepOrderBtn =
    document.getElementById(
        "keepOrderBtn"
    );


const cancelError =
    document.getElementById(
        "cancelError"
    );


const cancelSuccess =
    document.getElementById(
        "cancelSuccess"
    );


const orderDate =
    document.getElementById(
        "orderDate"
    );


const cancelledDetail =
    document.getElementById(
        "cancelledDetail"
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

                    step.removeAttribute(
                        "aria-current"
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


                step.removeAttribute(
                    "aria-current"
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

                    step.setAttribute(
                        "aria-current",
                        "step"
                    );

                }

            }
        );

}



/* =========================================================
   UPDATE CANCELLED DETAIL
   Shows when, who, and why from the public order response only.
   Never exposes admin-only information.
========================================================= */

function updateCancelledDetail(
    order
) {

    if (!cancelledDetail) {

        return;

    }


    if (
        !order ||
        order.status !== "cancelled"
    ) {

        cancelledDetail.hidden =
            true;

        cancelledDetail.textContent =
            "";

        return;

    }


    const parts = [];


    if (order.cancelledAt) {

        const when =
            new Date(
                order.cancelledAt
            );

        if (
            !isNaN(
                when.getTime()
            )
        ) {

            parts.push(
                `Cancelled on ${when.toLocaleString()}.`
            );

        }

    }


    if (
        order.cancelledBy === "buyer"
    ) {

        parts.push(
            "You cancelled this order."
        );

    } else if (
        order.cancelledBy === "admin"
    ) {

        parts.push(
            "Our team cancelled this order."
        );

    } else if (
        order.cancelledBy === "system"
    ) {

        parts.push(
            "The payment window expired before payment could be completed."
        );

    }


    if (
        typeof order.cancellationReason === "string" &&
        order.cancellationReason.trim() !== ""
    ) {

        parts.push(
            `Reason given: “${order.cancellationReason.trim()}”`
        );

    }


    if (
        parts.length === 0
    ) {

        cancelledDetail.hidden =
            true;

        cancelledDetail.textContent =
            "";

        return;

    }


    cancelledDetail.textContent =
        parts.join(" ");

    cancelledDetail.hidden =
        false;

}


/* =========================================================
   UPDATE PAYMENT STATUS
   Displays payment status separately from order status.
======================================================= */

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
                "Payment has been confirmed and your order is queued for processing.";

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


    statusBadge.className =
        "order-status-badge st-" +
        String(
            order.status || ""
        ).toLowerCase().replace(
            /[^a-z]/g,
            ""
        );


    if (orderDate) {

        const placed =
            order.createdAt
                ? new Date(
                    order.createdAt
                )
                : null;

        orderDate.textContent =
            placed &&
            !isNaN(
                placed.getTime()
            )
                ? placed.toLocaleString()
                : "—";

    }



    /* =============================================
       STATUS
       ============================================== */

    updateTimeline(
        order.status
    );


    updateCancelledDetail(
        order
    );



    /* =============================================
       PAYMENT STATUS
       ============================================== */

    updatePaymentStatus(
        order
    );



    /* =============================================
       BUYER CANCELLATION
       ============================================== */

    updateCancelSection(
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

    const deliveryCityState =
        [
            order.delivery?.city,

            order.delivery?.state
        ]
            .filter(Boolean)
            .join(", ") || "—";


    const hasStructuredDelivery =
        Boolean(
            order.delivery?.lga ||
            order.delivery?.area ||
            order.delivery?.street
        );


    document.getElementById(
        "deliveryAddress"
    ).textContent = hasStructuredDelivery
        ? `DELIVERY ADDRESS: ${[
            order.delivery?.houseNumber,
            order.delivery?.street,
            order.delivery?.area,
            order.delivery?.lga,
            order.delivery?.state
        ].filter(Boolean).join(", ")}`
        : `DELIVERY ADDRESS: ${order.delivery?.address || "—"}`;


    document.getElementById(
        "deliveryLocation"
    ).textContent = `DELIVERY LOCATION: ${deliveryCityState}${
        order.delivery?.details
            ? ` — NOTE: ${order.delivery.details}`
            : ""
    }`;



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


    if (
        items.length === 0
    ) {

        orderItems.innerHTML =
            `<p class="order-empty-note">No items listed for this order.</p>`;

    }


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
   BUYER CANCELLATION
   Eligibility is derived from the server-returned order
   (authoritative). The server independently verifies
   ownership (order email) and eligibility on every
   request — the UI only decides what to display.
========================================================= */

let cancelInFlight =
    false;


function isBuyerCancellable(
    order
) {

    return Boolean(order) &&
        order.status === "pending";

}


function resetCancelControls() {

    cancelInFlight =
        false;

    if (cancelConfirmWrap) {

        cancelConfirmWrap.hidden =
            true;

    }

    if (cancelBtn) {

        cancelBtn.hidden =
            false;

        cancelBtn.disabled =
            false;

    }

    if (confirmCancelBtn) {

        confirmCancelBtn.disabled =
            false;

    }

    if (keepOrderBtn) {

        keepOrderBtn.disabled =
            false;

    }

    if (cancelError) {

        cancelError.textContent =
            "";

    }

    if (cancelSuccess) {

        cancelSuccess.hidden =
            true;

        cancelSuccess.textContent =
            "";

    }

}


function showCancelInfo(
    message
) {

    if (!cancelSection) {

        return;

    }

    cancelSection.hidden =
        false;

    if (cancelActionWrap) {

        cancelActionWrap.hidden =
            true;

    }

    if (cancelInfo) {

        cancelInfo.hidden =
            false;

        cancelInfo.textContent =
            message;

    }

}


function updateCancelSection(
    order
) {

    if (!cancelSection) {

        return;

    }

    resetCancelControls();

    if (cancelActionWrap) {

        cancelActionWrap.hidden =
            true;

    }

    if (cancelInfo) {

        cancelInfo.hidden =
            true;

    }


    if (!order) {

        cancelSection.hidden =
            true;

        return;

    }


    if (
        isBuyerCancellable(order)
    ) {

        cancelSection.hidden =
            false;

        cancelActionWrap.hidden =
            false;

        if (cancelActionNote) {

            cancelActionNote.textContent =
                order.paymentStatus === "paid"
                    ? "Cancelling stops fulfilment of this order. " +
                      "It does not automatically refund your payment — " +
                      "please contact the bookstore about your payment. " +
                      "This cannot be undone."
                    : "Cancelling releases your reserved books and " +
                      "stops this order. No payment will be taken. " +
                      "This cannot be undone.";

        }

        if (cancelEmail) {

            cancelEmail.value =
                order.customer?.email || "";

        }

        if (cancelReason) {

            cancelReason.value =
                "";

        }

        return;

    }


    if (
        order.status === "processing" ||
        order.status === "shipped"
    ) {

        showCancelInfo(
            "This order is already " +
            order.status +
            " and cannot be cancelled online. Please contact " +
            "the bookstore for help."
        );

        return;

    }


    cancelSection.hidden =
        true;

}


async function submitBuyerCancel() {

    if (
        cancelInFlight ||
        !currentOrder
    ) {

        return;

    }


    const email =
        cancelEmail
            ? cancelEmail.value.trim()
            : "";


    const reason =
        cancelReason
            ? cancelReason.value.trim()
            : "";


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        if (cancelError) {

            cancelError.textContent =
                "Please enter a valid email address.";

        }

        return;

    }


    if (
        reason.length > 500
    ) {

        if (cancelError) {

            cancelError.textContent =
                "Reason is too long (maximum 500 characters).";

        }

        return;

    }


    cancelInFlight =
        true;


    if (confirmCancelBtn) {

        confirmCancelBtn.disabled =
            true;

        confirmCancelBtn.textContent =
            "Cancelling...";

    }

    if (keepOrderBtn) {

        keepOrderBtn.disabled =
            true;

    }

    if (cancelError) {

        cancelError.textContent =
            "";

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/orders/${encodeURIComponent(
                    currentOrder.id
                )}/cancel`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            email: email,
                            reason: reason
                        })
                }
            );


        let data =
            null;

        try {

            data =
                await response.json();

        } catch (error) {

            data =
                null;

        }


        if (
            !response.ok
        ) {

            const failed =
                new Error(
                    data?.message ||
                    "Unable to cancel this order."
                );

            failed.status =
                response.status;

            throw failed;

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


        const message =
            data.message ||
            "Order cancelled successfully.";


        const fresh =
            await fetchOrder(
                currentOrder.id
            );

        renderOrder(
            fresh
        );


        cancelSection.hidden =
            false;

        if (cancelActionWrap) {

            cancelActionWrap.hidden =
                true;

        }

        if (cancelInfo) {

            cancelInfo.hidden =
                true;

        }

        if (cancelSuccess) {

            cancelSuccess.hidden =
                false;

            cancelSuccess.textContent =
                message;

        }

    } catch (error) {

        console.error(
            "Order cancellation error:",
            error
        );


        const message =
            error.message ||
            "Unable to cancel this order.";


        /* The order may have become ineligible between loading
           and submitting (paid, shipped, or cancelled elsewhere).
           Refresh from the server so the page reflects the
           authoritative state alongside the error. Rendering
           resets the form, so the message is set afterwards. */

        if (
            error.status === 404 ||
            error.status === 409 ||
            error.status === 410
        ) {

            try {

                const fresh =
                    await fetchOrder(
                        currentOrder.id
                    );

                renderOrder(
                    fresh
                );

            } catch (refreshError) {

                console.error(
                    "Order refresh error:",
                    refreshError
                );

            }

        }


        if (cancelError) {

            cancelError.textContent =
                message;

        }

    } finally {

        cancelInFlight =
            false;

        if (confirmCancelBtn) {

            confirmCancelBtn.disabled =
                false;

            confirmCancelBtn.textContent =
                "Yes, cancel my order";

        }

        if (keepOrderBtn) {

            keepOrderBtn.disabled =
                false;

        }

    }

}


if (cancelBtn) {

    cancelBtn.addEventListener(
        "click",
        () => {

            if (cancelError) {

                cancelError.textContent =
                    "";

            }

            if (cancelConfirmWrap) {

                cancelConfirmWrap.hidden =
                    false;

            }

            cancelBtn.hidden =
                true;

        }
    );

}


if (keepOrderBtn) {

    keepOrderBtn.addEventListener(
        "click",
        () => {

            if (cancelConfirmWrap) {

                cancelConfirmWrap.hidden =
                    true;

            }

            if (cancelBtn) {

                cancelBtn.hidden =
                    false;

            }

        }
    );

}


if (confirmCancelBtn) {

    confirmCancelBtn.addEventListener(
        "click",
        submitBuyerCancel
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
