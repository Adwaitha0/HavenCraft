const Razorpay = require("razorpay");
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Your Razorpay Key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Your Razorpay Key Secret
});


const createOrder = async (req, res) => {
  const { amount } = req.body;

  // Razorpay order creation options
  const options = {
    amount: amount * 100, // amount in smallest currency unit (paise)
    currency: "INR",
    receipt: `order_rcptid_${Date.now()}`, // Generate unique receipt ID
  };

  try {
    // Create an order using Razorpay API
    const order = await razorpay.orders.create(options);
    res.status(200).json(order); // Respond with order details
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Unable to create Razorpay order" });
  }
};

// Export the controller method
module.exports = {
  createOrder,
};
