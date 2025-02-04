const Order = require('../model/order');
const statusCode=require('../controller/statusCode')
const message=require('../controller/statusCode') 
const {StatusCodes,Messages } = require("../controller/statusCode");

const loadSalesReport = async (req, res) => {
    try {
        const orders = await Order.find({ isDeleted: false })
            .populate('userId', 'username')
            .sort({ orderDate: -1 })
            .select('orderId totalPrice payableAmount uniqueOrderId orderDate'); 

        const totalSales = orders.reduce((sum, order) => sum + order.payableAmount, 0);
        const totalDiscount = orders.reduce((sum, order) => sum + (order.totalPrice - order.payableAmount), 0);

        const formattedOrders = orders.map(order => ({
            orderId: order.uniqueOrderId, 
            username: order.userId.username,
            orderDate: order.orderDate.toLocaleDateString(), 
            totalSales: order.totalPrice,
            discountPrice: order.payableAmount,
            discount: order.totalPrice - order.payableAmount,
        }));

        res.render('admin/salesReport', {
            orders: formattedOrders,
            totalSales,
            totalDiscount,
        });
    } catch (error) {
        console.error('Error loading sales report:', error);
        res.status(statusCode.INTERNAL_SERVER_ERROR).send(message.INTERNAL_ERROR);
    }
};


const filterSales = async (req, res) => {
    const { filter, startDate, endDate } = req.query;
    let start, end;

    try {
        if (filter === 'daily') {
            start = new Date();
            start.setHours(0, 0, 0, 0);
            end = new Date();
            end.setHours(23, 59, 59, 999);
        } else if (filter === 'weekly') {
            start = new Date();
            start.setDate(start.getDate() - start.getDay());
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        } else if (filter === 'monthly') {
            start = new Date();
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
        } else if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            return res.redirect('/admin/salesReport'); 
        }

        const orders = await Order.find({
            isDeleted: false, 
            orderDate: { $gte: start, $lte: end },
        })
            .sort({ orderDate: -1 }) 
            .select('orderId username totalPrice uniqueOrderId payableAmount orderDate'); 

        const totalSales = orders.reduce((sum, order) => sum + order.payableAmount, 0);
        const totalDiscount = orders.reduce((sum, order) => sum + (order.totalPrice - order.payableAmount), 0);

        const formattedOrders = orders.map(order => ({
            orderId: order.uniqueOrderId,
            username: order.username,
            orderDate: order.orderDate.toLocaleDateString(), 
            totalSales: order.totalPrice,
            discountPrice: order.payableAmount,
            discount: order.totalPrice - order.payableAmount,
        }));

        res.render('admin/salesReport', {
            orders: formattedOrders,
            totalSales,
            totalDiscount,
        });
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).send('An error occurred while loading the filtered sales report.');
    }
};



const generatePDF=async (req, res) => {
    const { salesData } = req.body;

    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
        res.send(pdfBuffer);
    });

    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.moveDown();

    salesData.forEach((sale, index) => {
        doc.fontSize(12).text(`${index + 1}. ${sale.item} - $${sale.amount}`);
    });

    doc.end();
}



const getTopSellingProducts = async (req, res) => {
    try {
      const topProducts = await Order.aggregate([
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.productId",
            totalSales: { $sum: "$products.quantity" },
          },
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "product", 
            localField: "_id",
            foreignField: "_id", 
            as: "productDetails", 
          },
        },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            totalSales: 1,
            productDetails: 1,
          },
        },
      ]);
      res.status(200).json(topProducts); 
    } catch (error) {
      console.error("Error fetching top-selling products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };


  const getCategorySales = async (req, res) => {
    try {
      const categorySales = await Order.aggregate([
        { $unwind: "$products" },
        {
          $lookup: {
            from: "product", 
            localField: "products.productId", 
            foreignField: "_id", 
            as: "productDetails", 
          },
        },
        { $unwind: "$productDetails" },
        {
          $lookup: {
            from: "category", 
            localField: "productDetails.category",
            foreignField: "name",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        {
          $group: {
            _id: "$categoryDetails.name", 
            totalSales: { $sum: "$products.quantity" }, 
          },
        },
        { $sort: { totalSales: -1 } },
      ]);
  
      console.log('Category Sales:', JSON.stringify(categorySales, null, 2));
      res.status(200).json(categorySales);
    } catch (error) {
      console.error("Error fetching category sales:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  
  





module.exports = { loadSalesReport,
    filterSales,
    generatePDF,
    getTopSellingProducts,
    getCategorySales
 };
