const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryInfo'
    },
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryInfo'
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

const wishlistModel = mongoose.model("wishlistInfo", wishlistSchema);

module.exports = wishlistModel;
 