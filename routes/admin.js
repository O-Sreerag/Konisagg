const express = require('express');
const router = express.Router();

// middlewares
const multer = require('../middlewares/multer')
const adminMiddleware = require('../middlewares/adminMiddleware')

// controllers
const adminController = require('../controllers/adminController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')

/* admin login */
router.get('/', adminMiddleware.adminLoginStatusTrue, adminController.adminLogin);
router.post('/loginSubmit', adminController.adminLoginSubmit);

/* admin home */
router.get('/home', adminMiddleware.adminLoginStatusFalse, adminController.adminHome);

/* admin users */
router.get('/users', adminMiddleware.adminLoginStatusFalse, adminController.adminUsers);
router.get('/userBlock', adminMiddleware.adminLoginStatusFalse, adminMiddleware.adminUserBlock, adminController.adminUsers);
router.get('/userUnblock', adminMiddleware.adminLoginStatusFalse, adminMiddleware.adminUserUnblock, adminController.adminUsers);

/* admin  products */
router.get('/products', adminMiddleware.adminLoginStatusFalse, productController.adminProducts);
router.get('/addProduct', adminMiddleware.adminLoginStatusFalse, productController.adminAddProducts);
router.get('/getSubcategories', adminMiddleware.adminLoginStatusFalse, productController.getSubCategories);
router.post('/addProductSubmit', multer.productImagesFolder.array('productimage'), productController.adminAddProductsSubmit);
router.get('/product/edit', adminMiddleware.adminLoginStatusFalse, productController.adminEditProduct);
// router.post('/product/edit/submit', multer.productImagesFolder.array('productimage'), productController.adminEditProductSubmit);

/*admin orders */
router.get('/orders', adminMiddleware.adminLoginStatusFalse, orderController.adminViewOrders)
router.get('/orderDetails', adminMiddleware.adminLoginStatusFalse, orderController.adminOrderDetails)
router.get('/order/deliver', adminMiddleware.adminLoginStatusFalse, orderController.adminOrderDeliver)
router.get('/order/cancelRequest', adminMiddleware.adminLoginStatusFalse, orderController.adminOrderCancelReq)
router.get('/order/returnRequest', adminMiddleware.adminLoginStatusFalse, orderController.adminOrderRA)

/* admin categories */
router.get('/categories', adminMiddleware.adminLoginStatusFalse, categoryController.categories);
router.post('/addCategorySubmit', multer.categoryImagesFolder.single('categoryimage'), categoryController.addCategorySubmit);
router.post('/updateCategorySubmit', multer.categoryImagesFolder.single('updatecategoryimage'), categoryController.updateCategorySubmit);

router.get('/brands', adminMiddleware.adminLoginStatusFalse, adminController.adminBrands);

module.exports = router;
