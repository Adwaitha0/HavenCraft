const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
    orderId: { type: String, required: true }, 
    username: { type: String, required: true }, 
    totalPrice: { type: Number, required: true }, 
    totalDiscount: { type: Number, default: 0 }, 
    createdAt: { type: Date, default: Date.now }, 
});

module.exports = mongoose.model('Sales', salesSchema,'sales');
