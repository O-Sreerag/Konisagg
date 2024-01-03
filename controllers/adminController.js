const adminModel = require('../models/adminModel')
const userModel = require('../models/userModel')
const categoryModel = require('../models/categoryModel')
const productModel = require('../models/productModel')
const orderModel = require('../models/orderModel')
const mongoose = require('mongoose');

const pdf = require('pdfkit');
const excel = require('exceljs');
const fs = require('fs');

let errorMessage

// admin login
const adminLogin = (req,res,next) => {
    try {
        res.render('admin/account-login', {error: errorMessage})
        errorMessage = ""
    } catch (error) {
        console.log(error)
    }
}

// admin login submit
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

            // let totalEarnings
            
            // if(orders.totalWithDiscount) {
                //     totalEarnings = orders
                //         .filter(filterFunction)
                //         .reduce((accumulator, orders) => accumulator + orders.totalWithDiscount, 0);
                // } else {
                    //     totalEarnings = orders
                    //     .filter(filterFunction)
                    //     .reduce((accumulator, orders) => accumulator + orders.total, 0);
                    // }
                    
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
        const paymentDone = [paymentDoneDailyEarnings, paymentDoneMonthlyEarnings, paymentDoneYearlyEarnings]
        
        console.log('Awaiting Payment:');
        console.log('Daily:', awaitingPaymentDailyEarnings);
        console.log('Monthly:', awaitingPaymentMonthlyEarnings);
        console.log('Yearly:', awaitingPaymentYearlyEarnings);
        const awaitingPayment = [awaitingPaymentDailyEarnings, awaitingPaymentMonthlyEarnings, awaitingPaymentYearlyEarnings]

        console.log('Refund Requested:');
        console.log('Daily:', refundReqDailyEarnings);
        console.log('Monthly:', refundReqMonthlyEarnings);
        console.log('Yearly:', refundReqYearlyEarnings);
        const refundRequested = [refundReqDailyEarnings, refundReqMonthlyEarnings, refundReqYearlyEarnings]
        
        const chartData2 = {
            paymentDone: paymentDone,
            awaitingPayment: awaitingPayment,
            refundRequested: refundRequested
        }
        
        console.log("chartData2")
        console.log(chartData2)
        
        // chartData1
        // Aggregation pipeline stages to count users registered in each month
        const currentYear = new Date().getFullYear();
        const pipeline = [
            {
                // Match documents created within the current year
                $match: {
                    createdAt: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lt: new Date(`${currentYear + 1}-01-01`)
                    }
                }
            },
            {
                // Group documents by month and count users
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            {
                // Sort by month (optional)
                $sort: { _id: 1 }
            }
        ];
        
        console.log('Monthly user registrations:'); 
        const userYearlyData = await userModel.aggregate(pipeline).exec()
        console.log(userYearlyData) // [ { _id: 12, count: 2 } ]
        
        const userYearlyDataSorted = Array.from({ length: 12 }).fill(0);
        userYearlyData.forEach((item) => {
            const index = item._id - 1;
            userYearlyDataSorted[index] = item.count;
        });
        // Fill any remaining undefined elements with 0
        userYearlyData.forEach((value, index) => {
            if (value === undefined) {
                userYearlyDataSorted[index] = 0;
            }
        });
        console.log(userYearlyDataSorted) //[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2]

        console.log('Monthly product registrations:'); 
        const productYearlyData = await productModel.aggregate(pipeline).exec()
        console.log(productYearlyData) // [ { _id: 12, count: 2 } ]

        const productYearlyDataSorted = Array.from({ length: 12 }).fill(0);
        productYearlyData.forEach((item) => {
            const index = item._id - 1;
            productYearlyDataSorted[index] = item.count;
        });
        // Fill any remaining undefined elements with 0
        productYearlyData.forEach((value, index) => {
            if (value === undefined) {
                productYearlyDataSorted[index] = 0;
            }
        });
        console.log(productYearlyDataSorted) //[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2]

        console.log('Monthly order registrations:'); 
        const orderYearlyData = await orderModel.aggregate(pipeline).exec()
        console.log(orderYearlyData) // [ { _id: 12, count: 2 } ]

        const orderYearlyDataSorted = Array.from({ length: 12 }).fill(0);
        orderYearlyData.forEach((item) => {
            const index = item._id - 1;
            orderYearlyDataSorted[index] = item.count;
        });
        // Fill any remaining undefined elements with 0
        orderYearlyData.forEach((value, index) => {
            if (value === undefined) {
                orderYearlyDataSorted[index] = 0;
            }
        });
        console.log(orderYearlyDataSorted) //[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2]

        console.log("yearly data")
        console.log(userYearlyDataSorted, productYearlyDataSorted, orderYearlyDataSorted)
        const chartData1 = {
            userYearlyDataSorted: userYearlyDataSorted,
            productYearlyDataSorted: productYearlyDataSorted,
            orderYearlyDataSorted: orderYearlyDataSorted
        }

        const totalMonthlyRevenue = paymentDoneMonthlyEarnings.toFixed(2)

        const totalPaymentDone = orders.reduce((acc, order) => {
            if (order.paymentStatus === 'Payment Done') {
              return acc + order.total;
            }
            return acc;
        }, 0);

        const admin = req.session.verifiedAdmin

        res.render('admin/index',
            {
                userData: userData, 
                orders: orders, 
                totalOrders: orders.length, 
                totalProducts: products.length, 
                totalCategories: categories.length,
                totalRevenue: totalPaymentDone.toFixed(2),
                totalMonthlyRevenue: totalMonthlyRevenue,
                admin: admin,
                chartData1: JSON.stringify(chartData1),
                chartData2: JSON.stringify(chartData2),
        })
    } catch (error) {
        console.log(error)
    }
}

const adminGenerateReport = async (req, res) => {
    try {
    console.log("generate report root")

    const { startDate, endDate, reportType } = req.body;
    console.log(startDate, endDate, reportType )

    const startOfDay = new Date(startDate); // Convert to Date object
    const endOfDay = new Date(endDate); // Convert to Date object
    startOfDay.setUTCHours(0, 0, 0, 0);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Fetch orders data based on the date range (use your logic to fetch orders)
    const orders = await orderModel.find({
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        }
    });
    console.log(orders)

    if (reportType === 'pdf') {
        console.log("report type pdf")
        // Generate PDF
        const doc = new pdf();
        doc.pipe(fs.createWriteStream('report.pdf'));
        
        // Add data to the PDF
        doc.text(`Sales Report From ${startDate} to ${endDate}`);
        doc.text('                                    ')
        doc.text('____________________________________')
        orders.forEach((order, index) => {
            doc.text('                                    ')
            let totalAmount
            if(order.totalWithDiscount) {
                totalAmount = order.totalWithDiscount
            } else {
                totalAmount = order.total
            }
        
            doc.text(`Order ${index + 1}`); // Adding 1 to start indexing from 1 instead of 0
            doc.text(`${order.orderId} - ₹${totalAmount}`);
            
            // Adding purchaser information
            doc.text(`Purchased by User ID: ${order.userId}`);
            doc.text(`Phone Number: ${order.userPhone}`);
            doc.text(`Address: ${order.userAddress.selectedHouse}, ${order.userAddress.selectedCity}, ${order.userAddress.selectedDistrict}, ${order.userAddress.selectedState}, ${order.userAddress.selectedPin}`);
            
            // Adding purchased products
            doc.text('Purchased Products:');
            order.products.forEach(item => {
                doc.text(`- Product Name: ${item.product.productname}`);
                doc.text(`  Quantity: ${item.quantity}`);
                doc.text(`  Price per unit: ₹${item.price}`);
            });
        
            doc.text('____________________________________');
        });
        
        // doc.end();
        // res.download('report.pdf');

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');

        // Pipe the PDF content to the response
        doc.pipe(res);
        doc.end();
    } else if (reportType === 'excel') {
        console.log("report type excel")
        // Generate Excel
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sales');

        // Add headers
        worksheet.addRow(['Order ID', 'Total Amount', 'User ID', 'Phone Number', 'Address', 'Product Name', 'Quantity', 'Price per unit']);

        // Add data to the Excel sheet
        orders.forEach(order => {
            let totalAmount
            if(order.totalWithDiscount) {
                totalAmount = order.totalWithDiscount
            } else {
                totalAmount = order.total
            }
    
            // Adding purchaser information and product details
            order.products.forEach(item => {
                worksheet.addRow([
                    order.orderId,
                    totalAmount,
                    order.userId,
                    order.userPhone,
                    `${order.userAddress.selectedHouse}, ${order.userAddress.selectedCity}, ${order.userAddress.selectedDistrict}, ${order.userAddress.selectedState}, ${order.userAddress.selectedPin}`,
                    item.product.productname,
                    item.quantity,
                    item.price
                ]);
            });
        });

        // workbook.xlsx.writeFile('report.xlsx')
        //     .then(() => {
        //         res.download('report.xlsx');
        //     });

        // Set response headers for Excel download[]
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');

        // Write the Excel file to the response
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
    } else {
        res.status(400).send('Invalid reportType');
    }

    } catch(error) {
        console.log(error)
    }
}

// const adminUsers = async (req,res,next) => {
//     try {
//         const userData = await userModel.find().sort({username:1}) 
//         console.log(userData);
//         res.render('admin/users', {userData: userData})
//     } catch (error) {
//         console.log(error)
//     }
// }

const ITEMS_PER_PAGE = 5; // Number of users per page

const adminUsers = async (req, res, next) => {
  try {
    const page = +req.query.page || 1; // Get page number from query parameter or default to 1

    const totalUsers = await userModel.countDocuments();
    const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

    const userData = await userModel
      .find()
      .sort({ username: 1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('admin/users', {
      userData: userData,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalUsers,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: totalPages,
      pageNumbers: Array.from({ length: totalPages }, (_, index) => index + 1)
    });
  } catch (error) {
    console.log(error);
  }
};


const searchUser = async (req, res) => {
    try {
        console.log("search user root")

        let payload = req.body.payload.trim()
        console.log(payload)
        let search = await userModel.find({username:{$regex: new RegExp('^'+payload+'.*',"i")}}).exec()
        search = search.slice(0, 10);
        console.log(search)
        if(payload) {
            if(search) {
                res.send({payload: search})
            } else {
                res.send({payload: []})
            }
        }else {
            let search = await userModel.find()
            res.send({payload: search})
        }
    } catch (error) {
        console.log(error)
    }
}

const adminLogout = (req, res, next) => {
    try {
        req.session.verifiedAdmin = null
        res.clearCookie('connect.sid')
        
        res.redirect('/admin')
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    adminHome, 
    adminGenerateReport,
    adminLogin, 
    adminLoginSubmit, 
    adminUsers, 
    searchUser,
    adminLogout
}