const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const adminModel = require('../models/adminModel')
const userModel = require('../models/userModel')
const orderModel = require('../models/orderModel')
const coupenModel = require('../models/coupenModel')

let coupenError

const adminListCoupen = async (req, res) => {
    try {
        console.log("admin list coupen root")
        const coupens = await coupenModel.find({})
        console.log("coupens :" + coupens)

        res.render('admin/coupens', {coupens: coupens, Message:req.session?.Message})
        if(req.session.Message) {
            req.session.Message = null
        }
    } catch (error) {
        console.log(error)
    }
}

const adminCreateCoupen = async (req, res) => {
    try {
        console.log("admin create coupen")
        
        res.render('admin/coupens-add', {coupenError: coupenError})
        coupenError = null
    } catch (error) {
        console.log(error)
    }
}

const adminCreateCoupenSubmit = async (req, res) => {
    try {
        console.log("admin create coupen submit")

        // Create a new coupon object using the Coupon model
        const {code, type, value, minPurchaseAmount} = req.body;

        // Check if the code already exists in the database
        const existingCoupon = await coupenModel.findOne({ code: code });
        if (existingCoupon) {
            coupenError = "This name already exists. Please choose another name"
            return res.redirect('/admin/coupens/create')
            // return res.status(400).json({ message: 'Coupon code already exists' });
        }

        // const uniqueCouponCode = uuidv4();

        console.log({code, type, value, minPurchaseAmount})

        const newCoupon = new coupenModel({
            code,
            type,
            discount: value,
            minPurchaseAmount,
        });

        await newCoupon.save();

        req.session.Message = 'Coupon created successfully'
        res.redirect('/admin/coupens')
        // res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
    } catch (error) {
        console.log(error)
    }
}

const adminStatusChangeCoupen = async (req, res) => {
    try {
        console.log("coupen status changing root")
        const coupenId = req.query.coupenid; 
        console.log(coupenId)

        // Find the coupon by its ID
        const coupenToUpdate = await coupenModel.findOne({ _id: coupenId });
        console.log(coupenToUpdate)

        if (coupenToUpdate) {
            // Change the status based on the current status
            coupenToUpdate.status = (coupenToUpdate.status === 'active') ? 'inactive' : 'active';
            
            await coupenToUpdate.save();
            req.session.Message = 'Coupon ID status changed successfully.'
            res.redirect('/admin/coupens')
            // res.status(200).json({ message: `Coupon ID ${couponId} status changed successfully.` });
        } else {
            req.session.Message = 'Coupon ID not found.'
            res.redirect('/admin/coupens')
            // res.status(404).json({ message: `Coupon ID ${couponId} not found.` });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    adminListCoupen,
    adminCreateCoupen,
    adminCreateCoupenSubmit,
    adminStatusChangeCoupen,
}