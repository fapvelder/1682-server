import { CommentModel } from '../models/comment.js'

export const createComment = async (req, res) => {
  try {
    const comment = await CommentModel({
      commenter: req.body.userID,
      comment: req.body.comment,
      product: req.body.productID,
    })
    await comment.save()
    res.status(200).send('Comment successfully ')
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const getCommentByProductID = async (req, res) => {
  try {
    const comments = await CommentModel.find({
      product: req.body.productID,
    }).populate('commenter', 'slug fullName displayName avatar')
    res.status(200).send(comments)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
