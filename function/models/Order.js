const mongoose = require("mongoose");


const orderItemSchema = new mongoose.Schema(

    {

        bookId: {
            type: Number,
            required: true
        },

        title: {
            type: String,
            required: true
        },

        author: {
            type: String,
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        itemTotal: {
            type: Number,
            required: true,
            min: 0
        }

    },

    {
        _id: false
    }

);


/* =========================================================
   EMAIL NOTIFICATION TRACKER
   Optional, Brevo transactional side effects only.
   Each event records claim/send state so duplicate
   callback/webhook executions cannot send twice.
   Absent on historical orders — no migration required.
========================================================= */

const emailNotificationSchema = new mongoose.Schema(

    {

        status: {
            type: String,
            enum: [
                "pending",
                "sending",
                "sent"
            ]
        },

        claimedAt: {
            type: Date
        },

        sentAt: {
            type: Date
        },

        messageId: {
            type: String
        }

    },

    {
        _id: false
    }

);


const emailNotificationsSchema = new mongoose.Schema(

    {

        orderReceived: {
            type: emailNotificationSchema,
            required: false
        },

        paymentConfirmed: {
            type: emailNotificationSchema,
            required: false
        },

        paymentFailed: {
            type: emailNotificationSchema,
            required: false
        },

        shipped: {
            type: emailNotificationSchema,
            required: false
        },

        delivered: {
            type: emailNotificationSchema,
            required: false
        },

        cancelled: {
            type: emailNotificationSchema,
            required: false
        }

    },

    {
        _id: false
    }

);


/* =========================================================
   LATE PAYMENT EVIDENCE
   Verified-successful Paystack transactions that arrived
   after cancellation/expiry and therefore were NOT applied
   as payment. Records evidence for manual reconciliation
   without changing status or paymentStatus meaning.
   Absent on historical orders — no migration required.
========================================================= */

const latePaymentSchema = new mongoose.Schema(

    {

        reference: {
            type: String,
            required: true
        },

        amount: {
            type: Number
        },

        channel: {
            type: String,
            default: null
        },

        paidAt: {
            type: Date,
            default: null
        },

        receivedAt: {
            type: Date,
            default: null
        },

        source: {
            type: String,
            default: null
        }

    },

    {
        _id: false
    }

);


const orderSchema = new mongoose.Schema(

    {

        id: {
            type: String,
            required: true,
            unique: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled"
            ],
            default: "pending"
        },

        paymentStatus: {
            type: String,
            enum: [
                "unpaid",
                "paid",
                "failed"
            ],
            default: "unpaid"
        },

        transactionReference: {
            type: String,
            unique: true,
            sparse: true
        },

        paymentMethod: {
            type: String,
            default: null
        },

        paidAt: {
            type: Date,
            default: null
        },

        reservationExpiresAt: {
            type: Date,
            default: null
        },

        reservationReleasedAt: {
            type: Date,
            default: null
        },

        cancelledAt: {
            type: Date,
            default: null
        },

        cancelledBy: {
            type: String,
            enum: [
                "buyer",
                "admin",
                "system"
            ],
            default: null
        },

        cancellationReason: {
            type: String,
            default: null
        },

        customer: {

            name: {
                type: String,
                required: true
            },

            email: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                required: true
            }

        },

        delivery: {

            address: {
                type: String
            },

            city: {
                type: String
            },

            state: {
                type: String
            },

            lga: {
                type: String
            },

            area: {
                type: String
            },

            street: {
                type: String
            },

            houseNumber: {
                type: String
            },

            details: {
                type: String
            }

        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: items => items.length > 0,
                message: "Order must contain at least one item"
            }
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        deliveryFee: {
            type: Number,
            required: true,
            min: 0
        },

        total: {
            type: Number,
            required: true,
            min: 0
        },

        currency: {
            type: String,
            default: "NGN"
        },

        emailNotifications: {
            type: emailNotificationsSchema,
            required: false,
            default: undefined
        },

        latePayments: {
            type: [latePaymentSchema],
            required: false,
            default: undefined
        }

    },

    {
        timestamps: true
    }

);


module.exports =
    mongoose.model(
        "Order",
        orderSchema
    );