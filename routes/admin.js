const express=require('express')
const router=express.Router();
const adminController=require('../controller/adminController')
const productController=require('../controller/productController')
const categoryController=require('../controller/categoryController')
const orderController=require('../controller/orderController')
const stockController=require('../controller/stockController')
const couponController=require('../controller/couponController')
const offerController=require('../controller/offerController')
const salesController=require('../controller/salesController')
const adminAuth=require('../middleware/adminAuth')
const multer = require('multer');
const storage = multer.memoryStorage(); 
const upload = multer({ storage }).array('images', 4);


router.get('/login',adminAuth.isLogin,adminController.loadLogin)

router.post('/login',adminController.login)

router.get('/logout',adminAuth.checkSession,adminController.logout)

router.get('/admin_user', adminAuth.checkSession,adminController.loadUsers);

router.post('/block_user',adminController.blockUser)

router.post('/unblock_user',adminController.unblockUser)

router.post('/delete_user',adminController.deleteUser)

//Category
router.get('/admin_category',adminAuth.checkSession, categoryController.loadCategories);

router.post('/add_category',categoryController.addCategory)

router.post('/update_category',categoryController.updateCategory)

router.post('/delete_category',categoryController.deleteCategory)

//product
router.get('/admin_product', adminAuth.checkSession,productController.loadProducts)

router.post('/add_product',upload, productController.addProduct)

router.post('/update_product',productController.updateProduct)

router.post('/delete_product',productController.deleteProduct)

router.get('/check_product_exists',productController.check_product_exists)

router.post('/check_category_exists',categoryController.check_category_exists)

//order
router.get('/admin_order',adminAuth.checkSession, orderController.loadOrder);

router.get('/admin_stock',adminAuth.checkSession, stockController.createStockEntries,stockController.loadStock);

router.post('/update-stock',stockController.updateStock)

router.get('/items', productController.loadProducts);

router.get('/stocks', stockController.loadStock);

router.post('/update-product-status',orderController.adminUpdateIndividualOrder)

router.post('/update-order-status',orderController.adminUpdateOrderStatus)

//coupon
router.get('/coupon',adminAuth.checkSession, couponController.loadCoupon);

router.post('/add_coupon', couponController.addCoupon);

router.put('/toggle-status/:id', couponController.changeStatus);

router.post('/delete-coupon/:id',couponController.deleteCoupon);

//offer
router.get('/offer',adminAuth.checkSession, offerController.loadOffer);

router.post('/add-offer', offerController.addOffer);

router.post('/delete-offer/:id',offerController.deleteOffer);

//salesReport
router.get('/salesReport',adminAuth.checkSession, salesController.loadSalesReport);

router.get('/filter-sales', salesController.filterSales);

router.post('/refund-order',orderController.refundOrder);

router.post('/generate-pdf',salesController.generatePDF)

router.get('/top-products',salesController.getTopSellingProducts)

router.get('/category-sales', salesController.getCategorySales);

router.get('/error', adminController.loadError);








router.get('/admin_home',adminAuth.checkSession, adminController.loadDashboard);


module.exports=router  