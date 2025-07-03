const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: 'YOUR_RAZORPAY_KEY_ID',      //modify
  key_secret: 'YOUR_RAZORPAY_SECRET'   //modify
});

// Create payment order
router.post('/create-order', async (req, res) => {
  const options = {
    amount: req.body.amount * 100, // ₹ to paise
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`
  };

  const order = await razorpay.orders.create(options);
  res.json(order);
});

// Verify payment signature
router.post('/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto.createHmac("sha256", 'YOUR_RAZORPAY_SECRET')
    .update(sign.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true, message: "Payment verified" });
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

module.exports = router;
