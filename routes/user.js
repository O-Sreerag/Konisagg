const express = require('express');
const router = express.Router();

// middlewares
const multer = require('../middlewares/multer')
const userMiddlewares = require('../middlewares/userMiddlewares');

//controllers
const userController = require('../controllers/userController');
const shopController = require('../controllers/shopController');
const wishlistController = require('../controllers/wishlistController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');


router.get('/testing', (req, res) => {
    res.render('user/testing')
} )

// URLs

// home page
router.get('/',userController.userHome);

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

// user logout management
router.get('/logout', userController.userLogout)

// shop page management
router.get('/shop', shopController.userShop);
router.get('/shop/product/details', shopController.productDetails)
router.get('/getOnlyCategories', shopController.getOnlyCategories)


// user Settings
// account Management
router.get('/account/view~profile', userMiddlewares.userLoginStatusFalse, userController.accountViewProfile);

router.get('/account/edit~profile', userMiddlewares.userLoginStatusFalse, userController.accountEditProfile);
router.post('/account/edit~profile/submit', multer.userImagesFolder.single('userimage'), userController.accountEditProfileSubmit);
router.post('/account/editprofile/editEmail', userController.accountEditEmail);

router.get('/account/notifications', userMiddlewares.userLoginStatusFalse, userController.accountNotifications);
router.get('/account/security', userMiddlewares.userLoginStatusFalse, userController.accountSecurity);



// wishlist management
router.get('/wishlist/view', userMiddlewares.userLoginStatusFalse, wishlistController.viewItems)
router.get('/wishlist/add', userMiddlewares.userLoginStatusFalse, wishlistController.addToWishlist)
router.get('/wishlist/contactUs', userMiddlewares.userLoginStatusFalse, wishlistController.contactUs)
router.get('/wishlist/delete/:itemId', userMiddlewares.userLoginStatusFalse, wishlistController.deleteItem)

// cart management
router.get('/cart/view', userMiddlewares.userLoginStatusFalse, cartController.viewItems)
router.post('/cart/add', userMiddlewares.userLoginStatusFalse, cartController.addToCart)
router.get('/cart/delete/:itemId', userMiddlewares.userLoginStatusFalse, cartController.deleteItem)
router.get('/cart/delete/all', userMiddlewares.userLoginStatusFalse, cartController.deleteAllItems)
router.post('/cart/update-quantity', userMiddlewares.userLoginStatusFalse, cartController.updateQuantity)

// Checkout page
router.get('/checkout', userMiddlewares.userLoginStatusFalse, cartController.checkout)
router.post('/placeorder', userMiddlewares.userLoginStatusFalse, cartController.placeOrder)
router.post('/verify-payment', userMiddlewares.userLoginStatusFalse, cartController.verifyPayment)
router.get('/order-success', userMiddlewares.userLoginStatusFalse, cartController.orderSuccess)

// Order management
router.get('/orders/history', userMiddlewares.userLoginStatusFalse, orderController.orderHistory)
router.get('/order/details', userMiddlewares.userLoginStatusFalse, orderController.orderDetails)
router.get('/order/cancel/', userMiddlewares.userLoginStatusFalse, orderController.orderCancel)
router.get('/order/return/', userMiddlewares.userLoginStatusFalse, orderController.orderReturn)
router.get('/orders/track', userMiddlewares.userLoginStatusFalse, orderController.orderTrack)
router.get('/orders/address', userMiddlewares.userLoginStatusFalse, orderController.orderAddress)



module.exports = router;
