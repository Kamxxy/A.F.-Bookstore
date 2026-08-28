const fs =
    require("fs");

const path =
    require("path");

const {
    getBookById
} = require("./bookService");


/* =========================================================
   ORDER DATA PATH
========================================================= */

const ordersPath =
    path.join(
        __dirname,
        "../data/orders.json"
    );


/* =========================================================
   DELIVERY FEE
========================================================= */

const DELIVERY_FEE = 2000;


/* =========================================================
   READ ORDERS
========================================================= */

function getAllOrders() {

    try {

        const data =
            fs.readFileSync(
                ordersPath,
                "utf8"
            );

        return JSON.parse(data);

    }

    catch (error) {

        console.error(
            "Error reading orders.json:",
            error
        );

        throw new Error(
            "Unable to load order data"
        );

    }

}


/* =========================================================
   SAVE ORDERS
========================================================= */

function saveOrders(
    orders
) {

    fs.writeFileSync(

        ordersPath,

        JSON.stringify(
            orders,
            null,
            4
        ),

        "utf8"

    );

}


/* =========================================================
   GENERATE ORDER ID
========================================================= */

function generateOrderId() {

    const timestamp =
        Date.now();

    const random =
        Math.floor(
            1000 +
            Math.random() * 9000
        );

    return `AF-${timestamp}-${random}`;

}


/* =========================================================
   CREATE ORDER
========================================================= */

function createOrder(
    orderData
) {

    const {
        customer,
        delivery,
        items
    } = orderData;


    /* =====================================================
       VALIDATE ITEMS
    ===================================================== */

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        throw new Error(
            "Order must contain at least one item"
        );

    }


    /* =====================================================
       VALIDATE BOOKS AND BUILD SERVER-SIDE ITEMS
    ===================================================== */

    const orderItems = [];


    for (
        const item of items
    ) {

        const bookId =
            Number(
                item.bookId
            );

        const quantity =
            Number(
                item.quantity
            );


        if (
            !Number.isInteger(bookId) ||
            bookId <= 0
        ) {

            throw new Error(
                "Invalid book ID"
            );

        }


        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            throw new Error(
                "Invalid item quantity"
            );

        }


        /* =================================================
           GET REAL BOOK FROM SERVER
        ================================================= */

        const book =
            getBookById(
                bookId
            );


        if (!book) {

            throw new Error(
                `Book with ID ${bookId} was not found`
            );

        }


        /* =================================================
           CHECK STOCK
        ================================================= */

        const stock =
            Number(
                book.stockNumber
            ) || 0;


        if (
            stock <= 0
        ) {

            throw new Error(
                `"${book.title}" is currently out of stock`
            );

        }


        if (
            quantity > stock
        ) {

            throw new Error(
                `Only ${stock} cop${
                    stock === 1
                        ? "y"
                        : "ies"
                } of "${book.title}" are available`
            );

        }


        /* =================================================
           USE SERVER PRICE
        ================================================= */

        const price =
            Number(
                book.price
            );


        if (
            !Number.isFinite(price) ||
            price < 0
        ) {

            throw new Error(
                `Invalid price for "${book.title}"`
            );

        }


        orderItems.push({

            bookId:
                book.id,

            title:
                book.title,

            author:
                book.author,

            quantity,

            price,

            itemTotal:
                price * quantity

        });

    }


    /* =====================================================
       CALCULATE SUBTOTAL
    ===================================================== */

    const subtotal =
        orderItems.reduce(

            (
                total,
                item
            ) => {

                return total +
                    item.itemTotal;

            },

            0

        );


    /* =====================================================
       CALCULATE TOTAL
    ===================================================== */

    const deliveryFee =
        DELIVERY_FEE;


    const total =
        subtotal +
        deliveryFee;


    /* =====================================================
       CREATE ORDER
    ===================================================== */

    const order = {

        id:
            generateOrderId(),

        status:
            "pending_payment",

        paymentStatus:
            "unpaid",

        customer: {

            name:
                customer.name,

            email:
                customer.email,

            phone:
                customer.phone

        },

        delivery: {

            address:
                delivery.address,

            city:
                delivery.city,

            state:
                delivery.state

        },

        items:
            orderItems,

        subtotal,

        deliveryFee,

        total,

        currency:
            "NGN",

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    /* =====================================================
       SAVE ORDER
    ===================================================== */

    const orders =
        getAllOrders();


    orders.push(
        order
    );


    saveOrders(
        orders
    );


    return order;

}


/* =========================================================
   GET ORDER BY ID
========================================================= */

function getOrderById(
    id
) {

    const orders =
        getAllOrders();


    return orders.find(
        order =>
            order.id === id
    );

}

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

function updateOrderStatus(
    id,
    status
) {

    const allowedStatuses = [
        "pending_payment",
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
    ];


    if (
        !allowedStatuses.includes(
            status
        )
    ) {

        throw new Error(
            "Invalid order status"
        );

    }


    const orders =
        getAllOrders();


    const index =
        orders.findIndex(
            order =>
                String(order.id) ===
                String(id)
        );


    if (
        index === -1
    ) {

        return null;

    }


    orders[index].status =
        status;

    orders[index].updatedAt =
        new Date().toISOString();


    saveOrders(
        orders
    );


    return orders[index];

}

/* =========================================================
   ORDER STATUS TRACKING
========================================================= */

function getPublicOrderById(id) {

    const orders =
        getAllOrders();


    const order =
        orders.find(
            order =>
                String(order.id) ===
                String(id)
        );


    if (!order) {

        return null;

    }


    return {

        id:
            order.id,

        status:
            order.status,

        paymentStatus:
            order.paymentStatus,

        customer:
            order.customer,

        delivery:
            order.delivery,

        items:
            order.items.map(
                item => ({

                    title:
                        item.title,

                    author:
                        item.author,

                    quantity:
                        item.quantity,

                    price:
                        item.price,

                    itemTotal:
                        item.itemTotal

                })
            ),

        subtotal:
            order.subtotal,

        deliveryFee:
            order.deliveryFee,

        total:
            order.total,

        currency:
            order.currency,

        createdAt:
            order.createdAt,

        updatedAt:
            order.updatedAt

    };

}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    getAllOrders,

    getOrderById,

    getPublicOrderById,

    createOrder,

    updateOrderStatus

};module.exports = {

    getAllOrders,

    getOrderById,

    getPublicOrderById,

    createOrder,

    updateOrderStatus

};