const fs =
    require("fs");

const path =
    require("path");

const {
    getBookById,
    adjustBookStock
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


        return JSON.parse(
            data
        );

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
       VALIDATE ALL BOOKS FIRST
       
       Nothing is changed yet.
    ===================================================== */

    const orderItems = [];

    const stockChanges = [];


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


        /*
           Record the stock change.

           We DON'T modify the book yet.
        */

        stockChanges.push({

            bookId:
                book.id,

            quantity:
                quantity

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
       RESERVE / DEDUCT STOCK
       
       Every item was already validated above.
    ===================================================== */

    try {

        for (
            const change of stockChanges
        ) {

            adjustBookStock(

                change.bookId,

                -change.quantity

            );

        }

    }

    catch (error) {

        /*
           If something unexpectedly fails while
           adjusting stock, stop the order.
        */

        throw new Error(
            error.message ||
            "Unable to update book stock"
        );

    }


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


    /* =====================================================
       VALIDATE STATUS
    ===================================================== */

    if (
        !allowedStatuses.includes(
            status
        )
    ) {

        throw new Error(
            "Invalid order status"
        );

    }


    /* =====================================================
       LOAD ORDERS
    ===================================================== */

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


    const order =
        orders[index];


    const previousStatus =
        order.status;


    /* =====================================================
       NO CHANGE NEEDED
       
       If the status is already the requested status,
       do not touch inventory.
    ===================================================== */

    if (
        previousStatus === status
    ) {

        return order;

    }


    /* =====================================================
       LOAD BOOKS
    ===================================================== */

    const {
        getBookById,
        updateBook
    } = require("./bookService");


    /* =====================================================
       CANCEL ORDER
       
       ACTIVE → CANCELLED

       Restore the quantity that was originally deducted
       when the order was created.
    ===================================================== */

    if (
        previousStatus !== "cancelled" &&
        status === "cancelled"
    ) {

        for (
            const item of order.items
        ) {

            const book =
                getBookById(
                    item.bookId
                );


            if (!book) {

                throw new Error(
                    `Book with ID ${item.bookId} was not found`
                );

            }


            const currentStock =
                Number(
                    book.stockNumber
                ) || 0;


            const quantity =
                Number(
                    item.quantity
                );


            updateBook(
                item.bookId,
                {
                    stockNumber:
                        currentStock +
                        quantity
                }
            );

        }

    }


    /* =====================================================
       REACTIVATE CANCELLED ORDER
       
       CANCELLED → ACTIVE

       Deduct the order quantity again because the order
       is no longer cancelled.
    ===================================================== */

    if (
        previousStatus === "cancelled" &&
        status !== "cancelled"
    ) {

        /* ================================================
           FIRST CHECK ALL STOCK

           We do this BEFORE changing anything so that
           a partially-restored order cannot occur.
        ================================================= */

        for (
            const item of order.items
        ) {

            const book =
                getBookById(
                    item.bookId
                );


            if (!book) {

                throw new Error(
                    `Book with ID ${item.bookId} was not found`
                );

            }


            const currentStock =
                Number(
                    book.stockNumber
                ) || 0;


            const quantity =
                Number(
                    item.quantity
                );


            if (
                currentStock < quantity
            ) {

                throw new Error(
                    `Not enough stock for "${book.title}". Only ${currentStock} ${
                        currentStock === 1
                            ? "copy"
                            : "copies"
                    } available, but this order requires ${quantity}.`
                );

            }

        }


        /* ================================================
           NOW DEDUCT STOCK
        ================================================= */

        for (
            const item of order.items
        ) {

            const book =
                getBookById(
                    item.bookId
                );


            const currentStock =
                Number(
                    book.stockNumber
                ) || 0;


            const quantity =
                Number(
                    item.quantity
                );


            updateBook(
                item.bookId,
                {
                    stockNumber:
                        currentStock -
                        quantity
                }
            );

        }

    }


    /* =====================================================
       UPDATE ORDER STATUS
    ===================================================== */

    order.status =
        status;


    order.updatedAt =
        new Date().toISOString();


    /* =====================================================
       SAVE ORDER
    ===================================================== */

    saveOrders(
        orders
    );


    return order;

}


/* =========================================================
   ORDER STATUS TRACKING
========================================================= */

function getPublicOrderById(
    id
) {

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

};