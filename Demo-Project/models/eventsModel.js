const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minLength: 5
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minLength: 10
    },
    maxQuantity: {
        type: Number,
        required: true,
        default: 0
    },
    date: {
        type: Date,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);