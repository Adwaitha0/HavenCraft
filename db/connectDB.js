require('dotenv').config()

// const mongoose=require('mongoose')


// const connectDB=async()=>{
//     try{
//         const conn=await mongoose.connect('mongodb://localhost:27017/project',{});
//         console.log(`MongoDB Connected: ${conn.connection.host}`);
//     }catch(error){
//         console.log(error);
//         process.exit(1);
//     }
// };

// module.exports=connectDB



const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected to Atlas!");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    }
};

module.exports = connectDB;
