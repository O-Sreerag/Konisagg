const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String 
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryInfo'
    },
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryInfo'
    }],
    tier: {
        type: Number
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' 
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
});

const categoryModel = mongoose.model("categoryInfo", categorySchema);

module.exports = categoryModel;
 