const mongoose = require('mongoose');
const productModel = require('../models/productModel')
const categoryModel = require('../models/categoryModel')

const adminProducts = async (req, res, next) => {
    console.log("admin products list get root")

    const products = await productModel.find()
    console.log(products)
    res.render('admin/products', { productList: products })
}

const adminAddProducts = async (req, res, next) => {
    console.log("admin products add get root")

    const parentCategories = await categoryModel.find({ tier: 1 })
    console.log("parentCategories")
    console.log(parentCategories)
    
    const defaultParent = await categoryModel.findById(parentCategories[0]._id).populate('subCategories');
    console.log(defaultParent)

    res.render('admin/product-add', { parentCategories: parentCategories , defaultSubCategories: defaultParent.subCategories})
}

const getSubCategories = async (req, res) => {
    try {
        console.log("admin get subcategories root")
        const parentId = req.query.parentId; // Retrieve the parent category ID from the request query

        // Find the parent category by ID and populate its subcategories
        const parentCategory = await categoryModel.findById(parentId).populate('subCategories');
        console.log(parentCategory)

        if (!parentCategory) {
            return res.status(404).json({ message: 'Parent category not found' });
        }

        // Extract and send the subcategories associated with the parent category in the response
        const subcategories = parentCategory.subCategories;

        res.status(200).json({ subcategories });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const adminAddProductsSubmit = (req, res, next) => {
    console.log("admin add product submit")

    const { product_name, product_description, regular_price, promotional_price, product_stock, returnPeriodValue, warrantyPeriodValue, selected_paymentMethods, selected_colors, selected_sizes, selectedCategories, tags } = req.body
    console.log({ product_name, product_description, regular_price, promotional_price, product_stock, returnPeriodValue, warrantyPeriodValue, selected_paymentMethods, selected_colors, selected_sizes, selectedCategories, tags })
    const productimage = req.files
    console.log(productimage)
    const productimagearray = req.files.map(file => file.filename)
    console.log(productimagearray)

    // Convert returnPeriodValue and warrantyPeriodValue to JSON objects
    const returnPeriod = JSON.parse(returnPeriodValue);
    const warrantyPeriod = JSON.parse(warrantyPeriodValue);

    // Format the prices to two decimal points
    const regularPrice = parseFloat(regular_price).toFixed(2);
    const promotionalPrice = parseFloat(promotional_price).toFixed(2);

    // Convert selected_paymentMethods and selectedCategories to arrays
    const paymentMethods = JSON.parse(selected_paymentMethods);
    const categories = JSON.parse(selectedCategories);

    // Create a new product instance
    const newProduct = new productModel({
        productname: product_name,
        productdescription: product_description,
        regularprice: regularPrice,
        promotionalprice: promotionalPrice,
        stock: parseInt(product_stock),
        returnperiod: returnPeriod,
        warrentyperiod: warrantyPeriod,
        paymentmethods: paymentMethods,
        colors: selected_colors.split(','),
        sizes: selected_sizes.split(','),
        categories: categories,
        tags: tags.split(','),
        productimages: productimagearray
    });

    // Save the new product to the database
    newProduct.save()
        .then((product) => {
            console.log('Product saved:', product);
            res.send('Product saved successfully');
        })
        .catch((error) => {
            console.error('Error saving product:', error);
            res.status(500).send('Error saving product');
        });
}

const adminEditProduct = async (req, res) => {
    try {
        console.log("admin edit product")

        const productId = req.query.productId
        console.log("product id")
        console.log(productId)

        const product = await productModel.find({ _id: productId })
        console.log("product details")
        console.log(product)

        res.render('admin/product-edit', { product: product[0] })

    } catch (error) {
        console.log(error)
    }
}

module.exports = 
{
    adminProducts, 
    adminAddProducts, 
    adminAddProductsSubmit, 
    adminEditProduct,
    getSubCategories 
}