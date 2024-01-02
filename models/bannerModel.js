const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    descriptions: [{
        type: String,
        maxlength: 100
    }]
});

const bannerModel = mongoose.model("bannerInfo", bannerSchema);

module.exports = bannerModel;

 