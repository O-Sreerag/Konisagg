const express = require('express');
const router = express.Router();

// middlewares
const multer = require('../middlewares/multer')
const sharp = require('../middlewares/sharp')
const adminMiddleware = require('../middlewares/adminMiddleware')

// controllers
const adminController = require('../controllers/adminController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const offerController = require('../controllers/offerController')
const coupenController = require('../controllers/coupenController')
const bannerController = require('../controllers/bannerController')

/* admin login */
router.get('/', adminMiddleware.adminLoginStatusTrue, adminController.adminLogin);
router.post('/loginSubmit', adminController.adminLoginSubmit);
router.get('/logout',  adminController.adminLogout)

/* admin home */
router.get('/home', adminMiddleware.adminLoginStatusFalse, adminController.adminHome);

// generate report
router.post('/generateReport', adminController.adminGenerateReport);

/* admin users */
router.get('/users', adminMiddleware.adminLoginStatusFalse, adminController.adminUsers);
router.post('/users/search', adminMiddleware.adminLoginStatusFalse, adminController.searchUser);
router.get('/userBlock', adminMiddleware.adminLoginStatusFalse, adminMiddleware.adminUserBlock, adminController.adminUsers);
router.get('/userUnblock', adminMiddleware.adminLoginStatusFalse, adminMiddleware.adminUserUnblock, adminController.adminUsers);

/* admin categories */
router.get('/categories', adminMiddleware.adminLoginStatusFalse, categoryController.categories);
router.post('/categories/search', adminMiddleware.adminLoginStatusFalse, categoryController.searchCategory);
router.post('/getPSCategory', categoryController.getParentSubCategories);
router.post('/addCategorySubmit', multer.categoryImagesFolder.single('categoryimage'), categoryController.addCategorySubmit);
router.post('/updateCategorySubmit', multer.categoryImagesFolder.single('updatecategoryimage'), categoryController.updateCategorySubmit);
router.get('/category/delete', adminMiddleware.adminLoginStatusFalse, categoryController.deleteCategorySubmit);

/* admin  products */
router.get('/products', adminMiddleware.adminLoginStatusFalse, productController.adminProducts);
router.post('/products/search', adminMiddleware.adminLoginStatusFalse, productController.searchProduct);
router.get('/addProduct', adminMiddleware.adminLoginStatusFalse, productController.adminAddProducts);
router.get('/addProductOverride', adminMiddleware.adminLoginStatusFalse, productController.adminAddProductsForm)
router.get('/getSubcategories', adminMiddleware.adminLoginStatusFalse, productController.getSubCategories);
router.post('/addProductSubmit', multer.productImagesFolder.array('productimage'), sharp.cropProductImages, productController.adminAddProductsSubmit);
router.get('/product/edit', adminMiddleware.adminLoginStatusFalse, productController.adminEditProduct);
router.post('/product/edit/submit', productController.adminEditProductSubmit);
router.get('/product/editImage', adminMiddleware.adminLoginStatusFalse, productController.adminEditProductImage);
router.post('/product/editImage/submit', multer.productImagesFolder.single('productimage'), sharp.cropProductImage, productController.adminEditProductImageSubmit);
router.delete('/product/deleteImage/submit', adminMiddleware.adminLoginStatusFalse, productController.adminDeleteProductImageSubmit);
router.get('/product/delete', productController.adminDeleteProduct);

/*admin orders */
router.get('/orders', adminMiddleware.adminLoginStatusFalse, orderController.adminViewOrders)
router.post('/orders/search', adminMiddleware.adminLoginStatusFalse, orderController.searchOrders)
router.get('/orderDetails', adminMiddleware.adminLoginStatusFalse, orderController.adminOrderDetails)
router.get('/order/deliver', adminMiddleware.adminLoginStatusFalse, orderController.adminOrderDeliver)
router.get('/order/cancelRequest', adminMiddleware.adminLoginStatusFalse, orderController.adminOrderCancelReq)
router.get('/order/returnRequest', adminMiddleware.adminLoginStatusFalse, orderController.adminOrderRA)

//offer management
router.get('/offers/category-offers', adminMiddleware.adminLoginStatusFalse, offerController.adminCategoryOffersList);
router.get('/offers/product-offers', adminMiddleware.adminLoginStatusFalse, offerController.adminProductOffersList);
router.get('/offers/category/addOffer', adminMiddleware.adminLoginStatusFalse, offerController.adminAddCategoryOffer);
router.get('/offers/product/addOffer', adminMiddleware.adminLoginStatusFalse, offerController.adminAddProductOffer);
router.get('/offers/addOffer', adminMiddleware.adminLoginStatusFalse, offerController.adminAddOffer);
router.post('/offers/addOffer/submit', adminMiddleware.adminLoginStatusFalse, multer.offerImagesFolder.single('offerimage'), sharp.cropOfferImage, offerController.adminAddOfferSubmit);

// coupen management
router.get('/coupens', adminMiddleware.adminLoginStatusFalse, coupenController.adminListCoupen)
router.get('/coupens/create', adminMiddleware.adminLoginStatusFalse, coupenController.adminCreateCoupen)
router.post('/coupens/create/submit', adminMiddleware.adminLoginStatusFalse, coupenController.adminCreateCoupenSubmit)
router.get('/coupens/changeStatus', adminMiddleware.adminLoginStatusFalse, coupenController.adminStatusChangeCoupen)

// banners management
router.get('/banners', adminMiddleware.adminLoginStatusFalse, bannerController.adminListBanners)
router.get('/banners/create', adminMiddleware.adminLoginStatusFalse, bannerController.adminCreateBanners)
router.post('/banners/create/submit', adminMiddleware.adminLoginStatusFalse, multer.bannerImagesFolder.single('bannerimage'), sharp.cropBannerImage, bannerController.adminCreateBannersSubmit)
router.get('/banners/delete', adminMiddleware.adminLoginStatusFalse, bannerController.adminDeleteBanners)


module.exports = router;
