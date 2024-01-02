const mongoose = require('mongoose');


const adminModel = require('../models/adminModel')
const userModel = require('../models/userModel')
const orderModel = require('../models/orderModel')
const categoryModel = require('../models/categoryModel')
const productModel = require('../models/productModel')
const productOfferModel = require('../models/productOfferModel')
const categoryOfferModel = require('../models/categoryOfferModel')

const sharp = require('../middlewares/sharp')


const adminCategoryOffersList = async (req, res) => {
    try {
        console.log("admin category offers list")

        const categoryOffers = await categoryOfferModel.find({})

        res.render('admin/offers-categoryOffers', {categoryOffersList: categoryOffers, Message: req.session?.Message})
        if(req.session.Message) {
            req.session.Message = null
        }
    } catch (error) {
        console.log(error)
    }
}

const adminProductOffersList = async (req, res) => {
    try {
        console.log("admin product offers list")

        const productOffers = await productOfferModel.find({})
        
        res.render('admin/offers-productOffers', {productOffersList: productOffers, Message: req.session?.Message})
        if(req.session.Message) {
            req.session.Message = null
        }
    } catch (error) {
        console.log(error)
    }
}

const adminAddCategoryOffer = (req, res) => {
    try {
        console.log("admin adding category offer")
        
        const categoryId = req.query.categoryId
        console.log("categoryId")
        console.log(categoryId)

        res.redirect(`/admin/offers/addOffer?categoryId=${categoryId}`);
    } catch(error) {
        console.log(error)
    }
}

const adminAddProductOffer = (req, res) => {
    try {
        console.log("admin adding product offer")
        
        const productId = req.query.productId
        console.log("productId")
        console.log(productId)

        res.redirect(`/admin/offers/addOffer?productId=${productId}`);
    } catch(error) {
        console.log(error)
    }
}

const adminAddOffer = async (req, res) => {
    try {
        console.log("admin offers get")
 
        let productId = req.query.productId;
        let categoryId = req.query.categoryId;
        let product 
        let category

        if (!productId && !categoryId) {
            res.render('admin/offers-add', { nothingSelected: 1 });
            return;
        }

        if (productId) {
            console.log("offer for product", productId);
            product = await productModel.findOne({ _id: productId });
            console.log(product);
        } else if (categoryId) {
            console.log("offer for category", categoryId);
            category = await categoryModel.findOne({ _id: categoryId });
            console.log(category);
        }

        res.render('admin/offers-add', {product: product, category: category})
    } catch (error) {
        console.log(error)
    }
}

const adminAddOfferSubmit = async (req, res) => {
    try {
        console.log("admin add offer submit")

        const { offer_for, offer_name, offer_description, discountPercentage, startDate, endDate } = req.body;
        console.log({ offer_for, offer_name, offer_description, discountPercentage, startDate, endDate });
        const offer_image = req.file;
        console.log(offer_image);

        let highestDiscount = 0; 

        if (offer_for[0] === "product") {
            const newProductOffer = new productOfferModel({
                for: offer_for[1],
                name: offer_name,
                description: offer_description,
                image: offer_image.filename,
                discountPercentage: discountPercentage,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            });

            await newProductOffer.save();
            highestDiscount = Number(discountPercentage); 

            console.log('Product Offer saved successfully');
            req.session.Message = 'Product Offer saved successfully'
            res.redirect('/admin/offers/category-offers')
            // res.send('Product Offer saved successfully');

            // Fetch offers for the specific product
            const product = await productModel.findById(offer_for[1]);
            const categoryOffer = await productOfferModel.findOne({ for: product.categories[1] }).select('discountPercentage');

            // Update the product's promotional price based on the highest discount percentage
            if(categoryOffer) {
                highestDiscount = Math.max(highestDiscount, categoryOffer);
            }
            if (offer_for[1] !== null) {
                const updatedPromotionalPrice = product.regularprice - (product.regularprice * (highestDiscount / 100));
                await productModel.findByIdAndUpdate(offer_for[1], { promotionalprice: updatedPromotionalPrice });

                console.log('Product promotional price updated successfully');
            }
        } else {
            const newCategoryOffer = new categoryOfferModel({
                for: offer_for[1],
                offer_name,
                name: offer_name,
                description: offer_description,
                image: offer_image.filename, 
                discountPercentage: discountPercentage,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            });
            
            await newCategoryOffer.save();

            console.log('Category Offer saved successfully');
            req.session.Message = 'Category Offer saved successfully'
            res.redirect('/admin/offers/category-offers')
            // res.send('Category Offer saved successfully');

            highestDiscount = Number(discountPercentage)

            // Fetch products associated with the category
            const category = await categoryModel.findById(offer_for[1]);
            const productsInCategory = category.products; 

            // Update promotional prices of all products in the category
            for (const productId of productsInCategory) {
                // Fetch offers for the specific product
                const product = await productModel.findOne({_id: productId});
                console.log(product)
                const productOffer = await productOfferModel.findOne({ for: product._id }).select('discountPercentage');

                console.log(productOffer)
                console.log(isNaN(productOffer))

                console.log(highestDiscount)

                // Update the product's promotional price in the database
                if(productOffer) {
                    highestDiscount = Math.max(highestDiscount, productOffer.discountPercentage); 
                }

                console.log(product.regularprice )
                console.log(highestDiscount )
                const updatedPromotionalPrice = product.regularprice - (product.regularprice * (highestDiscount / 100));
                console.log(updatedPromotionalPrice)
                if (!isNaN(updatedPromotionalPrice)) {
                    await productModel.findByIdAndUpdate(productId, { promotionalprice: updatedPromotionalPrice });
                    console.log(`Product promotional price updated successfully for product ID: ${productId}`);
                } else {
                    console.log(`Invalid updated promotional price for product ID: ${productId}`);
                    // Handle the case where updatedPromotionalPrice is not a valid number
                }
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Error saving offer');
    }
};


module.exports = {
    adminCategoryOffersList,
    adminProductOffersList,
    adminAddCategoryOffer,
    adminAddProductOffer,
    adminAddOffer,
    adminAddOfferSubmit,
}