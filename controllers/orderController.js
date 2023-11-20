const mongoose = require('mongoose');
const cartModel = require('../models/cartModel') 
const productModel = require('../models/productModel') 
const userModel = require('../models/userModel') 
const orderModel = require('../models/orderModel') 
const { ObjectId } = require("mongodb");


// user order management route definitions
const orderHistory = async(req, res) => {
    try {
        console.log("order history")

        const userId = req.session.verifiedUser.userid;
        console.log("user Id")
        console.log(userId);
        console.log(userId);

        const orders = await orderModel.find({userId: userId})
        console.log(orders)

        res.render('user/settings-orders-orderHistory', {orders:orders})
    } catch(error) {
        console.log(error)
    }
}

const orderDetails = async (req, res) => {
  try {
    console.log("user order details") 
    
    const orderId = req.query.orderId
    console.log("orderId")
    console.log(orderId)

    const orders = await orderModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(orderId),
        },
      },
      {
        $lookup: {
          from: "userinfos",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          _id: 1,
          "userInfo.username": 1,
          "userInfo.useremail": 1,
          "userInfo.userphone": 1,
          "userInfo.useraddress": 1,
          products: 1,
          total: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          userPhone: 1,
          userAddress: 1,
          Status: 1,
          updatedAt: 1,
        },
      },
    ]);

    console.log("orders");
    console.log(orders[0]);

    let statusPending
    let statusCancelled
    let statusCancelReq
    let statusDelivered
    let statusRR
    let statusRA
    console.log("status value")
    if(orders[0].Status === 'Pending') {
      statusPending = true
      console.log("statusPending")
    } else if(orders[0].Status === 'Cancelled') {
      statusCancelled = true
      console.log("statusCancelled")
    } else if(orders[0].Status === 'CancelReq') {
      statusCancelReq = true
      console.log("statusCancelReq")
    } else if(orders[0].Status === 'Delivered') {
      statusDelivered = true
      console.log("statusDelivered")
    } else if(orders[0].Status === 'Return Requested') {
      statusRR = true
      console.log("statusRR")
    } else if(orders[0].Status === 'Returned') {
      statusRA = true
      console.log("statusRA")
    }

    res.render('user/settings-orders-orderdetails',
     {order: orders[0],
      statusPending: statusPending,
      statusCancelReq: statusCancelReq, 
      statusCancelled: statusCancelled, 
      statusDelivered: statusDelivered, 
      statusRR: statusRR, 
      statusRA: statusRA
    })
  } catch(error) {
    console.log(error)
  }
}

const orderCancel = async(req, res) => {
  try {
    console.log("order cancel")

    const orderId = req.query.orderId
    console.log("orderId")
    console.log(orderId)
    
    const order = await orderModel.find({_id: orderId})
    console.log("order")
    console.log(order)
    
    if(order[0].paymentMethod === "cash_on_delivery") {
      await orderModel.updateOne({_id: orderId}, {$set: {Status: "Cancelled", paymentStatus: "Refund Processed"}})
    } else {   
      await orderModel.updateOne({_id: orderId}, {$set: {Status: "CancelReq", paymentStatus: "Refund Requested"}})
    }

    res.send("update status successfully")
  }catch(error) {
    console.log(error)
  }
}

const orderReturn = async (req, res) => {
  try {
    console.log("order return")

    const orderId = req.query.orderId
    console.log("orderId")
    console.log(orderId)
    
    const order = await orderModel.find({_id: orderId})
    console.log("order")
    console.log(order)
      
    await orderModel.updateOne({_id: orderId}, {$set: {Status: "Return Requested", paymentStatus: "Refund Requested"}})

    res.send("update status successfully")
  }catch(error) {
    console.log(error)
  }
}

const orderTrack = (req, res) => {
    res.render('user/settings-orders-orderTrack')
}

const orderAddress = (req, res) => {
    res.render('user/settings-orders-orderAddress')
}



// admin order management route definitions
const adminViewOrders = async (req, res) => {
    try {
        console.log("admin order history")

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

        res.render('admin/orders', { orders: orders });
    } catch(error) {
        console.log(error);
    } 
}

const adminOrderDetails = async (req, res) => {
    try {
      console.log("admin order details");
  
      const orderId = req.query.orderId;
      console.log("order id");
      console.log(orderId);
  
      const orders = await orderModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(orderId),
          },
        },
        {
          $lookup: {
            from: "userinfos",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $unwind: "$userInfo",
        },
        {
          $project: {
            _id: 1,
            "userInfo.username": 1,
            "userInfo.useremail": 1,
            "userInfo.userphone": 1,
            "userInfo.useraddress": 1,
            products: 1,
            total: 1,
            paymentMethod: 1,
            paymentStatus: 1,
            userPhone: 1,
            userAddress: 1,
            Status: 1,
            updatedAt: 1,
          },
        },
      ]);

      let statusPending
      let statusCancelReq
      let statusCancelled
      let statusDelivered
      let statusRR
      let statusRA
      console.log("status value")
      if(orders[0].Status === 'Pending') {
        statusPending = true
        console.log("statusPending")
      } else if(orders[0].Status === 'CancelReq') {
        statusCancelReq = true
        console.log("statusCancelReq")
      } else if(orders[0].Status === 'Cancelled') {
        statusCancelled = true
        console.log("statusCancelled")
      } else if(orders[0].Status === 'Delivered') {
        statusDelivered = true
        console.log("statusDelivered")
      } else if(orders[0].Status === 'Return Requested') {
        statusRR = true
        console.log("statusRR")
      } else if(orders[0].Status === 'Returned') {
        statusRA = true
        console.log("statusRA")
      }

      console.log("orders");
      console.log(orders);
  
      res.render("admin/order-details",
      { orders: orders[0],
        statusPending: statusPending,
        statusCancelled: statusCancelled,
        statusCancelReq: statusCancelReq, 
        statusDelivered: statusDelivered,
        statusRR: statusRR,
        statusRA: statusRA
      })
    } catch (error) {
      console.log(error);
    }
};

const adminOrderCancelReq = async (req, res) => {
  try {
    console.log("admin order cancel requested")

    const orderId = req.query.orderId
    console.log("orderId")
    console.log(orderId)
    
    await orderModel.updateOne({_id: orderId}, {$set: {Status: "Cancelled", paymentStatus: "Refund Processed"}})
    const order = await orderModel.find({_id: orderId})
    console.log("order")
    console.log(order)

    await userModel.updateOne(
      { _id: order[0].userId },
      { $inc: { userwallet: "+" + order[0].total } }
    );

    res.send("success")
  } catch(error) {
    console.log(error)
  }
}

const adminOrderDeliver = async (req, res) => {
  try {
    console.log("admin order delivered")

    const orderId = req.query.orderId
    console.log("orderId")
    console.log(orderId)
    
    await orderModel.updateOne({_id: orderId}, {$set: {Status: "Delivered", paymentStatus: 'Payment Done'}})

    res.send("success")
  } catch(error) {
    console.log(error)
  }
}

const adminOrderRA = async (req, res) => {
  try {
    console.log("admin order request accepted")

    const orderId = req.query.orderId
    console.log("orderId")
    console.log(orderId)
    
    await orderModel.updateOne({_id: orderId}, {$set: {Status: "Returned", paymentStatus: 'Refund Processed'}})
    const order = await orderModel.find({_id: orderId})
    console.log("order")
    console.log(order)

    await userModel.updateOne(
      { _id: order[0].userId },
      { $inc: { userwallet: "+" + order[0].total } }
    );

    res.send("success")
  } catch(error) {
    console.log(error)
  }
}
  
module.exports = {
  // user side
    orderHistory,
    orderCancel,
    orderReturn,
    orderDetails,
    orderTrack,

  // admin side
    orderAddress,
    adminViewOrders,
    adminOrderDetails,
    adminOrderDeliver,
    adminOrderCancelReq,
    adminOrderRA
}