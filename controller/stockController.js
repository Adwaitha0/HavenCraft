const Stock= require('../model/stock')
const Product= require('../model/product')
const {StatusCodes,Messages } = require("../controller/statusCode");


const loadStock = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6; 
  const skip = (page - 1) * limit; 
  try {
      const stocks = await Stock.find()
          .populate('productId', 'name')
          .select('productId name small large')
          .skip(skip)
          .limit(limit);
      const totalItems = await Stock.countDocuments();
      const totalPages = Math.ceil(totalItems / limit);
      res.render('admin/admin_stock', {
          stocks,          
          currentPage: page,
          totalPages       
      });
  } catch (error) {
      console.error('Error fetching stock data:', error);
      res.status(500).send('Internal Server Error');
  }
};

  
  

const createStockEntries = async (req, res, next) => {
  try {
      const products = await Product.find().select('_id name');
      for (let product of products) {
          const existingStock = await Stock.findOne({ productId: product._id });
          if (!existingStock) {
              const newStock = new Stock({
                  productId: product._id,
                  name: product.name,
                  small: 0, 
                  large: 0   
              });
              await newStock.save();
          }
      }
      next();
  } catch (error) {
      console.error('Error creating stock entries:', error);
      res.status(500).send('Internal Server Error');
  }
};



  
const updateStock = async (req, res) => {
  const { productId,stockId, largeQuantity, smallQuantity } = req.body;
  if (!productId) {
     return res.status(400).send('Product ID is required');
  }
  try {  
     const stock = await Stock.findOneAndUpdate(
        { _id : productId }, 
        { small: smallQuantity, large: largeQuantity },
        { new: true }
     );

     if (!stock) {
        return res.status(404).send('Stock not found');
     }

     res.redirect('/admin/admin_stock')
  } catch (error) {
     console.error('Error updating stock:', error);
     res.status(500).send('Error updating stock');
  }
}


const getStock = async (req, res) => {
  try {
    const { productId, size } = req.query;
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    if (!size) {
      return res.status(400).json({ message: 'Size is required' });
    }
    const validSizes = ['small', 'large'];
    if (!validSizes.includes(size.toLowerCase())) {
      return res.status(400).json({ message: `Invalid size. Valid sizes are: ${validSizes.join(', ')}` });
    }
    const product = await Stock.findOne({ productId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const stock = product[size.toLowerCase()];
    if (stock === 0) {
      return res.json({ stock: 'Out of stock' });
    }
    return res.json({ stock: stock });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


  module.exports = { 
                    loadStock,
                    updateStock,
                    createStockEntries,
                    getStock,
  }