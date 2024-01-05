const productModel = require('../models/productModel')
const categoryModel = require('../models/categoryModel')
const cartModel = require('../models/cartModel')
const wishlistModel = require('../models/wishlistModel')

// const userShop = async(req, res, next) => {
//     console.log("user shop")

//     console.log("req.session.verifiedUser :")
//     const user = req.session.verifiedUser
//     console.log(user)
//     const products = await productModel.find()
//     console.log("products :")
//     console.log(products)

    
//     function createSubsetArray(products, limitValue) {
//         const productsArray = [];
//         let start = 0;
    
//         while (start < products.length) {
//         const subset = products.slice(start, start + limitValue);
//         productsArray.push(subset);
//         start += limitValue;
//         }
    
//         return productsArray;
//     }
    
//     const limitValue = 1; 
//     const productsArray = createSubsetArray(products, limitValue);
    
//     console.log("Products Array:");
//     console.log(productsArray);

//     const parentCategories = await categoryModel.aggregate([
//         {
//         $match: { tier: 1 } 
//         },
//         {
//         $lookup: {
//             from: 'categoryinfos', 
//             localField: 'subCategories',
//             foreignField: '_id',
//             as: 'subCategoriesData' 
//         }
//         },
//         {
//         $project: {
//             name: 1,  
//             image: 1, 
//             subCategoriesData: {
//             _id: 1,
//             name: 1, 
//             products: 1 
//             }
//         }
//         }
//     ]);
//     console.log("parent categories")
//     console.log(parentCategories);  

//     const allCategories = await categoryModel.find({})
//     console.log("all categories")
//     console.log(allCategories)

//     let wishlistItemCount, cartItemCount  
//     if(user?.userid) {
//         const wishlist = await wishlistModel.findOne({ userId: user?.userid})
//         const cart = await cartModel.findOne({ userId: user?.userid})
//         console.log("wishlist & cart")
//         console.log(wishlist + "\n" + cart)
        
//         wishlistItemCount = wishlist?.productIds?.length || 0
//         cartItemCount = cart?.products?.length || 0
//     }
//     console.log(wishlistItemCount + " " + cartItemCount)

//     res.render('user/shop', 
//     {   loginStatus: req.session?.verifiedUser?.loginStatus,
//         username: req.session?.verifiedUser?.username,
//         productList: products,
//         parentCategories: parentCategories,
//         allCategories: allCategories,
//         wishlistItemCount: wishlistItemCount,
//         cartItemCount: cartItemCount,
//         productsLength: products.length,
//         productsArray: productsArray,
//         productsArrayJson: JSON.stringify(productsArray),
//         productsArrayLengthJson: JSON.stringify(productsArray.length)
//     })

//     // res.render('user/shop', {loginStatus:req.session?.user?.loginStatus, useremail: req.session?.user?.username, productList:products, categoryList: categories, categoriesT1: categoriesTier1})
// }

const userShop = async (req, res, next) => {
    console.log("user shop");

    console.log("req.session.verifiedUser :");
    const user = req.session.verifiedUser;
    console.log(user);

    try {
        const page = +req.query.page || 1; // Get page number from query parameter or default to 1
        const limit = 6; // Number of products per page

        // const products = await productModel.find();
        // const totalProducts = products.length;

        let products;
        let totalProducts;

        // Check if categoryId exists in the query
        if (req.query.categoryId) {
            console.log(req.query.categoryId)
            const categoryId = req.query.categoryId;
            const categoryProducts = await productModel.find({ categories: categoryId, status: true }); // Replace 'categoryId' with the field in your product model representing the category

            totalProducts = categoryProducts.length;
            products = categoryProducts.slice((page - 1) * limit, page * limit);
        } else {
            products = await productModel.find({status: true});
            totalProducts = products.length;

            products = products.slice((page - 1) * limit, page * limit);
        }

        const totalPages = Math.ceil(totalProducts / limit);
        // Assuming you've calculated these variables:
        const lastPage = totalPages; // Total number of pages

        // Logic to generate pageNumbers array
        const pageNumbers = [];
        for (let i = 1; i <= lastPage; i++) {
            pageNumbers.push(i);
        }


        // const paginatedProducts = products.slice((page - 1) * limit, page * limit);

        // Your existing code for creating product subsets

        function createSubsetArray(products, limitValue) {
            const productsArray = [];
            let start = 0;

            while (start < products.length) {
                const subset = products.slice(start, start + limitValue);
                productsArray.push(subset);
                start += limitValue;
            }

            return productsArray;
        }

        const productsArray = createSubsetArray(products, limit);

        // Your existing code for fetching categories, wishlist, cart, etc.
        console.log("Products Array:");
        console.log(productsArray);

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
        
        res.render('user/shop', {
            loginStatus: req.session?.verifiedUser?.loginStatus,
            username: req.session?.verifiedUser?.username,
            productList: products,
            parentCategories: parentCategories,
            allCategories: allCategories,
            wishlistItemCount: wishlistItemCount,
            cartItemCount: cartItemCount,
            productsLength: totalProducts,
            currentPage: page,
            pageNumbers: pageNumbers,
            hasNextPage: limit * page < totalProducts,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages,
            productsArray: productsArray,
            productsArrayJson: JSON.stringify(productsArray),
            productsArrayLengthJson: JSON.stringify(productsArray.length),
            Message: req.session?.Message,
            categoryId: req.query?.categoryId,
        });
        if(req.session.Message) {
            req.session.Message = null
        }
    } catch (error) {
        console.error(error);
        // Handle errors appropriately
    }
};


const getOnlyCategories =  async(req, res, next) => {
    console.log('reached')
    const categories = await categoryModel.find()
    res.json(categories)
}

const productDetails = async(req, res, next) => {
    try {
        console.log("req.session.verifiedUser :")
        const user = req.session.verifiedUser
        console.log(user)

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

        console.log("product details");
        console.log(req.query.productid) 
        const product= await productModel.findOne({_id: req.query.productid})
        console.log(product)

        res.render('user/product-details', 
        {   loginStatus: req.session?.verifiedUser?.loginStatus,
            username: req.session?.verifiedUser?.username,
            userimage: req.session?.verifiedUser?.userimage,
            productDetails: product,
            parentCategories: parentCategories,
            allCategories: allCategories,
            wishlistItemCount: wishlistItemCount,
            cartItemCount: cartItemCount,
        })
        // res.render('user/product-details', {loginStatus:req.session?.user?.loginStatus, useremail: req.session?.user?.username, productDetails:product})
    } catch (error) {
        console.log(error);
    }
}

const sortByCategory = async (req, res) => {
    try {
        console.log(" sort by category root")

        const categoryId = req.query.categoryId
        console.log("categoryId : " + categoryId)

        if(categoryId == "allCategories") {
            const products = await productModel.find({});

            res.json({
                categoryName: "All Categories",
                products :products,
                productsLength: products.length
            })
        } else {
            const category = await categoryModel.findOne({_id: categoryId})

            console.log(category)
            const productIds = category.products
    
            // find products from productModel
            const products = await productModel.find({ _id: { $in: productIds } });
    
            res.json({
                categoryName: category.name,
                products :products,
                productsLength: products.length
            })
        }

    } catch (error) {
        console.log(error)
    }
} 

const sortByPrice = async (req, res) => {
    try {
        console.log(" sort by category root")

        const selectedOption = req.body.selectedOption
        const category = req.body.category

        console.log("selectedOption, category")
        console.log(selectedOption, category)

        if(category == "All Categories"){
            console.log("all categories")
            
            if(selectedOption == "1") {
                console.log("selected option is 1")
                // find products from productModel
                const products = await productModel.find({});

                console.log(products)
                    
                res.json({
                    categoryName: "All Categories",
                    products :products,
                    productsLength: products.length
                })
            } else if(selectedOption == "2") {
                console.log("selectedOption is 2")

                const products = await productModel.aggregate([
                    { $match: {} },
                    {
                      $addFields: {
                        sortingField: {
                          $cond: {
                            if: { $gte: ["$promotionalprice", 0] }, // Check if promotionalprice exists and greater than or equal to 0
                            then: "$promotionalprice", // If promotionalprice exists, use promotionalprice for sorting
                            else: "$regularprice" // If promotionalprice doesn't exist, use regularprice for sorting
                          }
                        }
                      }
                    },
                    { $sort: { sortingField: 1 } }
                  ]);                  
                        
                  console.log(products)
                res.json({
                    categoryName: "All Categories",
                    products :products,
                    productsLength: products.length
                })
            } else {
                console.log("selectedOption is 3")

                const products = await productModel.aggregate([
                    { $match: {} },
                    {
                      $addFields: {
                        sortingField: {
                          $cond: {
                            if: { $gte: ["$promotionalprice", 0] }, // Check if promotionalprice exists and greater than or equal to 0
                            then: "$promotionalprice", // If promotionalprice exists, use promotionalprice for sorting
                            else: "$regularprice" // If promotionalprice doesn't exist, use regularprice for sorting
                          }
                        }
                      }
                    },
                    { $sort: { sortingField: -1 } }
                  ]);                  
                        
                  console.log(products)
                res.json({
                    categoryName: "All Categories",
                    products :products,
                    productsLength: products.length
                })
            }

            
        } else {
            console.log("not all categories")

            const filteredCategory = await categoryModel.findOne({name: category})
            console.log(filteredCategory)
            const productIds = filteredCategory.products
    

            if(selectedOption == "1") {
                console.log("selected option is 1")
                // find products from productModel
                const products = await productModel.find({ _id: { $in: productIds } });

                console.log(products)
                    
                res.json({
                    categoryName: filteredCategory.name,
                    products :products,
                    productsLength: products.length
                })
            } else if(selectedOption == "2") {
                console.log("selectedOption is 2")

                const products = await productModel.aggregate([
                    { $match: { _id: { $in: productIds } } },
                    {
                      $addFields: {
                        sortingField: {
                          $cond: {
                            if: { $gte: ["$promotionalprice", 0] }, // Check if promotionalprice exists and greater than or equal to 0
                            then: "$promotionalprice", // If promotionalprice exists, use promotionalprice for sorting
                            else: "$regularprice" // If promotionalprice doesn't exist, use regularprice for sorting
                          }
                        }
                      }
                    },
                    { $sort: { sortingField: 1 } }
                  ]);                  
                        
                  console.log(products)
                res.json({
                    categoryName: filteredCategory.name,
                    products :products,
                    productsLength: products.length
                })
            } else {
                console.log("selectedOption is 3")

                const products = await productModel.aggregate([
                    { $match: { _id: { $in: productIds } } },
                    {
                      $addFields: {
                        sortingField: {
                          $cond: {
                            if: { $gte: ["$promotionalprice", 0] }, // Check if promotionalprice exists and greater than or equal to 0
                            then: "$promotionalprice", // If promotionalprice exists, use promotionalprice for sorting
                            else: "$regularprice" // If promotionalprice doesn't exist, use regularprice for sorting
                          }
                        }
                      }
                    },
                    { $sort: { sortingField: -1 } }
                  ]);                  
                        
                  console.log(products)
                res.json({
                    categoryName: filteredCategory.name,
                    products :products,
                    productsLength: products.length
                })
            }
        }

    } catch (error) {
        console.log(error)
    }
} 

const searchProduct = async (req, res) => {
    try {
        console.log("search product on shop root")

        let payload = req.body.payload.trim()
        console.log(payload)
        let search = await productModel.find({productname:{$regex: new RegExp('^'+payload+'.*',"i")}}).exec()
        search = search.slice(0, 10);
        console.log(search)
        if(payload) {
            if(search) {
                res.send({payload: search})
            } else {
                res.send({payload: []})
            }
        }else {
            res.send({payload: "payloadEmpty"})
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = 
    {userShop,
    productDetails,
    getOnlyCategories,
    sortByCategory,
    searchProduct,
    sortByPrice
}