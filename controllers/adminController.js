const adminModel = require('../models/adminModel')
const userModel = require('../models/userModel')
const categoryModel = require('../models/categoryModel')
const productModel = require('../models/productModel')
const orderModel = require('../models/orderModel')
const mongoose = require('mongoose');

let errorMessage
let specificCategory

// admin login
const adminLogin = (req,res,next) => {
    res.render('admin/account-login', {error: errorMessage})
    errorMessage = null
} 

const adminLoginSubmit = async (req, res, next) => {

    const { adminemail, adminpassword } = req.body
    console.log({ adminemail, adminpassword });
    try {
        const admin = await adminModel.findOne({ adminemail })
        // const admin  = await adminModel.findOne({adminemail:adminemail, password:password})
        console.log(admin);
        if (admin) {
            if (admin.adminpassword === adminpassword) {
                // Initialize req.session.verifiedAdmin
                req.session.verifiedAdmin = {
                    adminid: admin._id,
                    adminemail: admin.adminemail,
                    loginStatus: true,
                };

                res.redirect('/admin/home')
            } else {
                errorMessage = "incorrect password"
            }
        } else {
            errorMessage = "incorrect email"
        }
        res.redirect('/admin')
    } catch (error) {
        console.log(error)
    }
}


// admin home
const adminHome = async(req,res,next) => {
    try {
        console.log("admin home page get root")
        
        const userData = await userModel.find().sort({username:1}) 
        console.log(userData);

        const products = await productModel.find({})
        const categories = await categoryModel.find({})
        const orders = await orderModel.aggregate([
            {
                $lookup: {
                    from: 'userinfos', 
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $unwind: '$userInfo'
            },
            {
                $project: {
                    _id: 1,
                    'userInfo.username': 1,
                    'userInfo.useremail': 1,
                    'userInfo.userphone': 1,
                    'userInfo.useraddress': 1,
                    'products': 1,
                    'total': 1,
                    'paymentMethod' : 1,
                    'paymentStatus' : 1,
                    'userPhone': 1,
                    'userAddress': 1,
                    'Status': 1,
                    'updatedAt': 1
                }
            }
        ]);

        console.log("orders")
        console.log(orders)
           
        // Function to calculate total earnings for a specific status within a specific time period
        function calculateEarningsByStatusAndTimePeriod(paymentStatus, timePeriod) {
            const currentDate = new Date(); // Current date

            let filterFunction;
            switch (timePeriod) {
                case 'monthly':
                    filterFunction = orders => (
                        orders.paymentStatus === paymentStatus &&
                        new Date(orders.updatedAt).getFullYear() === currentDate.getFullYear() &&
                        new Date(orders.updatedAt).getMonth() === currentDate.getMonth()
                    );
                    break;

                case 'yearly':
                    filterFunction = orders => (
                        orders.paymentStatus === paymentStatus &&
                        new Date(orders.updatedAt).getFullYear() === currentDate.getFullYear()
                    );
                    break;

                case 'daily':
                default:
                    filterFunction = orders => (
                        orders.paymentStatus === paymentStatus &&
                        new Date(orders.updatedAt).toDateString() === currentDate.toDateString()
                    );
                    break;
            }

            const totalEarnings = orders
                .filter(filterFunction)
                .reduce((accumulator, orders) => accumulator + orders.total, 0);

            return totalEarnings;
        }

        // Calculate earnings for different statuses on a monthly, yearly, and daily basis
        const paymentDoneDailyEarnings = calculateEarningsByStatusAndTimePeriod('Payment Done', 'daily');
        const paymentDoneMonthlyEarnings = calculateEarningsByStatusAndTimePeriod('Payment Done', 'monthly');
        const paymentDoneYearlyEarnings = calculateEarningsByStatusAndTimePeriod('Payment Done', 'yearly');

        const awaitingPaymentDailyEarnings = calculateEarningsByStatusAndTimePeriod('Awaiting Payment', 'daily');
        const awaitingPaymentMonthlyEarnings = calculateEarningsByStatusAndTimePeriod('Awaiting Payment', 'monthly');
        const awaitingPaymentYearlyEarnings = calculateEarningsByStatusAndTimePeriod('Awaiting Payment', 'yearly');

        const refundReqDailyEarnings = calculateEarningsByStatusAndTimePeriod('Refund Requested', 'daily');
        const refundReqMonthlyEarnings = calculateEarningsByStatusAndTimePeriod('Refund Requested', 'monthly');
        const refundReqYearlyEarnings = calculateEarningsByStatusAndTimePeriod('Refund Requested', 'yearly');

        // Logging the calculated earnings for each status and time period
        console.log('Payment Done:');
        console.log('Daily:', paymentDoneDailyEarnings);
        console.log('Monthly:', paymentDoneMonthlyEarnings);
        console.log('Yearly:', paymentDoneYearlyEarnings);

        console.log('Awaiting Payment:');
        console.log('Daily:', awaitingPaymentDailyEarnings);
        console.log('Monthly:', awaitingPaymentMonthlyEarnings);
        console.log('Yearly:', awaitingPaymentYearlyEarnings);

        console.log('Refund Requested:');
        console.log('Daily:', refundReqDailyEarnings);
        console.log('Monthly:', refundReqMonthlyEarnings);
        console.log('Yearly:', refundReqYearlyEarnings);

        const totalMonthlyRevenue = paymentDoneMonthlyEarnings.toFixed(2)

        const totalPaymentDone = orders.reduce((acc, order) => {
            if (order.paymentStatus === 'Payment Done') {
              return acc + order.total;
            }
            return acc;
          }, 0);
        

        res.render('admin/index',
            {
                userData: userData, 
                orders: orders, 
                totalOrders: orders.length, 
                totalProducts: products.length, 
                totalCategories: categories.length,
                totalRevenue: totalPaymentDone.toFixed(2),
                totalMonthlyRevenue: totalMonthlyRevenue
            })
    } catch (error) {
        console.log(error)
    }
}

const adminUsers = async (req,res,next) => {
    try {
        const userData = await userModel.find().sort({username:1}) 
        console.log(userData);
        res.render('admin/users', {userData: userData})
    } catch (error) {
        console.log(error)
    }
}

const adminBrands = (req,res,next) => {
    res.render('admin/brands')
}

const adminLogout = (req, res, next) => {
    try {
        req.session.destroy()
        res.clearCookie('connect.sid')
        next()
    } catch (error) {
        console.log(error);
    }
}

module.exports = {adminHome, adminLogin, adminLoginSubmit, adminUsers, adminBrands,adminLogout}