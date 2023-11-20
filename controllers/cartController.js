const mongoose = require('mongoose');
const cartModel = require('../models/cartModel')
const orderModel = require('../models/orderModel')
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const { ObjectId } = require("mongodb");

const bcrypt = require("bcrypt");
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require('uuid');
require("dotenv").config();

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const addToCart = async (req, res, next) => {
    try {
        console.log("add to cart");

        const userId = req.session.verifiedUser.userid;
        console.log(userId);
        const itemId = new mongoose.Types.ObjectId(req.query.cartItemId);
        console.log(itemId);
        const { sizes, colors } = req.body;
        console.log({ sizes, colors });

        const usercart = await cartModel.findOne({ userId });
        console.log("usercart")
        console.log(usercart)

        if (usercart) {

            // Check if the product with the same productId exists in the cart
            const existingProducts = usercart.products.filter((product) => product.productId.equals(itemId));
            console.log("existingProducts")
            console.log(existingProducts)

            // if (!existingProducts) {
            //     // If the product doesn't exist, add it to the cart
            //     usercart.products.push({
            //         productId: itemId,
            //         selectedColor: colors,
            //         selectedSize: sizes,
            //     });

            //     await usercart.save();
            //     res.status(200).json({ message: 'Product added to cart' });
            // } else {
            //     // If the product exists, increase the quantity or add as a new product
            //     if (
            //         existingProducts.selectedColor === colors &&
            //         existingProducts.selectedSize === sizes
            //     ) {
            //         // Same color and size, increase the quantity
            //         existingProducts.defaultQuantity++;
            //         await usercart.save();
            //         res.status(200).json({ message: 'Product quantity increased by one' });
            //     } else {
            //         // Different color and size, add a new product
            //         usercart.products.push({
            //             productId: itemId,
            //             selectedColor: colors,
            //             selectedSize: sizes,
            //         });

            //         await usercart.save();
            //         res.status(200).json({ message: 'Product added to cart' });
            //     }
            // }
            if (existingProducts.length > 0) {
                // Iterate through existing products to find a match based on color and size
                let productExists = false;
                for (let i = 0; i < existingProducts.length; i++) {
                    if (
                        existingProducts[i].selectedColor === colors &&
                        existingProducts[i].selectedSize === sizes
                    ) {
                        // Same color and size found, increase the quantity
                        existingProducts[i].defaultQuantity++;
                        productExists = true;
    
                        await usercart.save();
                        res.status(200).json({ message: 'Product added/quantity updated in the cart' });
    
                        break; 
                    }
                }
            
                if (!productExists) {
                    // If the product with the same color and size doesn't exist, add it to the cart
                    usercart.products.push({
                        productId: itemId,
                        selectedColor: colors,
                        selectedSize: sizes,
                        defaultQuantity: 1,
                    });
    
                    await usercart.save();
                    res.status(200).json({ message: 'Product added to cart' });
                }
    
            } else {
                // If no existing product found with the given itemId, add a new product to the cart
                usercart.products.push({
                    productId: itemId,
                    selectedColor: colors,
                    selectedSize: sizes,
                    defaultQuantity: 1,
                });
    
                await usercart.save();
                res.status(200).json({ message: 'Product added to cart' });
            }
        } else {
            // Create a new cart with the first product
            const newCart = new cartModel({
                userId: userId,
                products: [
                    {
                        productId: itemId,
                        selectedColor: colors,
                        selectedSize: sizes,
                    },
                ],
            });

            await newCart.save();
            res.status(200).json({ message: 'Product added to cart' });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


const viewItems = async (req, res) => {
    try {
        console.log("cart/view-items");

        console.log(req.session.verifiedUser)
        const userId = req.session.verifiedUser.userid
        const products = await cartModel.aggregate([
            {
                $match: { userId: new ObjectId(userId) }
            },
            {
                $unwind: "$products"
            },
            {
                $project: {
                    productId: "$products.productId",
                    color: "$products.selectedColor",
                    size: "$products.selectedSize",
                    quantity: "$products.defaultQuantity",
                    ItemId: "$products._id",
                },
            },
            {
                $lookup: {
                    from: "productinfos",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $project: {
                    productId: 1,
                    quantity: 1,
                    size: 1,
                    color: 1,
                    ItemId: 1,
                    product: { $arrayElemAt: ["$product", 0] },
                },
            }
        ])

        products.forEach(item => {
            item.price = item.product.promotionalprice * item.quantity
            item.price = item.price.toFixed(2);
        })
        let total = 0
        products.forEach(item => {
            total = total + parseFloat(item.price)
        })
        total = total.toFixed(2)

        console.log("products")
        console.log(products)

        console.log("total")
        console.log(total)

        res.render('user/cart', { cartItems: products, total: total });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while retrieving cart items' });
    }
};


const deleteItem = async (req, res) => {
    try {
        console.log("delete item")

        const itemId = req.params.itemId;
        const userId = req.session.verifiedUser.userid;
        const usercart = await cartModel.findOne({ userId });

        if (usercart) {
            usercart.productIds = usercart.productIds.filter(id => id.toString() !== itemId);
            await usercart.save();

            res.status(200).json({ message: 'Item removed from the cart' });
        } else {
            res.status(404).json({ message: 'User\'s cart not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while removing the item from the cart' });
    }
};

const deleteAllItems = async (req, res) => {
    try {
        console.log("delete all items")


    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while removing the item from the cart' });
    }
};

const updateQuantity = async (req, res) => {
    console.log("update quantity")

    const ItemId = req.query.ItemId
    const increment = req.query.increment
    const user = req.session.verifiedUser
    console.log("itemId and increment and userid")
    console.log(ItemId, increment, user.userid)

    const cart = await cartModel.find({ userId: user.userid })
    console.log(cart)

    await cartModel.updateOne(
        { userId: user.userid, 'products._id': ItemId },
        { $inc: { 'products.$.defaultQuantity': increment } },
    )

    console.log("success")
    res.json({});
}


const checkout = async (req, res) => {
    try {
        console.log("proceed To Checkout")

        const user = req.session.verifiedUser
        console.log("user")
        console.log(user)

        const products = await cartModel.aggregate([
            {
                $match: { userId: new ObjectId(user.userid) }
            },
            {
                $unwind: "$products"
            },
            {
                $project: {
                    productId: "$products.productId",
                    color: "$products.selectedColor",
                    size: "$products.selectedSize",
                    quantity: "$products.defaultQuantity",
                    ItemId: "$products._id",
                },
            },
            {
                $lookup: {
                    from: "productinfos",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $project: {
                    productId: 1,
                    quantity: 1,
                    size: 1,
                    color: 1,
                    ItemId: 1,
                    product: { $arrayElemAt: ["$product", 0] },
                },
            }
        ])

        products.forEach(item => {
            item.price = item.product.promotionalprice * item.quantity
            item.price = item.price.toFixed(2);
        })
        let total = 0
        products.forEach(item => {
            total = total + parseFloat(item.price)
        })
        total = total.toFixed(2)

        console.log("products")
        console.log(products)

        console.log("total")
        console.log(total)


        const userDetails = await userModel.find({ _id: req.session.verifiedUser.userid })
        console.log("userDetails")
        console.log(userDetails)

        const error = req.session.walletError
        console.log("wallet error : " + error)
        res.render('user/checkout', { user: userDetails[0], cartItems: products, total: total, error: error })

    } catch (error) {
        console.log(error)
    }
}

const placeOrder = async (req, res) => {
    try {
        console.log("place order")

        const user = req.session.verifiedUser
        console.log("user session details")
        console.log(user)

        const User = await userModel.find({ _id: user.userid })
        console.log("user details")
        console.log(User)

        const { username, useremail } = req.body
        const { state, district, city, pin, house } = req.body
        const defaultPhone = req.body.phone
        const defaultAddress = { state, district, city, pin, house }
        console.log("user default details in submit")
        console.log({ username, useremail, defaultPhone, defaultAddress })

        const filter = { useremail: useremail };
        const update = {
            $set: {
                userphone: defaultPhone,
                useraddress: defaultAddress,
            },
        };
        const result = await userModel.updateOne(filter, update);

        const { stateTemp, districtTemp, cityTemp, pinTemp, houseTemp } = req.body
        const phoneTemp = req.body.phoneTemp
        console.log("user temp details in submit")
        console.log({ stateTemp, districtTemp, cityTemp, pinTemp, houseTemp }, phoneTemp)

        let attachAddress, attachPhone
        const tempAddress = { stateTemp, districtTemp, cityTemp, pinTemp, houseTemp }
        if (tempAddress.stateTemp != '' && tempAddress.districtTemp != '' && tempAddress.cityTemp != '' && tempAddress.houseTemp != '' && tempAddress.pinTemp != '' && phoneTemp != '') {
            attachAddress = tempAddress
            attachPhone = phoneTemp
        } else {
            attachAddress = defaultAddress
            attachPhone = defaultPhone
        }

        // get product details
        const products = await cartModel.aggregate([
            {
                $match: { userId: new ObjectId(user.userid) }
            },
            {
                $unwind: "$products"
            },
            {
                $project: {
                    productId: "$products.productId",
                    color: "$products.selectedColor",
                    size: "$products.selectedSize",
                    quantity: "$products.defaultQuantity",
                    ItemId: "$products._id",
                },
            },
            {
                $lookup: {
                    from: "productinfos",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $project: {
                    productId: 1,
                    quantity: 1,
                    size: 1,
                    color: 1,
                    ItemId: 1,
                    product: { $arrayElemAt: ["$product", 0] },
                },
            }
        ])

        products.forEach(item => {
            item.price = item.product.promotionalprice * item.quantity
            item.price = item.price.toFixed(2);
        })
        let total = 0
        products.forEach(item => {
            total = total + parseFloat(item.price)
        })
        total = total.toFixed(2)

        console.log("products")
        console.log(products)

        console.log("total")
        console.log(total)

        const payment = req.body.payment_option
        console.log("payment")
        console.log(payment)

        if (payment === 'cash_on_delivery') {
            paymentStatus = 'Awaiting Payment';
          } else {
            paymentStatus = 'Payment Done';
          }


        req.session.newOrder = {
            userId: user.userid,
            products: products,
            total: total,
            paymentMethod: payment,
            paymentStatus: paymentStatus,
            userPhone: attachPhone,
            userAddress: attachAddress,
        }

        console.log("req.session.newOrder")
        console.log(req.session.newOrder)

        if (req.session.newOrder.paymentMethod == "razorpay") {
            console.log("payment method === razorpay")

            req.session.payReciept = uuidv4();
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: req.session.payReciept,
            };
            instance.orders.create(options, function (err, order) {
                console.log(order);

                res.json(order);
            });
        } else if (req.session.newOrder.paymentMethod === "cash_on_delivery") {
            console.log("payment method === COD")

            // await orderModel.insertMany([req.session.newOrder])
            await orderModel.create(req.session.newOrder)
            await cartModel.deleteMany({ userId: req.session.verifiedUser.userid })

            // await couponModel.updateOne(
            //     { code: req.session.orders.couponId },
            //     { $push: { usedUsers: req.session.user } }
            // );

            res.json({ COD: true });
        } else { // req.session.newOrder.paymentMethod === "wallet"
            console.log("payment method === wallet")

            console.log("wallet amount");
            console.log(User[0].userwallet);
            console.log("billing total");
            const totalNumber = parseFloat(req.session.newOrder.total);
            console.log(totalNumber);

            if (totalNumber < User[0].userwallet) {

                //   for (var i = 0; i < req.session.newOrder.products.length; i++) {
                //     req.session.newOrder.products[i].paymentId = uuidv4();
                //     console.log("payment id for each products")
                //     console.log(req.session.newOrder.products[i].paymentId);
                //   }

                await orderModel.create(req.session.newOrder)
                await userModel.updateOne(
                    { _id: req.session.verifiedUser.userid },
                    { $inc: { userwallet: "-" + totalNumber } }
                );
                await cartModel.deleteMany({ userId: req.session.verifiedUser.userid })

                //   await couponModel.updateOne(
                //     { code: req.session.orders.couponId },
                //     { $push: { usedUsers: req.session.user } }
                //   );

                res.json({ WalletTrue: true });
            } else {
                console.log("Sorry you dont have enough money on your wallet");
                req.session.walletError = "Sorry you dont have enough money on your wallet";
                res.json({ WalletFalse: true });
            }

        }


    } catch (error) {
        console.log(error)
    }
}

const verifyPayment = async (req, res) => {
    try {
        console.log("verify payment url")
        console.log(req.body);

        const crypto = require("crypto");
        let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
        hmac.update(
            req.body["response[razorpay_order_id]"] +
            "|" +
            req.body["response[razorpay_payment_id]"]
        );
        hmac = hmac.digest("hex");
        console.log(req.body["response[razorpay_order_id]"]);
        console.log(req.body["response[razorpay_payment_id]"]);
        console.log(req.body["response[razorpay_signature]"]);
        console.log(hmac);
        if (hmac == req.body["response[razorpay_signature]"]) {
            // for (var i = 0; i < req.session.userdone.length; i++) {
            //     req.session.newOrder.products[i].paymentId =
            //     req.body["response[razorpay_payment_id]"];
            // }
            console.log("done");

            await orderModel.create(req.session.newOrder);
            await cartModel.deleteMany({ userId: req.session.verifiedUser.userid })

            res.json({ status: true });
        } else {
            console.log("failed transaction");
        }

    } catch (error) {
        console.log(error)
    }
}

const orderSuccess = (req, res) => {
    try {
        res.render('user/order-success')
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    viewItems,
    addToCart,
    deleteItem,
    deleteAllItems,
    updateQuantity,
    checkout,
    placeOrder,
    verifyPayment,
    orderSuccess
}

