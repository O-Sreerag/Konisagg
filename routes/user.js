const express = require('express');
const router = express.Router();

// middlewares
const multer = require('../middlewares/multer')
const multer2 = require('../middlewares/multer2')
const cloudinary = require('../middlewares/cloudinary')
const userMiddlewares = require('../middlewares/userMiddlewares');

//controllers
const userController = require('../controllers/userController');
const shopController = require('../controllers/shopController');
const wishlistController = require('../controllers/wishlistController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');


router.get('/testing', (req, res) => {
    res.render('admin/of')
} )

// URLs

// home page
router.get('/', userMiddlewares.userBlockStatus,userController.userHome);

// user login management
router.get('/login', userMiddlewares.userLoginStatusTrue,userController.login);
router.post('/login/submit', userController.loginSubmit)
router.get('/otplogin', userMiddlewares.userLoginStatusTrue, userController.otpLogin);
router.post('/otplogin/submit', userController.otpLoginSubmit);
router.get('/otpLogin~otp', userController.otpLoginOtp);
router.post('/otplogin~otp/submit', userController.otpLoginOtpSubmit);

// user signup management
router.get('/signup', userMiddlewares.userLoginStatusTrue, userController.userSignup);
router.post('/signup/submit', userController.userSignupSubmit);
router.get('/signup/otp', userMiddlewares.userLoginStatusTrue, userController.userSignupOtp);
router.post('/signup/otp/submit', userController.userSignupOtpSubmit);


router.get('/password/reset', userController.userPasswordReset);
router.post('/password/reset/submit', userController.userPasswordResetSubmit);
router.get('/password/reset/otp', userController.userPasswordResetOtp);
router.post('/password/reset/otp/submit', userController.userPasswordResetOtpSubmit);
router.get('/password/reset/getNewPassword', userController.userPasswordGetNewPassword);
router.post('/password/reset/getNewPassword/submit', userController.userPasswordGetNewPasswordSubmit);

router.post('/resendOtp', userController.resendOtp)
// user logout management
router.get('/logout', userController.userLogout)

// shop page management
router.get('/shop', userMiddlewares.userBlockStatus, shopController.userShop);
router.get('/shop/product/details', userMiddlewares.userBlockStatus, shopController.productDetails)
router.get('/getOnlyCategories', shopController.getOnlyCategories)
router.post('/shop/sortByCategory', shopController.sortByCategory)
router.post('/shop/sortByPrice', shopController.sortByPrice)
router.post('/shop/search', shopController.searchProduct)


// user Settings
// account Management
router.get('/account/view~profile', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, userController.accountViewProfile);
router.get('/account/edit~profile', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, userController.accountEditProfile);
// router.post('/account/edit~profile/submit', userMiddlewares.userLoginStatusFalse, multer.userImagesFolder.single('userimage'), userController.accountEditProfileSubmit);
router.post('/account/edit~profile/submit', userMiddlewares.userLoginStatusFalse, multer2.userImagesFolder, userController.accountEditProfileSubmit);
router.get('/account/edit~profile/image', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, userController.accountEditProfileImage);
// router.post('/account/edit~profile/image/submit', userMiddlewares.userLoginStatusFalse, multer.userImagesFolder.single('userimage'), userController.accountEditProfileImageSubmit);
router.post('/account/edit~profile/image/submit', userMiddlewares.userLoginStatusFalse, multer2.userImagesFolder, userController.accountEditProfileImageSubmit);
router.get('/account/edit~profile/deleteImage/submit', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, userController.accountEditProfileDeleteImageSubmit);
router.get('/account/editprofile/editEmail', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, userController.accountEditEmail);
router.get('/account/add~address', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, userController.accountAddAddress);
router.post('/account/add~address/submit', userMiddlewares.userLoginStatusFalse, userController.accountAddAddressSubmit);
router.get('/account/delete~address/submit', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, userController.accountDeleteAddress);
router.get('/account/security', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, userController.accountSecurity);

// wishlist management
router.get('/wishlist/view', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, wishlistController.viewItems)
router.get('/wishlist/add', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, wishlistController.addToWishlist)
router.get('/wishlist/delete/:itemId', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, wishlistController.deleteItem)

// cart management
router.get('/cart/view', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, cartController.viewItems)
router.post('/cart/add', userMiddlewares.userLoginStatusFalse, cartController.addToCart)
router.get('/cart/delete', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, cartController.deleteItem)
router.get('/cart/delete/all', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, cartController.deleteAllItems)
router.post('/cart/update-quantity', userMiddlewares.userLoginStatusFalse, cartController.updateQuantity)

// Checkout page
router.get('/checkout', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, cartController.checkout)
router.post('/checkout/applyCoupen', userMiddlewares.userLoginStatusFalse, cartController.applyCoupen)
router.post('/placeorder', userMiddlewares.userLoginStatusFalse, cartController.placeOrder)
router.post('/verify-payment', userMiddlewares.userLoginStatusFalse, cartController.verifyPayment)
router.get('/order-success', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, cartController.orderSuccess)

// Order management
router.get('/orders/history', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, orderController.orderHistory)
router.get('/order/details', userMiddlewares.userLoginStatusFalse, userMiddlewares.userBlockStatus, orderController.orderDetails)
router.get('/order/cancel/', userMiddlewares.userLoginStatusFalse, orderController.orderCancel)
router.get('/order/return/', userMiddlewares.userLoginStatusFalse, orderController.orderReturn)
router.post('/order/cancel/singleProduct', userMiddlewares.userLoginStatusFalse, orderController.cancelSingleProduct)
router.post('/order/return/singleProduct', userMiddlewares.userLoginStatusFalse, orderController.returnSingleProduct)



module.exports = router;
