const mongoose = require("mongoose");


const bookSchema = new mongoose.Schema(

    {

        id: {
            type: Number,
            required: true,
            unique: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        author: {
            type: String,
            required: true,
            trim: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        description: {
            type: String,
            default: ""
        },

        cover: {
            type: String,
            default: ""
        },

        stockNumber: {
            type: Number,
            default: 0,
            min: 0
        }

    },

    {
        timestamps: true
    }

);


module.exports =
    mongoose.model(
        "Book",
        bookSchema
    );