/* =========================================================
   A.F. BOOKSTORE
   ORDER TRACKING JAVASCRIPT
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE_URL =
    "";


const TRACK_ORDER_URL =
    `${API_BASE_URL}/api/orders/track`;



/* =========================================================
   ELEMENTS
========================================================= */

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



/* =========================================================
   FORMAT PRICE
========================================================= */

function formatPrice(value) {

    return `₦${Number(
        value || 0
    ).toLocaleString(
        "en-NG"
    )}`;

}



/* =========================================================
   ESCAPE HTML
========================================================= */

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
========================================================= */

function getStatusLabel(
    status
) {

    const labels = {

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
========================================================= */

const statusOrder = [

    "pending_payment",

    "processing",

    "shipped",

    "delivered"

];



/* =========================================================
   UPDATE STATUS TIMELINE
========================================================= */

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
   SHOW LOADING
========================================================= */

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
========================================================= */

function showError(
    message
) {

    trackingError.textContent =
        message;

}



/* =========================================================
   CLEAR ERROR
========================================================= */

function clearError() {

    trackingError.textContent =
        "";

}



/* =========================================================
   RENDER ORDER
========================================================= */

function renderOrder(
    order
) {

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
   FETCH ORDER
========================================================= */

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
========================================================= */

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
========================================================= */

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
========================================================= */

const lastOrderId =
    sessionStorage.getItem(
        "afLastOrderId"
    );


if (
    lastOrderId &&
    orderIdInput
) {

    orderIdInput.value =
        lastOrderId;

}