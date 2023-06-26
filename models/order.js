import mongoose from 'mongoose'

const discountSchema = mongoose.Schema({
  code: { type: String, required: true },
  amount: { type: Number, required: true },
})
const orderSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    // discount: [discountSchema],
    // expiration: { type: String, required: true },
    // regionRestriction: { type: String, required: true },
    // currency: { type: String, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true }
)

export const OrderModel = mongoose.model('Order', orderSchema)
