const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { identification } = require('../middlewares/identification');

router.post('/request-voucher/:eventId', identification, eventController.requestVoucher);
router.post('/create-event', identification, eventController.createEvent);

module.exports = router;