const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const ownerEmail = process.env.OWNER_EMAIL || 'harshbusiness08@gmail.com';
const transportConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

const transporter = nodemailer.createTransport(transportConfig);

async function sendNotificationEmail(payload) {
  const {
    email,
    plan,
    paymentMethod,
    transactionId,
    stage
  } = payload;

  const destinationLine =
    paymentMethod === 'paypal'
      ? `PayPal destination: ${process.env.PAYPAL_EMAIL || 'harshsingh9993@gmail.com'}`
      : paymentMethod === 'usdt'
      ? `TRC20 address: ${process.env.USDT_TRON_ADDRESS || 'TTZsRB6LvEBZN5pNcCWu8qWK6o19rs19jB'}`
      : paymentMethod === 'usdt-bep20'
      ? `BEP20 address: ${process.env.USDT_BEP20_ADDRESS || '0x3c94abad8df6f8a5767c4eebda91f49b635652a7'}`
      : paymentMethod === 'usdc-bep20'
      ? `USDC BEP20 address: ${process.env.USDC_BEP20_ADDRESS || '0x3c94abad8df6f8a5767c4eebda91f49b635652a7'}`
      : 'Payment destination: unknown';

  const subject = `RealMaria ${stage}: ${plan.label} - ${paymentMethod}`;
  const text = [
    `Stage: ${stage}`,
    `Subscriber email: ${email}`,
    `Selected plan: ${plan.label}`,
    `Price: $${plan.price}`,
    `Payment method: ${paymentMethod}`,
    destinationLine,
    transactionId
      ? `Transaction / receipt ID: ${transactionId}`
      : 'Transaction / receipt ID: Pending or not submitted yet',
    '',
    'Captured from the RealMaria checkout form.',
    `Timestamp: ${new Date().toLocaleString()}`
  ].join('\n');

  await transporter.sendMail({
    from: transportConfig.auth.user,
    to: ownerEmail,
    subject,
    text
  });
}

app.post('/send-email', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.email || !payload.plan || !payload.paymentMethod) {
      return res.status(400).json({ message: 'Missing required checkout data.' });
    }

    await sendNotificationEmail(payload);
    res.json({ success: true });
  } catch (error) {
    console.error('Email send failed:', error);
    res.status(500).json({ message: 'Failed to send notification email.' });
  }
});

app.listen(port, () => {
  console.log(`RealMaria backend listening on http://localhost:${port}`);
});
