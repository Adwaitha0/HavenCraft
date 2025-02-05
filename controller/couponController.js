const Coupon= require('../model/coupon')
const Wallet= require('../model/wallet')
const {StatusCodes,Messages } = require("../controller/statusCode");

const loadCoupon=  async (req, res) => {
    try {
      const coupons = await Coupon.find();  
      res.render('admin/admin_coupon', { coupons }); 
    } catch (err) {
      res.render('admin/error')
    }
}


const addCoupon=async (req, res) => {
    try {
      const {
        couponCode,
        discountType,
        discountValue,
        minimumPurchase,
        maximumPurchase,
        startDate,
        endDate,
        usageLimit,
      } = req.body;
  
      const newCoupon = new Coupon({
        couponCode,
        discountType,
        discountValue,
        minimumPurchase,
        maximumPurchase,
        startDate,
        expiryDate: endDate, 
        usageLimit,
      });
  
      await newCoupon.save();  
      res.redirect('/admin/coupon')
    } catch (error) {
      console.error('Error saving coupon:', error);
      if (error.code === 11000) {
        res.status(400).send({ success: false, message: 'Coupon code must be unique!' });
      } else {
        res.render('admin/error')
      }
    }
  }




  const changeStatus=async (req, res) => {
    try {
      const { id } = req.params; 
      const { isActive } = req.body; 
      const updatedCoupon = await Coupon.findByIdAndUpdate(id, { isActive }, { new: true }); 
      if (updatedCoupon) {
        res.json({ success: true, coupon: updatedCoupon });
      } else {
        res.status(404).json({ success: false, message: 'Coupon not found' });
      }
    } catch (err) {
      res.render('admin/error')
    }
  }

const deleteCoupon=async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    if (!deletedCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.redirect('/admin/coupon')
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.render('admin/error')
  }
}


const addMoney=async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).send('Invalid amount.');
  }
  try {
    const userId = req.user._id;
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = new Wallet({ userId, balance: amount, transactions: [] });
    } else {
      wallet.balance += parseInt(amount);
    }
    
    const uniqueTransactionId = generateUniqueTransactionId(); 
    wallet.transactions.push({
      type: 'credit',
      amount,
      description: 'Money added to wallet',
      uniqueTransactionId: uniqueTransactionId,
    });

    await wallet.save();
    res.redirect('/user/user_profile')
  } catch (error) {
    console.error('Error updating wallet:', error);
    res.render('user/error')
  }
}


const generateUniqueTransactionId = () => {
  const randomNumber = Math.floor(10000 + Math.random() * 90000); 
  return `TNR${randomNumber}`; 
};








module.exports = {loadCoupon,addCoupon,
            changeStatus,deleteCoupon,addMoney
}