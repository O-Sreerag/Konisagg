const productModel = require('../models/productModel')
const categoryModel = require('../models/categoryModel')

const userShop = async(req, res, next) => {
    console.log("user shop")

    console.log("req.session.verifiedUser :")
    console.log(req.session.verifiedUser)
    const products = await productModel.find()
    console.log("products :")
    console.log(products)

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

    res.render('user/shop', 
    { loginStatus: req.session?.verifiedUser?.loginStatus,
        username: req.session?.verifiedUser?.username,
        productList: products,
        categories: parentCategories
    })

    // res.render('user/shop', {loginStatus:req.session?.user?.loginStatus, useremail: req.session?.user?.username, productList:products, categoryList: categories, categoriesT1: categoriesTier1})
}

const getOnlyCategories =  async(req, res, next) => {
    console.log('reached')
    const categories = await categoryModel.find()
    res.json(categories)
}

const productDetails = async(req, res, next) => {
    try {
        console.log("req.session.verifiedUser :")
        console.log(req.session.verifiedUser)

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

        console.log("product details");
        console.log(req.query.productid) 
        const product= await productModel.findOne({_id: req.query.productid})
        console.log(product)

        res.render('user/product-details', 
        { loginStatus: req.session?.verifiedUser?.loginStatus,
            username: req.session?.verifiedUser?.username,
            productDetails: product,
            categories: parentCategories
        })
        // res.render('user/product-details', {loginStatus:req.session?.user?.loginStatus, useremail: req.session?.user?.username, productDetails:product})
    } catch (error) {
        console.log(error);
    }

}
  module.exports = {userShop, productDetails, getOnlyCategories}