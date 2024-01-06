// if login redirect to home else to next
// if not login redirect to login or next
const userModel = require("../models/userModel")

const adminLoginStatusTrue = (req, res, next) => {
    console.log("admin login status middleware")
    console.log("login status" + req.session?.verifiedAdmin?.loginStatus)

    if (req.session?.verifiedAdmin?.loginStatus) {
        res.redirect('/admin/home')
    } else {
        next()
    }
}

const adminLoginStatusFalse = (req, res, next) => {
    console.log("admin login status middleware")
    console.log("login status" + req.session?.verifiedAdmin?.loginStatus)

    if (req.session?.verifiedAdmin?.loginStatus) {
        next()
    } else {
        res.redirect('/admin')
    }
}

const adminUserBlock = async (req, res, next) => {
    try {
        console.log(req.query.userid) 
        const user= await userModel.updateOne({_id: req.query.userid}, {status:false})
        if(req.session.verifiedUser) {
            const verifiedUser = req.session.verifiedUser
            
        }
        next()
    } catch (error) {
        console.log(error);
    }
}

const adminUserUnblock = async (req, res, next) => {
    try {
        console.log(req.query.userid) 
        const user= await userModel.updateOne({_id: req.query.userid}, {status:true})
        next()
    } catch (error) {
        console.log(error);
    }
}


module.exports = {adminLoginStatusFalse,adminLoginStatusTrue, adminUserBlock, adminUserUnblock}