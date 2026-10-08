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

const {
    toKobo
} = require("./paymentService");


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
   PAYMENT RESERVATION WINDOW
   A new order reserves stock for this long. If payment
   is not confirmed within the window, the reservation
   is released and the order is cancelled.
======================================================== */

const PAYMENT_RESERVATION_MINUTES =
    30;


const PAYMENT_RESERVATION_MS =
    PAYMENT_RESERVATION_MINUTES *
    60 *
    1000;


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

    return `AFORDER-${timestamp}-${random}`;

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
                            "pending",

                        paymentStatus:
                            "unpaid",

                        reservationExpiresAt:
                            new Date(
                                Date.now() +
                                PAYMENT_RESERVATION_MS
                            ),

                        customer: {

                            name:
                                customer.name,

                            email:
                                customer.email,

                            phone:
                                customer.phone

                        },

                        delivery,

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
            "pending",

        paymentStatus:
            "unpaid",

        reservationExpiresAt:
            new Date(
                Date.now() +
                PAYMENT_RESERVATION_MS
            ).toISOString(),

        customer: {

            name:
                customer.name,

            email:
                customer.email,

            phone:
                customer.phone

        },

        delivery,

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
                       Restore stock only if the order
                       has NOT been paid. Paid orders
                       require manual refund handling.
                    ================================= */

                    if (

                        previousStatus !==
                            "cancelled" &&

                        status ===
                            "cancelled"

                    ) {

                        const paymentStatus =
                            order.paymentStatus;

                        if (
                            (
                                paymentStatus === "unpaid" ||
                                paymentStatus === "failed"
                            ) &&
                            !order.reservationReleasedAt
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

                                    ...(
                                        status !== "cancelled" &&
                                        previousStatus === "cancelled" &&
                                        order.paymentStatus === "unpaid"
                                            ? {
                                                reservationReleasedAt:
                                                    null,
                                                reservationExpiresAt:
                                                    new Date(
                                                        Date.now() +
                                                        PAYMENT_RESERVATION_MS
                                                    )
                                            }
                                            : {}
                                    ),

                                    ...(
                                        status === "cancelled" &&
                                        (
                                            order.paymentStatus === "unpaid" ||
                                            order.paymentStatus === "failed"
                                        ) &&
                                        !order.reservationReleasedAt
                                            ? {
                                                reservationReleasedAt:
                                                    new Date()
                                            }
                                            : {}
                                    ),

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
       Restore stock only if the order has NOT been
       paid. Paid orders require manual refund handling.
    ================================================ */

    if (

        previousStatus !==
            "cancelled" &&

        status ===
            "cancelled"

    ) {

        const paymentStatus =
            order.paymentStatus;

        if (
            (
                paymentStatus === "unpaid" ||
                paymentStatus === "failed"
            ) &&
            !order.reservationReleasedAt
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


    if (
        status !== "cancelled" &&
        previousStatus === "cancelled" &&
        order.paymentStatus === "unpaid"
    ) {

        orders[index].reservationReleasedAt =
            null;

        orders[index].reservationExpiresAt =
            new Date(
                Date.now() +
                PAYMENT_RESERVATION_MS
            ).toISOString();

    }


    if (
        status === "cancelled" &&
        (
            order.paymentStatus === "unpaid" ||
            order.paymentStatus === "failed"
        ) &&
        !order.reservationReleasedAt
    ) {

        orders[index].reservationReleasedAt =
            new Date().toISOString();

    }


    orders[index].updatedAt =
        new Date().toISOString();


    saveOrdersToJSON(
        orders
    );


    return orders[index];

}


/* =========================================================
   MARK ORDER AS PAID
   Atomic, idempotent payment state update.
   Returns { order, status } where status is one of:
   - "paid"           → payment recorded successfully
   - "already_paid"   → same reference, idempotent success
   - "duplicate_paid" → different reference, manual review needed
========================================================= */

async function markOrderAsPaid(
    orderId,
    paymentData
) {

    if (
        !isMongoConnected()
    ) {

        throw new Error(
            "Payment processing is temporarily unavailable. Please try again later."
        );

    }

    const {
        reference,
        amount,
        currency,
        channel,
        paidAt
    } = paymentData;

    /* =====================================================
       VALIDATE INPUTS
    ===================================================== */

    if (
        !reference ||
        typeof reference !== "string"
    ) {

        throw new Error(
            "Invalid payment reference."
        );

    }

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        throw new Error(
            "Invalid payment amount."
        );

    }

    if (
        currency !== "NGN"
    ) {

        throw new Error(
            "Invalid payment currency."
        );

    }

    /* =====================================================
       LOOKUP ORDER
    ===================================================== */

    const order =
        await getOrderById(
            orderId
        );

    if (
        !order
    ) {

        throw new Error(
            "Order not found."
        );

    }

    /* =====================================================
       VALIDATE AMOUNT AGAINST STORED ORDER TOTAL
       This must happen BEFORE already-paid checks to ensure
       every payment is validated against the order.
    ===================================================== */

    const expectedKobo =
        toKobo(order.total);

    if (
        amount !== expectedKobo
    ) {

        throw new Error(
            "Payment amount does not match order total."
        );

    }

    /* =====================================================
       CASE B: ALREADY PAID — SAME REFERENCE
       Idempotent success. Do not modify anything.
    ===================================================== */

    if (
        order.paymentStatus === "paid" &&
        order.transactionReference === reference
    ) {

        return {
            order: order,
            status: "already_paid"
        };

    }

    /* =====================================================
       CASE C: ALREADY PAID — DIFFERENT REFERENCE
       Preserve original payment. Log for manual review.
    ===================================================== */

    if (
        order.paymentStatus === "paid" &&
        order.transactionReference !== reference
    ) {

        console.error(
            `DUPLICATE PAYMENT: Order ${order.id} already paid with reference ${order.transactionReference}. ` +
            `Additional successful transaction detected: ${reference}. ` +
            `Amount: ${amount} kobo. Manual review/refund required.`
        );

        return {
            order: order,
            status: "duplicate_paid"
        };

    }

    /* =====================================================
       CASE A: RESERVATION NO LONGER ACTIVE
       An expired/cancelled unpaid reservation must NOT
       silently become paid. Preserve the payment evidence
       (handled by caller via status) and flag for manual
       review / refund workflow.
    ===================================================== */

    if (
        order.paymentStatus === "unpaid"
    ) {

        const windowExpired =
            order.reservationExpiresAt &&
            new Date(
                order.reservationExpiresAt
            ) <= new Date();

        if (
            order.status === "cancelled" ||
            order.reservationReleasedAt ||
            windowExpired
        ) {

            /*
             * If the window passed but the cleanup
             * has not run yet, expire it now
             * (idempotent).
             */

            if (
                !order.reservationReleasedAt
            ) {

                await expireOrderReservation(
                    orderId
                );

            }

            console.error(
                `Payment success arrived for order ${order.id} ` +
                `after its reservation expired (reference ${reference}). ` +
                `Order NOT marked paid. Manual review/refund required.`
            );

            const currentOrder =
                await getOrderById(
                    orderId
                );

            return {
                order: currentOrder,
                status: "reservation_expired"
            };

        }

    }

    /* =====================================================
       CASE B: UNPAID — RECORD PAYMENT
       Use atomic conditional update to prevent race conditions.
       Only succeeds if paymentStatus is still not "paid".
       NOTE: stock was already reserved at order creation;
       successful payment makes the reservation permanent
       and must NOT decrement stock again.
    ===================================================== */

    const paidAtDate =
        paidAt
            ? new Date(paidAt)
            : new Date();

    const updatedOrder =
        await Order.findOneAndUpdate(

            {
                id: String(orderId),
                paymentStatus: {
                    $ne: "paid"
                }
            },

            {
                $set: {
                    paymentStatus: "paid",
                    transactionReference: reference,
                    paymentMethod: channel || null,
                    paidAt: paidAtDate,
                    updatedAt: new Date()
                }
            },

            {
                new: true
            }

        ).lean();

    /* =====================================================
       If no document was updated, another concurrent
       request already marked the order as paid.
    ===================================================== */

    if (
        !updatedOrder
    ) {

        const currentOrder =
            await getOrderById(
                orderId
            );

        if (
            currentOrder?.paymentStatus === "paid"
        ) {

            if (
                currentOrder.transactionReference === reference
            ) {

                return {
                    order: currentOrder,
                    status: "already_paid"
                };

            }

            console.error(
                `DUPLICATE PAYMENT (race): Order ${order.id} already paid with reference ${currentOrder.transactionReference}. ` +
                `Additional successful transaction detected: ${reference}. ` +
                `Manual review/refund required.`
            );

            return {
                order: currentOrder,
                status: "duplicate_paid"
            };

        }

        throw new Error(
            "Unable to update order payment status."
        );

    }

    console.log(
        `Payment recorded for order ${order.id}. Reference: ${reference}.`
    );

    return {
        order: updatedOrder,
        status: "paid"
    };

}

/* =========================================================
   MARK PAYMENT FAILED
   Only for definitive Paystack payment failures.
   Does NOT restore stock or cancel the order.
========================================================= */

async function markPaymentFailed(
    orderId
) {

    if (
        !isMongoConnected()
    ) {

        throw new Error(
            "Payment processing is temporarily unavailable. Please try again later."
        );

    }

    const order =
        await getOrderById(
            orderId
        );

    if (
        !order
    ) {

        throw new Error(
            "Order not found."
        );

    }

    /* =====================================================
       Do NOT change paid orders to failed.
    ===================================================== */

    if (
        order.paymentStatus === "paid"
    ) {

        throw new Error(
            "Cannot mark a paid order as failed."
        );

    }

    /* =====================================================
       Idempotently claim the reservation release.
       The first caller to set reservationReleasedAt
       is responsible for restoring stock; later
       duplicate callbacks/webhooks do not restore
       again.
    ===================================================== */

    const claimed =
        await Order.findOneAndUpdate(

            {
                id: String(orderId),
                paymentStatus: {
                    $ne: "paid"
                },
                $or: [
                    { reservationReleasedAt: null },
                    { reservationReleasedAt: { $exists: false } }
                ]
            },

            {
                $set: {
                    paymentStatus: "failed",
                    reservationReleasedAt: new Date(),
                    updatedAt: new Date()
                }
            },

            {
                new: true
            }

        ).lean();


    if (claimed) {

        for (
            const item of claimed.items
        ) {

            await adjustBookStock(

                item.bookId,

                Number(item.quantity)

            );

        }

        console.log(
            `Payment marked as failed for order ${orderId}. Reserved stock released.`
        );

        return claimed;

    }


    /* =====================================================
       Already released/failed — idempotent no-op.
    ===================================================== */

    const updatedOrder =
        await Order.findOneAndUpdate(

            {
                id: String(orderId),
                paymentStatus: {
                    $ne: "paid"
                }
            },

            {
                $set: {
                    paymentStatus: "failed",
                    updatedAt: new Date()
                }
            },

            {
                new: true
            }

        ).lean();

    if (
        !updatedOrder
    ) {

        throw new Error(
            "Unable to update payment status."
        );

    }

    console.log(
        `Payment marked as failed for order ${orderId}. Stock already released — no duplicate restore.`
    );

    return updatedOrder;

}

/* =========================================================
   RESERVATION HELPERS
======================================================== */

function isReservationExpired(
    order
) {

    if (
        !order ||
        order.paymentStatus !== "unpaid"
    ) {

        return false;

    }

    if (
        order.status === "cancelled"
    ) {

        return true;

    }

    if (
        order.reservationReleasedAt
    ) {

        return true;

    }

    if (
        order.reservationExpiresAt &&
        new Date(
            order.reservationExpiresAt
        ) <= new Date()
    ) {

        return true;

    }

    return false;

}


/* =========================================================
   EXPIRE ORDER RESERVATION
   Idempotent. Releases reserved stock exactly once,
   marks the order cancelled with paymentStatus unpaid.
======================================================== */

async function expireOrderReservation(
    orderId
) {

    if (
        !isMongoConnected()
    ) {

        return null;

    }

    const claimed =
        await Order.findOneAndUpdate(

            {
                id: String(orderId),
                paymentStatus: "unpaid",
                status: {
                    $ne: "cancelled"
                },
                $or: [
                    { reservationReleasedAt: null },
                    { reservationReleasedAt: { $exists: false } }
                ]
            },

            {
                $set: {
                    status: "cancelled",
                    reservationReleasedAt: new Date(),
                    updatedAt: new Date()
                }
            },

            {
                new: true
            }

        ).lean();

    if (
        !claimed
    ) {

        return null;

    }

    for (
        const item of claimed.items
    ) {

        try {

            await adjustBookStock(

                item.bookId,

                Number(item.quantity)

            );

        } catch (error) {

            console.error(
                `Failed to restore stock for book ${item.bookId} ` +
                `while expiring order ${orderId}: ${error.message}`
            );

        }

    }

    console.log(
        `Reservation expired for order ${orderId}. Stock released.`
    );

    return claimed;

}


/* =========================================================
   CLEANUP EXPIRED RESERVATIONS
   Periodic sweep. Idempotent.
======================================================== */

async function cleanupExpiredReservations() {

    if (
        !isMongoConnected()
    ) {

        return 0;

    }

    try {

        const expired =
            await Order.find({

                paymentStatus: "unpaid",

                status: {
                    $ne: "cancelled"
                },

                reservationExpiresAt: {
                    $lte: new Date()
                },

                $or: [
                    { reservationReleasedAt: null },
                    { reservationReleasedAt: { $exists: false } }
                ]

            })

                .select("id")

                .lean();

        let released =
            0;

        for (
            const order of expired
        ) {

            const result =
                await expireOrderReservation(
                    order.id
                );

            if (
                result
            ) {

                released++;

            }

        }

        if (
            released > 0
        ) {

            console.log(
                `Reservation cleanup: expired ${released} order(s).`
            );

        }

        return released;

    } catch (error) {

        console.error(
            "Reservation cleanup failed:",
            error.message
        );

        return 0;

    }

}


/* =========================================================
   PREPARE ORDER FOR PAYMENT
   Called before initializing a Paystack transaction.
   Returns the payable order, or throws an Error with
   .code of:
     "not_found" | "already_paid" | "reservation_expired" |
     "stock_unavailable"
======================================================== */

async function prepareOrderForPayment(
    orderId
) {

    if (
        !isMongoConnected()
    ) {

        throw new Error(
            "Payment processing is temporarily unavailable. Please try again later."
        );

    }

    const order =
        await getOrderById(
            orderId
        );

    if (
        !order
    ) {

        const error =
            new Error(
                "Order not found"
            );
        error.code =
            "not_found";
        throw error;

    }

    if (
        order.paymentStatus === "paid"
    ) {

        const error =
            new Error(
                "This order has already been paid"
            );
        error.code =
            "already_paid";
        throw error;

    }

    /* =============================================
       UNPAID
    ============================================== */

    if (
        order.paymentStatus === "unpaid"
    ) {

        if (
            order.status === "cancelled" ||
            order.reservationReleasedAt
        ) {

            const error =
                new Error(
                    "The payment window for this order has expired. Please place a new order."
                );
            error.code =
                "reservation_expired";
            throw error;

        }

        if (
            order.reservationExpiresAt &&
            new Date(
                order.reservationExpiresAt
            ) <= new Date()
        ) {

            await expireOrderReservation(
                orderId
            );

            const error =
                new Error(
                    "The payment window for this order has expired. Please place a new order."
                );
            error.code =
                "reservation_expired";
            throw error;

        }

        return order;

    }

    /* =============================================
       FAILED — allow retry on the SAME order.
       Re-reserve stock (it was released on failure).
    ============================================== */

    if (
        order.paymentStatus === "failed"
    ) {

        if (
            order.reservationReleasedAt
        ) {

            for (
                const item of order.items
            ) {

                const book =
                    await getBookById(
                        item.bookId
                    );

                const available =
                    Number(
                        book?.stockNumber
                    ) || 0;

                if (
                    !book ||
                    available <
                    Number(
                        item.quantity
                    )
                ) {

                    const error =
                        new Error(
                            `Not enough stock available for "${item.title}" to retry payment.`
                        );
                    error.code =
                        "stock_unavailable";
                    throw error;

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

        const reactivated =
            await Order.findOneAndUpdate(

                {
                    id: String(orderId),
                    paymentStatus: "failed"
                },

                {
                    $set: {
                        paymentStatus: "unpaid",
                        status:
                            order.status === "cancelled"
                                ? "pending"
                                : order.status,
                        reservationReleasedAt: null,
                        reservationExpiresAt:
                            new Date(
                                Date.now() +
                                PAYMENT_RESERVATION_MS
                            ),
                        updatedAt: new Date()
                    }
                },

                {
                    new: true
                }

            ).lean();

        if (
            !reactivated
        ) {

            throw new Error(
                "Unable to prepare this order for payment."
            );

        }

        return reactivated;

    }

    throw new Error(
        "Unable to prepare this order for payment."
    );

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
            order.updatedAt,

        reservationExpiresAt:
            order.reservationExpiresAt ||
            null,

        reservationReleasedAt:
            order.reservationReleasedAt ||
            null,

        reservationExpired:
            isReservationExpired(
                order
            )

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

    updateOrderStatus,

    markOrderAsPaid,

    markPaymentFailed,

    prepareOrderForPayment,

    cleanupExpiredReservations,

    expireOrderReservation,

    isReservationExpired,

    PAYMENT_RESERVATION_MINUTES

};