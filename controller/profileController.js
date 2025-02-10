const user_model = require('../model/user_model')
const bcrypt = require('bcrypt');
const Address = require('../model/address');
const order_model = require('../model/order')
const wallet_model = require('../model/wallet')
const {StatusCodes,Messages } = require("../controller/statusCode");

const loadProfile = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const user = await user_model.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const orders = await order_model.find({ userId: user._id })
    .populate('userId','username')
      .populate('products.productId')
      .sort({ orderDate: -1 })
      .select(
        '_id totalPrice status isPaid uniqueOrderId payableAmount reason products.productName products._id products.quantity products.size products.price products.productStatus products.image orderDate paymentMethod address.street address.contactno address.firstname address.lastname address.city address.state address.pincode address.country')
      .exec();

    orders.forEach(order => {
      order.products.forEach(product => {
        if (product.image && product.image.length > 0) {
          product.imageBase64 = product.image[0]; 
        }
      });
    });

    const wallet = await wallet_model.findOne({ userId });
    const walletBalance = wallet ? wallet.balance : 0;   
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
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
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
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
  }
};



const generateUniqueTransactionId = () => {
  const randomNumber = Math.floor(10000 + Math.random() * 90000); 
  return `TNR${randomNumber}`; 
};



const cancelProduct = async (req, res) => {
  const { orderId, productId } = req.params;

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

    let wallet = await wallet_model.findOne({ userId: order.userId });
    if (!wallet) {
      wallet = new wallet_model({
        userId: order.userId,
        balance: 0,
        transactions: [],
      });
    }

    const uniqueTransactionId = generateUniqueTransactionId();

    const otherActiveProducts = order.products.filter((p) => p._id.toString() !== productId && p.productStatus !== 'Cancelled');
    if (otherActiveProducts.length === 0) {
      order.payableAmount -= 50;
    }

    order.payableAmount -= refundAmount;
    if (order.payableAmount < 0) order.payableAmount = 0; 

    //wallet
    wallet.balance += refundAmount;
    wallet.transactions.push({
      type: 'credit',
      amount: refundAmount,
      description: `Refund for cancelled product`,
      uniqueTransactionId: uniqueTransactionId,
    });

    await wallet.save();

    const allProductsCancelled = order.products.every((p) => p.productStatus === 'Cancelled');
    if (allProductsCancelled) {
      order.status = 'Cancelled'; 
    }

    await order.save();

    res.json({ success: true, message: 'Product cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling product:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
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

      const refundAmount = order.payableAmount - shippingCharge;
      order.status = 'Cancelled';
      order.products.forEach(product => {
          product.productStatus = 'Cancelled';
      });
      await order.save();
      let wallet = await wallet_model.findOne({ userId });
      if (!wallet) {
        wallet = new wallet_model({
            userId,
            balance: 0,
            transactions: [],
        });
    }
      const uniqueTransactionId = generateUniqueTransactionId();
      wallet.balance += refundAmount;
      wallet.transactions.push({
          type: 'credit',
          amount: refundAmount,
          description: `Refund for cancelled order `,
          uniqueTransactionId: uniqueTransactionId,
      });

      await wallet.save(); 
      res.json({ success: true, refundAmount });
  } catch (error) {
      console.error('Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
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
    // const profileData = await loadProfile(userId);
    // res.status(200).render("user/user_profile", { addresses: profileData.addresses });
    res.redirect('/user/user_profile');
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
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
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
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
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
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
    res.render('user/error')
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
    res.render('user/error')
  }
};



const getInvoice = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    if (!orderId) {
      return res.status(400).send("Order ID is required");
    }
    const order = await order_model.findById(orderId).populate('userId').populate('products.productId').exec();

    if (!order) {
      return res.status(404).send("Order not found");
    }
    res.render('user/invoice', { order });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.render('user/error')
  }
};

const resumePayment = async (req, res) => {
  try {
      const orderId = req.params.orderId;
      res.render('user/payment', { orderId }); 
  } catch (error) {
      console.error("Error in resumePayment:", error);
      res.render('user/error')
  }
};

const resumeOrderPayment = async (req, res) => {
  try {
      const orderId  = req.params.orderId;
      if (!orderId) {
          return res.status(400).json({ success: false, message: "Order ID is required" });
      }

      const order = await order_model.findById(orderId);

      if (!order) {
          return res.status(404).json({ success: false, message: "Order not found" });
      }

      if (order.isPaid) {
          return res.status(400).json({ success: false, message: "Order is already paid" });
      }

      res.status(200).json({ 
          success: true, 
          orderId: order._id, 
          amount: order.payableAmount,
          currency: "INR",
          message: "Order payment resumed successfully"
      });

  } catch (error) {
      console.error("Error resuming order payment:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updatePayment = async (req, res) =>{
  try {
    const orderId = req.params.orderId; 
    const updatedOrder = await order_model.findByIdAndUpdate(orderId, 
        { isPaid: true }, 
        { new: true } 
    );
    if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Payment updated successfully", order: updatedOrder });
} catch (error) {
    console.error("Error updating payment:", error);
    res.render('user/error')
}
}







module.exports = { loadProfile,
                  editProfile,
                  addAddress,
                  editAddress,
                  removeAddress,
                  changePassword,
                  cancelOrder,
                  cancelProduct,
                  getWalletHistory,
                  getInvoice,
                  resumePayment,
                  resumeOrderPayment,
                  updatePayment

}