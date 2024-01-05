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

        const orders = await orderModel.find({userId: userId}).sort({_id: -1})
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
          orderId:1,
          "userInfo.username": 1,
          "userInfo.useremail": 1,
          "userInfo.userphone": 1,
          "userInfo.useraddress": 1,
          products: 1,
          total: 1,
          discount:1,
          totalWithDiscount:1,
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
      statusRA: statusRA,
      orderId: JSON.stringify(orders[0]._id),
      Message: req.session?.userMessage 
    })
    if(req.session.userMessage) {
      req.session.userMessage = null
    }
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
      const convertedOrderId = new mongoose.Types.ObjectId(orderId);
      const updatedOrder = await orderModel.updateMany(
        { 
          _id: convertedOrderId
        },
        {
          $set: { 'products.$[].status': 'cancelled' }
        }
        );
      req.session.userMessage = "order cancelled"
      res.redirect(`/order/details?orderId=${orderId}`)
      return
    } else {   
      await orderModel.updateOne({_id: orderId}, {$set: {Status: "CancelReq", paymentStatus: "Refund Requested"}})
      req.session.userMessage = "order cancel requested"
      res.redirect(`/order/details?orderId=${orderId}`)
      return
    }

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

    req.session.userMessage = "order return requested"
    res.redirect(`/order/details?orderId=${orderId}`)
  }catch(error) {
    console.log(error)
  }
}

const cancelSingleProduct = async (req, res) => {
  try {
    console.log("cancel single product")

    const { orderId, productId } = req.query;
    console.log("orderId, productId")
    console.log(orderId, productId)

    const order = await orderModel.findById(orderId);
    console.log("order")
    console.log(order)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const convertedOrderId = new mongoose.Types.ObjectId(orderId);

    let updatedOrder;
    let productToCancel
    if (order.paymentMethod === 'cash_on_delivery' || order.paymentMethod === 'wallet') {
      const convertedProductId = new mongoose.Types.ObjectId(productId);

      updatedOrder = await orderModel.findOneAndUpdate(
        { 
          _id: convertedOrderId,
          'products.productId': convertedProductId 
        },
        {
          $set: { 'products.$.status': 'cancelled' }
        },
        { new: true }
      );
    } else {
      updatedOrder = await orderModel.findOneAndUpdate(
        { 
          _id: convertedOrderId,
          'products.productId': productId // Assuming productId is a string here
        },
        {
          $set: { 'products.$.status': 'cancelled' }
        },
        { new: true }
      );
      productToCancel = updatedOrder.products.find(item => item.productId ==productId)
    }
    
    if (order.paymentMethod === 'wallet') {
        const convertedProductId = new mongoose.Types.ObjectId(productId);
        productToCancel = updatedOrder.products.find(item => item.productId ==convertedProductId)
    }


    if (!updatedOrder) {
      console.log("product not found")
      req.session.userMessage = 'product not found'
      res.redirect(`/order/details?orderId=${orderId}`)
    }

    console.log("updatedOrder")
    console.log(updatedOrder)
    console.log("productToCancel")
    console.log(productToCancel)


    // Check payment method and update user's wallet
    if (order.paymentMethod === 'razorpay' || order.paymentMethod === 'wallet') {
      console.log("razorPay or wallet")

      const priceOfCancelledProduct = productToCancel.price; 
      console.log(priceOfCancelledProduct)

      // updating user's wallet
      const user = await userModel.findOne({_id:order.userId})
      console.log("user")
      console.log(user)
      if (user) {
        // await userModel.updateOne({_id:order.userId}, {$inc: {wallet: priceOfCancelledProduct}})
        user.userwallet += Number(priceOfCancelledProduct);
        await user.save();
      }

      updatedOrder.total -= Number(priceOfCancelledProduct)
      await updatedOrder.save()
    }

    console.log("final updatedOrder")
    console.log(updatedOrder)

    req.session.userMessage = 'single product cancellation successful'
    res.redirect(`/order/details?orderId=${orderId}`)
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const returnSingleProduct = async (req, res) => {
  try {
    console.log("return single product")

    const { orderId, productId } = req.query;
    console.log(orderId, productId)

    const order = await orderModel.findById(orderId);
    console.log("order")
    console.log(order)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const convertedOrderId = new mongoose.Types.ObjectId(orderId);

    let updatedOrder;
    let productToReturn
    if (order.paymentMethod === 'cash_on_delivery' || order.paymentMethod === 'wallet') {
      const convertedProductId = new mongoose.Types.ObjectId(productId);
      productToReturn = order.products.find(item => item.productId ==convertedProductId)

      updatedOrder = await orderModel.findOneAndUpdate(
        {
          _id: convertedOrderId,
          'products.productId': convertedProductId,
        },
        {
          $set: { 'products.$[elem].status': 'returned' }
        },
        {
          new: true,
          arrayFilters: [{ 'elem.productId': convertedProductId }]
        }
        );
      } else {
        productToReturn = order.products.find(item => item.productId ==productId)
      
        updatedOrder = await orderModel.findOneAndUpdate(
        {
          _id: convertedOrderId,
          'products.productId': productId,
        },
        {
          $set: { 'products.$[elem].status': 'returned' }
        },
        {
          new: true,
          arrayFilters: [{ 'elem.productId': productId }]
        }
      );
    }


    if (!updatedOrder) {
      console.log("product not found")
      
      req.session.userMessage = 'Product not found in order or Order not found'
      res.redirect(`/order/details?orderId=${orderId}`)
      return
    }

    console.log("updatedOrder")
    console.log(updatedOrder)
    console.log("productToReturn")
    console.log(productToReturn)

    const user = await userModel.findOne({_id:order.userId})
    console.log("user")
    console.log(user)
    const priceOfReturnedProduct = productToReturn.price; 
    console.log(priceOfReturnedProduct)
    console.log()
    if (user) {
      // await userModel.updateOne({_id:order.userId}, {$inc: {wallet: priceOfReturnedProduct}})
      user.userwallet += Number(priceOfReturnedProduct);
      await user.save();
    }

    
    updatedOrder.total -= Number(priceOfReturnedProduct)
    await updatedOrder.save()

    console.log("final updatedOrder")
    console.log(updatedOrder)

    req.session.userMessage = "single product return successful"
    res.redirect(`/order/details?orderId=${orderId}`)
    return
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 


// admin order management route definitions

// const adminViewOrders = async (req, res) => {
//     try {
//         console.log("admin order history")

//         const orders = await orderModel.aggregate([
//             {
//                 $lookup: {
//                     from: 'userinfos', 
//                     localField: 'userId',
//                     foreignField: '_id',
//                     as: 'userInfo'
//                 }
//             },
//             {
//                 $unwind: '$userInfo'
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     'orderId': 1,
//                     'userInfo.username': 1,
//                     'userInfo.useremail': 1,
//                     'userInfo.userphone': 1,
//                     'userInfo.useraddress': 1,
//                     'products': 1,
//                     'total': 1,
//                     'Discount': 1,
//                     'totalWithDiscount': 1,
//                     'paymentMethod' : 1,
//                     'paymentStatus' : 1,
//                     'userPhone': 1,
//                     'userAddress': 1,
//                     'Status': 1,
//                     'updatedAt': 1
//                 }
//             }
//         ]);

//         console.log("orders")
//         console.log(orders)

//         res.render('admin/orders', { orders: orders });
//     } catch(error) {
//         console.log(error);
//     } 
// }

const ITEMS_PER_PAGE = 5; // Number of orders per page

const adminViewOrders = async (req, res) => {
    try {
        console.log(" view orders admin root")
        const page = +req.query.page || 1; // Get page number from query parameter or default to 1

        const totalOrders = await orderModel.countDocuments();
        const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

        const ordersOg = await orderModel.find({})
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .lean();

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
                  orderId: 1,
                  "userInfo.username": 1,
                  "userInfo.useremail": 1,
                  "userInfo.userphone": 1,
                  "userInfo.useraddress": 1,
                  products: 1,
                  total: 1,
                  discount: 1,
                  totalWithDiscount: 1,
                  paymentMethod: 1,
                  paymentStatus: 1,
                  userPhone: 1,
                  userAddress: 1,
                  Status: 1,
                  updatedAt: 1,
                }
            },
            {
                $skip: (page - 1) * ITEMS_PER_PAGE
            },
            {
                $limit: ITEMS_PER_PAGE
            }
        ])

        res.render('admin/orders', { 
            orders: orders,
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalOrders,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages,
            pageNumbers: Array.from({ length: totalPages }, (_, index) => index + 1),          
        });

    } catch(error) {
        console.log(error);
        // Handle errors or return an error page
        res.status(500).send('Internal Server Error');
    } 
}


const searchOrders = async (req, res) => {
  try {
      console.log("search orders root")

      let payload = req.body.payload.trim();
      console.log(payload);

      let search = await orderModel.aggregate([
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
            $match: {
              'userInfo.username': { $regex: new RegExp('^' + payload + '.*', 'i') }
            }
          },
          {
            $limit: 10
          },
        {
          $project: {
              _id: 1,
              orderId: 1,
              userInfo: 1,
              products: 1,
              total: 1,
              discount: 1,
              totalWithDiscount: 1,
              paymentMethod: 1,
              paymentStatus: 1,
              userPhone: 1,
              userAddress: 1,
              Status: 1,
              updatedAt: 1
            }
          }
        ]);
        console.log(search)
              
        search = search.slice(0, 10);
        console.log(search)
          
        if(payload) {
          if(search) {
              res.send({payload: search})
          } else {
              res.send({payload: []})
          }
        }else {
          console.log("payload empty")
          let search = await orderModel.find({})
          console.log(search)
          res.send({payload: search})
        }
  } catch(error) {
    console.log(error) 
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
            orderId: 1,
            "userInfo.username": 1,
            "userInfo.useremail": 1,
            "userInfo.userphone": 1,
            "userInfo.useraddress": 1,
            products: 1,
            total: 1,
            discount: 1,
            totalWithDiscount: 1,
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
        statusRA: statusRA,
        orderId: JSON.stringify(orders[0]._id),
        Message: req.session?.Message
      })
      if(req.session.Message) {
        req.session.Message = null
      }
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

    const convertedOrderId = new mongoose.Types.ObjectId(orderId);

    const updatedOrder = await orderModel.updateMany(
      { 
        _id: convertedOrderId
      },
      {
        $set: { 'products.$[].status': 'cancelled' }
      }
    );

    req.session.Message = "Order Cancel request accepted"
    res.redirect(`/admin/OrderDetails?orderId=${orderId}`)
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
    
    // Retrieve order details by orderId
    const orderDetails = await orderModel.findOne({ _id: orderId });

    // Loop through each product in the order
    for (const product of orderDetails.products) {
      const productId = product.productId;
      const quantityPurchased = product.quantity;

      // Update the stock for the product in productModel
      await productModel.updateOne(
        { _id: productId },
        { $inc: { stock: -quantityPurchased } } // Decrease stock by purchased quantity
      );
    }

    await orderModel.updateOne({_id: orderId}, {$set: {Status: "Delivered", paymentStatus: 'Payment Done'}})

    const convertedOrderId = new mongoose.Types.ObjectId(orderId);

    const updatedOrder = await orderModel.updateMany(
      { 
        _id: convertedOrderId
      },
      {
        $set: { 'products.$[].status': 'return' }
      }
    );

    req.session.Message = "Order Delivered"
    res.redirect(`/admin/OrderDetails?orderId=${orderId}`)
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

    // Retrieve order details by orderId
    const orderDetails = await orderModel.findOne({ _id: orderId });

    // Loop through each product in the order
    for (const product of orderDetails.products) {
      const productId = product.productId;
      const quantityPurchased = product.quantity;

      // Update the stock for the product in productModel
      await productModel.updateOne(
        { _id: productId },
        { $inc: { stock: quantityPurchased } } // Decrease stock by purchased quantity
      );
    }

    await userModel.updateOne(
      { _id: order[0].userId },
      { $inc: { userwallet: "+" + order[0].total } }
    );

    const convertedOrderId = new mongoose.Types.ObjectId(orderId);

    const updatedOrder = await orderModel.updateMany(
      {
        _id: convertedOrderId
      },
      {
        $set: { 'products.$[].status': 'returned' }
      }
    );
    req.session.Message = "Order return accepted" 
    res.redirect(`/admin/OrderDetails?orderId=${orderId}`)
  } catch(error) {
    console.log(error)
  }
}
  
module.exports = {
  // user side
    orderHistory,
    searchOrders,
    orderCancel,
    orderReturn,
    orderDetails,
    cancelSingleProduct,
    returnSingleProduct,

  // admin side
    adminViewOrders,
    adminOrderDetails,
    adminOrderDeliver,
    adminOrderCancelReq,
    adminOrderRA
}