const mongoose = require('mongoose');

// Define Coupon Schema
const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true // Assuming each coupon has a unique code
    },
    type: {
        type: String,
        enum: ['flat', 'percentage'], // Possible types: flat or percentage
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    minPurchaseAmount: {
        type: Number,
        required: true,
    },
    usedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // If you have a User model, you can refer to users who used this coupon
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'], // Possible types: flat or percentage
        required: true,
        default: 'active'
    }
});

// Create Coupon model from the schema
const CouponModel = mongoose.model('CouponInfo', couponSchema);

module.exports = CouponModel;
