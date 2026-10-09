const {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    getPublicOrderById
} = require("../services/orderService");

const {
    validateStructuredDelivery,
    buildDeliveryRecord
} = require("../services/deliveryService");

const {
    sendOrderReceivedEmail,
    sendOrderStatusEmail,
    sendOrderCancellationEmail
} = require("../services/emailService");


/* =========================================================
   CREATE ORDER
========================================================= */

async function create(
    req,
    res
) {

    try {

        const {
            customer,
            delivery,
            items
        } = req.body;


        /* =================================================
           CUSTOMER VALIDATION
        ================================================= */

        if (
            !customer ||
            typeof customer !== "object"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Customer information is required"

            });

        }


        if (
            !customer.name ||
            !customer.email ||
            !customer.phone
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, email and phone are required"

            });

        }


        /* =================================================
           DELIVERY VALIDATION
        ================================================= */

        if (
            !delivery ||
            typeof delivery !== "object"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Delivery information is required"

            });

        }


        const deliveryCheck =
            validateStructuredDelivery(
                delivery
            );

        if (!deliveryCheck.valid) {

            return res.status(400).json({

                success: false,

                message:
                    deliveryCheck.message

            });

        }


        /* =================================================
           ITEM VALIDATION
        ================================================= */

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Your cart is empty"

            });

        }


        /* =================================================
           CREATE ORDER
        ================================================= */

        const order =
            await createOrder({

                customer: {

                    name:
                        customer.name.trim(),

                    email:
                        customer.email.trim(),

                    phone:
                        customer.phone.trim()

                },

                delivery:
                    buildDeliveryRecord(
                        delivery
                    ),

                items

            });


        /* =================================================
           RESPONSE
           Business operation has committed. Fire the
           order-received notification without blocking
           the response and without affecting it.
        ================================================= */

        sendOrderReceivedEmail(order).catch(() => {});

        return res.status(201).json({

            success: true,

            message:
                "Order created successfully",

            order: {

                id:
                    order.id,

                status:
                    order.status,

                paymentStatus:
                    order.paymentStatus,

                items:
                    order.items,

                subtotal:
                    order.subtotal,

                deliveryFee:
                    order.deliveryFee,

                total:
                    order.total,

                currency:
                    order.currency,

                createdAt:
                    order.createdAt

            }

        });

    }

    catch (error) {

        console.error(
            "Order creation error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to create order"

        });

    }

}


/* =========================================================
   GET ORDER
========================================================= */

async function getOrder(
    req,
    res
) {

    try {

        const order =
            await getOrderById(
                req.params.id
            );


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

            });

        }


        return res.json({

            success: true,

            order

        });

    }

    catch (error) {

        console.error(
            "Order loading error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load order"

        });

    }

}


/* =========================================================
   GET ALL ORDERS
========================================================= */

async function getOrders(
    req,
    res
) {

    try {

        const orders =
            await getAllOrders();


        return res.json(
            orders
        );

    }

    catch (error) {

        console.error(
            "Orders loading error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load orders"

        });

    }

}


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

async function updateStatus(
    req,
    res
) {

    try {

        const {
            status,
            reason
        } = req.body;


        if (!status) {

            return res.status(400).json({

                success: false,

                message:
                    "Order status is required"

            });

        }


        /* =================================================
           ADMIN CANCELLATION
           Delegates to the shared cancellation service so
           buyer and admin cancellations share one mutation,
           one stock safeguard, and one notification event.
        ================================================= */

        if (
            status === "cancelled"
        ) {

            let result;

            try {

                result =
                    await cancelOrder(
                        req.params.id,
                        {
                            actor: "admin",
                            reason: reason
                        }
                    );

            } catch (cancelError) {

                if (
                    cancelError.code === "not_found"
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Order not found"

                    });

                }

                return res.status(400).json({

                    success: false,

                    message:
                        cancelError.message ||
                        "Unable to cancel order"

                });

            }


            if (
                result.status === "cancelled"
            ) {

                sendOrderCancellationEmail(
                    result.order,
                    "admin"
                ).catch(() => {});

            }


            return res.json({

                success: true,

                message:
                    result.status === "already_cancelled"
                        ? "Order is already cancelled"
                        : "Order cancelled successfully",

                order:
                    result.order

            });

        }


        /* =================================================
           PREVIOUS STATUS (best effort, for notification
           transition detection only)
        ================================================= */

        let previousStatus =
            null;

        try {

            const existing =
                await getOrderById(
                    req.params.id
                );

            previousStatus =
                existing?.status || null;

        } catch (lookupError) {

            previousStatus =
                null;

        }


        const order =
            await updateOrderStatus(

                req.params.id,

                status

            );


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

            });

        }


        /* =================================================
           STATUS NOTIFICATION (fire-and-forget)
           Only on an actual transition into shipped or
           delivered. Same-status no-ops and other
           statuses never notify.
        ================================================= */

        if (
            previousStatus &&
            previousStatus !== order.status &&
            (
                order.status === "shipped" ||
                order.status === "delivered"
            )
        ) {

            sendOrderStatusEmail(
                order,
                order.status
            ).catch(() => {});

        }


        return res.json({

            success: true,

            message:
                "Order status updated successfully",

            order

        });

    }

    catch (error) {

        console.error(
            "Order status update error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to update order status"

        });

    }

}


/* =========================================================
   SAFE CANCELLATION VIEW
   Minimal public subset — no customer PII, no items.
========================================================= */

function toSafeCancelView(
    order
) {

    return {

        id:
            order.id,

        status:
            order.status,

        paymentStatus:
            order.paymentStatus,

        cancelledAt:
            order.cancelledAt ||
            null,

        cancelledBy:
            order.cancelledBy ||
            null,

        updatedAt:
            order.updatedAt ||
            null

    };

}


/* =========================================================
   BUYER CANCEL ORDER
   POST /api/orders/:id/cancel
   Guest-friendly ownership check: the caller must supply
   the order's saved customer email. The server verifies
   ownership and eligibility on every request via the
   shared cancellation service.
========================================================= */

async function cancelByBuyer(
    req,
    res
) {

    try {

        const {
            email,
            reason
        } = req.body || {};


        if (
            !email ||
            typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email.trim()
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "A valid email address is required to cancel this order"

            });

        }


        let result;

        try {

            result =
                await cancelOrder(
                    req.params.id,
                    {
                        actor: "buyer",
                        email: email.trim(),
                        reason: reason
                    }
                );

        } catch (cancelError) {

            const code =
                cancelError.code;


            if (
                code === "not_found"
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found"

                });

            }

            if (
                code === "forbidden"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Email does not match this order"

                });

            }

            if (
                code === "paid" ||
                code === "ineligible"
            ) {

                return res.status(409).json({

                    success: false,

                    code,

                    message:
                        cancelError.message

                });

            }

            return res.status(400).json({

                success: false,

                message:
                    cancelError.message ||
                    "Unable to cancel order"

            });

        }


        if (
            result.status === "cancelled"
        ) {

            sendOrderCancellationEmail(
                result.order,
                "buyer"
            ).catch(() => {});

        }


        return res.json({

            success: true,

            message:
                result.status === "already_cancelled"
                    ? "Order is already cancelled"
                    : "Order cancelled successfully",

            already:
                result.status === "already_cancelled" ||
                undefined,

            order:
                toSafeCancelView(result.order)

        });

    }

    catch (error) {

        console.error(
            "Buyer cancellation error:",
            error.message
        );


        return res.status(400).json({

            success: false,

            message:
                "Unable to cancel order"

        });

    }

}


/* =========================================================
   TRACK ORDER
========================================================= */

async function trackOrder(
    req,
    res
) {

    try {

        const order =
            await getPublicOrderById(
                req.params.id
            );


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

            });

        }


        return res.json({

            success: true,

            order

        });

    }

    catch (error) {

        console.error(
            "Order tracking error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to track order"

        });

    }

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    create,

    getOrder,

    getOrders,

    updateStatus,

    cancelByBuyer,

    trackOrder

};