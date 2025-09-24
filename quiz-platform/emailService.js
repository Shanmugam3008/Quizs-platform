const nodemailer = require('nodemailer');

console.log('Email service loaded...');

// Verify transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'info.quizplatform@gmail.com',
        pass: 'kely nvay dsbh lwxj'
    }
});

// Verify connection configuration
transporter.verify(function(error, success) {
    if (error) {
        console.log('❌ Email transporter error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

// Function to send thank you email
async function sendThankYouEmail(userEmail, userName, quizName, score) {
    console.log(`Attempting to send email to: ${userEmail}`);
    
    try {
        const mailOptions = {
            from: 'info.quizplatform@gmail.com',
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
        console.log('✅ Email sent successfully: %s', info.messageId);
        console.log('✅ Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
}

module.exports = { sendThankYouEmail };