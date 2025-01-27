const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user_model', // Reference to your user model
    required: false,
  },
  username: {
    type: String,
    required: true, 
  },
  uniqueOrderId:{
    type: String,
    required: true,
  },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'product',  
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        size: {
            type: String,
            required: false,
        },
        image: [{ type: Buffer }],
      
        productStatus: {
          type: String,
          required: true,
          default:'Pending'
        },
      }
    ],
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default:'Pending'
  },
  address: {
    firstname: { type: String, required: false },
    lastname: { type: String, required: false },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },
    contactno: { type: String, required: false },
  },
  
  paymentMethod: {
    type: String,
    required: true,
  },
  payableAmount: {
    type: Number,
    required: false
},
  orderDate: {
    type: Date,
    default: Date.now,
  },
  isDeleted: { 
    type: Boolean, 
    default: false,
}, reason: { 
    type: String, 
    default: '' },
},{timestamps:true});


module.exports = mongoose.model('order', orderSchema,'order');
