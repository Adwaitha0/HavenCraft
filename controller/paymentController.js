const Razorpay = require("razorpay");
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, 
  key_secret: process.env.RAZORPAY_KEY_SECRET, 
});

const createOrder = async (req, res) => {
  const { amount } = req.body;
  const options = {
    amount: amount * 100, 
    currency: "INR",
    receipt: `order_rcptid_${Date.now()}`, 
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json(order); 
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Unable to create Razorpay order" });
  }
};

module.exports = {
  createOrder,
};
