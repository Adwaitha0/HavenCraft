const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },   
    description: { type: String, required: false },
    originalPrice: { type: Number, required: true },
    discountPrice: { type: Number, required: false },
    offerPercentage: { type: Number, required: false },
    images: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
    offerPrice: { type: Number, required: false },
},{timestamps:true});

module.exports = mongoose.model('product', productSchema,'product');

 
