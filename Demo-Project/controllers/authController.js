const { signupSchema, signinSchema, acceptCodeSchema } = require("../middlewares/validator");
const { doHash, compareHash, hmacProcess } = require("../untils/hashing");
const User = require("../models/usersModel");
const jwt = require("jsonwebtoken");
const emailQueue = require("../middlewares/sendMail");

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       401:
 *         description: Validation error or user already exists
 *       500:
 *         description: Internal server error
 */
exports.signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const { error, value } = signupSchema.validate({ name, email, password });
        if (error) {
            return res.status(401).json({ message: error.details[0].message });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(401).json({ message: 'User already exists' });
        }
        const hashedPassword = await doHash(password, 12);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });
        const result = await newUser.save();
        result.password = undefined;
        res.status(201).json({
            message: 'User created successfully',
            user: result,
        });
    } catch (error) {
        console.error('Error during signup:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * @swagger
 * /sign-in:
 *   post:
 *     summary: Sign in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User signed in successfully
 *       401:
 *         description: Invalid credentials or user does not exist
 *       500:
 *         description: Internal server error
 */
exports.sign_in = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signinSchema.validate({ email, password });
        if (error) {
            return res.status(401).json({ message: error.details[0].message });
        }
        const existingUser = await User.findOne({ email }).select('+password');
        if (!existingUser) {
            return res.status(401).json({ message: 'User does not exist.' });
        }
        const result = await compareHash(password, existingUser.password);
        if (!result) {
            return res.status(401).json({ message: 'Invalid credentials!' });
        }
        const token = jwt.sign(
            { 
                id: existingUser._id,
                email: existingUser.email,
                verified: existingUser.verified
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.cookie("Authorization",
             "Bearer " + token, 
             { expies: new Date(Date.now() + 8 * 3600000), 
                httpOnly: process.env.NODE_ENV === 'production', 
                secure: process.env.NODE_ENV === 'production' })
            .json({
                token,
                message: 'User signed in successfully'
            })
    } catch (error) {
        console.error('Error during sign-in:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * @swagger
 * /sign-out:
 *   post:
 *     summary: Sign out a user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User signed out successfully
 *       500:
 *         description: Internal server error
 */
exports.sign_out = async (req, res) => {
    try {
        res.clearCookie("Authorization");
        res.status(200).json({
            message: 'User signed out successfully'
        });
    } catch (error) {
        console.error('Error during sign-out:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * @swagger
 * /send-verification-code:
 *   post:
 *     summary: Send a verification code to the user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       404:
 *         description: User does not exist
 *       400:
 *         description: User already verified or error sending verification code
 *       500:
 *         description: Internal server error
 */
exports.sendVerificationCode = async (req, res) => {   
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: 'User does not exist.' });
        }
        if (existingUser.verified) {
            return res.status(400).json({ message: 'User already verified.' });
        }
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const subject = `Verification Code`;
        const text = `Your verification code is ${verificationCode}`;
        let info = emailQueue.add({ email, subject, text });
        
        if (existingUser.email) {
            const hashedCodeValue = hmacProcess(verificationCode, process.env.HMAC_VERIFICATION_KEY);
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({
                message: 'Verification code sent successfully',
                verificationCode: hashedCodeValue,
            });
        }
        res.status(400).json({
            message: 'Error sending verification code',
            error: info,
        });
    }
    catch (error) {
        console.error('Error during sending verification code:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * @swagger
 * /verify-verification-code:
 *   post:
 *     summary: Verify the user's verification code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               verificationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: User verified successfully
 *       404:
 *         description: User does not exist
 *       400:
 *         description: Invalid or expired verification code
 *       500:
 *         description: Internal server error
 */
exports.verifyVerificationCode = async (req, res) => {
    const { email, verificationCode } = req.body;
    try {
        const {error, value } = acceptCodeSchema.validate({ email, verificationCode });
        if (error) {
            return res.status(401).json({ message: error.details[0].message });
        }
        const codeValue = verificationCode;
        const existingUser = await User.findOne({ email }).select('+verificationCode +verificationCodeValidation');
        if (!existingUser) {
            return res.status(404).json({ message: 'User does not exist.' });
        }
        if (existingUser.verified) {
            return res.status(400).json({ message: 'User already verified.' });
        }
        if (!existingUser.verificationCode || !existingUser.verificationCodeValidation) {
            return res.status(400).json({ message: 'Verification code not sent.' });
        }
        if (Date.now() - existingUser.verificationCodeValidation > 10 * 60 * 1000) {
            return res.status(400).json({ message: 'Verification code expired.' });
        }
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_KEY);
        if (hashedCodeValue === existingUser.verificationCode) {
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({
                message: 'User verified successfully',
                user: existingUser,
            });
        }
        return res.status(400).json({ message: 'Invalid verification code.' });
    } catch (error) {
        console.error('Error during verification code:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }   
}