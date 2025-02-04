const mongoose = require('mongoose');
const Wishlist= require('../model/wishlist')
const Product= require('../model/product')
const {StatusCodes,Messages } = require("../controller/statusCode");



const loadWishlist = async (req, res) => {
    try {
        const user = req.session.user.id;
        if (!user) {
            return res.status(400).json({ message: 'User not logged in' });
        }
        const obj=new mongoose.Types.ObjectId(user);
        console.log(obj)
        const wishlist = await Wishlist.aggregate([
            { $match: { userId: obj } }, 
            {
                $lookup: {
                    from: 'product', 
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' }, 
            {
                $project: {
                    _id: 1,
                    productId: 1,
                    name: '$productDetails.name',
                    originalPrice: '$productDetails.originalPrice',
                    discountPrice: '$productDetails.discountPrice',
                    imageUrl: {
                        $cond: {
                            if: { $gt: [{ $size: '$productDetails.images' }, 0] },
                            then: { $concat: ['data:image/png;base64,', { $toString: { $arrayElemAt: ['$productDetails.images', 0] } }] },
                            else: null
                        }
                    },
                    addedAt: 1
                }
            }
        ]);
        res.render('user/user_wishlist', { wishlist });
    } catch (error) {
        console.error('Error loading wishlist:', error.message);
        res.status(500).json({ message: 'Failed to load wishlist', error: error.message });
    }
};



const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user.id; 
        const productId = req.params.id;

         if (!userId || !productId) {
            return res.status(400).json({success: false, message: 'User ID or Product ID missing' });
        }  
        const existingItem = await Wishlist.findOne({ userId, productId });
        if (existingItem) {
            return res.status(400).json({ success: false,message: 'Product already in wishlist ' });
        }
        const wishlistItem = new Wishlist({
            userId,
            productId,           
        });
        await wishlistItem.save();
        return res.status(200).json({ success: true, message: 'Added to wishlist successfully' });
    } catch (err) {
        console.error('Error adding to wishlist:', err.message);
        res.status(500).json({ message: 'Failed to add product to wishlist', error: err.message });
    }
};  











const removeFromWishlist=async (req, res) => {
    const productId = req.params.id;  
    try {
      const wishlistItem = await Wishlist.findOne({ productId, userId: req.session.user.id });
      if (!wishlistItem) {
        return res.status(404).send('Wishlist item not found.');
      }
      await Wishlist.deleteOne({ _id: wishlistItem._id });
      res.redirect('/user/wishlist');
    } catch (error) {
      console.error('Error deleting wishlist item:', error.message);
      res.status(500).send('Failed to delete product from wishlist');
    }
  };





module.exports = {
    loadWishlist,
    addToWishlist,
    removeFromWishlist
}