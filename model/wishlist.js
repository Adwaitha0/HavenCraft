const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user_model' },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'product' },
    addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('wishlist', WishlistSchema,'wishlist');
