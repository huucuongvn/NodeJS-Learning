const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { identification } = require('../middlewares/identification');

router.post('/signup', authController.signup);
router.post('/sign_in', authController.sign_in);
router.post('/sign_out', identification, authController.sign_out);
router.patch('/send-verify-code', identification, authController.sendVerificationCode);
router.patch('/verify-verification-code', identification, authController.verifyVerificationCode);

module.exports = router;