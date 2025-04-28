const mongoose = require("mongoose");
const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    issuedAt: {
        type: Date,
        default: Date.now
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);