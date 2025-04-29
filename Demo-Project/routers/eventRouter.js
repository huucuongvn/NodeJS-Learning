const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { identification } = require('../middlewares/identification');

router.post('/request-voucher/:eventId', identification, eventController.requestVoucher);
router.post('/create-event', identification, eventController.createEvent);
router.post('/:event_id/editable/me', identification, eventController.editTable);

module.exports = router;