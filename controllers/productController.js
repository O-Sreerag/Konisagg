const mongoose = require('mongoose');
const productModel = require('../models/productModel')
const categoryModel = require('../models/categoryModel')
const productOfferModel = require('../models/productOfferModel')
const categoryOfferModel = require('../models/categoryOfferModel');
const cartModel = require('../models/cartModel');

// // admin products list 
// const adminProducts = async (req, res, next) => {
//     try {
//         console.log("admin side products listing root")

//         const products = await productModel.find()
//         console.log(products)
//         res.render('admin/products', { productList: products })

//     } catch(error) {
//         console.log(error)
//     }
// }

const ITEMS_PER_PAGE = 5; // Number of products per page

const adminProducts = async (req, res, next) => {
  try {
    const page = +req.query.page || 1; // Get page number from query parameter or default to 1

    const totalProducts = await productModel.countDocuments();
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    const products = await productModel
      .find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('admin/products', {
      productList: products,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: totalPages,
      pageNumbers: Array.from({ length: totalPages }, (_, index) => index + 1),
      Message: req.session?.Message
    });

    if(req.session.Message) {
        req.session.Message = null
    }
  } catch (error) {
    console.log(error);
    // Handle errors or return an error page
    res.status(500).send('Internal Server Error');
  }
};


// admin products add
const adminAddProducts = async (req, res, next) => {
    try {
        console.log("admin side products add get root")
    
        const allCategories = await categoryModel.find(); // Fetch all categories
        const parentCategories = await categoryModel.find({ tier: 1 }); // Fetch parent categories

        console.log("allCategories:", allCategories);
        console.log("parentCategories:", parentCategories);
    
        if (allCategories.length === 0) {
            // Case: No categories at all
            res.render('admin/product-add', { NoCat: 1 });
        }  else {
            let atLeastOneParentHasSubcategories = false;
        
            for (const parent of parentCategories) {
                if (parent.subCategories.length > 0) {
                    // At least one parent category has subcategories
                    atLeastOneParentHasSubcategories = true;
                    break;
                }
            }
        
            if (atLeastOneParentHasSubcategories) {
                let allParentsHaveSubcategories = true;
        
                for (const parent of parentCategories) {
                    if (parent.subCategories.length === 0) {
                        // Case: At least one parent category has no subcategories
                        allParentsHaveSubcategories = false;
                        break;
                    }
                }
        
                if (allParentsHaveSubcategories) {
                    // Case: All parent categories have at least one subcategory
                    const defaultParent = await categoryModel
                        .findById(parentCategories[0]._id)
                        .populate('subCategories');
                    console.log(defaultParent);
                    res.render('admin/product-add', {
                        parentCategories: parentCategories,
                        defaultSubCategories: defaultParent.subCategories
                    });
                } else {
                    // Case: At least one parent category has no subcategories
                    res.render('admin/product-add', { NoSubCat: 1 });
                }
            } else {
                // Case: No parent category with subcategories
                res.render('admin/product-add', { NoParentSubCat: 1 });
            }
        }

    } catch (error) {
        console.log(error)
    }
}

// admin add products form 
const adminAddProductsForm = async (req, res) => {
    try {
        console.log("admin add products form") 

        // Find parent categories where tier is 1 and have at least one subcategory
        const parentCategoriesWithSubs = await categoryModel.find({ tier: 1, subCategories: { $exists: true, $not: { $size: 0 } } });

        let defaultParent = null;

        if (parentCategoriesWithSubs.length > 0) {
            // Get the first document from parentCategoriesWithSubs array as default category
            defaultParent = await categoryModel
                .findById(parentCategoriesWithSubs[0]._id)
                .populate('subCategories');
            console.log(defaultParent);
        }

        res.render('admin/product-add', {
            parentCategories: parentCategoriesWithSubs,
            defaultSubCategories: defaultParent ? defaultParent.subCategories : []
        });
    } catch (error) {
        console.log(error);
    }
}

// admin products add categories listing
const getSubCategories = async (req, res) => {
    try {
        console.log("admin get subcategories root")
        const parentId = req.query.parentId; // Retrieve the parent category ID from the request query

        // Find the parent category by ID and populate its subcategories
        const parentCategory = await categoryModel.findById(parentId).populate('subCategories');
        console.log(parentCategory)

        if (!parentCategory) {
            req.session.Message = 'Parent category not found'
            res.redirect('/admin/products')
        }

        // Extract and send the subcategories associated with the parent category in the response
        const subcategories = parentCategory.subCategories;

        res.status(200).json({ subcategories });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// admin product add submit
const adminAddProductsSubmit = async (req, res, next) => {
    try {
        console.log("admin add product submit")

        const { product_name, product_description, regular_price, product_stock, returnPeriodValue, warrantyPeriodValue, selected_paymentMethods, selected_colors, selected_sizes, selectedCategories, tags } = req.body
        console.log({ product_name, product_description, regular_price, product_stock, returnPeriodValue, warrantyPeriodValue, selected_paymentMethods, selected_colors, selected_sizes, selectedCategories, tags })
        const productimage = req.files
        console.log(productimage)
        const productimagearray = req.files.map(file => file.filename)
        console.log(productimagearray)
    
        // Convert returnPeriodValue and warrantyPeriodValue to JSON objects
        const returnPeriod = JSON.parse(returnPeriodValue);
        const warrantyPeriod = JSON.parse(warrantyPeriodValue);
    
        // Format the prices to two decimal points
        const regularPrice = parseFloat(regular_price).toFixed(2);
    
        // Convert selected_paymentMethods and selectedCategories to arrays
        const paymentMethods = JSON.parse(selected_paymentMethods);

        // const parent = await categoryModel.findOne({})
        const parent = await categoryModel.findOne({ subCategories: { $exists: true, $not: { $size: 0 } } });
        const parentId = parent._id
        const child = await categoryModel.findOne({_id:parent.subCategories[0]})
        const childId = child._id
        console.log(parent, child, parentId, childId)
        const defaultCategories = []
        defaultCategories.push(parentId)
        defaultCategories.push(childId)
         
        const categories = selectedCategories ? JSON.parse(selectedCategories) : defaultCategories
    
        // Create a new product instance
        const newProduct = new productModel({
            productname: product_name,
            productdescription: product_description,
            regularprice: regularPrice,
            stock: parseInt(product_stock),
            returnperiod: returnPeriod,
            warrentyperiod: warrantyPeriod,
            paymentmethods: paymentMethods,
            colors: selected_colors.split(','),
            sizes: selected_sizes.split(','),
            categories: categories,
            tags: tags.split(/[,\s]+/),
            productimages: productimagearray
        });

        const savedProduct = await newProduct.save();

        // Find and update documents in categoryModel
        const product = await productModel.findOne({ _id: savedProduct._id });
        const categoryIdsToUpdate = [product.categories[0], product.categories[1]];

        await Promise.all(categoryIdsToUpdate.map(async (categoryId) => {
            const category = await categoryModel.findById(categoryId);

            if (category) {
                // Push the ID of the saved product to the products array in the category
                category.products.push(savedProduct._id);
                await category.save();
            }
        }));

        // Fetch offers for the specific product
        // const productOffer = await productOfferModel.findOne({ for: product._id }).select('discountPercentage');
        const categoryOffer = await categoryOfferModel.findOne({ for: product.category }).select('discountPercentage');
        if(categoryOffer) {
            console.log(`category offer exists for this product ${product}`)
                                    
            const updatedPromotionalPrice = product.regularprice - (product.regularprice * (categoryOffer / 100));
            await productModel.findByIdAndUpdate(offer_for[1], { promotionalprice: updatedPromotionalPrice });
            
            console.log(`added promotional price for the product ${product}`)
        }

        console.log('Product saved:', savedProduct);

        req.session.Message = 'Product saved successfully'
        res.redirect('/admin/products')
        return
    } catch(error) {
        console.error('Error saving product:', error);
        res.status(500).send('Error saving product');
    }


    // // Save the new product to the database
    // newProduct.save()
    //     .then((product) => {
    //         console.log('Product saved:', product);
    //         res.send('Product saved successfully');
    //     })
    //     .catch((error) => {
    //         console.error('Error saving product:', error);
    //         res.status(500).send('Error saving product');
    //     });
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
            let search = await productModel.find()
            res.send({payload: search})
        }
    } catch (error) {
        console.log(error)
    }
}

// admin edit product
const adminEditProduct = async (req, res) => {
    try {
        console.log("admin edit product get root")

        const productId = req.query.productId
        console.log("product id")
        console.log(productId)

        const product = await productModel.find({ _id: productId })
        console.log("product details")
        console.log(product)

        // categories
        const parentId = product[0].categories[0];
        const subId = product[0].categories[1];
        const parentCategory = await categoryModel.findById(parentId);
        const subCategory = await categoryModel.findById(subId);
        console.log(parentCategory)
        console.log(subCategory)

        res.render('admin/product-edit', { 
            product: product[0],
            parentCategory,
            subCategory })

    } catch (error) {
        console.log(error)
    }
}

// admin edit products submit
const adminEditProductSubmit = async (req, res) => {
    try {
        console.log(req.body)
        console.log("admin edit product submit root");

        const {
            product_name,
            product_description,
            regular_price,
            product_stock,
            selected_colors,
            selected_sizes,
            tags
        } = req.body;

        console.log({
            product_name,
            product_description,
            regular_price,
            product_stock,
            selected_colors,
            selected_sizes,
            tags
        });

        const productId = req.query.productId;

        // Find the product by ID
        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update the product fields if they exist in the request body
        if (product_name) {
            product.productname = product_name;
        }
        if (product_description) {
            product.productdescription = product_description;
        }
        if (regular_price) {
            product.regularprice = regular_price;
            
            // Fetch offers for the specific product
            // const product = await productModel.findOne({_id: productId})
            const productOffer = await productOfferModel.findOne({ for: product._id }).select('discountPercentage');
            const categoryOffer = await categoryOfferModel.findOne({ for: product.category }).select('discountPercentage');
            if(productOffer && categoryOffer) {
                console.log(`Both product offer category offer exist for this product ${product}`)

                if(productOffer > categoryOffer) {
                    console.log("productOffer > categoryOffer")
                                        
                    const updatedPromotionalPrice = product.regularprice - (product.regularprice * (productOffer / 100));
                    await productModel.findByIdAndUpdate(offer_for[1], { promotionalprice: updatedPromotionalPrice });
                } else {
                    console.log("productOffer < categoryOffer")
                                        
                    const updatedPromotionalPrice = product.regularprice - (product.regularprice * (categoryOffer / 100));
                    await productModel.findByIdAndUpdate(offer_for[1], { promotionalprice: updatedPromotionalPrice });
                }
            } else if(productOffer) {
                console.log(`only product offer is avail for this product ${product}`)

                const updatedPromotionalPrice = product.regularprice - (product.regularprice * (productOffer / 100));
                await productModel.findByIdAndUpdate(offer_for[1], { promotionalprice: updatedPromotionalPrice });
            } else if(categoryOffer) {
                console.log(`only category offer is avail for this product ${product}`)
                
                const updatedPromotionalPrice = product.regularprice - (product.regularprice * (categoryOffer / 100));
                await productModel.findByIdAndUpdate(offer_for[1], { promotionalprice: updatedPromotionalPrice });
            } else {
                console.log(`no offers avail for this product ${product}`)
            }

            console.log("offers updated successfully")
        }
        if (product_stock) {
            product.stock = product_stock;
        }
        if (selected_colors) {
            product.colors = selected_colors.split(',');
        }
        if (selected_sizes) {
            product.sizes = selected_sizes.split(',');
        }
        if (tags) {
            product.tags = tags.split(/[,\s]+/);
        }

        // Save the updated product
        const updatedProduct = await product.save();

        req.session.Message = 'Product updated successfully'
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// admin edit image get root
const adminEditProductImage = async (req, res) => {
    try  {
        console.log("admin edit product image get root")

        const productId = req.query.productId
        console.log("product id")
        console.log(productId)

        const product = await productModel.find({ _id: productId })
        console.log("product details")
        console.log(product)

        res.render('admin/product-image-edit', { 
            product: product[0],
            productId: JSON.stringify(product[0]._id)
        })

        
    } catch (error) {
        console.log(error)
    }
}

// admin edit image submit root
const adminEditProductImageSubmit = async (req, res) => {
    try  {
        console.log("admin edit product image submit root")

        const productimage = req.file.filename
        console.log(productimage)

        const productId = req.query.productId
        const imageIndex = req.query.imageIndex
        console.log(productId, imageIndex)

        // Find the product document by productId
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found.');
        }

        // Update the productImages array at the specified imageIndex
        if (product.productimages && product.productimages[imageIndex]) {
            product.productimages[imageIndex] = productimage;
            await product.save();
            return res.status(200).json({ imageName: productimage });
        } else {
            return res.status(400).send('Invalid image index or product images.');
        }
    } catch (error) {
        console.log(error)
    }
}

// admin delete image submit root
const adminDeleteProductImageSubmit = async (req, res) => {
    try  {
        console.log("admin delete product image submit root")

        const productId = new mongoose.Types.ObjectId(req.query.productId);
        const imageIndex = parseInt(req.query.imageIndex);
        console.log("productId, imageIndex")
        console.log(productId, imageIndex)

        const product = await productModel.findOne({_id: productId})
        console.log(product)
        if (!product) {
            req.session.Message = 'Product not found.'
            res.redirect('/admin/products')
        }
        product.productimages.splice(imageIndex, 1)
        await product.save();

        return res.status(200)
    } catch (error) {
        console.log(error)
    }
}

// admin delete products
const adminDeleteProduct = async (req, res) => {
    try  {
        console.log("admin edit product delete root")

        const productId = req.query.productId;
        console.log("productId: " + productId);

        const product = await productModel.findOne({ _id: productId })
        console.log(product)
        
        // const [parentCategoryId, subCategoryId] = product.categories;
        // console.log(parentCategoryId, subCategoryId)
        
        // // Update parent and sub category by removing the current product id from its products array
        // await categoryModel.findByIdAndUpdate(parentCategoryId, {
        //     $pull: { products: productId },
        // });
        // await categoryModel.findByIdAndUpdate(subCategoryId, {
        //     $pull: { products: productId },
        // });
        
        // // Delete the product
        // await productModel.findByIdAndDelete(productId);
        
        if(product.status == true) {
            await productModel.findByIdAndUpdate(productId, {
                status: false
            }) 

            req.session.Message = "Product disabled successfully"
        } else {
            await productModel.findByIdAndUpdate(productId, {
                status: true
            }) 
            req.session.Message = "Product abled successfully"
        }

        const userId = req.session.verifiedUser.userid;
        console.log(userId);
        const cart = await cartModel.find({userId: userId})
        console.log("cart")
        console.log(cart)
        const isProduct = await productModel.find({ _id: { $in: cart.products } });
        console.log(isProduct)
        if(isProduct) {
            if(product.status == true) {
                await cartModel.updateMany({userId:userId}, {isActive: false})
            } else {
                await cartModel.updateMany({userId:userId}, {isActive: true})
            }
        }

        // Send a success response or perform additional operations if needed
        res.redirect('/admin/products')
        return
        
    } catch (error) {
        console.log(error)
    }
}

module.exports = 
{
    adminProducts, 
    adminAddProducts, 
    adminAddProductsForm,
    adminAddProductsSubmit, 
    searchProduct,
    adminEditProduct,
    adminEditProductSubmit,
    adminEditProductImage,
    adminEditProductImageSubmit,
    adminDeleteProductImageSubmit,
    adminDeleteProduct,
    getSubCategories,
}