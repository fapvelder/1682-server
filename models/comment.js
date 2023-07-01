import mongoose from 'mongoose'
const Schema = mongoose.Schema
const commentSchema = new mongoose.Schema(
  {
    commenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)
export const CommentModel = mongoose.model('Comment', commentSchema)
