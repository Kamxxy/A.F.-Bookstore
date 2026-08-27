if (!requireAdminAuth()) {
    window.location.href = "/admin/login";
}


const API_URL = "/api/orders";


let orders = [];


document.addEventListener(
    "DOMContentLoaded",
    loadOrders
);


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );


    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                Loading orders...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                API_URL
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load orders"
            );

        }


        orders =
            await response.json();


        updateStats();

        renderOrders(
            orders
        );


    } catch (error) {

        console.error(
            "Error loading orders:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    Failed to load orders.
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   UPDATE DASHBOARD STATS
========================================================= */

function updateStats() {

    const total =
        orders.length;


    /*
        Orders awaiting payment.

        The backend currently creates
        orders with:

        status: "pending_payment"
    */

    const pending =
        orders.filter(
            order =>
                String(
                    order.status || ""
                ).toLowerCase() ===
                "pending_payment"
        ).length;


    /*
        Completed orders
    */

    const completed =
        orders.filter(
            order =>
                String(
                    order.status || ""
                ).toLowerCase() ===
                "delivered"
        ).length;


    /*
        Revenue

        For now this is the total value
        of orders, regardless of payment
        status.

        Once payment is implemented,
        this should probably count only
        successfully paid orders.
    */

    const revenue =
        orders.reduce(
            (
                sum,
                order
            ) =>
                sum +
                Number(
                    order.total || 0
                ),
            0
        );


    document.getElementById(
        "totalOrders"
    ).textContent =
        total;


    document.getElementById(
        "pendingOrders"
    ).textContent =
        pending;


    document.getElementById(
        "completedOrders"
    ).textContent =
        completed;


    document.getElementById(
        "totalRevenue"
    ).textContent =
        "₦" +
        revenue.toLocaleString(
            "en-NG"
        );

}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders(
    list
) {

    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );


    if (
        !list ||
        list.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    No orders found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        list.map(
            order => {

                const items =
                    Array.isArray(
                        order.items
                    )
                        ? order.items
                        : [];


                const itemText =
                    items.length > 0

                        ? items
                            .map(
                                item =>
                                    `${escapeHTML(
                                        item.title ||
                                        "Book"
                                    )} × ${
                                        Number(
                                            item.quantity
                                        ) || 1
                                    }`
                            )
                            .join(
                                "<br>"
                            )

                        : "—";


                const total =
                    Number(
                        order.total || 0
                    );


                const status =
                    order.status ||
                    "pending_payment";


                const customer =
                    order.customer?.name ||
                    "Unknown";


                const date =
                    order.createdAt ||
                    null;


                return `

                    <tr>

                        <td>
                            #${escapeHTML(
                                String(
                                    order.id ||
                                    "N/A"
                                )
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                customer
                            )}
                        </td>


                        <td class="order-items">
                            ${itemText}
                        </td>


                        <td>
                            ₦${total.toLocaleString(
                                "en-NG"
                            )}
                        </td>


                        <td>

                            <span class="status">
                                ${escapeHTML(
                                    formatStatus(
                                        status
                                    )
                                )}
                            </span>

                        </td>


                        <td>
                            ${formatDate(
                                date
                            )}
                        </td>


                        <td>

                            <button
                                class="view-btn"
                                onclick="viewOrder('${escapeHTML(
                                    String(
                                        order.id
                                    )
                                )}')"
                            >
                                View
                            </button>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =========================================================
   FILTER ORDERS
========================================================= */

function filterOrders() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const status =
        statusFilter
            ? statusFilter.value
            : "all";


    const filtered =
        orders.filter(
            order => {

                const customer =
                    order.customer?.name ||
                    "";


                const id =
                    String(
                        order.id || ""
                    );


                const matchesSearch =
                    customer
                        .toLowerCase()
                        .includes(search) ||

                    id
                        .toLowerCase()
                        .includes(search);


                const orderStatus =
                    String(
                        order.status ||
                        "pending_payment"
                    ).toLowerCase();


                const matchesStatus =
                    status === "all" ||
                    orderStatus === status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderOrders(
        filtered
    );

}


/* =========================================================
   VIEW ORDER
========================================================= */

function viewOrder(
    id
) {

    const order =
        orders.find(
            order =>
                String(
                    order.id
                ) ===
                String(id)
        );


    if (!order) {
        return;
    }


    const items =
        Array.isArray(
            order.items
        )
            ? order.items
            : [];


    const customer =
        order.customer?.name ||
        "Unknown";


    const email =
        order.customer?.email ||
        "—";


    const phone =
        order.customer?.phone ||
        "—";


    const address =
        order.delivery?.address ||
        "—";


    const city =
        order.delivery?.city ||
        "—";


    const state =
        order.delivery?.state ||
        "—";


    const total =
        Number(
            order.total || 0
        );


    const subtotal =
        Number(
            order.subtotal || 0
        );


    const deliveryFee =
        Number(
            order.deliveryFee || 0
        );


    const status =
        order.status ||
        "pending_payment";


    const paymentStatus =
        order.paymentStatus ||
        "unpaid";


    const itemsHTML =
        items.length > 0

            ? items
                .map(
                    item => {

                        const name =
                            item.title ||
                            "Book";


                        const quantity =
                            Number(
                                item.quantity
                            ) || 1;


                        const price =
                            Number(
                                item.price
                            ) || 0;


                        return `

                            <div class="item">

                                <span>
                                    ${escapeHTML(
                                        name
                                    )}
                                    × ${quantity}
                                </span>

                                <span>
                                    ₦${(
                                        price *
                                        quantity
                                    ).toLocaleString(
                                        "en-NG"
                                    )}
                                </span>

                            </div>

                        `;

                    }
                )
                .join("")

            : "<p>No item information.</p>";


    document.getElementById(
        "orderDetails"
    ).innerHTML = `

        <div class="order-detail">

            <h3>
                Order #${escapeHTML(
                    String(
                        order.id ||
                        "N/A"
                    )
                )}
            </h3>

            <p>
                Date:
                ${formatDate(
                    order.createdAt
                )}
            </p>

        </div>


        <div class="order-detail">

            <h3>
                Customer
            </h3>

            <p>
                Name:
                ${escapeHTML(
                    customer
                )}
            </p>

            <p>
                Email:
                ${escapeHTML(
                    email
                )}
            </p>

            <p>
                Phone:
                ${escapeHTML(
                    phone
                )}
            </p>

        </div>


        <div class="order-detail">

            <h3>
                Delivery
            </h3>

            <p>
                Address:
                ${escapeHTML(
                    address
                )}
            </p>

            <p>
                City:
                ${escapeHTML(
                    city
                )}
            </p>

            <p>
                State:
                ${escapeHTML(
                    state
                )}
            </p>

        </div>


        <div class="order-detail">

            <h3>
                Items
            </h3>

            <div class="items-list">
                ${itemsHTML}
            </div>

        </div>


        <div class="order-detail">

            <h3>
                Payment
            </h3>

            <p>
                Payment Status:
                <strong>
                    ${escapeHTML(
                        formatPaymentStatus(
                            paymentStatus
                        )
                    )}
                </strong>
            </p>

            <p>
                Subtotal:
                ₦${subtotal.toLocaleString(
                    "en-NG"
                )}
            </p>

            <p>
                Delivery:
                ₦${deliveryFee.toLocaleString(
                    "en-NG"
                )}
            </p>

            <p>
                Total:
                <strong>
                    ₦${total.toLocaleString(
                        "en-NG"
                    )}
                </strong>
            </p>

        </div>


        <div class="order-detail">

            <h3>
                Order Status
            </h3>


            <label
                for="orderStatus"
                class="sr-only"
            >
                Order status
            </label>


            <select
                id="orderStatus"
                class="status-select"
            >

                <option
                    value="pending_payment"
                    ${
                        status ===
                        "pending_payment"
                            ? "selected"
                            : ""
                    }
                >
                    Pending Payment
                </option>


                <option
                    value="processing"
                    ${
                        status ===
                        "processing"
                            ? "selected"
                            : ""
                    }
                >
                    Processing
                </option>


                <option
                    value="shipped"
                    ${
                        status ===
                        "shipped"
                            ? "selected"
                            : ""
                    }
                >
                    Shipped
                </option>


                <option
                    value="delivered"
                    ${
                        status ===
                        "delivered"
                            ? "selected"
                            : ""
                    }
                >
                    Delivered
                </option>


                <option
                    value="cancelled"
                    ${
                        status ===
                        "cancelled"
                            ? "selected"
                            : ""
                    }
                >
                    Cancelled
                </option>

            </select>


            <button
                class="save-status-btn"
                onclick="updateOrderStatus('${escapeHTML(
                    String(
                        order.id
                    )
                )}')"
            >
                Update Status
            </button>

        </div>

    `;


    document.getElementById(
        "orderModal"
    ).classList.add(
        "show"
    );

}


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

async function updateOrderStatus(
    id
) {

    const status =
        document.getElementById(
            "orderStatus"
        ).value;


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {

                    method:
                        "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status
                        })

                }
            );


        if (!response.ok) {

            const result =
                await response
                    .json()
                    .catch(
                        () => ({})
                    );


            throw new Error(
                result.message ||
                result.error ||
                "Failed to update order"
            );

        }


        closeModal();


        await loadOrders();


        alert(
            "Order status updated successfully."
        );


    } catch (error) {

        console.error(
            "Order status update error:",
            error
        );


        alert(
            error.message
        );

    }

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(
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
        status
    );

}


/* =========================================================
   FORMAT PAYMENT STATUS
========================================================= */

function formatPaymentStatus(
    status
) {

    const labels = {

        unpaid:
            "Unpaid",

        paid:
            "Paid",

        failed:
            "Failed",

        refunded:
            "Refunded"

    };


    return (
        labels[status] ||
        status
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal(
    event
) {

    if (
        event &&
        event.target !==
        document.getElementById(
            "orderModal"
        )
    ) {

        return;

    }


    document.getElementById(
        "orderModal"
    ).classList.remove(
        "show"
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    date
) {

    if (!date) {
        return "—";
    }


    const parsed =
        new Date(date);


    if (
        isNaN(
            parsed.getTime()
        )
    ) {

        return "—";

    }


    return parsed.toLocaleString(
        "en-NG"
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}