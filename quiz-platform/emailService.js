const nodemailer = require('nodemailer');

// FIX: Use createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'info.quizplatform@gamil.com'
        pass: 'xfwa uhlo ujmc lazh'
    }
});

// Function to send thank you email
async function sendThankYouEmail(userEmail, userName, quizName, score) {
    try {
        const mailOptions = {
            from:'info.quizplatform@gamil.com',
            to: userEmail,
            subject: `Thank you for taking the ${quizName} quiz!`,
            html: `
                <h2>Hello ${userName}! 👋</h2>
                <p>Thank you for completing the <strong>${quizName}</strong> quiz.</p>
                <p>Your score: <strong>${score}</strong></p>
                <br>
                <p>We hope to see you again soon!</p>
            `
        };

        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

module.exports = { sendThankYouEmail };