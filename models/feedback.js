import mongoose from 'mongoose'
const Schema = mongoose.Schema
const feedbackSchema = new mongoose.Schema({
  reviewerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: String, required: true },
  comment: { type: String, required: true },
})
export const FeedbackModel = mongoose.model('Feedback', feedbackSchema)
