const categoryModel = require('../models/categoryModel')
const productModel = require('../models/productModel')
const productOfferModel = require('../models/productOfferModel')
const categoryOfferModel = require('../models/categoryOfferModel')

const offerExpired = async () => {
    try {
        // Find and delete expired product offers
        const expiredProductOffers = await productOfferModel.find({ endDate: { $lte: new Date() } });
        
        // Find and delete expired category offers
        const expiredCategoryOffers = await categoryOfferModel.find({ endDate: { $lte: new Date() } });

        console.log('Expired offers deleted successfully');

        // Update prices for affected products
        const expiredProductsIdsFromProductOffer = [
            ...expiredProductOffers.map(offer => offer.for),
        ];
        const expiredCategoryOfferIds = [
            ...expiredCategoryOffers.map(offer => offer.for) 
        ];
        

        // updating products from expired product offers
        for (const productId of expiredProductsIdsFromProductOffer) {
            
            // Fetch offers for the specific product
            const product = await productModel.findById(productId);
            const productOffer = await productOfferModel.findOne({ for: product._id}).select('discountPercentage');
            const categoryOffer = await categoryOfferModel.findOne({ for: product.categories[1] }).select('discountPercentage');
            
            // Update the product's promotional price based on the highest discount percentage
            if(categoryOffer) {
                if(productOffer > categoryOffer) {
                    console.log(`both product and category offers exists for the product ${product} and product offer > category offer`)
                    
                    const updatedPromotionalPrice = product.regularprice - (product.regularprice * (categoryOffer / 100));
                    await productModel.findByIdAndUpdate(offer_for[1], { promotionalprice: updatedPromotionalPrice });
                    
                    console.log(`now only category offer exists for the product ${product} and change is made for the product promotional price`)
                } else {
                    console.log(`both product and category offers exists for the product ${product} and product offer < category offer`)
                    console.log(`now only category offer exists for the product ${product} and no change is made for the product promotional price`)
                }
            } else {
                console.log(`Only product offer exists for the product ${product}`)

                // simply set promotional price to null
                await productModel.findByIdAndUpdate(offer_for[1], {promotionalprice: null})
                console.log(`now no offers exists for the product ${product}`)
            }
        }
        
        
        // updating products from expired category offers
        for (const categoryId of expiredCategoryOfferIds) {

            // Fetch products associated with the category
            const category = await categoryModel.findById(categoryId);
            const expiredProductIdsFromCategoryOffer = category.products; 

            // Update promotional prices of all products in the category
            for (const productId of expiredProductIdsFromCategoryOffer) {
                // Fetch offers for the specific product
                const product = await productModel.findById(productId);
                const productOffer = await productOfferModel.findOne({ for: product._id }).select('discountPercentage');
                const categoryOffer = await categoryOfferModel.findOne({ for: product.category }).select('discountPercentage');

                // Update the product's promotional price based on the highest discount percentage
                if(productOffer) {
                    if(categoryOffer > productOffer) {
                        console.log(`both product and category offers exists for the product ${product} and product offer < category offer`)
                        
                        const updatedPromotionalPrice = product.regularprice - (product.regularprice * (productOffer / 100));
                        await productModel.findByIdAndUpdate(offer_for[1], { promotionalprice: updatedPromotionalPrice });
                        
                        console.log(`now only product offer exists for the product ${product} and change is made for the product promotional price`)
                    } else {
                        console.log(`both product and category offers exists for the product ${product} and product offer > category offer`)
                        console.log(`now only product offer exists for the product ${product} and no change is made for the product promotional price`)
                    }
                } else {
                    console.log(`Only category offer exists for the product ${product}`)

                    // simply set promotional price to null
                    await productModel.findByIdAndUpdate(offer_for[1], {promotionalprice: null})
                    console.log(`now no offers exists for the product ${product}`)
                }
            }
        }

        await productOfferModel.deleteMany({ endDate: { $lte: new Date() } });
        await categoryOfferModel.deleteMany({ endDate: { $lte: new Date() } });

        console.log('Prices updated for affected products');
    } catch (error) {
        console.error('Error handling expired offers and updating prices:', error);
    }
};

// Call the function to delete expired offers and update prices
offerExpired();

module.exports = {
    offerExpired
}
