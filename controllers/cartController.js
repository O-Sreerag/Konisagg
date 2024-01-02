const mongoose = require('mongoose');
const cartModel = require('../models/cartModel')
const wishlistModel = require('../models/wishlistModel')
const orderModel = require('../models/orderModel')
const productModel = require('../models/productModel')
const coupenModel = require('../models/coupenModel')
const categoryModel = require('../models/categoryModel')
const userModel = require('../models/userModel')
const { ObjectId } = require("mongodb");

const bcrypt = require("bcrypt");
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require('uuid');
// const { default: items } = require('razorpay/dist/types/items');
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
                        if (!req.session.Message) {
                            req.session.Message = {};
                        }
                        req.session.Message = "Product added/quantity updated in the cart"
                        res.redirect('/shop')
    
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
                    if (!req.session.Message) {
                        req.session.Message = {};
                    }
                    req.session.Message = "item added to cart"
                    res.redirect('/shop')
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
                if (!req.session.Message) {
                    req.session.Message = {};
                }
                req.session.Message = "item added to cart"
                res.redirect('/shop')
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
            if (!req.session.Message) {
                req.session.Message = {};
            }
            req.session.Message = "item added to cart"
            res.redirect('/shop')
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


const viewItems = async (req, res) => {
    try {
        console.log("cart/view-items root");

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
            if(item.product.promotionalprice) {
                item.price = item.product.promotionalprice * item.quantity
                item.price = item.price.toFixed(2);
            } else {
                item.price = item.product.regularprice * item.quantity
                item.price = item.price.toFixed(2);
            }
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

        const user = await userModel.findOne({ _id: userId });
        console.log(user)
        let isAddressEmpty 
        let isPhoneEmpty 
        if (user && user.useraddresses && user.useraddresses.length > 0) {
        } else {
            isAddressEmpty = 1;
        }
        if (user && user.userphone) {            
        } else {
            isPhoneEmpty = 1;
        }

        res.render('user/cart', { cartItems: products, total: total, isAddressEmpty: isAddressEmpty, isPhoneEmpty: isPhoneEmpty, Message: req.session?.Message});
        if(req.session.Message) {
            req.session.Message = null
        }

    } catch (error) {
        console.log(error);
        if (!req.session.Message) {
            req.session.Message = {};
        }
        req.session.Message = "an Error occured while retrieving cart items"
        res.redirect('/shop')
    }
};


const deleteItem = async (req, res) => {
    try {
        console.log("delete item")

        const itemId = req.query.itemId;
        const color = req.query.color;
        const size = req.query.size;
        console.log(`itemId: ${itemId} color: ${color} size: ${size} `)

        const userId = req.session.verifiedUser.userid;
        const usercart = await cartModel.findOne({ userId });
        console.log("usercart " + usercart)

        if (usercart) {
            // Filter the user's products array to remove the matching item
            usercart.products = usercart.products.filter(product =>
                !(String(product.productId) === itemId &&
                product.selectedColor === color &&
                product.selectedSize === size)
            );

            await usercart.save();

            console.log('Product removed from the user cart successfully');
            if (!req.session.Message) {
                req.session.Message = {};
            }
            req.session.Message = "Product removed"
            res.redirect('/cart/view')
        } else {
            if (!req.session.Message) {
                req.session.Message = {};
            }
            req.session.Message = "User\'s cart not found"
            res.redirect('/cart/view')
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while removing the item from the cart' });
    }
};

const deleteAllItems = async (req, res) => {
    try {
        console.log("delete all items")

        const userId = req.session.verifiedUser.userid;
        const usercart = await cartModel.findOne({ userId });
        console.log("usercart " + usercart)

        const updatedCart = await cartModel.findOneAndUpdate(
            { userId },
            { $set: { products: [] } },
            { new: true }
        );

        if (updatedCart) {
            console.log('All products removed from the user cart successfully');
            if (!req.session.Message) {
                req.session.Message = {};
            }
            req.session.Message = "All products deleted from user cart"
            res.redirect('/cart/view')
        } else {
            if (!req.session.Message) {
                req.session.Message = {};
            }
            req.session.Message = "User\'s cart not found"
            res.redirect('/cart/view')
        }

    } catch (error) {
        console.log(error);
        if (!req.session.Message) {
            req.session.Message = {};
        }
        req.session.Message = "An error occurred while removing the item from the cart"
        res.redirect('/cart/view')
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
            if(item.product.promotionalprice) {
                item.price = item.product.promotionalprice * item.quantity
                item.price = item.price.toFixed(2);
            } else {
                item.price = item.product.regularprice * item.quantity
                item.price = item.price.toFixed(2);
            }
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

        const userId = req.session.verifiedUser.userid
        const availableCoupens = await coupenModel.find({
            usedBy: { $nin: [userId] } 
        });
        console.log("availableCoupens")
        console.log(availableCoupens)

        const error = req.session.walletError
        console.log("wallet error : " + error)

        const parentCategories = await categoryModel.aggregate([
            {
            $match: { tier: 1 } 
            },
            {
            $lookup: {
                from: 'categoryinfos', 
                localField: 'subCategories',
                foreignField: '_id',
                as: 'subCategoriesData' 
            }
            },
            {
            $project: {
                name: 1,  
                image: 1, 
                subCategoriesData: {
                _id: 1,
                name: 1, 
                products: 1 
                }
            }
            }
        ]);
        console.log("parent categories")
        console.log(parentCategories);  
    
        const allCategories = await categoryModel.find({})
        console.log("all categories")
        console.log(allCategories)
    
        let wishlistItemCount, cartItemCount  
        if(user?.userid) {
            const wishlist = await wishlistModel.findOne({ userId: user?.userid})
            const cart = await cartModel.findOne({ userId: user?.userid})
            console.log("wishlist & cart")
            console.log(wishlist + "\n" + cart)
            
            wishlistItemCount = wishlist?.productIds?.length || 0
            cartItemCount = cart?.products?.length || 0
        }
        console.log(wishlistItemCount + " " + cartItemCount)

        res.render('user/checkout', { 
            loginStatus: req.session?.verifiedUser?.loginStatus,
            username: req.session?.verifiedUser?.username,
            user: userDetails[0],
            cartItems: products,
            total: total,
            coupens: availableCoupens,
            error: error,
            parentCategories: parentCategories,
            allCategories: allCategories,
            wishlistItemCount: wishlistItemCount,
            cartItemCount: cartItemCount, })

    } catch (error) {
        console.log(error)
    }
}

const applyCoupen = async (req, res) => {
    try {
        console.log("apply coupen code root.")
        
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
            if(item.product.promotionalprice) {
                item.price = item.product.promotionalprice * item.quantity
                item.price = item.price.toFixed(2);
            } else {
                item.price = item.product.regularprice * item.quantity
                item.price = item.price.toFixed(2);
            }
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

        const {coupenCode} = req.body
        console.log(coupenCode)

        const coupen = await coupenModel.findOne({code:coupenCode})
        console.log(coupen)

        if (!coupen) {
            return res.status(400).json({ error: 'Invalid coupen code' });
        }

        if (coupen.minPurchaseAmount && total < coupen.minPurchaseAmount) {
            console.log("total < minPurchaseAmount")
            return res.status(400).json({ error: 'Minimum amount not met for this coupen' });
        }

        let appliedDiscount = 0;

        if (coupen.type === 'flat') {
            // For flat discount type, subtract the discount from the total
            appliedDiscount = coupen.discount;
        } else if (coupen.type === 'percentage') {
            // For percentage discount type, calculate the discounted amount
            appliedDiscount = total * (coupen.discount / 100);
        }

        console.log(total)
        console.log(appliedDiscount)
        total = parseFloat(total);
        console.log(total)
        
        // Check if total is a valid number before proceeding
        if (typeof total !== 'number' || isNaN(total)) {
            throw new Error('Total is not a valid number');
        }
        
        let discountedTotal = (total - appliedDiscount).toFixed(2);
        discountedTotal = parseFloat(discountedTotal);

        // Ensure discountedTotal is a valid number before sending the response
        if (typeof discountedTotal !== 'number' || isNaN(discountedTotal)) {
            throw new Error('Discounted total is not a valid number');
        }

        total = total.toFixed(2)
        discountedTotal = discountedTotal.toFixed(2)

        return res.json({ total: discountedTotal, discount: appliedDiscount, appliedCoupenCode: coupenCode});

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

        // console.log({selectedState, selectedDistrict, selectedCity, selectedPin, selectedHouse})        
        const { username, useremail } = req.body
        const {selectedState, selectedDistrict, selectedCity, selectedPin, selectedHouse} = req.body
        const defaultPhone = req.body.phone
        const defaultAddress = {selectedState, selectedDistrict, selectedCity, selectedPin, selectedHouse}
        console.log("user default details in submit")
        console.log({ username, useremail, defaultPhone, defaultAddress })

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
            if(item.product.promotionalprice) {
                item.price = item.product.promotionalprice * item.quantity
                item.price = item.price.toFixed(2);
            } else {
                item.price = item.product.regularprice * item.quantity
                item.price = item.price.toFixed(2);
            }
        })
        let total = 0
        products.forEach(item => {
            total = total + parseFloat(item.price)
        })
        total = total.toFixed(2)

        products.forEach(item => {
            item.status = "cancel"
        })

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

        const { discount, appliedCoupenCode } = req.body;
        console.log("coupen details");
        console.log({ discount, appliedCoupenCode });

        // Calculate total with discount (if applicable)
        let totalWithDiscount
        if (discount) {
            totalWithDiscount = parseFloat(total);
            totalWithDiscount -= parseFloat(discount);
            totalWithDiscount = totalWithDiscount.toFixed(2);
        }

        // Check if a coupon code was applied
        if (appliedCoupenCode) {
            req.session.newOrder.discount = discount;
            req.session.newOrder.totalWithDiscount = totalWithDiscount;
            req.session.newOrder.appliedCoupenCode = appliedCoupenCode;
        }

        console.log("req.session.newOrder")
        console.log(req.session.newOrder)

        if (req.session.newOrder.paymentMethod == "razorpay") {
            console.log("payment method === razorpay")

            req.session.payReciept = uuidv4();
            let amount
            if(totalWithDiscount) {
                amount = totalWithDiscount * 100
            } else {
                amount = total * 100
            }
            var options = {
                amount: amount,
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

            await coupenModel.updateOne(
                { code: req.session.newOrder.appliedCoupenCode },
                { $push: { usedBy: req.session.verifiedUser.userid} }
            );

            res.json({ COD: true });
        } else { // req.session.newOrder.paymentMethod === "wallet"
            console.log("payment method === wallet")

            console.log("wallet amount");
            console.log(User[0].userwallet);
            console.log("billing total");
            let totalNumber 
            if (totalWithDiscount) {
                totalNumber = parseFloat(req.session.newOrder.totalWithDiscount);
            } else {
                totalNumber = parseFloat(req.session.newOrder.total);
            }
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

                await coupenModel.updateOne(
                { code: req.session.newOrder.appliedCoupenCode },
                { $push: { usedBy: req.session.verifiedUser.userid} }
                );

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

            await coupenModel.updateOne(
                { code: req.session.newOrder.appliedCoupenCode },
                { $push: { usedBy: req.session.verifiedUser.userid} }
            );

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
    applyCoupen,
    placeOrder,
    verifyPayment,
    orderSuccess
}

