const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors');

admin.initializeApp();
const corsOptions = {
    origin: true, // يمكنك تحديد أو إضافة قائمة بالمصادر المسموح بها
};

exports.sendEmail = functions.https.onRequest((req, res) => {
    cors(corsOptions)(req, res, async () => {
        const { email, registration_link } = req.body;

        try {
            const response = await axios.post('https://api.sendgrid.com/v3/mail/send', {
                personalizations: [
                    {
                        to: [{ email }],
                        subject: "Registration Link",
                    },
                ],
                from: { email: "litrix.team@gmail.com" },
                content: [
                    {
                        type: "text/plain",
                        value: `Hello, here is your registration link: ${registration_link}`,
                    },
                ],
            }, {
                headers: {
                    'Authorization': `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`, // تأكد من استخدام مفتاح API الصحيح
                    'Content-Type': 'application/json',
                },
            });

            return res.status(200).send(response.data);
        } catch (error) {
            console.error("Error sending email:", error);
            return res.status(500).send("Error sending email");
        }
    });
});
