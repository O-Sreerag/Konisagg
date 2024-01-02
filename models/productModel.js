const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productname: {
        type: String,
        required: true
    },
    productdescription: {
        type: String,
        required: true
    }, 
    regularprice: {
        type: Number,
        required: true
    },
    promotionalprice: {
        type: Number,
    },
    stock: {
        type: Number,
        required: true
    }, 
    returnperiod: {
        type: Object,
        required: true
    }, 
    warrentyperiod: {
        type: Object,
        required: true
    },
    paymentmethods: {
        type: Array,
        required:true
    },
    colors: {
        type: Array,
        required: true
    },
    sizes: {
        type: Array,
        required: true
    }, 
    categories: {
        type: Array,
        required: true
    },
    tags: {
        type: Array
    },
    productimages: {
        type: Array,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const productModel = mongoose.model("productInfo", productSchema);

module.exports = productModel;