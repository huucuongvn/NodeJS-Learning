const nodemailer = require('nodemailer');
const Queue = require('bull');

const emailQueue = new Queue('emailQueue');

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }

});

emailQueue.process(async (job) => {
    const { email, subject, text } = job.data;

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: subject,
        text: text,
    };


    try {
        await transport.sendMail(mailOptions);
        console.log('Email sent successfully:', subject);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
});

module.exports = emailQueue