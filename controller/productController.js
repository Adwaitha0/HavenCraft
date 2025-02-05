const product=require('../model/product')
const Category=require('../model/category')
const statusCode=require('../controller/statusCode')
const message=require('../controller/statusCode')
const {StatusCodes,Messages } = require("../controller/statusCode")
const Wishlist=require('../model/wishlist')
const Cart=require('../model/cart')


const loadProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = 6; 
    const skip = (page - 1) * limit; 
    const searchQuery = req.query.search || '';
    try {
        let filter = { isDeleted: false };
        if (searchQuery) {
            filter = {
                ...filter,
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { category: { $regex: searchQuery, $options: 'i' } } 
                ]
            };
        }
        const products = await product
            .find(filter, {
                name: 1,
                size: 1,
                category: 1,
                originalPrice: 1,
                discountPrice: 1,
                offerPercentage: 1,
                description: 1,
                stock: 1,
                images: 1,
                _id: 1
            })
            .skip(skip)
            .limit(limit);

        products.forEach(product => {
            product.images = product.images.map(image => image.toString('base64'));
        });
        const categories = await Category.find(
            { isDeleted: false },
            { name: 1 }
        );
        const totalItems = await product.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / limit);
        res.render('admin/admin_product', {
            products,
            categories,
            currentPage: page,
            totalPages,
            searchQuery 
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.render('admin/error')
    }
};


const addProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            size,
            originalPrice,
            offerPercentage, 
            description,
            stock,           
        } = req.body;

        let images = [];
        if (req.files) {
            images = req.files.map(file => file.buffer); 
        }

        const originalPriceNum = parseFloat(originalPrice) || 0;
        const offerPercentageNum = parseFloat(offerPercentage) || 0;

        const discountPrice = offerPercentageNum > 0 
            ? originalPriceNum - ((offerPercentageNum / 100) * originalPriceNum) 
            : originalPriceNum; 
        const newProduct = new product({
            name,
            category,
            size,
            originalPrice: originalPriceNum, 
            discountPrice: parseInt(discountPrice),  
            offerPercentage: offerPercentageNum, 
            description,
            stock: parseInt(stock) || 0, 
            images,
        });

        await newProduct.save();
        res.redirect('/admin/admin_product');
    } catch (error) {
        console.error('Error adding product:', error);
        res.render('admin/error')
    }
};

const check_product_exists= async (req, res) => {
    const productName = req.query.name;
    const products = await product.findOne({ name: { $regex: new RegExp('^' + productName + '$', 'i') } });
    if (products) {
        return res.json({ exists: true });
    }
    return res.json({ exists: false });
}


const updateProduct = async (req, res) => {
    const { 
        id, 
        name, 
        image, 
        size, 
        category, 
        description, 
        originalPrice, 
        offerPercentage,  
        stock 
    } = req.body;
    
    try {
        const originalPriceNum = parseFloat(originalPrice) || 0;
        const offerPercentageNum = parseFloat(offerPercentage) || 0;

        const discountPrice = offerPercentageNum > 0 
            ? originalPriceNum - ((offerPercentageNum / 100) * originalPriceNum) 
            : originalPriceNum; 

        await product.findByIdAndUpdate(id, {
            name,
            image,
            size,
            category,
            description,
            originalPrice: originalPriceNum,
            discountPrice, 
            offerPercentage: offerPercentageNum,  
            stock: parseInt(stock) || 0,
        });
        res.redirect('/admin/admin_product'); 
    } catch (error) {
        console.error('Error updating product:', error);
        res.render('admin/error')
    }
};


const deleteProduct=async (req, res) => {
    try {
        const { id } = req.body;
        const deletedProduct = await product.findByIdAndUpdate(id, { isDeleted: true });
        if (!deletedProduct) {
            console.error('Product not found for deletion');
            return res.status(404).send('Product not found');
        }
        res.redirect('/admin/admin_product');
    } catch (error) {
        console.error('Error soft deleting product:', error);
        res.render('admin/error')
    }
};


const loadCandleholderProducts = async (req, res) => {
    try {
        const sortOption = req.query.sort || '';
        let sortCriteria = {};
        switch (sortOption) {
            case 'priceLowToHigh':
                sortCriteria = { originalPrice: 1 }; 
                break;
            case 'priceHighToLow':
                sortCriteria = { originalPrice: -1 }; 
                break;
            case 'newArrivals':
                sortCriteria = { _id: -1 };
                break;
            default:
                sortCriteria = {}; 
        }
        const products = await product.find({ category: "Candle holder", isDeleted: false })
            .select('_id name category images originalPrice discountPrice offerPercentage')
            .sort(sortCriteria); 
            let wishlistProductIds = [];
        if (req.session.user) {
            const wishlist = await Wishlist.find({ userId: req.session.user.id }).select('productId');
            wishlistProductIds = wishlist.map(item => item.productId.toString());
        }



        const productsData = products.map(prod => {
            const firstImage = prod.images.length > 0 ? prod.images[0].toString('base64') : null;
            return {
                name: prod.name,
                price: prod.originalPrice,
                offerPercentage: prod.offerPercentage || 0 ,
                image: firstImage,
                id: prod._id,
                isInWishlist: wishlistProductIds.includes(prod._id.toString()) 
            };
        });
        res.render('user/user_candle', { products: productsData, currentCategory: 'candleHolder'});
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
    }
};


const loadTableLampProducts = async (req, res) => {
    try {
        const sortOption = req.query.sort || '';
        let sortCriteria = {};
        switch (sortOption) {
            case 'priceLowToHigh':
                sortCriteria = { originalPrice: 1 }; 
                break;
            case 'priceHighToLow':
                sortCriteria = { originalPrice: -1 }; 
                break;
            case 'newArrivals':
                sortCriteria = { _id: -1 };
                break;
            default:
                sortCriteria = {}; 
        }
        const products = await product.find({ category: "Table Lamp", isDeleted: false })
            .select('_id name category images originalPrice discountPrice offerPercentage')
            .sort(sortCriteria); 
            let wishlistProductIds = [];
            if (req.session.user) {
            const wishlist = await Wishlist.find({ userId: req.session.user.id }).select('productId');
            wishlistProductIds = wishlist.map(item => item.productId.toString());
            }
        const productsData = products.map(prod => {
            const firstImage = prod.images.length > 0 ? prod.images[0].toString('base64') : null;
            return {
                name: prod.name,
                price: prod.originalPrice,
                offerPercentage: prod.offerPercentage || 0 ,
                image: firstImage,
                id: prod._id,
                isInWishlist: wishlistProductIds.includes(prod._id.toString())
            };
        });
        res.render('user/user_candle', { products: productsData, currentCategory:'tableLamp' });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
    }
};


const loadVaseProducts = async (req, res) => {
    try {
        const sortOption = req.query.sort || '';
        let sortCriteria = {};
        switch (sortOption) {
            case 'priceLowToHigh':
                sortCriteria = { originalPrice: 1 }; 
                break;
            case 'priceHighToLow':
                sortCriteria = { originalPrice: -1 }; 
                break;
            case 'newArrivals':
                sortCriteria = { _id: -1 };
                break;
            default:
                sortCriteria = {}; 
        }
        const products = await product.find({ category: "Vase", isDeleted: false })
            .select('_id name category images originalPrice discountPrice offerPercentage')
            .sort(sortCriteria); 
            let wishlistProductIds = [];
            if (req.session.user) {
            const wishlist = await Wishlist.find({ userId: req.session.user.id }).select('productId');
            wishlistProductIds = wishlist.map(item => item.productId.toString());
            }
        const productsData = products.map(prod => {
            const firstImage = prod.images.length > 0 ? prod.images[0].toString('base64') : null;
            return {
                name: prod.name,
                price: prod.originalPrice,
                image: firstImage,
                id: prod._id,
                isInWishlist: wishlistProductIds.includes(prod._id.toString())
            };
        });
        res.render('user/user_candle', { products: productsData, currentCategory:'vase'});
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
    }
};

const loadArtifactProducts = async (req, res) => {
    try {
        const sortOption = req.query.sort || '';
        let sortCriteria = {};
        switch (sortOption) {
            case 'priceLowToHigh':
                sortCriteria = { originalPrice: 1 }; 
                break;
            case 'priceHighToLow':
                sortCriteria = { originalPrice: -1 }; 
                break;
            case 'newArrivals':
                sortCriteria = { _id: -1 };
                break;
            default:
                sortCriteria = {}; 
        }
        const products = await product.find({ category: "Artifact", isDeleted: false })
            .select('_id name category images originalPrice')
            .sort(sortCriteria); 
            let wishlistProductIds = [];
            if (req.session.user) {
            const wishlist = await Wishlist.find({ userId: req.session.user.id }).select('productId');
            wishlistProductIds = wishlist.map(item => item.productId.toString());
            }
        const productsData = products.map(prod => {
            const firstImage = prod.images.length > 0 ? prod.images[0].toString('base64') : null;
            return {
                name: prod.name,
                price: prod.originalPrice,
                offerPercentage: prod.offerPercentage || 0 ,
                image: firstImage,
                id: prod._id,
                isInWishlist: wishlistProductIds.includes(prod._id.toString())
            };
        });
        res.render('user/user_candle', { products: productsData, currentCategory: 'artifact' });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
    }
};

const loadSculptureProducts = async (req, res) => {
    try {
        const sortOption = req.query.sort || '';
        let sortCriteria = {};
        switch (sortOption) {
            case 'priceLowToHigh':
                sortCriteria = { originalPrice: 1 }; 
                break;
            case 'priceHighToLow':
                sortCriteria = { originalPrice: -1 }; 
                break;
            case 'newArrivals':
                sortCriteria = { _id: -1 };
                break;
            default:
                sortCriteria = {}; 
        }
        const products = await product.find({ category: "Sculpture", isDeleted: false })
            .select('_id name category images originalPrice discountPrice offerPercentage')
            .sort(sortCriteria);
            let wishlistProductIds = [];
            if (req.session.user) {
            const wishlist = await Wishlist.find({ userId: req.session.user.id }).select('productId');
            wishlistProductIds = wishlist.map(item => item.productId.toString());
            } 
        const productsData = products.map(prod => {
            const firstImage = prod.images.length > 0 ? prod.images[0].toString('base64') : null;
            return {
                name: prod.name,
                price: prod.originalPrice,
                offerPercentage: prod.offerPercentage || 0 ,
                image: firstImage,
                id: prod._id,
                isInWishlist: wishlistProductIds.includes(prod._id.toString())
            };
        });
        res.render('user/user_candle', { products: productsData, currentCategory: 'sculpture' });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
    }
};


const loadChendelierProducts = async (req, res) => {
    try {
        const sortOption = req.query.sort || '';
        let sortCriteria = {};
        switch (sortOption) {
            case 'priceLowToHigh':
                sortCriteria = { originalPrice: 1 }; 
                break;
            case 'priceHighToLow':
                sortCriteria = { originalPrice: -1 }; 
                break;
            case 'newArrivals':
                sortCriteria = { _id: -1 };
                break;
            default:
                sortCriteria = {}; 
        }
        const products = await product.find({ category: "Chendeliers", isDeleted: false })
            .select('_id name category images originalPrice discountPrice offerPercentage')
            .sort(sortCriteria);
            let wishlistProductIds = [];
            if (req.session.user) {
            const wishlist = await Wishlist.find({ userId: req.session.user.id }).select('productId');
            wishlistProductIds = wishlist.map(item => item.productId.toString());
        } 
        const productsData = products.map(prod => {
            const firstImage = prod.images.length > 0 ? prod.images[0].toString('base64') : null;
            return {
                name: prod.name,
                price: prod.originalPrice,
                offerPercentage: prod.offerPercentage || 0 ,
                image: firstImage,
                id: prod._id,
                isInWishlist: wishlistProductIds.includes(prod._id.toString())
            };
        });
        res.render('user/user_candle', { products: productsData, currentCategory: 'Chendeliers' });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_ERROR);
    }
};




const loadCandleDetail = async (req, res) => {
  const productId = req.params.id; 
  try {
    const currentProduct = await product.findById(productId); 
    if (!currentProduct) {
      return res.status(404).send("Product not found.");
    }
    const relatedProducts = await product.find({
      category: currentProduct.category,
      _id: { $ne: productId } 
    }).limit(4); 

    let isInWishlist = false;
    let isInCart = false;
    if (req.session.user) {
      const wishlistItem = await Wishlist.findOne({ 
        userId: req.session.user.id, 
        productId: productId 
      });
      isInWishlist = !!wishlistItem;
      const cartItem = await Cart.findOne({
        userId: req.session.user.id,
        productId: productId 
      });
      isInCart = !!cartItem;
    }



    res.render("user/user_candleDetail", { 
      products: currentProduct, 
      relatedProducts ,
      isInWishlist,
      isInCart
    });
  } catch (error) {
    console.error(error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(message.INTERNAL_ERROR);
  }
};





module.exports = {loadProducts,updateProduct,addProduct,deleteProduct,
    loadCandleholderProducts,
    loadCandleDetail,
    loadVaseProducts,
    loadTableLampProducts,
    loadArtifactProducts,
    loadSculptureProducts,
    loadChendelierProducts,
    check_product_exists
}