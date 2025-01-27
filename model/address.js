const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  firstname:String,
  lastname:String,
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
  contactno:String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user_model' }, // Link address to user
});

const Address = mongoose.model('address', addressSchema,'address');

module.exports = Address;
