const Offer= require('../model/offer')
const Category= require('../model/category')
const Product= require('../model/product')
/*
const loadOffer = async (req, res) => {
    try {
        const offers = await Offer.find(); 
        res.render('admin/admin_offer', { offers }); 
    } catch (err) {
        console.error('Error fetching offers:', err.message);
        res.status(500).send('Error fetching offers');
    }
};
*/


const loadOffer = async (req, res) => {
    try {
        const offers = await Offer.find(); // Fetch all offers
        const categories = await Category.find({}, { _id: 1, name: 1 }); // Fetch categories (id and name)
        const products = await Product.find({}, { _id: 1, name: 1 }); // Fetch products (id and name)

        // Render template with the required data
        res.render('admin/admin_offer', { 
            offers, 
            categories, 
            products 
        }); 
    } catch (err) {
        console.error('Error fetching offers:', err.message);
        res.status(500).send('Error fetching offers');
    }
};


const addOffer = async (req, res) => {
    try {
        const { offerName, type, offerItem, discountType, discountValue, startDate, endDate } = req.body;

        // Check if the type is "Product" or "Category" and find the document by name
        let offerDocument;
        console.log(req.body);
        
        if (type === 'Product') {
            offerDocument = await Product.findOne({ name: offerItem }); // Search by name
        } else if (type === 'Category') {
            offerDocument = await Category.findOne({ name: offerItem }); // Search by name
        }

        // If no product/category is found, return an error
        if (!offerDocument) {
            return res.status(404).send('Product or Category not found');
        }

        // Create a new offer document
        const newOffer = new Offer({
            offerName,
            type,
            categoryOrProduct: offerDocument._id,  // Save the document ID of the found Product or Category
            discountType,
            discountValue,
            startDate,
            endDate,
        });

        // Save the offer to the database
        await newOffer.save();

        // Save the discount information directly to the product or category (no price calculation)
        if (type === 'Product') {
            // Just save the discountType and discountValue to the product
            offerDocument.discountType = discountType;
            offerDocument.discountValue = discountValue;
            await offerDocument.save();
        } else if (type === 'Category') {
            // Optionally apply the discount information to all products in the category
            await Product.updateMany({ category: offerDocument._id }, { 
                $set: { discountType, discountValue }
            });
        }

        // Redirect or respond after saving
        res.redirect("/admin/offer"); // Redirect to an offer list page or any other page
    } catch (error) {
        console.error("Error saving offer:", error.message);
        res.status(500).send("Failed to save the offer. Please try again.");
    }
};



const deleteOffer = async (req, res) => {
    try {
      const { id } = req.params; // Extract the offer ID from the route parameters
      await Offer.findByIdAndDelete(id); // Delete the offer document by its ID
      res.redirect('/admin/offer'); // Redirect to the offers list or appropriate page
    } catch (error) {
      console.error('Error deleting offer:', error);
      res.render('user/error')
    }
  };


const getCategories=async (req, res) => {
    try {
      const categories = await Category.find({}, { _id: 1, name: 1 }); // Fetch categories with ID and name
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.render('user/error')
    }
  }


const getProducts=async (req, res) => {
    try {
      const products = await Product.find(); // Fetch all products
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









