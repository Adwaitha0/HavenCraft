const admin_model = require('../model/admin_model')
const bcrypt = require('bcrypt');
const user_model = require('../model/user_model')
const Product = require('../model/product')
const Order = require('../model/order')
const Category = require('../model/category')
const Coupon = require('../model/coupon')
const Stock = require('../model/stock')
const StatusCodes =require("../controller/statusCode");
const Messages  = require("../controller/statusCode");

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await admin_model.findOne({ username });
        
        if (!admin) {
            return res.render('admin/admin_login', { message: 'Invalid username' });
        }
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.render('admin/admin_login', { message: 'Invalid password' });
        }
        req.session.admin = true;
        res.redirect('/admin/admin_home');
    } catch (error) {
        res.render('admin/admin_login', { message: 'An unexpected error occurred. Please try again.' });
    }
};


const loadLogin = (req, res) => {
    res.render('admin/admin_login', { message: null });
};


const loadDashboard = async (req, res) => {
    try {
        const totalUsers = await user_model.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalCategories = await Category.countDocuments();
        const totalCoupons = await Coupon.countDocuments();
        const orders = await Order.find({ isDeleted: false }).populate('products.productId');

        const totalSales = orders.reduce((sum, order) => sum + order.payableAmount, 0);
        const totalDiscounts = orders.reduce((sum, order) => sum + (order.totalPrice - order.payableAmount), 0);

        const categorySales = {};
        orders.forEach(order => {
            order.products.forEach(item => {
                const category = item.productId.category;
                const price = item.price * item.quantity;
                if (categorySales[category]) {
                    categorySales[category].totalSales += price;
                } else {
                    categorySales[category] = {
                        name: category,
                        totalSales: price,
                        image: item.image?.[0] || null
                    };
                }
            });
        });

        const topCategories = Object.values(categorySales)
            .sort((a, b) => b.totalSales - a.totalSales)
            .slice(0, 5);

            const productSales = {};
            orders.forEach(order => {
                order.products.forEach(item => {
                    const productId = item.productId._id;
                    if (productSales[productId]) {
                        productSales[productId].totalQuantitySold += item.quantity;
                    } else {
                        productSales[productId] = {
                            name: item.productName,
                            price: item.price,
                            totalQuantitySold: item.quantity,
                            stock: 0,
                            image: item.productId.images?.[0] || null
                        };
                    }
                });
            });
            
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
            .slice(0, 5);

        for (let product of topProducts) {
            const stockData = await Stock.findOne({ name: product.name });
            product.stock = stockData ? stockData.small + stockData.large : 0;
        }

        res.render('admin/admin_home', {
            totalUsers,
            totalOrders,
            totalProducts,
            totalCategories,
            totalCoupons,
            totalSales,
            totalDiscounts,
            topCategories,
            topProducts
        });
    } catch (err) {
        console.error('Error loading dashboard:', err.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: Messages.INTERNAL_ERROR
        });
        
    }
};



const loadUsers = async (req, res) => {
    try {
        const users = await user_model.find({isDeleted: false},{ username: 1, email: 1, joinDate: 1 ,isBlocked:1});
        console.log(users) 
        res.render('admin/admin_user', { users }); 
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

const blockUser=async (req, res) => {
    const { id } = req.body;
    console.log(`Blocked user ${req.body.id}`)
    try {
        
        await user_model.findByIdAndUpdate(id, { isBlocked: true });
      
        res.redirect('/admin/admin_user');
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: Messages.INTERNAL_ERROR
        });
        
    }
};

const unblockUser = async (req, res) => {
    const { id } = req.body;
    console.log(`Unblocked user ${id}`);
    try {
        await user_model.findByIdAndUpdate(id, { isBlocked: false });
        res.redirect('/admin/admin_user');  
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: Messages.INTERNAL_ERROR
        });
        
    }
};



const deleteUser=async (req, res) => {
    const { id } = req.body; 
    try {
        await user_model.findByIdAndUpdate(id, { isDeleted: true });
        res.redirect('/admin/admin_user'); 
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: Messages.INTERNAL_ERROR
        });
        
    }
};





const logout = async (req, res) => {
    req.session.admin = null
    res.render('admin/admin_login')
}

const loadError = (req, res) => {
    res.render('admin/error' );
};
 


module.exports = {loadLogin,login,logout,loadUsers,blockUser,unblockUser,deleteUser,loadDashboard,
    loadError
}