const {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrderStatus
} = require("../services/orderService");


/* =========================================================
   CREATE ORDER
========================================================= */

function create(
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


        if (
            !delivery.address ||
            !delivery.city ||
            !delivery.state
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Delivery address, city and state are required"

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
            createOrder({

                customer: {

                    name:
                        customer.name
                            .trim(),

                    email:
                        customer.email
                            .trim(),

                    phone:
                        customer.phone
                            .trim()

                },

                delivery: {

                    address:
                        delivery.address
                            .trim(),

                    city:
                        delivery.city
                            .trim(),

                    state:
                        delivery.state
                            .trim()

                },

                items

            });


        /* =================================================
           RESPONSE
        ================================================= */

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

function getOrder(
    req,
    res
) {

    try {

        const order =
            getOrderById(
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

function getOrders(
    req,
    res
) {

    try {

        const orders =
            getAllOrders();

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

function updateStatus(
    req,
    res
) {

    try {

        const {
            status
        } = req.body;


        if (!status) {

            return res.status(400).json({

                success: false,

                message:
                    "Order status is required"

            });

        }


        const order =
            updateOrderStatus(
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
   EXPORT
========================================================= */

module.exports = {

    create,

    getOrder,

    getOrders,

    updateStatus

};