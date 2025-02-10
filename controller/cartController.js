const cart = require('../model/cart');
const Product= require('../model/product');
const user_model = require('../model/user_model')
const order = require('../model/order');
const address_model = require('../model/address')
const Coupon= require('../model/coupon');
const Stock= require('../model/stock');
const Wallet= require('../model/wallet');
const Wishlist= require('../model/wishlist')
const {StatusCodes,Messages } = require("../controller/statusCode");




const addToCart = async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/user/login');
  }
  const userId = req.session.user.id;
  const { productId, size } = req.query; 
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).render('user/error', {
        statusCode: StatusCodes.NOT_FOUND,
        message: Messages.RESOURCE_NOT_FOUND
      });
    }
    let cartItem = await cart.findOne({ userId, productId }).populate({ path: 'productId' });   
    if (cartItem) {
      if (cartItem.quantity >= 3) {
        return res.status(400).json({ message: 'You can only purchase a maximum of 3 of the same product.' });
      }
      cartItem.quantity += 1;
      cartItem.total = cartItem.quantity * parseFloat(cartItem.productId.discountPrice);      
      await cartItem.save();
    } else {
      cartItem = new cart({
        userId,
        productId,
        images: product.images,
        quantity: 1,
        size: size,
        total: parseFloat(product.discountPrice),
        isDeleted: false,
      });
      await cartItem.save();
    }
    const cartItems = await cart.find({ userId, isDeleted: false });
    req.session.cartItems = cartItems;
    req.session.cartSummary = calculateCartSummary(cartItems);

    res.redirect('/user/user_addToCart');
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: Messages.INTERNAL_ERROR
    });
  }
};



const calculateCartSummary = (cartItems) => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const shipping = subtotal > 0 ? 50 : 0;
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
};







const loadCart = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const cartItems = await cart.find({ userId, isDeleted: false }).populate('productId');
    cartItems.forEach(item => {
      if (item.images && item.images.length > 0) {
        item.imageSrc = item.images[0];  
      }
     
    });
    const cartSummary = calculateCartSummary(cartItems);
    req.session.cartItems = cartItems;
    req.session.cartSummary = cartSummary;
    res.render('user/user_cart', {
      cartItems,
      subtotal: cartSummary.subtotal,
      shipping: cartSummary.shipping,
      total: cartSummary.total,
    });
  } catch (error) {
    console.error('Error loading cart:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: Messages.INTERNAL_ERROR
    });
  }
};



const deleteCartItem = async (req, res) => {
  const { productId } = req.body; 
  try {
    const cartItem = await cart.findOne({ _id: productId, userId: req.session.user.id });
    if (!cartItem) {
      return res.status(404).send('Cart item not found.');
    }
    await cart.deleteOne({ _id: productId });
    res.redirect('/user/user_addToCart');
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return res.status(StatusCodes.NOT_FOUND).render('user/error', {
      statusCode: StatusCodes.NOT_FOUND,
      message: Messages.RESOURCE_NOT_FOUND
    });
  }
};



const addAddress=async (req, res) => {
  try {
    const userId = req.session.user.id;
      const {
          firstname,
          lastname,
          street,
          city,
          state,
          pincode,
          country,
          contactno
      } = req.body;
      const updatedUser = await user_model.findByIdAndUpdate(
          userId,
          {
              $push: {
                  addresses: {
                      firstname,
                      lastname,
                      street,
                      city,
                      state,
                      pincode,
                      country,
                      contactno,
                  },
              },
          },
          { new: true } 
      );
      if (updatedUser) {
          res.redirect('/user/user_checkout'); 
      } else {
          res.status(404).send('User not found');
      }
  } catch (error) {
      console.error('Error adding address:', error);
      return res.status(StatusCodes.NOT_FOUND).render('user/error', {
        statusCode: StatusCodes.NOT_FOUND,
        message: Messages.RESOURCE_NOT_FOUND
      });
  }
}





const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await user_model.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const cartItems = await cart.find({ userId, isDeleted: false }).populate('productId');
    const cartSummary = calculateCartSummary(cartItems);
    cartItems.forEach(item => {
      if (item.images && item.images.length > 0) {
        item.imageSrc = item.images[0];  
      }
    });
  
    res.render('user/user_checkout', {
      cartItems,
      subtotal: cartSummary.subtotal,
      shipping: cartSummary.shipping,
      total: cartSummary.total,
      payAmount: cartSummary.payAmount,
      addresses: user.addresses,
      username: user.username,
    });
  } catch (error) {
    console.error('Error loading checkout page:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: Messages.INTERNAL_ERROR
  });
  
  }
};



const applyCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal, shipping } = req.body;

    const coupon = await Coupon.findOne({ couponCode });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'Coupon is not active' });
    }

    const currentDate = new Date();
    const expiryDate = new Date(coupon.expiryDate);
    if (expiryDate < currentDate) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    const total = parseFloat(subtotal);
    if (total < coupon.minimumPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount for this coupon is ${coupon.minimumPurchase}`,
      });
    }

    if (coupon.maximumPurchase && total > coupon.maximumPurchase) {
      return res.status(400).json({
        success: false,
        message: `Maximum purchase amount for this coupon is ${coupon.maximumPurchase}`,
      });
    }

    let discountedTotal = total;
    if (coupon.discountType === 'Fixed') {
      discountedTotal -= coupon.discountValue;
    } else if (coupon.discountType === 'Percentage') {
      discountedTotal -= total * (coupon.discountValue / 100);
    }

    discountedTotal = Math.max(discountedTotal, 0); 
    const payableAmount =  Math.round(discountedTotal + parseFloat(shipping || 0));

    req.session.cartSummary = {
      ...req.session.cartSummary,
      payAmount: payableAmount,
      couponCode,
      couponId: coupon._id,
    };


    res.json({ success: true, payableAmount });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: Messages.INTERNAL_ERROR
  });
  
  }
};





const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(400).json({ message: 'User not authenticated' });
    }

    const user = await user_model.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const cartItems = await cart.find({ userId, isDeleted: false }) 
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const { total, subtotal, shipping, payAmount, couponCode, couponId } = req.session.cartSummary || {};
    if (!total || !subtotal || !shipping) {
      return res.status(400).json({ message: 'Invalid cart summary' });
    }
   
    const addressId = req.session.addressId;
    const userAddress = user.addresses.find(addr => addr._id.toString() === addressId);
    if (!userAddress) {
      return res.status(400).json({ message: 'Address not found' });
    }






    for (let item of cartItems) {
      const productid = item.productId.toString();
      const orderedQuantity = item.quantity;
      const orderedSize = item.size.toLowerCase(); 
  
      const stockField = orderedSize === 'small' ? 'small' : orderedSize === 'large' ? 'large' : null;
  
      if (!stockField) {
          return res.status(400).json({ message: `Invalid size ${orderedSize} for product ${item.productName}` });
      }
  
      const updateQuery = { $inc: { [`${stockField}`]: -orderedQuantity } };
  
      try {
          const updatedStock = await Stock.findOneAndUpdate(
              { productId: productid, [`${stockField}`]: { $gte: orderedQuantity } },
              updateQuery,
              { new: true }
          );
  
          if (!updatedStock) {
              return res.status(400).json({
                  message: `Insufficient stock for product  in size ${orderedSize}`
              });
          }
      } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          message: Messages.INTERNAL_ERROR
      });
      
      }
  }
  


    if (couponCode && couponId) {
      const coupon = await Coupon.findById(couponId);
      if (!coupon || coupon.expiryDate < new Date() || !coupon.isActive) {
        return res.status(400).json({ message: 'Coupon is invalid or expired' });
      }

      const usedCoupons = user.usedCoupons || [];
      const couponIndex = usedCoupons.findIndex(usedCoupon => usedCoupon.couponId.toString() === couponId.toString());

      if (couponIndex !== -1 && usedCoupons[couponIndex].usageCount >= coupon.usageLimit) {
        return res.status(400).json({ message: 'Coupon usage limit exceeded' });
      }
      if (couponIndex !== -1) {
        usedCoupons[couponIndex].usageCount += 1;
      } else {
        usedCoupons.push({ couponId, usageCount: 1 });
      }
      user.usedCoupons = usedCoupons;
      await user.save();
    }
    const paymentMethod = req.params.paymentMethod;
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required' });
    }
    if (paymentMethod === 'wallet') {
      let  wallet = await Wallet.findOne({ userId });
      if (!wallet) {
              wallet = new Wallet({
                  userId,
                  balance: 0,
                  transactions: [],
              });
        }
      const amountToDeduct = payAmount || total;   
      if (wallet.balance < amountToDeduct) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      
      wallet.balance -= amountToDeduct;
      const uniqueTransactionId = generateUniqueTransactionId();
      wallet.transactions.push({
        type: 'debit',
        amount: amountToDeduct,
        description: 'Order payment',
        uniqueTransactionId: uniqueTransactionId,
      });   
      await wallet.save();
    }



    const productIds = cartItems.map(item => item.productId);
const productDetails = await Product.find({ _id: { $in: productIds } }, 'name discountPrice');

const productMap = {};
productDetails.forEach(product => {
  productMap[product._id] = {
    name: product.name,
    price: product.discountPrice || product.price 
  };
});

    


    const products = cartItems.map(item => ({
      productId: item.productId, 
      productName: productMap[item.productId]?.name || 'Unknown Product',
      quantity: item.quantity,
      size: item.size,
      price: productMap[item.productId]?.price || 0,   
      image: item.images[0], 
    }));

    const uniqueOrderId = generateOrderId();
    const newOrder = new order({
      uniqueOrderId: uniqueOrderId,
      userId: user._id,
      products,
      totalPrice: total,
      address: userAddress,
      paymentMethod,
      payableAmount: payAmount || total,
      subtotal,
      shipping,
    });

    await newOrder.save();
    await cart.deleteMany({ userId, isDeleted: false });
    res.status(200).json({ success: true, message: 'Order placed successfully!',orderId: newOrder.uniqueOrderId  });
  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(StatusCodes.NOT_FOUND).render('user/error', {
      statusCode: StatusCodes.NOT_FOUND,
      message: Messages.RESOURCE_NOT_FOUND
    });
  }
};


const generateUniqueTransactionId = () => {
  const randomNumber = Math.floor(10000 + Math.random() * 90000); 
  return `TNR${randomNumber}`; 
};



const generateOrderId = () => {
  const characters = '0123456789'; 
  let orderId = 'ID'; 
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    orderId += characters[randomIndex]; 
  }  
  return orderId;
};





const saveAddress=async (req, res) => {
  const { addressId } = req.body;  
  if (addressId) {
    req.session.addressId = addressId;
    res.json({
      message: 'Address saved successfully',
      addressId: addressId
    });
  } else {
    res.status(400).json({ message: 'Address ID not provided' });
  }
}



const orderSuccess = (req, res) => {
  res.render('user/user_orderSuccess');
};



const updateIsPaid = async (req, res) => {
  const { orderId } = req.params;  
  const { isPaid } = req.body;  
  
  try {
    const orders = await order.findOneAndUpdate(
      { uniqueOrderId: orderId },
      { isPaid: true },  
      { new: true }  
    );
    
    if (!orders) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }   
    return res.status(200).json({
      success: true, 
      message: 'Order payment status updated successfully', 
    });
  } catch (error) {
    console.error('Error updating isPaid field:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: Messages.INTERNAL_ERROR
  });
  
  }
};






const updateCartQuantity = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const userId = req.session.user.id;

    const cartItem = await cart.findOne({ userId, productId, isDeleted: false }).populate('productId');

    if (cartItem) {
      const productPrice = cartItem.productId.discountPrice || cartItem.productId.originalPrice || 0;
      cartItem.quantity = quantity;
      cartItem.total = quantity * productPrice;
      await cartItem.save();
    }

    const allCartItems = await cart.find({ userId, isDeleted: false }).populate('productId');
    let subtotal = 0;
    allCartItems.forEach((item) => {
      const productPrice = item.productId.discountPrice || item.productId.originalPrice || 0;
      subtotal += item.quantity * productPrice;
    });

    const shipping = subtotal > 500 ? 0 : 50; 
    const total = subtotal + shipping;
    return res.status(200).json({
      message: 'Cart updated successfully.',
      cartItems: allCartItems,
      subtotal,
      shipping,
      total,
    });
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: Messages.INTERNAL_ERROR
  });
  
  }
};

const loadNavbarData = async (req, res, next) => {
  res.locals.cartCount = 0; 
  res.locals.wishlistCount = 0;
  if (req.session.user) {
    try {
      const cartItems = await cart.find({ userId: req.session.user.id });
      res.locals.cartCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0); 
      const wishlistItems = await Wishlist.find({ userId: req.session.user.id });
      res.locals.wishlistCount = wishlistItems.length;
    } catch (error) {
      console.error("Error fetching cart data:", error);
    }
  }
  next();
};



module.exports = {
  loadCart,
  addToCart,
  deleteCartItem, 
  placeOrder,
  loadCheckout,
  addAddress,
  applyCoupon,
  saveAddress,
  orderSuccess,
  updateIsPaid,
  updateCartQuantity,
  loadNavbarData
};
