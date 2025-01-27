const user_model=require('../model/user_model')
const bcrypt = require('bcrypt');
const Product=require('../model/product')
const Wallet=require('../model/wallet')
const Category=require('../model/category')

const loadLogin = async (req, res) => {
    res.render('user/user_login')

}



const login = async (req, res) => {
    try {
        const {email, password} = req.body
        const user = await user_model.findOne({email})
        console.log(req.body)
        console.log(user)
        console.log('$$$$$$$$$')
        if(!user){      
            return res.render('user/user_login', {message: 'Invalid credentials'})                   
        }
        if (user.isBlocked) {
          return res.render('user/user_login', { message: 'Your account has been blocked. Please contact support.' });
      }
        const isMatch = await bcrypt.compare(password, user.password)
        console.log(`password matched or not ${isMatch}`)
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
    console.log(req.body)

    try {
        const user = await user_model.findOne({ email: email });
        console.log(user)

        if (user) {
            const hashedPassword = await bcrypt.hash(newPassword, 10); 
            user.password = hashedPassword;
            console.log(hashedPassword)
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


const saveRefferalcode=async (req, res) => {
    try {
        const { referralCode } = req.body;
        const user = await user_model.findById(req.user._id); 
        
        if (user) {
            user.referralCode = referralCode;
            await user.save();
            res.redirect('/user/user_profile')
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving referral code');
    }
}



const applyRefferalcode = async (req, res) => {
  try {
    const { referralCode } = req.body;
    const appliedUserId = req.session.user.id; 

    const referredUser = await user_model.findOne({ referralCode });
    if (!referredUser) {
      return res.status(400).json({ swal: { icon: 'error', title: 'Invalid Referral Code', text: 'The referral code you entered is invalid.' } });
    }
    if (referredUser.isBlocked) {
      return res.status(400).json({ swal: { icon: 'error', title: 'User Blocked', text: 'The user associated with this referral code is blocked.' } });
    }
    if (referredUser._id.toString() === appliedUserId) {
      return res.status(400).json({ swal: { icon: 'error', title: 'Invalid Action', text: 'You cannot use your own referral code.' } });
    }
    let appliedUserWallet = await Wallet.findOne({ userId: appliedUserId });
    if (!appliedUserWallet) {
      appliedUserWallet = new Wallet({
        userId: appliedUserId,
        balance: 0,
        transactions: [],
      });
      await appliedUserWallet.save();
    }

    let referredUserWallet = await Wallet.findOne({ userId: referredUser._id });
    if (!referredUserWallet) {
      referredUserWallet = new Wallet({
        userId: referredUser._id,
        balance: 0,
        transactions: [],
      });
      await referredUserWallet.save();
    }


    await Wallet.findByIdAndUpdate(appliedUserWallet._id, {
      $inc: { balance: 100 },
      $push: {
        transactions: {
          type: 'credit',
          amount: 100,
          description: 'Referral code applied - credited 100',
        },
      },
    });

    await Wallet.findByIdAndUpdate(referredUserWallet._id, {
      $inc: { balance: 100 },
      $push: {
        transactions: {
          type: 'credit',
          amount: 100,
          description: 'Referral bonus for referred user - credited 100',
        },
      },
    });

    res.json({ swal: { icon: 'success', title: 'Referral Code Applied', text: 'Both users have been credited ₹100.' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ swal: { icon: 'error', title: 'Error', text: 'An error occurred. Please try again later.' } });
  }
};














const loadAbout= async (req,res)=>{
    res.render('user/about')
}

const loadContact= async (req,res)=>{
    res.render('user/contact')
}

/*
const loadStore = async (req, res) => {
  try {
    const searchQuery = req.query.search || ''; 
    const sortQuery = req.query.sort || '';
    const selectedCategories = req.query.categories || []; // Get selected categories from the query
    let filter = {};

    // Search functionality
    if (searchQuery) {
      filter = {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { category: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }

    // Category filtering
    if (selectedCategories.length > 0) {
      filter.category = { $in: selectedCategories }; // Filter products by selected categories
    }

    // Sorting functionality
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

    // Fetch products based on the filter and sort criteria
    const products = await Product.find({ ...filter, isDeleted: false })
      .sort(sortCriteria)
      .select('_id name category images originalPrice discountPrice offerPercentage');

    // Map products for easier display
    const productsData = products.map(prod => {
      const firstImage = prod.images.length > 0 ? prod.images[0].toString('base64') : null;
      return {
        id: prod._id,
        name: prod.name,
        category: prod.category,
        price: prod.originalPrice,
        offerPercentage: prod.offerPercentage || 0,
        image: firstImage
      };
    });

    // Fetch all categories from the Category collection
    const categories = await Category.find().select('_id name');

    // Render the store page with the products and categories, passing the selected categories
    res.render('user/store', { products: productsData, categories, selectedCategories });

  } catch (error) {
    console.error('Error loading store:', error);
    res.status(500).send('Internal Server Error');
  }
};
*/


const loadStore = async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const sortQuery = req.query.sort || '';
    const selectedCategories = req.query.categories || [];
    const page = parseInt(req.query.page) || 1; // Current page
    const limit = parseInt(req.query.limit) || 12; // Number of products per page
    const skip = (page - 1) * limit; // Skip products for pagination
    let filter = {};

    // Search functionality
    if (searchQuery) {
      filter = {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { category: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }

    // Category filtering
    if (selectedCategories.length > 0) {
      filter.category = { $in: selectedCategories };
    }

    // Sorting functionality
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

    // Fetch products with pagination
    const products = await Product.find({ ...filter, isDeleted: false })
      .sort(sortCriteria)
      .skip(skip) // Skip products for the current page
      .limit(limit) // Limit the number of products fetched
      .select('_id name category images originalPrice discountPrice offerPercentage');

    // Map products for easier display
    const productsData = products.map(prod => {
      const firstImage = prod.images.length > 0 ? prod.images[0].toString('base64') : null;
      return {
        id: prod._id,
        name: prod.name,
        category: prod.category,
        price: prod.originalPrice,
        offerPercentage: prod.offerPercentage || 0,
        image: firstImage
      };
    });

    const totalProducts = await Product.countDocuments({ ...filter, isDeleted: false });
    const totalPages = Math.ceil(totalProducts / limit);

    // Render the store page with products and pagination data
    const categories = await Category.find().select('_id name');
    res.render('user/store', { 
      products: productsData, 
      categories, 
      selectedCategories, 
      totalPages, 
      currentPage: page 
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
    console.log(req.body)

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
      message: 'An error occurred while changing the password. Please try again later.',
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
    saveRefferalcode,
    applyRefferalcode,
    loadAbout,
    loadContact,
    loadStore,
    loadForgotOTP,
    changePassword
}