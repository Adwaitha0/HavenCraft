const express=require('express')
const router=express.Router();
const userController=require('../controller/userController')
const otpController=require('../controller/otpController')
const productController=require('../controller/productController')
const cartController=require('../controller/cartController')
const profileController=require('../controller/profileController')
const stockController=require('../controller/stockController')
const couponController=require('../controller/couponController')
const paymentController=require('../controller/paymentController')
const orderController=require('../controller/orderController')
const wishlistController=require('../controller/wishlistController')
const userAuth=require('../middleware/userAuth')


router.get('/user_login',userAuth.isLogin,userController.loadLogin)

router.post('/user_login',userController.login)

router.get('/user_register',userAuth.isLogin,userController.loadRegister)

router.post("/logout", userController.logout)

router.post('/resetPassword',userController.resetPassword);




router.post('/checkEmail',userController.checkEmail);

router.get('/about',userAuth.checkBlockedStatus,userController.loadAbout);

router.get('/contact',userAuth.checkBlockedStatus,userController.loadContact);

router.get('/store', userAuth.checkBlockedStatus,userController.loadStore);

router.get('/load-otp',userController.loadOTP);

router.get('/resend-otp',otpController.resendOTP);

router.post('/sent-otp',otpController.sendOTP);

router.post('/sent-forgot-otp',otpController.sendForgotOTP);

router.get('/load-forgot-otp',userController.loadForgotOTP);

router.post('/verifyOTP',otpController.verifyOTP);

router.post('/verifyForgotOTP',otpController.verifyForgotOTP);

router.post('/changePassword',userController.changePassword);

router.get('/user_landing',userController.loadLanding)

router.get('/user_home',userController.loadHome)

router.get('/candleHolder',userAuth.checkBlockedStatus,productController.loadCandleholderProducts)

router.get('/vase',userAuth.checkBlockedStatus,productController.loadVaseProducts)

router.get('/tableLamp',userAuth.checkBlockedStatus,productController.loadTableLampProducts)

router.get('/sculpture',userAuth.checkBlockedStatus,productController.loadSculptureProducts)

router.get('/artifact',userAuth.checkBlockedStatus,productController.loadArtifactProducts)

router.get('/user_candleDetail/:id', productController.loadCandleDetail);

router.get('/user_profile',userAuth.checkBlockedStatus,profileController.loadProfile)

router.post('/updateProfile',profileController.editProfile)  

router.post('/add-address/:id',profileController.addAddress)

router.post('/edit-address/:id',profileController.editAddress)   

router.post('/remove-address/:id', profileController.removeAddress);

router.post('/change-password', profileController.changePassword);

router.get("/addToCart", cartController.addToCart);

router.get("/user_addToCart", cartController.loadCart)

router.post('/update-cart-quantity', cartController.updateCartQuantity);


router.post('/deleteCartItem', cartController.deleteCartItem);

router.get("/user_checkout", cartController.loadCheckout)

//router.get('/orderSummary',cartController.getOrderSummary)

router.post('/place-order/:paymentMethod', cartController.placeOrder);

//router.get('/place-order', cartController.placeOrder);


//router.get('/getPaymentMethod', cartController.getPaymentMethod );

router.get('/order-success', cartController.orderSuccess);

//router.get('/stock/:productId/:size',stockController.displayStock);

router.get('/getStock',stockController.getStock)

router.post('/cancel-product/:orderId/:productId', profileController.cancelProduct);

router.post('/cancel-order/:orderId', profileController.cancelOrder);

router.get("/wishlist", wishlistController.loadWishlist)

router.get("/addToWishlist/:id", wishlistController.addToWishlist)

router.post("/addToWishlist/:id", wishlistController.addToWishlist)

router.get("/removeFromWishlist/:id", wishlistController.removeFromWishlist)


router.post("/add-address", cartController.addAddress )

router.post("/applyCoupon", cartController.applyCoupon )

router.post("/create-order", paymentController.createOrder);

router.post("/save-address", cartController.saveAddress);

//router.post('/save-payment-method',cartController.savePaymentMethod);

router.post("/return-order", orderController.returnOrder);

router.post("/add-money", couponController.addMoney);

router.post('/generate-referralcode',userController.saveRefferalcode)

router.post('/apply-referralcode',userController.applyRefferalcode)

router.get("/wallet-history", profileController.getWalletHistory);













module.exports =router
