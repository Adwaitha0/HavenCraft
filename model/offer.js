const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    offerName: { type: String, required: true },
    type: { type: String, required: true },
    /*categoryOrProduct: { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: 'type', 
      required: true 
    },  */
    categoryOrProduct: { type: String, required: false},
    discountType: { type: String, required: false },
    discountValue: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["Active", "Inactive", "Scheduled"], default: "Scheduled" },
    description: { type: String },
  },
  { timestamps: true }
);
const Offer = mongoose.model('Offer', offerSchema,'offer');

module.exports = Offer;