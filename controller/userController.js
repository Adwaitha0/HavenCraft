const user_model=require('../model/user_model')
const bcrypt = require('bcrypt');
const Product=require('../model/product')
const Wallet=require('../model/wallet')
const Wishlist=require('../model/wishlist')
const Category=require('../model/category')
const {StatusCodes,Messages } = require("../controller/statusCode");


const loadLogin = async (req, res) => {
    res.render('user/user_login')

}

const login = async (req, res) => {
    try {
        const {email, password} = req.body
        const user = await user_model.findOne({email})
        
        if(!user){      
            return res.render('user/user_login', {message: 'Invalid credentials'})                   
        }
        if (user.isBlocked) {
          return res.render('user/user_login', { message: 'Your account has been blocked. Please contact support.' });
      }
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) {
            return res.render('user/user_login', {message: 'Invalid password credentials'})
        }
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            isBlocked: user.isBlocked,
        };
        console.log(req.session.user)
        res.redirect('/user/user_home')  
    } catch (error) {   
        res.send(error)
    }
}    


const loadRegister=(req,res)=>{
    res.render('user/user_register')
}


const loadOTP=(req,res)=>{
    res.render('user/user_otp')
}

const loadForgotOTP=(req,res)=>{
  res.render('user/forgototp')
}


const loadLanding = async (req, res) => {
    res.render('user/user_landing')
}

const loadHome= async (req,res) =>{
    res.render('user/user_home')
}

const loadCandle= async (req,res)=>{
    res.render('user/user_candle')
}

const resetPassword=async (req, res) => {
    const { email, newPassword } = req.body;    
    const user = await user_model.findOne({ email: email });   
    if (user) {
        user.password = newPassword;  
        await user.save();
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
}



const checkEmail = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const user = await user_model.findOne({ email: email });
        if (user) {
            const hashedPassword = await bcrypt.hash(newPassword, 10); 
            user.password = hashedPassword;
            await user.save();
            res.json({ success: true, message: 'Password updated successfully!' });
        } else {
            res.json({ success: false, message: 'Enter a valid email.' });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error updating password.' });
    }
}



const logout=async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('An error occurred while logging out.');
        }
        res.redirect('/user/user_login');
    });
}


const loadAbout= async (req,res)=>{
    res.render('user/about')
}


const loadContact= async (req,res)=>{
    res.render('user/contact')
}


const loadStore = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';
    const selectedCategories = Array.isArray(req.query.categories) ? req.query.categories : (req.query.categories ? [req.query.categories] : []);
    const sortQuery = req.query.sort || '';
    let filter = { isDeleted: false };
    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    if (selectedCategories.length > 0) {
      filter.category = { $in: selectedCategories };
    }
    let sortCriteria = {};
    switch (sortQuery) {
      case 'priceLowToHigh':
        sortCriteria = { originalPrice: 1 };
        break;
      case 'priceHighToLow':
        sortCriteria = { originalPrice: -1 };
        break;
      case 'newArrivals':
        sortCriteria = { createdAt: -1 };
        break;
      default:
        sortCriteria = {}; 
    }
    const products = await Product.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .select('_id name category images originalPrice discountPrice offerPercentage');

      let wishlistProductIds = [];
    if (req.session.user) {
      const wishlist = await Wishlist.find({ userId: req.session.user.id }).select('productId');
      wishlistProductIds = wishlist.map(item => item.productId.toString());
    }
    


    const productsData = products.map(prod => {
      const firstImage = prod.images.length > 0 ? prod.images[0].toString('base64') : null;
      return {
        id: prod._id,
        name: prod.name,
        category: prod.category,
        price: prod.originalPrice,
        offerPercentage: prod.offerPercentage || 0,
        image: firstImage,
        isInWishlist: wishlistProductIds.includes(prod._id.toString())
      };
    });
    
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    const categories = await Category.find().select('_id name');

    res.render('user/store', { 
      products: productsData,
      categories,
      selectedCategories,
      searchQuery,
      totalPages,
      currentPage: page,
      sortQuery
    });
  } catch (error) {
    console.error('Error loading store:', error);
    res.status(500).send('Internal Server Error');
  }
};

  

const changePassword=async (req, res)=> {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    const { password, confirmPassword } = req.body;
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await user_model.findOneAndUpdate(
      { email: req.session.user }, 
      { password: hashedPassword }, 
      { new: true } 
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    req.session.destroy();

    return res.status(200).json({
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      message: 'An error occurred while changing the password. Please try again later.'
    });
  }
}






module.exports = {
    loadLanding,
    loadHome,
    loadCandle,
    loadLogin,
    login,
    loadRegister,
    loadOTP,
    resetPassword,
    checkEmail,
    logout,
    loadAbout,
    loadContact,
    loadStore,
    loadForgotOTP,
    changePassword
}