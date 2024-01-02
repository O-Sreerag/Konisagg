const mongoose = require('mongoose');

const productOfferSchema = new mongoose.Schema({
    for: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'productInfo',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: { 
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    discountPercentage: {
        type: Number, 
        required: true 
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    status: {
        type: String,
        default: "active",
    }
});

const productOfferModel = mongoose.model('productOfferInfo', productOfferSchema);

module.exports = productOfferModel;
