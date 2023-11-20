const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryInfo'
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'categoryInfo'
        },
        productImage: {
            type: String,
        },
        selectedCurrency: {
            type: String,
        },
        selectedColor: {
            type: String
        },
        selectedSize: {
            type: String
        },
        defaultQuantity: {
            type: Number,
            default: 1
        }
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
});

const cartModel = mongoose.model("cartInfo", cartSchema);

module.exports = cartModel;

 