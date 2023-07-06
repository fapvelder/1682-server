import mongoose from 'mongoose'

const discountSchema = mongoose.Schema({
  code: { type: String, required: true },
  amount: { type: Number, required: true },
})
const feedbackSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  feedbackOn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: { type: String, required: true },
  comment: {
    type: String,
    required: false,
  },
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
    isBotSent: { type: Boolean },
    isTransfer: { type: Boolean },
    isFeedback: { type: Boolean },
  },
  { timestamps: true }
)

export const OrderModel = mongoose.model('Order', orderSchema)
export const FeedbackModel = mongoose.model('Feedback', feedbackSchema)
