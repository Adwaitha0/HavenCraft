const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'product', 
      required: true 
    },
    small: { 
      type: Number, 
      required: true, 
      min: 0, 
      default: 0 
    }, 
    large: { 
      type: Number, 
      required: true, 
      min: 0, 
      default: 0 
    }  
  },
  { 
    timestamps: true 
  }
);

stockSchema.index({ productId: 1 }, { unique: true });

const Stock = mongoose.model('Stock', stockSchema, 'Stock');

module.exports = Stock;
