const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    adminemail:{
        type:String,
        required:true
    },
    adminpassword:{
        type:String,
        required:true
    }
})

const adminModel = mongoose.model("adminInfo", adminSchema)

module.exports = adminModel