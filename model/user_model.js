const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: false,
    },
    phone: {
        type: String,
        required: false,
        match: /^[0-9+\-()\s]+$/,
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId; 
        },
    },
    googleId: {
        type: String,
        sparse: true,
    },
    profilePic: {
        type: String, 
    },
    referralCode: { 
        type: String,
        required:false },
    addresses: [
        {
            firstname: { 
                type: String, 
                required: true 
            },
            lastname: { 
                type: String, 
                required: false 
            },
            street: { 
                type: String, 
                required: true 
            },
            city: { 
                type: String, 
                required: true 
            },
            state: { 
                type: String, 
                required: true 
            },
            pincode: { 
                type: String, 
                required: true 
            },
            country: { 
                type: String, 
                required: true 
            },
            contactno: { 
                type: String, 
                required: false
            }
        }
    ],
    usedCoupons: [
        {
            couponId: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: "coupon",
                required: true 
            },
            usageCount: { 
                type: Number, 
                default: 1 
            },
        }
    ],
    joinDate: {
        type: Date,
        default: Date.now,
    },
    isBlocked: { 
        type: Boolean,
        default: false,
    },
    isDeleted: { 
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("user_model", userSchema, "user_model");
