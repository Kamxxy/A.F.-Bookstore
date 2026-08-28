const fs =
    require("fs");

const path =
    require("path");

const mongoose =
    require("mongoose");

const {
    isMongoConnected
} = require("../config/databaseState");

const Order =
    require("../models/Order");

const {
    getBookById,
    adjustBookStock,
    updateBook
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

const DELIVERY_FEE =
    2000;


/* =========================================================
   JSON HELPERS
========================================================= */

function readOrdersFromJSON() {

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


function saveOrdersToJSON(
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
   GET ALL ORDERS
========================================================= */

async function getAllOrders() {

    if (
        isMongoConnected()
    ) {

        try {

            return await Order
                .find()
                .sort({
                    createdAt: -1
                })
                .lean();

        }

        catch (error) {

            console.error(
                "MongoDB getAllOrders failed:",
                error.message
            );

            throw error;

        }

    }


    return readOrdersFromJSON();

}


/* =========================================================
   GET ORDER BY ID
========================================================= */

async function getOrderById(
    id,
    session = null
) {

    if (
        isMongoConnected()
    ) {

        try {

            const query =
                Order.findOne({
                    id: String(id)
                });


            if (
                session
            ) {

                query.session(
                    session
                );

            }


            return await query.lean();

        }

        catch (error) {

            console.error(
                "MongoDB getOrderById failed:",
                error.message
            );

            throw error;

        }

    }


    const orders =
        readOrdersFromJSON();

    return orders.find(

        order =>
            String(order.id) ===
            String(id)

    );

}


/* =========================================================
   BUILD ORDER ITEMS
========================================================= */

async function buildOrderItems(
    items,
    session = null
) {

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


        const book =
            await getBookById(
                bookId,
                session
            );


        if (
            !book
        ) {

            throw new Error(
                `Book with ID ${bookId} was not found`
            );

        }


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


    return orderItems;

}


/* =========================================================
   CREATE ORDER
========================================================= */

async function createOrder(
    orderData
) {

    const {
        customer,
        delivery,
        items
    } = orderData;


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        throw new Error(
            "Order must contain at least one item"
        );

    }


    /* =====================================================
       MONGODB TRANSACTION
    ===================================================== */

    if (
        isMongoConnected()
    ) {

        const session =
            await mongoose.startSession();


        try {

            let createdOrder;


            await session.withTransaction(

                async () => {

                    /* =====================================
                       VALIDATE ITEMS
                    ===================================== */

                    const orderItems =
                        await buildOrderItems(
                            items,
                            session
                        );


                    /* =====================================
                       CALCULATE TOTALS
                    ===================================== */

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


                    const deliveryFee =
                        DELIVERY_FEE;


                    const total =
                        subtotal +
                        deliveryFee;


                    /* =====================================
                       DEDUCT INVENTORY
                    ===================================== */

                    for (
                        const item of orderItems
                    ) {

                        await adjustBookStock(

                            item.bookId,

                            -item.quantity,

                            session

                        );

                    }


                    /* =====================================
                       CREATE ORDER
                    ===================================== */

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
                            "NGN"

                    };


                    const documents =
                        await Order.create(

                            [order],

                            {
                                session
                            }

                        );


                    createdOrder =
                        documents[0].toObject();

                }

            );


            return createdOrder;

        }

        catch (error) {

            console.error(
                "MongoDB createOrder transaction failed:",
                error.message
            );

            throw error;

        }

        finally {

            await session.endSession();

        }

    }


    /* =====================================================
       JSON MODE
    ===================================================== */

    const orderItems =
        await buildOrderItems(
            items
        );


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


    const deliveryFee =
        DELIVERY_FEE;


    const total =
        subtotal +
        deliveryFee;


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
            "NGN"

    };


    /*
     * JSON does not have database transactions.
     *
     * We therefore deduct stock only after all
     * validation has completed.
     */

    for (
        const item of orderItems
    ) {

        await adjustBookStock(

            item.bookId,

            -item.quantity

        );

    }


    const orders =
        readOrdersFromJSON();


    orders.push({

        ...order,

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    });


    saveOrdersToJSON(
        orders
    );


    return orders[
        orders.length - 1
    ];

}


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

async function updateOrderStatus(
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


    /* =====================================================
       MONGODB TRANSACTION
    ===================================================== */

    if (
        isMongoConnected()
    ) {

        const session =
            await mongoose.startSession();


        try {

            let updatedOrder;


            await session.withTransaction(

                async () => {

                    const order =
                        await getOrderById(
                            id,
                            session
                        );


                    if (
                        !order
                    ) {

                        throw new Error(
                            "Order not found"
                        );

                    }


                    const previousStatus =
                        order.status;


                    if (
                        previousStatus === status
                    ) {

                        updatedOrder =
                            order;

                        return;

                    }


                    /* =================================
                       CANCEL ORDER
                    ================================= */

                    if (

                        previousStatus !==
                            "cancelled" &&

                        status ===
                            "cancelled"

                    ) {

                        for (
                            const item of order.items
                        ) {

                            await adjustBookStock(

                                item.bookId,

                                Number(
                                    item.quantity
                                ),

                                session

                            );

                        }

                    }


                    /* =================================
                       REACTIVATE ORDER
                    ================================= */

                    if (

                        previousStatus ===
                            "cancelled" &&

                        status !==
                            "cancelled"

                    ) {

                        /* =============================
                           CHECK STOCK
                        ============================= */

                        for (
                            const item of order.items
                        ) {

                            const book =
                                await getBookById(

                                    item.bookId,

                                    session

                                );


                            if (
                                !book
                            ) {

                                throw new Error(

                                    `Book with ID ${item.bookId} was not found`

                                );

                            }


                            const stock =
                                Number(
                                    book.stockNumber
                                ) || 0;


                            const quantity =
                                Number(
                                    item.quantity
                                );


                            if (
                                stock < quantity
                            ) {

                                throw new Error(

                                    `Not enough stock for "${book.title}". Only ${stock} ${
                                        stock === 1
                                            ? "copy"
                                            : "copies"
                                    } available, but this order requires ${quantity}.`

                                );

                            }

                        }


                        /* =============================
                           DEDUCT STOCK
                        ============================= */

                        for (
                            const item of order.items
                        ) {

                            await adjustBookStock(

                                item.bookId,

                                -Number(
                                    item.quantity
                                ),

                                session

                            );

                        }

                    }


                    /* =================================
                       UPDATE ORDER
                    ================================= */

                    updatedOrder =
                        await Order.findOneAndUpdate(

                            {
                                id:
                                    String(id)
                            },

                            {

                                $set: {

                                    status,

                                    updatedAt:
                                        new Date()

                                }

                            },

                            {

                                new: true,

                                session

                            }

                        ).lean();


                    if (
                        !updatedOrder
                    ) {

                        throw new Error(
                            "Order could not be updated"
                        );

                    }

                }

            );


            return updatedOrder;

        }

        catch (error) {

            console.error(

                "MongoDB updateOrderStatus transaction failed:",

                error.message

            );

            throw error;

        }

        finally {

            await session.endSession();

        }

    }


    /* =====================================================
       JSON MODE
    ===================================================== */

    const orders =
        readOrdersFromJSON();


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


    if (
        previousStatus === status
    ) {

        return order;

    }


    /* ================================================
       CANCEL
    ================================================ */

    if (

        previousStatus !==
            "cancelled" &&

        status ===
            "cancelled"

    ) {

        for (
            const item of order.items
        ) {

            await adjustBookStock(

                item.bookId,

                Number(
                    item.quantity
                )

            );

        }

    }


    /* ================================================
       REACTIVATE
    ================================================ */

    if (

        previousStatus ===
            "cancelled" &&

        status !==
            "cancelled"

    ) {

        for (
            const item of order.items
        ) {

            const book =
                await getBookById(
                    item.bookId
                );


            if (
                !book
            ) {

                throw new Error(

                    `Book with ID ${item.bookId} was not found`

                );

            }


            const stock =
                Number(
                    book.stockNumber
                ) || 0;


            const quantity =
                Number(
                    item.quantity
                );


            if (
                stock < quantity
            ) {

                throw new Error(

                    `Not enough stock for "${book.title}". Only ${stock} ${
                        stock === 1
                            ? "copy"
                            : "copies"
                    } available, but this order requires ${quantity}.`

                );

            }

        }


        for (
            const item of order.items
        ) {

            await adjustBookStock(

                item.bookId,

                -Number(
                    item.quantity
                )

            );

        }

    }


    orders[index].status =
        status;


    orders[index].updatedAt =
        new Date().toISOString();


    saveOrdersToJSON(
        orders
    );


    return orders[index];

}


/* =========================================================
   PUBLIC ORDER
========================================================= */

async function getPublicOrderById(
    id
) {

    const order =
        await getOrderById(
            id
        );


    if (
        !order
    ) {

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