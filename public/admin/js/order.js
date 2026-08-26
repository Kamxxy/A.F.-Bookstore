if (!requireAdminAuth()) {
    window.location.href = "/admin/login";
}

const API_URL = "/api/orders";

let orders = [];

document.addEventListener(
    "DOMContentLoaded",
    loadOrders
);


async function loadOrders() {

    const tableBody =
        document.getElementById("ordersTableBody");

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                Loading orders...
            </td>
        </tr>
    `;

    try {

        const response =
            await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load orders");
        }

        orders = await response.json();

        updateStats();

        renderOrders(orders);

    } catch (error) {

        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    Failed to load orders.
                </td>
            </tr>
        `;

    }

}


function updateStats() {

    const total =
        orders.length;

    const pending =
        orders.filter(
            order =>
                String(order.status || "")
                    .toLowerCase() === "pending"
        ).length;

    const completed =
        orders.filter(
            order =>
                String(order.status || "")
                    .toLowerCase() === "delivered"
        ).length;

    const revenue =
        orders.reduce(
            (sum, order) =>
                sum + Number(
                    order.total ||
                    order.totalAmount ||
                    0
                ),
            0
        );


    document.getElementById(
        "totalOrders"
    ).textContent = total;

    document.getElementById(
        "pendingOrders"
    ).textContent = pending;

    document.getElementById(
        "completedOrders"
    ).textContent = completed;

    document.getElementById(
        "totalRevenue"
    ).textContent =
        "₦" + revenue.toLocaleString();

}


function renderOrders(list) {

    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );


    if (!list || list.length === 0) {

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
        list.map(order => {

            const items =
                order.items ||
                order.products ||
                [];


            const itemText =
                Array.isArray(items)
                    ? items.map(item =>
                        `${escapeHTML(
                            item.title ||
                            item.name ||
                            "Book"
                        )} × ${item.quantity || 1}`
                    ).join("<br>")
                    : "—";


            const total =
                Number(
                    order.total ||
                    order.totalAmount ||
                    0
                );


            const status =
                order.status ||
                "pending";


            const customer =
                order.customerName ||
                order.name ||
                order.customer?.name ||
                "Unknown";


            const date =
                order.createdAt ||
                order.date ||
                order.created ||
                null;


            return `

                <tr>

                    <td>
                        #${escapeHTML(
                            String(order.id || "N/A")
                        )}
                    </td>

                    <td>
                        ${escapeHTML(customer)}
                    </td>

                    <td class="order-items">
                        ${itemText}
                    </td>

                    <td>
                        ₦${total.toLocaleString()}
                    </td>

                    <td>

                        <span class="status">
                            ${escapeHTML(status)}
                        </span>

                    </td>

                    <td>
                        ${formatDate(date)}
                    </td>

                    <td>

                        <button
                            class="view-btn"
                            onclick="viewOrder('${order.id}')"
                        >
                            View
                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}


function filterOrders() {

    const search =
        document.getElementById(
            "searchInput"
        ).value
            .toLowerCase()
            .trim();


    const status =
        document.getElementById(
            "statusFilter"
        ).value;


    const filtered =
        orders.filter(order => {

            const customer =
                order.customerName ||
                order.name ||
                order.customer?.name ||
                "";


            const id =
                String(order.id || "");


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
                    "pending"
                ).toLowerCase();


            const matchesStatus =
                status === "all" ||
                orderStatus === status;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    renderOrders(filtered);

}


function viewOrder(id) {

    const order =
        orders.find(
            order =>
                String(order.id) === String(id)
        );


    if (!order) {
        return;
    }


    const items =
        order.items ||
        order.products ||
        [];


    const customer =
        order.customerName ||
        order.name ||
        order.customer?.name ||
        "Unknown";


    const email =
        order.email ||
        order.customer?.email ||
        "—";


    const phone =
        order.phone ||
        order.customer?.phone ||
        "—";


    const address =
        order.address ||
        order.shippingAddress ||
        order.customer?.address ||
        "—";


    const total =
        Number(
            order.total ||
            order.totalAmount ||
            0
        );


    const status =
        order.status ||
        "pending";


    const itemsHTML =
        Array.isArray(items)
            ? items.map(item => {

                const name =
                    item.title ||
                    item.name ||
                    "Book";

                const quantity =
                    item.quantity || 1;

                const price =
                    Number(
                        item.price || 0
                    );

                return `

                    <div class="item">

                        <span>
                            ${escapeHTML(name)}
                            × ${quantity}
                        </span>

                        <span>
                            ₦${(
                                price *
                                quantity
                            ).toLocaleString()}
                        </span>

                    </div>

                `;

            }).join("")
            : "<p>No item information.</p>";


    document.getElementById(
        "orderDetails"
    ).innerHTML = `

        <div class="order-detail">

            <h3>Order #${escapeHTML(
                String(order.id || "N/A")
            )}</h3>

            <p>
                Date:
                ${formatDate(
                    order.createdAt ||
                    order.date ||
                    order.created
                )}
            </p>

        </div>


        <div class="order-detail">

            <h3>Customer</h3>

            <p>
                Name: ${escapeHTML(customer)}
            </p>

            <p>
                Email: ${escapeHTML(email)}
            </p>

            <p>
                Phone: ${escapeHTML(phone)}
            </p>

            <p>
                Address: ${escapeHTML(address)}
            </p>

        </div>


        <div class="order-detail">

            <h3>Items</h3>

            <div class="items-list">
                ${itemsHTML}
            </div>

        </div>


        <div class="order-detail">

            <h3>Total</h3>

            <p>
                ₦${total.toLocaleString()}
            </p>

        </div>


        <div class="order-detail">

            <h3>Order Status</h3>
            <label for="orderStatus" class="sr-only">
                Order status
            </label>

            <select
                id="orderStatus"
                class="status-select"
            >

                <option value="pending"
                    ${status === "pending" ? "selected" : ""}>
                    Pending
                </option>

                <option value="processing"
                    ${status === "processing" ? "selected" : ""}>
                    Processing
                </option>

                <option value="shipped"
                    ${status === "shipped" ? "selected" : ""}>
                    Shipped
                </option>

                <option value="delivered"
                    ${status === "delivered" ? "selected" : ""}>
                    Delivered
                </option>

                <option value="cancelled"
                    ${status === "cancelled" ? "selected" : ""}>
                    Cancelled
                </option>

            </select>

            <button
                class="save-status-btn"
                onclick="updateOrderStatus('${order.id}')"
            >
                Update Status
            </button>

        </div>

    `;


    document.getElementById(
        "orderModal"
    ).classList.add("show");

}


async function updateOrderStatus(id) {

    const status =
        document.getElementById(
            "orderStatus"
        ).value;


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status
                    })
                }
            );


        if (!response.ok) {

            const result =
                await response.json()
                    .catch(() => ({}));

            throw new Error(
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

        console.error(error);

        alert(error.message);

    }

}


function closeModal(event) {

    if (
        event &&
        event.target !==
        document.getElementById("orderModal")
    ) {
        return;
    }

    document.getElementById(
        "orderModal"
    ).classList.remove("show");

}


function formatDate(date) {

    if (!date) {
        return "—";
    }

    const parsed =
        new Date(date);

    if (isNaN(parsed.getTime())) {
        return "—";
    }

    return parsed.toLocaleString();

}


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}