/* =========================================================
   A.F. BOOKSTORE
   ADMIN JAVASCRIPT
========================================================= */
if (!requireAdminAuth()) {
    window.location.href = "/admin/login";
}

/* =========================================================
   BOOK INVENTORY
========================================================= */

async function loadBookStats() {

    try {

        /* ================= BOOKS ================= */

        const response =
            await fetch("/api/books");


        if (!response.ok) {

            throw new Error(
                `Failed to load books: ${response.status}`
            );

        }


        const booksResult =
            await response.json();


        console.log(
            "Books API result:",
            booksResult
        );


        if (
            !booksResult ||
            !Array.isArray(booksResult.books)
        ) {

            throw new Error(
                "Books API did not return a valid books array"
            );

        }


        const books =
            booksResult.books;


        console.log(
            "Admin books:",
            books
        );


        /* ================= ORDERS ================= */

        const response2 =
            await fetch("/api/orders");


        if (!response2.ok) {

            throw new Error(
                `Failed to load orders: ${response2.status}`
            );

        }


        const ordersResult =
            await response2.json();


        console.log(
            "Orders API result:",
            ordersResult
        );


        /*
         * If /api/orders returns an array directly,
         * use it.
         *
         * If it returns:
         *
         * {
         *     success: true,
         *     orders: [...]
         * }
         *
         * use ordersResult.orders instead.
         */

        const orders =
            Array.isArray(ordersResult)
                ? ordersResult
                : ordersResult.orders;


        if (!Array.isArray(orders)) {

            throw new Error(
                "Orders API did not return a valid orders array"
            );

        }


        /* ================= STATISTICS ================= */

        const totalBooks =
            books.length;


        const totalOrders =
            orders.length;


        const outOfStock =
            books.filter(
                book =>
                    String(
                        book.stockStatus || ""
                    ).toLowerCase() === "out of stock"
            ).length;


        const inStock =
            books.filter(
                book =>
                    Number(
                        book.stockNumber || 0
                    ) > 0
            ).length;


        const lowStock =
            books.filter(
                book => {

                    const stock =
                        Number(
                            book.stockNumber || 0
                        );


                    return (
                        stock > 0 &&
                        stock <= 5
                    );

                }
            ).length;


        /* ================= UPDATE DASHBOARD ================= */

        document.getElementById(
            "totalBooks"
        ).textContent =
            totalBooks;


        document.getElementById(
            "totalOrders"
        ).textContent =
            totalOrders;


        document.getElementById(
            "lowStock"
        ).textContent =
            lowStock;


        document.getElementById(
            "outOfStock"
        ).textContent =
            outOfStock;


        document.getElementById(
            "inStock"
        ).textContent =
            inStock;


        document.getElementById(
            "inventoryLowStock"
        ).textContent =
            lowStock;


        document.getElementById(
            "inventoryOutOfStock"
        ).textContent =
            outOfStock;


        /* ================= RECENT ORDERS ================= */

        renderRecentOrders(
            orders
        );


    }

    catch (error) {

        console.error(
            "Admin dashboard error:",
            error
        );

    }

}

/* =========================================================
   RECENT ORDERS
========================================================= */

function renderRecentOrders(
    orders
) {

    const container =
        document.getElementById(
            "recentOrders"
        );


    if (!container) {
        return;
    }


    if (
        !Array.isArray(orders) ||
        orders.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-panel">

                <span>
                    ◌
                </span>

                <p>
                    No orders available yet.
                </p>

            </div>
        `;

        return;

    }


    const recentOrders =
        [...orders]
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    )
            )
            .slice(
                0,
                5
            );


    container.innerHTML =
        recentOrders
            .map(
                order => {

                    const customer =
                        order.customer?.name ||
                        "Unknown";


                    const items =
                        Array.isArray(
                            order.items
                        )
                            ? order.items
                            : [];


                    const itemCount =
                        items.reduce(
                            (
                                total,
                                item
                            ) =>
                                total +
                                (
                                    Number(
                                        item.quantity
                                    ) || 1
                                ),
                            0
                        );


                    const total =
                        Number(
                            order.total || 0
                        );


                    const status =
                        order.status ||
                        "pending_payment";


                    return `

                        <div class="recent-order">

                            <div class="recent-order-info">

                                <strong>
                                    ${escapeHTML(
                                        customer
                                    )}
                                </strong>

                                <span>
                                    #${escapeHTML(
                                        String(
                                            order.id ||
                                            "N/A"
                                        )
                                    )}
                                </span>

                            </div>


                            <div class="recent-order-items">

                                <span>
                                    ${itemCount}
                                    ${
                                        itemCount === 1
                                            ? "item"
                                            : "items"
                                    }
                                </span>

                                <span>
                                    ₦${total.toLocaleString(
                                        "en-NG"
                                    )}
                                </span>

                            </div>


                            <div class="recent-order-meta">

                                <span
                                    class="recent-order-status status-${escapeHTML(
                                        status
                                    )}"
                                >
                                    ${escapeHTML(
                                        formatStatus(
                                            status
                                        )
                                    )}
                                </span>

                                <span>
                                    ${formatDate(
                                        order.createdAt
                                    )}
                                </span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}

function formatStatus(status) {

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


function formatDate(date) {

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


function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}

document.addEventListener(
    "DOMContentLoaded",
    loadBookStats
);