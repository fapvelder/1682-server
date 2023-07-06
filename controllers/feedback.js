import { FeedbackModel, OrderModel } from '../models/order.js'
import { UserModel } from '../models/user.js'

export const getUserFeedback = async (req, res) => {
  try {
    const user = await UserModel.findOne({ slug: req.body.slug })
    const ratingFilter = req.body.rating || '' // Default is an empty string if no query parameter is provided
    const filter = { feedbackOn: user._id }
    if (ratingFilter) {
      filter.rating = ratingFilter
    }
    const feedbacks = await FeedbackModel.find(filter)
      .populate('user', 'displayName fullName')
      .populate({
        path: 'order',
        populate: {
          path: 'product',
          select: 'title',
          populate: { path: 'category', select: 'name' },
        },
      })

    res.status(200).send(feedbacks)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const getFeedback = async (req, res) => {
  try {
    const feedbacks = await FeedbackModel.find({ feedbackOn: req.body.userID })
      .populate('user', 'displayName fullName')
      .populate({
        path: 'order',
        populate: {
          path: 'product',
          select: 'title',
          populate: { path: 'category', select: 'name' },
        },
      })

    res.status(200).send(feedbacks)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
