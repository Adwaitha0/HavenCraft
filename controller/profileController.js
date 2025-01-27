const user_model = require('../model/user_model')
const bcrypt = require('bcrypt');
const Address = require('../model/address');
const order_model = require('../model/order')
const wallet_model = require('../model/wallet')


const loadProfile = async (req, res) => {
  const userId = req.session.user.id;
  console.log(userId)

  try {
    const user = await user_model.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const orders = await order_model
      .find({ userId: user._id })
      .populate('products.productId')
      .select(
        '_id username totalPrice status uniqueOrderId payableAmount reason products.productName products._id products.quantity products.price products.productStatus products.image orderDate paymentMethod address.street address.contactno address.firstname address.lastname address.city address.state address.pincode address.country')
      .exec();
      //console.log(`orders in loadProfile ${orders}`)

    // Convert product images to Base64
    orders.forEach(order => {
      order.products.forEach(product => {
        if (product.image && product.image.length > 0) {
          product.imageBase64 = product.image[0].toString('base64'); 
        }
      });
    });

    // Fetch wallet details
    const wallet = await wallet_model.findOne({ userId });
    const walletBalance = wallet ? wallet.balance : 0;

    // Prepare addresses (if applicable)
    const addresses = user.addresses || [];
    res.render('user/user_profile', {
      username: user.username,
      email: user.email,
      phoneNumber: user.phone || null,
      addresses, 
      orders,
      walletBalance,
      referralCode: user.referralCode || '' 
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};




 const editProfile= async (req, res) => {
  try {
    const { username, phoneNumber } = req.body; 
    const userId = req.session.user.id;
    const updatedUser = await user_model.findByIdAndUpdate(
      userId, 
      {
        username: username,
        phone: phoneNumber
      },
      { new: true } 
    );

    if (updatedUser) {
      res.redirect('/user/user_profile'); 
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};




/*
const cancelProduct = async (req, res) => {
  const { orderId, productId } = req.params;
  try {
      const order = await order_model.findById(orderId);
      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }
      const product = order.products.find(p => p._id.toString() === productId);
      if (!product) {
          return res.status(404).json({ message: 'Product not found in the order' });
      }
      product.productStatus = 'Cancelled';
      await order.save();
      res.json({ success: true, message: 'Product cancelled successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
};

*/

const generateUniqueTransactionId = () => {
  const randomNumber = Math.floor(10000 + Math.random() * 90000); 
  return `TNR${randomNumber}`; 
};


/*
const cancelProduct = async (req, res) => {
  const { orderId, productId } = req.params;
  console.log(orderId)
  console.log(productId)
  try {
    const order = await order_model.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const product = order.products.find((p) => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found in the order' });
    }

    
    product.productStatus = 'Cancelled';
    const refundAmount = product.price; 
    console.log(refundAmount)
    const wallet = await wallet_model.findOne({ userId: order.userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    console.log(wallet)

    const uniqueTransactionId = generateUniqueTransactionId();

    wallet.balance += refundAmount;
    wallet.transactions.push({
      type: 'credit',
      amount: refundAmount,
      description: `Refund for cancelled product`,
      uniqueTransactionId: uniqueTransactionId,
    });

    await wallet.save();

    order.payableAmount -= refundAmount;
    if (order.payableAmount < 0) order.payableAmount = 0; // Ensure it doesn't go negative

    // Check if all products in the order are canceled
    const allProductsCancelled = order.products.every((p) => p.productStatus === 'Cancelled');
    if (allProductsCancelled) {
      order.status = 'Cancelled'; // Update the order status
    }

    // Save the updated order
    await order.save();

    res.json({ success: true, message: 'Product cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

*/
const cancelProduct = async (req, res) => {
  const { orderId, productId } = req.params;
  console.log(orderId);
  console.log(productId);

  try {
    const order = await order_model.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const product = order.products.find((p) => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found in the order' });
    }

    product.productStatus = 'Cancelled';

    const refundAmount = product.price;
    console.log(refundAmount);

    const wallet = await wallet_model.findOne({ userId: order.userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    console.log(wallet);

    const uniqueTransactionId = generateUniqueTransactionId();

    const otherActiveProducts = order.products.filter((p) => p._id.toString() !== productId && p.productStatus !== 'Cancelled');
    if (otherActiveProducts.length === 0) {
      order.payableAmount -= 50;
      console.log('₹50 shipping charge reduced from payable amount');
    }

    order.payableAmount -= refundAmount;
    if (order.payableAmount < 0) order.payableAmount = 0; 

    // Add the refund amount to the wallet
    wallet.balance += refundAmount;
    wallet.transactions.push({
      type: 'credit',
      amount: refundAmount,
      description: `Refund for cancelled product`,
      uniqueTransactionId: uniqueTransactionId,
    });

    await wallet.save();

    // Check if all products in the order are cancelled
    const allProductsCancelled = order.products.every((p) => p.productStatus === 'Cancelled');
    if (allProductsCancelled) {
      order.status = 'Cancelled'; // Update the order status
    }

    // Save the updated order
    await order.save();

    res.json({ success: true, message: 'Product cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};









const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.session.user.id; 
  const shippingCharge = 50;
  
  try {
      const order = await order_model.findById(orderId);     
      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }
      if (order.status === 'Delivered') {
          return res.status(400).json({ message: 'Order already delivered and cannot be cancelled' });
      }

      // Calculate the refund amount
      const refundAmount = order.payableAmount - shippingCharge;

      // Update order status and product statuses
      order.status = 'Cancelled';
      order.products.forEach(product => {
          product.productStatus = 'Cancelled';
      });

      await order.save();

      // Find the user's wallet  ${orderId}
      const wallet = await wallet_model.findOne({ userId });
      if (!wallet) {
          return res.status(404).json({ message: 'Wallet not found' });
      }
      const uniqueTransactionId = generateUniqueTransactionId();
      wallet.balance += refundAmount;
      wallet.transactions.push({
          type: 'credit',
          amount: refundAmount,
          description: `Refund for cancelled order `,
          uniqueTransactionId: uniqueTransactionId,
      });

      await wallet.save(); // Save the updated wallet
      console.log(refundAmount)
      // Return success response
      res.json({ success: true, refundAmount });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
  }
};





 

const addAddress = async (req, res) => {
  const {firstname, lastname, street, city, state, pincode, country, contactno} = req.body;
  const userId = req.session.user.id;

  if (!firstname || !lastname || !street || !city || !state || !pincode || !country || !contactno) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const user = await user_model.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const newAddress = new Address({
      firstname,
      lastname,
      street,
      city,
      state,
      pincode,
      country,
      userId,
      contactno 
    });
    const savedAddress = await newAddress.save();

    user.addresses.push({
      firstname:savedAddress.firstname,
      lastname:savedAddress.lastname,
      street: savedAddress.street,
      city: savedAddress.city,
      state: savedAddress.state,
      pincode: savedAddress.pincode,
      country: savedAddress.country,
      contactno: savedAddress.contactno,
    });
    await user.save();
    const profileData = await loadProfile(userId);
    res.status(200).render("user/user_profile", { addresses: profileData.addresses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};





const editAddress = async (req, res) => {
  try {
      const { id } = req.params; 
      const { firstname,lastname,street, city, state, pincode, country, contactno } = req.body; 
      const userId = req.session.user.id; 

      if (!firstname || !lastname || !street || !city || !state || !pincode || !country || !contactno) {
          return res.status(400).json({ message: 'All address fields are required' });
      }
      const user = await user_model.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      if (!user.addresses[id]) {
          return res.status(400).json({ message: `Address with index ${id} does not exist` });
      }
      user.addresses[id] = { firstname,lastname,street, city, state, pincode, country };
      await user.save();
         
    res.redirect('/user/user_profile');
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};


const removeAddress = async (req, res) => {
  try {
      const userId = req.session.user.id;
      const { id } = req.params;
      const index = parseInt(id);
      const user = await user_model.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      if (index < 0 || index >= user.addresses.length) {
          return res.status(400).json({ message: 'Invalid address index' });
      }
      user.addresses.splice(index, 1);
      await user.save();
      res.redirect('/user/user_profile');
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};


const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;
    const user = await user_model.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};



const getWalletHistory= async (req, res) => {
  try {
    const userId = req.session.user.id; 
    const wallet = await wallet_model.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    res.json({
      success: true,
      transactions: wallet.transactions,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};








module.exports = { loadProfile,
                  editProfile,
                  addAddress,
                  editAddress,
                  removeAddress,
                  changePassword,
                  cancelOrder,
                  cancelProduct,
                  getWalletHistory
}