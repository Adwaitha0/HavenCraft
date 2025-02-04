const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user_model', 
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product', 
    required: true,
  },   
 
  size: {
    type: String,
    required: false,
  },
  images:
    [{ type: Buffer }], 
  quantity: {
    type: Number, 
    required: false,
    min: 1,
    max:3,
  },
  subtotal: {
    type: Number, 
    required: false
    },
  shipping:{
      type: Number, 
      required: false
    },
  total: {
    type: Number,
    required: false,
  },
  isDeleted: {
    type: Boolean, 
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  
});

cartSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('cart', cartSchema, 'cart');
