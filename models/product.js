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
    sellBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: mongoose.Schema.Types.Mixed, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    gameTitle: {
      type: String,
    },
    platform: { type: Schema.Types.ObjectId, ref: 'Platform', required: true },
    // regionRestriction: { type: String, required: true },
    // currency: { type: String, required: true },
    price: { type: Number, required: true },
    // expiration: { type: String, required: true },
    visibility: { type: String, required: true },
    photos: { type: [String], required: true },
    // discount: [discountSchema],
    // delivery: [deliverySchema],
    deliveryMethod: {
      type: String,
      required: true,
    },
    deliveryIn: { type: String, required: false },
    digitalCode: { type: String, required: false },
    status: { type: String, required: true, default: 'On Sale' },
    productFeedback: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' },
    ],
  },
  { timestamps: true }
)
export const ProductModel = mongoose.model('Product', productSchema)
