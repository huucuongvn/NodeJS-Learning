const mongoose = require('mongoose');
const eventsModel = require('../models/eventsModel');
const vouchersModel = require('../models/vouchersModel');
const emailQueue = require('../middlewares/sendMail');
const { isEditable } = require('../middlewares/eventEditing');

exports.requestVoucher = async (req, res) => {
    const eventId = req.params.eventId;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const event = await eventsModel.findOne({ _id: eventId }).session(session);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        if (event.maxQuantity <= 0) {
            return res.status(400).json({ message: 'No vouchers available' });
        }
        const voucherCode = `VOUCHER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const voucher = new vouchersModel({
            code: voucherCode,
            eventId: eventId,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            issuedAt: new Date(),
        });
        await voucher.save({ session });
        event.maxQuantity -= 1;
        await event.save({ session });
        const email = 'chieuanh955@gmail.com';
        const subject = `Your Voucher Code: ${voucherCode}`;
        const text = `Congratulations! Your voucher code is: ${voucherCode}.`;

        await emailQueue.add({ email, subject, text });
        await session.commitTransaction();
        res.status(200).json({
            message: 'Voucher requested successfully',
            voucher: {
                code: voucher.code,
                startDate: voucher.startDate,
                endDate: voucher.endDate,
                issuedAt: voucher.issuedAt,
                eventId: voucher.eventId,
            },
        });

    } catch (error) {
        console.error('Error requesting voucher:', error);
        await session.abortTransaction();
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        session.endSession();
    }
}

exports.createEvent = async (req, res) => {
    const { title, description, date, maxQuantity } = req.body;
    const userId = req.user.id;
    try {
        const event = new eventsModel({
            title,
            description,
            date,
            maxQuantity,
            userId,
        });
        await event.save();
        res.status(201).json({
            message: 'Event created successfully',
            event,
        });
    } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

