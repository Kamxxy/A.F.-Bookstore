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
                type: String,
                required: true
            },

            city: {
                type: String,
                required: true
            },

            state: {
                type: String,
                required: true
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