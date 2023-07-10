import {
  createCommentSchema,
  getCommentByProductIDSchema,
} from '../helpers/validation_schema.js'
import { CommentModel } from '../models/comment.js'

export const createComment = async (req, res) => {
  try {
    await createCommentSchema.validateAsync(req.body)
    const comment = await CommentModel({
      commenter: req.body.userID,
      comment: req.body.comment,
      product: req.body.productID,
    })
    await comment.save()
    res.status(200).send('Comment successfully')
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const getCommentByProductID = async (req, res) => {
  try {
    await getCommentByProductIDSchema.validateAsync(req.body)
    const comments = await CommentModel.find({
      product: req.body.productID,
    })
      .populate('commenter', 'slug fullName displayName avatar')
      .sort({ createdAt: -1 })
      .exec()
    res.status(200).send(comments)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
