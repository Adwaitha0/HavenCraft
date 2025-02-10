const order= require('../model/order')
const mongoose = require('mongoose');
const Wallet= require('../model/wallet')
const user_model = require('../model/user_model')
const {StatusCodes,Messages } = require("../controller/statusCode");


const loadOrder = async (req, res) => {
  try {
    const orders = await order.find({ isDeleted: false })
      .populate('userId', 'username')
      .populate('products.productId')
      .sort({ orderDate: -1 })
      .select(
        '_id totalPrice isPaid status reason products.productName products.quantity products.price products.productStatus products.image orderDate uniqueOrderId paymentMethod address.firstname address.lastname address.street address.city address.state address.pincode address.country'
      )
      .exec();
    const uniqueOrders = orders.map((order) => {
      const productsWithImages = order.products.map((product) => ({
        ...product._doc,
        imageBase64: product.image && product.image.length > 0
          ?product.image[0] : '/path-to-default-image.jpg', 
      }));

      return {
        ...order._doc,
        username: order.userId.username,
        products: productsWithImages,
      };
    });
    res.render('admin/admin_order', { orders: uniqueOrders });
  } catch (error) {
    console.error('Error fetching unique orders:', error);
    res.render('admin/error')
  }
};



  

  const updateProductStatus = async (req, res) => {
    const { id } = req.params; 
    const { status } = req.body; 
    const orderId = req.query.orderId;  
    try {
      await order.updateOne(
        { _id: orderId, "products.productId": id }, 
        { $set: { "products.$.status": status } }  
      );
  
      res.redirect(`/admin/admin_order`); 
    } catch (error) {
      console.error('Error updating product status:', error);
      res.render('admin/error')
    }
  };
 
 

const adminUpdateIndividualOrder = async (req, res) => {
  const { orderId, productId } = req.body;

  try {
    const orders = await order.findById(orderId);
    if (!orders) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const productIdObject = productId ? productId._id || productId : null;
    if (!productIdObject) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = orders.products.find((p) => p.productId.toString() === productIdObject.toString());
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found in order' });
    }

    product.productStatus = 'Cancelled';

    const refundAmount = product.price; 

    const wallet = await Wallet.findOne({ userId: orders.userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    wallet.balance += refundAmount;
    wallet.transactions.push({
      type: 'credit',
      amount: refundAmount,
      description: `Refund for cancelled product`,
    });

    await wallet.save();
    orders.payableAmount -= refundAmount;
    if (orders.payableAmount < 0) 
      orders.payableAmount = 0; 


    const allProductsCancelled = orders.products.every((p) => p.productStatus === 'Cancelled');
    if (allProductsCancelled) {
      orders.status = 'Cancelled';
    }
    await orders.save();

    res.redirect(`/admin/admin_order`);
  } catch (error) {
    console.error('Error updating product status:', error);
    res.render('admin/error')
  }
};




const generateUniqueTransactionId = () => {
  const randomNumber = Math.floor(10000 + Math.random() * 90000); 
  return `TNR${randomNumber}`; 
};




const adminUpdateOrderStatus = async (req, res) => {
  const { orderId, orderStatus } = req.body;
  const shippingCharge = 50; 

  try {
      const orders = await order.findById(orderId);
      if (!orders) {
          return res.status(404).json({ success: false, message: 'Order not found' });
      }
    
      orders.products.forEach(product => {
        product.productStatus = orderStatus;
      });
  
      orders.status = orderStatus;  
      await orders.save();

      if (orderStatus === 'Cancelled') {
          orders.products.forEach(product => {
              product.productStatus = 'Cancelled';
          });
          const refundAmount = orders.payableAmount - shippingCharge;
          const wallet = await Wallet.findOne({ userId: orders.userId });
          if (!wallet) {
              return res.status(404).json({ success: false, message: 'Wallet not found' });
          }

          const uniqueTransactionId = generateUniqueTransactionId();
          wallet.balance += refundAmount;
          wallet.transactions.push({
              type: 'credit',
              amount: refundAmount,
              description: `Refund for cancelled order  by admin`,
              uniqueTransactionId: uniqueTransactionId,
          });

          await wallet.save(); 
      }

      orders.status = orderStatus;
      await orders.save();
      res.redirect(`/admin/admin_order`);
  } catch (error) {
      console.error('Error updating order status:', error);
      res.render('admin/error')
  }
};



const returnOrder = async (req, res) => {
  const { orderId, reason } = req.body;
  if (!orderId || !reason) {
    return res.status(400).send('Invalid request. Please provide all required details.');
  }
  try {
    const orderToUpdate = await order.findById(orderId);    
    if (!orderToUpdate) {
      return res.status(404).send('Order not found.');
    }
    orderToUpdate.status = 'Returning';
    orderToUpdate.reason = reason;
    orderToUpdate.products.forEach(product => {
      product.productStatus = 'Returning';
    });
    await orderToUpdate.save();
    res.redirect('/user/user_profile');
  } catch (error) {
    console.error('Error processing return:', error);
    res.render('admin/error')
  }
};



const refundOrder = async (req, res) => {
  const { orderId, orderStatus } = req.body; 
  try {
    const orders = await order.findById(orderId);
    if (!orders) {
      return res.status(404).json({ error: 'Order not found' });
    }
    orders.status = orderStatus;
    if (orderStatus === 'Approve') {
      const shippingCharge = 50; 
      const refundAmount = orders.payableAmount - shippingCharge;
      const wallet = await Wallet.findOne({ userId: orders.userId });
      if (!wallet) {
        wallet = new wallet_model({
            userId : orders.userId,
            balance: 0,
            transactions: [],
        });
  }
      const uniqueTransactionId = generateUniqueTransactionId();
      wallet.balance += refundAmount;
      wallet.transactions.push({
        type: 'credit',
        amount: refundAmount,
        description: 'Refund for order after return',
        uniqueTransactionId: uniqueTransactionId,
      });
      await wallet.save();
      orders.status = 'Returned';
      await orders.save();
    }
    res.redirect('/admin/admin_order'); 
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
  }
};









module.exports = {
    loadOrder,
    updateProductStatus,
    adminUpdateIndividualOrder,
    adminUpdateOrderStatus,
    returnOrder,
    refundOrder
}