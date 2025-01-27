const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponCode: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  discountType: { 
    type: String, 
    required: true 
  },
  discountValue: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  minimumPurchase: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  maximumPurchase: { 
    type: Number, 
    min: 0,
    validate: {
      validator: function (value) {
        return value >= this.minimumPurchase;
      },
      message: 'Maximum purchase must be greater than or equal to the minimum purchase.'
    }
  },
  startDate: { 
    type: String, 
    required: true 
  },
  expiryDate: { 
    type: String, 
    required: true 
  },
  usageLimit: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
},{timestamps:true});

// Middleware to update updatedAt before saving
couponSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('coupon', couponSchema,'coupon');