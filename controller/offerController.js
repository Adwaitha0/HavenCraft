const Offer= require('../model/offer')
const Category= require('../model/category')
const Product= require('../model/product')
const {StatusCodes,Messages } = require("../controller/statusCode");


const loadOffer = async (req, res) => {
    try {
        const offers = await Offer.find();
        const categories = await Category.find({}, { _id: 1, name: 1 });
        const products = await Product.find({}, { _id: 1, name: 1 }); 

        res.render('admin/admin_offer', { 
            offers, 
            categories, 
            products 
        }); 
    } catch (err) {
        console.error('Error fetching offers:', err.message);
        res.render('admin/error')
    }
};


const addOffer = async (req, res) => {
    try {
        const { offerName, type, offerItem, discountType, discountValue, startDate, endDate } = req.body;
        let offerDocument;
        console.log(req.body);
        
        if (type === 'Product') {
            offerDocument = await Product.findOne({ name: offerItem }); 
        } else if (type === 'Category') {
            offerDocument = await Category.findOne({ name: offerItem }); 
        }
        if (!offerDocument) {
            return res.status(404).send('Product or Category not found');
        }
        const newOffer = new Offer({
            offerName,
            type,
            categoryOrProduct: offerDocument._id, 
            discountType,
            discountValue,
            startDate,
            endDate,
        });
        await newOffer.save();

        if (type === 'Product') {
            offerDocument.discountType = discountType;
            offerDocument.discountValue = discountValue;
            await offerDocument.save();
        } else if (type === 'Category') {
            await Product.updateMany({ category: offerDocument._id }, { 
                $set: { discountType, discountValue }
            });
        }
        res.redirect("/admin/offer"); 
    } catch (error) {
        console.error("Error saving offer:", error.message);
        res.render('admin/error')
    }
};



const deleteOffer = async (req, res) => {
    try {
      const { id } = req.params; 
      await Offer.findByIdAndDelete(id); 
      res.redirect('/admin/offer'); 
    } catch (error) {
      console.error('Error deleting offer:', error);
      res.render('admin/error')
    }
  };


const getCategories=async (req, res) => {
    try {
      const categories = await Category.find({}, { _id: 1, name: 1 }); 
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.render('user/error')
    }
  }


const getProducts=async (req, res) => {
    try {
      const products = await Product.find(); 
      res.json(products);
    } catch (error) {
        res.render('user/error')
    }
  }







module.exports = { loadOffer,
    addOffer,
    deleteOffer,
    getCategories,
    getProducts
 };









