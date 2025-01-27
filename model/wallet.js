const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user_model',
      required: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ['credit', 'debit'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        uniqueTransactionId:{
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
          default: function () {
            const expirationDuration = 30;
            return new Date(this.date.getTime() + expirationDuration * 24 * 60 * 60 * 1000); 
          },
        },
      },
    ],
  }, { timestamps: true });
  
  module.exports = mongoose.model('Wallet', walletSchema, 'wallet');
  