const mongoose = require('mongoose');
const { Schema } = mongoose;
const shortid = require('shortid')

// $object_id = new MongoId(HEX-OF-96BIT-HASH); from so

function generateCustomID() {
    const prefix = 'ORD';
    const randomDigits = Math.floor(Math.random() * 1000000); // Generates a random 6-digit number
    const formattedRandomDigits = String(randomDigits).padStart(6, '0'); // Ensure it's always 6 digits
    return `${prefix}[${formattedRandomDigits}]`;
}

// // Example usage:
// const customID = generateCustomID();
// console.log("customID");
// console.log(customID);

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: generateCustomID 
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryInfo'
    },
    products: {
        type: Array,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0.00
    },
    totalWithDiscount: {
        type: Number,
    },
    appliedCoupenCode: {
        type: String
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    paymentStatus: {  
        type: String,
        default: 'Pending'
    },

    // PaymentStatus paymentMethod Status

    // Awaiting Payment c-pending
    // Payment Done  w,r,c-delivered  ,  w,r-pending
    // Refund Requested w,r,c-rreq  ,  w,r-creq
    // Refund Processed w,r,c-returned,cancelled  

    userPhone: {
        type: Number,
        required: true,
    },
    userAddress: {
        type: Object,
        required: true,
    },
    Status: {
        type: String,
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
});


const orderModel = mongoose.model("orderInfo", orderSchema);

module.exports = orderModel;