const category= require('../model/category')
const product= require('../model/product')
const {StatusCodes,Messages } = require("../controller/statusCode");



const loadCategories = async (req, res) => {
    try {
        const searchQuery = req.query.search || ''; 
        let filter = { isDeleted: false };

        if (searchQuery) {
            filter.name = { $regex: searchQuery, $options: 'i' }; 
        }
        const categories = await category.find(filter, { name: 1, productCount: 1, parentCategoryId: 1, offerPercentage: 1 });
        
        res.render('admin/admin_category', { categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.render('admin/error')
    }
};











const addCategory = async (req, res) => {
    try {
        const { name, parentCategoryId, offerPercentage } = req.body;

        const offerPercentageNum = parseFloat(offerPercentage) || 0;
        const newCategory = new category({
            name,
            parentCategoryId: parentCategoryId || null,
            offerPercentage: offerPercentageNum > 0 ? offerPercentageNum : undefined,
        });

        await newCategory.save();
        if (offerPercentageNum > 0) {
            const productsToUpdate = await product.find({ category: name, isDeleted: false });
            const updates = productsToUpdate.map((product) => {
                const updatedDiscountPrice = product.originalPrice - (product.originalPrice * (offerPercentageNum / 100));
                return product.updateOne({
                    discountPrice: parseInt(updatedDiscountPrice),
                    offerPercentage: offerPercentageNum,
                });
            });
            await Promise.all(updates);
        }
        res.redirect('/admin/admin_category');
    } catch (error) {
        console.error('Error adding category:', error);
        res.render('admin/error')
    }
};




const getUpdateCategory= async (req, res) => {
    const categoryId = req.params.id;
    const category = await category.findById(categoryId); 
    res.render('update_category', { category });
};

const deleteCategory =async (req, res) => {
    const { id } = req.body; 
    try {
        await category.findByIdAndUpdate(id, { isDeleted: true });
        res.redirect('/admin/admin_category'); 
    } catch (error) {
        console.error('Error deleting category:', error);
        res.render('admin/error')
    }
};



const updateCategory = async (req, res) => {
    const { id, name, parentCategoryId, offerPercentage } = req.body;

    try {
        const offerPercentageNum = parseFloat(offerPercentage) || 0;

        await category.findByIdAndUpdate(id, {
            name,
            parentCategoryId: parentCategoryId || null,
            offerPercentage: offerPercentageNum > 0 ? offerPercentageNum : undefined,
        });
        if (offerPercentageNum > 0) {
            const productsToUpdate = await product.find({ category: name, isDeleted: false });
            const updates = productsToUpdate.map((product) => {
                const updatedDiscountPrice = product.originalPrice - (product.originalPrice * (offerPercentageNum / 100));
                return product.updateOne({
                    discountPrice: parseInt(updatedDiscountPrice),
                    offerPercentage: offerPercentageNum,
                });
            });
            await Promise.all(updates);
        } else {
            const productsToReset = await product.find({ category: name, isDeleted: false });
            const resets = productsToReset.map((product) => {
                return product.updateOne({
                    discountPrice: product.originalPrice,
                    offerPercentage: 0,
                });
            });
            await Promise.all(resets);
            await category.findByIdAndUpdate(id, {
                offerPercentage: 0
            });
        }
        res.redirect('/admin/admin_category');
    } catch (error) {
        console.error('Error updating category:', error);
        res.render('admin/error')
    }
};


const check_category_exists=async (req, res) => {
    const { name } = req.body;
    category.findOne({
        name: { $regex: `^${name}$`, $options: 'i' },
        isDeleted: false,
      })
      .then(category => {
        if (category) {
          res.json({ exists: true });
        } else {
          res.json({ exists: false });
        }
      })
      .catch(error => {
        console.error('Error checking category:', error);
        res.render('admin/error')
      });
  }

module.exports = {loadCategories,addCategory,updateCategory,
    getUpdateCategory,deleteCategory,check_category_exists  }