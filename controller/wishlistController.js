const Wishlist= require('../model/wishlist')
const Product= require('../model/product')


const loadWishlist = async (req, res) => {
    try {
        console.log('loadWishlist hit');
        const userId = req.session.user.id;

        if (!userId) {
            return res.status(400).json({ message: 'User not logged in' });
        }

        const wishlistItems = await Wishlist.find({ userId });

        const wishlist = wishlistItems.map((item) => ({
            id: item._id,
            productId: item.productId,
            name: item.productName,
            originalPrice: item.originalPrice,
            discountPrice: item.discountPrice,
            imageUrl: item.images && item.images.length > 0
                ? `data:image/png;base64,${item.images[0].toString('base64')}` // Convert first buffer to Base64
                : null,
            addedAt: item.addedAt,
        }));

        res.render('user/user_wishlist', { wishlist });
    } catch (error) {
        console.error('Error loading wishlist:', error.message);
        res.status(500).json({ message: 'Failed to load wishlist', error: error.message });
    }
};



const addToWishlist = async (req, res) => {
    try {
        console.log('addToWishlist hit');

        const userId = req.session.user.id; 
        const productId = req.params.id;

        console.log('UserId:', userId);
        console.log('ProductId:', productId);

         if (!userId || !productId) {
            return res.status(400).json({success: false, message: 'User ID or Product ID missing' });
        }  

        const existingItem = await Wishlist.findOne({ userId, productId });
        if (existingItem) {
            return res.status(400).json({ success: false,message: 'Product already in wishlist ' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({success: false, message: 'Product not found' });
        }

        const wishlistItem = new Wishlist({
            userId,
            productId,
            productName: product.name,
            originalPrice: product.originalPrice,
            discountPrice: product.discountPrice,
            images: product.images,
        });

        await wishlistItem.save();
        console.log('Wishlist item saved');
        return res.status(200).json({ success: true, message: 'Added to wishlist successfully' });
    } catch (err) {
        console.error('Error adding to wishlist:', err.message);
        res.status(500).json({ message: 'Failed to add product to wishlist', error: err.message });
    }
};  











const removeFromWishlist=async (req, res) => {
    const productId = req.params.id; 
  console.log('Received wishlist product ID:', productId);
  console.log('User ID:', req.session.user?.id);
  
    try {
      const wishlistItem = await Wishlist.findOne({ productId, userId: req.session.user.id });
      if (!wishlistItem) {
        return res.status(404).send('Wishlist item not found.');
      }
  
      // Delete the wishlist item
      await Wishlist.deleteOne({ _id: wishlistItem._id });
      console.log('Wishlist item deleted:', productId);
  
      // Redirect back to the wishlist page
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