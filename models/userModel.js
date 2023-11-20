const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type:String,
        required:true
    },
    useremail: {
        type:String,
        required:true
    },
    userpassword: {
        type:String,
        required:true
    },
    userphone: {
        type: Number,
    },
    useraddress: {
        type: Object
    },
    userimage: {
        type: String
    },
    loginStatus: {
        type: Boolean,
        required: true
    },
    status: {
        type: Boolean,
        required: true
    },
    verified: {
        type: Boolean,
        required: true
    },
    userwallet: {
        type: Number, 
        default: 0, 
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // carts: [{
    //     productId: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'categoryInfo'
    //     },
    //     productImage: {
    //         type: String,
    //     },
    //     selectedCurrency: {
    //         type: String,
    //     },
    //     selectedColor: {
    //         type: String
    //     },
    //     selectedSize: {
    //         type: String
    //     },
    //     defaultQuantity: {
    //         type: Number,
    //         default: 1
    //     }
    // }],
})

const userModel = mongoose.model("userInfo", userSchema)

module.exports = userModel