import { FeedbackModel, OrderModel } from '../models/order.js'
import { ProductModel } from '../models/product.js'
import { UserModel } from '../models/user.js'
import { sendNotification } from './notification.js'
import { getSteamItem, sendSteamItem, test } from './steam.js'
import { ObjectId } from 'mongodb'
export const getOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find({})
      .populate({
        path: 'product',
        populate: [
          { path: 'category', model: 'Category' },
          { path: 'platform', model: 'Platform' },
        ],
      })
      .populate('buyer', 'fullName displayName slug avatar')
      .populate('seller', 'fullName displayName slug avatar')
    res.status(200).send(orders)
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}
export const getOrderDetails = async (req, res) => {
  try {
    const orderID = req.body.orderID
    const order = await OrderModel.findOne({ _id: orderID })
      .populate({
        path: 'product',
        populate: [
          { path: 'category', model: 'Category' },
          { path: 'platform', model: 'Platform' },
        ],
      })
      .populate('buyer', 'fullName displayName slug avatar')
      .populate('seller', 'fullName displayName slug avatar')
    res.status(200).send(order)
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}

export const buyProduct = async (req, res) => {
  try {
    const product = await ProductModel.findOne({ _id: req.body.productID })
    const user = await UserModel.findOne({ _id: req.body.userID })
    if (!product) {
      return res.status(404).send({ message: 'Product not found' })
    }
    if (product.listingBy._id === req.body.userID) {
      return res
        .status(403)
        .send({ message: 'Product cannot be purchased by the owner' })
    }
    // if (!product.isAvailable) {
    //   return res
    //     .status(403)
    //     .send({ message: 'Product has already been purchased' })
    // }
    if (Number(user.wallet) < Number(product.price)) {
      return res.status(403).send({ message: 'User funds are insufficient' })
    }

    // Update product and user data
    product.isAvailable = false
    user.wallet -= product.price

    // Create the order
    const order = new OrderModel({
      product: req.body.productID,
      seller: product.listingBy,
      buyer: req.body.userID,
      status: 'Pending',
      isBotSent: false,
      isFeedback: false,
    })

    // await Promise.all([product.save(), user.save(), order.save()])

    res.status(200).send('Product purchased successfully')
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}
// export const completeProduct = async (req, res) => {
//   try {
//     const product = await ProductModel.findOne({ _id: req.body.productID })
//     if (product.purchaseBy === req.body.userID) {
//       product.status = 'Completed'
//       await product.save()
//       res.status(200).send({ message: 'Thanks for your purchase' })
//     } else {
//       res.status(403).send({ message: 'You are not purchaser of this product' })
//     }
//   } catch (err) {
//     res.status(500).send({ error: err.message })
//   }
// }
export const getItemOrder = async (req, res) => {
  try {
    const order = await OrderModel.findOne({ _id: req.body.orderID })
    if (!order) {
      return res.status(404).send({ message: 'Order not found' })
    }
    if (order.isBotSent) {
      return res
        .status(403)
        .send({ message: 'Trade offer has been accepted to you' })
    }
    if (order.seller._id.toString() !== req.body.userID) {
      return res
        .status(403)
        .send({ message: 'You do not have permission to do this' })
    }
    if (order.buyer._id.toString() !== req.body.receiverID) {
      return res
        .status(403)
        .send({ message: 'You do not have permission to do this' })
    }
    const orderStatus = await sendSteamItem(req)
    if (orderStatus === 'ACCEPTED') {
      order.isBotSent = true
      await order.save()
      res.status(200).send('Trade offer has been accepted')
    } else if (orderStatus === 'DENIED') {
      res.status(403).send({ message: 'Trade offer has been denied' })
    }
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}
export const completeOrder = async (req, res) => {
  try {
    const order = await OrderModel.findOne({ _id: req.body.orderID })
    if (!order) {
      return res.status(404).send({ message: 'Order not found' })
    }
    if (order.buyer._id.toString() !== req.body.userID) {
      return res
        .status(403)
        .send({ message: 'You do not have permission to do this' })
    }
    order.status = 'Completed'
    await order.save()
    res.status(200).send('Order is completed')
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}
export const feedbackOrder = async (req, res) => {
  try {
    const order = await OrderModel.findOne({ _id: req.body.orderID })
    if (order.isFeedback) {
      return res.status(403).send({ message: 'Order has been feedback' })
    }
    const feedback = new FeedbackModel({
      order: req.body.orderID,
      user: order.buyer._id,
      feedbackOn: order.seller._id,
      comment: req.body.feedback,
      rating: req.body.rating,
    })
    order.isFeedback = true
    await order.save()
    await feedback.save()
    res.status(200).send({ message: 'Feedback has been saved' })
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}
