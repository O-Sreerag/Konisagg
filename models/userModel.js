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
    // useraddress: {
    //     type: Object
    // },
    useraddresses: [{
        state: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        pin: {
            type: String,
            required: true
        },
        house: {
            type: String,
            required: true
        }
    }],
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
    referalLink : {
        type: String,
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

userSchema.pre('save', function(next) {
    if (!this.referalLink) {
        const defaultLink = `https://www.konisagg.com/signup?onKonisagg_with~${this.username}=${this._id.toString()}`;
        // https://www.konisagg.com//signup?on_Konisaggwith${this.username}=${this._id.toString()}_With~${this.username}
        this.referalLink = defaultLink;
    }
    next();
});

const userModel = mongoose.model("userInfo", userSchema)

module.exports = userModel