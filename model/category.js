const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    productCount: {
        type: Number,
        default: 0, 
    },
    parentCategoryId: {
        type: String,
        ref: 'category', 
        default: null,
    },
    offerPercentage: { 
        type: Number, 
        required: false 
    },
    isDeleted: { 
        type: Boolean, 
        default: false,
    },
});

module.exports = mongoose.model('category', categorySchema,'category');
