const Joi = require('joi');

exports.signupSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().min(5).max(50).required().email({
        tlds: { allow: ['com', 'net', 'org'] },
    }),
    password: Joi.string().min(8).max(20).required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
});

exports.signinSchema = Joi.object({
    email: Joi.string().email().min(5).max(50).required().email({
        tlds: { allow: ['com', 'net', 'org'] },
    }),
    password: Joi.string().min(8).max(20).required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
});

exports.acceptCodeSchema = Joi.object({
    verificationCode: Joi.number().required(),
    email: Joi.string().email().min(5).max(50).required().email({
        tlds: { allow: ['com', 'net', 'org'] },
    }),
});

exports.createPostSchema = Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().min(10).max(500).required(),
    userId: Joi.string().required(),
});