const mongoose = require('mongoose');
const wishlistModel = require('../models/wishlistModel')
const productModel = require('../models/productModel')

const addToWishlist = async (req, res, next) => {
    try {
        console.log("add to wishlist ") 

        const itemId = req.query.wishlistItemId
        console.log(itemId)
        const userId = req.session.verifiedUser.userid
        console.log(userId)
         
        const userWishlist = await wishlistModel.findOne({ userId });
        if (userWishlist) {
            if (!userWishlist.productIds.includes(itemId)) {
                userWishlist.productIds.push(itemId);
                await userWishlist.save();
                res.status(200).json({ message: 'Product added to wishlist' });
            } else {
                res.status(200).json({ message: 'Product already exists in the wishlist' });
            }
        } else {
            const newWishlist = new wishlistModel({
                userId,
                productIds: [itemId],
            });
            await newWishlist.save();
        }

        res.status(200).json({ message: 'Product added to wishlist' });
    } catch(error) {
        console.log(error)
    }
}

const viewItems = async (req, res) => {
    try {
        console.log("wishlist view items");

        const wishlist = await wishlistModel.findOne({});
        console.log("wishlist items");
        console.log(wishlist);

        if (!wishlist || !wishlist.productIds || wishlist.productIds.length === 0) {
            res.render('user/wishlist', { wishlistItems: [] });
        } else {
            const productIds = wishlist.productIds;
            const products = await productModel.find({ _id: { $in: productIds } });
            console.log('products');
            console.log(products);

            res.render('user/wishlist', { wishlistItems: products });
        }
    } catch (error) {
        console.log(error);
    }
};


const contactUs = (req, res) => {
    res.send('contactUs')
}

const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const userId = req.session.verifiedUser.userid;

        const userWishlist = await wishlistModel.findOne({ userId });

        if (userWishlist) {
            userWishlist.productIds = userWishlist.productIds.filter(id => id.toString() !== itemId);
            await userWishlist.save();

            res.status(200).json({ message: 'Item removed from the wishlist' });
        } else {
            res.status(404).json({ message: 'User\'s wishlist not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while removing the item from the wishlist' });
    }
};

module.exports = {
    addToWishlist,
    viewItems,
    contactUs,
    deleteItem,
}