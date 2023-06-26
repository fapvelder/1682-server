import mongoose from 'mongoose'
const Schema = mongoose.Schema
// const deliverySchema = mongoose.Schema({
//   deliveryMethod: {
//     type: String,
//     required: true,
//   },
//   deliveryIn: { type: String, required: false },
//   digitalCode: { type: String, required: false },
// })
const discountSchema = mongoose.Schema({
  code: { type: String, required: true },
  amount: { type: Number, required: true },
})
const productSchema = new mongoose.Schema(
  {
    listingBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // purchaseBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    title: { type: String, required: true },
    description: { type: mongoose.Schema.Types.Mixed, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    gameTitle: {
      type: String,
    },
    platform: { type: Schema.Types.ObjectId, ref: 'Platform', required: true },

    price: { type: Number, required: true },
    visibility: { type: String, required: true },
    photos: { type: [String], required: true },
    // discount: [discountSchema],
    // delivery: [deliverySchema],
    deliveryMethod: {
      type: String,
      required: true,
    },
    deliveryIn: { type: String, required: true },
    item: { type: mongoose.Schema.Types.Mixed, required: false },
    digitalCode: { type: String, required: false },
    productFeedback: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' },
    ],
    isAvailable: { type: Boolean, required: true },
  },
  { timestamps: true }
)
export const ProductModel = mongoose.model('Product', productSchema)
