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
      .populate('buyer', 'fullName displayName slug avatar profile')
      .populate('seller', 'fullName displayName slug avatar profile')
      .sort({ createdAt: -1 })
    res.status(200).send(orders)
  } catch (err) {
    res.status(500).send({ message: err.message })
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
      .populate('buyer', 'fullName displayName slug avatar profile')
      .populate('seller', 'fullName displayName slug avatar profile')
    res.status(200).send(order)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}

export const buyProduct = async (req, res) => {
  try {
    const product = await ProductModel.findOne({ _id: req.body.productID })
    const user = await UserModel.findOne({ _id: req.body.userID })
    if (!user.profile.steam.steamTradeURL) {
      return res
        .status(403)
        .send({ message: 'You must login via Steam first.' })
    }
    if (!product) {
      return res.status(404).send({ message: 'Product not found' })
    }
    if (product.listingBy._id === req.body.userID) {
      return res
        .status(403)
        .send({ message: 'Product cannot be purchased by the owner' })
    }
    if (!product.isAvailable) {
      return res
        .status(403)
        .send({ message: 'Product has already been purchased' })
    }
    if (Number(user.wallet) < Number(product.price)) {
      return res.status(403).send({ message: 'User funds are insufficient' })
    }

    // Update product and user data
    product.isAvailable = false
    product.status = 'Sold'
    user.wallet -= product.price

    // Create the order
    const order = new OrderModel({
      product: req.body.productID,
      seller: product.listingBy,
      buyer: req.body.userID,
      status: 'Pending',
      isBotSent: false,
      isFeedback: false,
      isTransfer: false,
    })

    await Promise.all([product.save(), user.save(), order.save()])

    res.status(200).send(order)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}

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
    res.status(500).send({ message: err.message })
  }
}
export const completeOrder = async (req, res) => {
  try {
    const order = await OrderModel.findOne({ _id: req.body.orderID }).populate(
      'product'
    )
    if (!order) {
      return res.status(404).send({ message: 'Order not found' })
    }
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res
        .status(403)
        .send({ message: 'Order has been completed or cancelled' })
    }
    if (order.buyer._id.toString() !== req.body.userID) {
      return res
        .status(403)
        .send({ message: 'You do not have permission to do this' })
    }
    const product = await ProductModel.findOne({ _id: order.product._id })
    const user = await UserModel.findOne({ _id: order.seller._id })
    order.status = 'Completed'
    product.status = 'Completed'
    user.wallet += Number(order.product.price * 0.9)
    await order.save()
    await product.save()
    await user.save()
    res.status(200).send('Order is completed')
  } catch (err) {
    res.status(500).send({ message: err.message })
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
    res.status(500).send({ message: err.message })
  }
}
export const transferItem = async (req, res) => {
  try {
    const order = await OrderModel.findOne({ _id: req.body.orderID }).populate({
      path: 'product',
      populate: [
        { path: 'category', model: 'Category' },
        { path: 'platform', model: 'Platform' },
      ],
    })
    if (!order) {
      return res.status(404).send({ message: 'Order not found' })
    }
    if (order.seller._id.toString() !== req.body.userID) {
      return res
        .status(403)
        .send({ message: 'You do not have permission to do this' })
    }
    console.log(req.body)
    if (order.product.category.name !== 'Game Items') {
      if (req.body.code === '') {
        return res
          .status(403)
          .send({ message: 'You did not provide digital or key code' })
      }
      const product = await ProductModel.findOne({ _id: order.product._id })
      product.digitalCode = req.body.code
      await product.save()
    }
    order.isTransfer = true
    await order.save()
    res.status(200).send({ message: 'Item has been transferred successfully' })
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const cancelOrder = async (req, res) => {
  try {
    const order = await OrderModel.findOne({ _id: req.body.orderID }).populate(
      'product'
    )
    console.log(order)

    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res
        .status(403)
        .send({ message: 'Order has been completed or cancelled' })
    }
    if (order.buyer._id.toString() !== req.body.userID) {
      return res
        .status(403)
        .send({ message: 'You do not have permission to do this' })
    }
    if (!order) {
      return res.status(404).send({ message: 'Order not found' })
    }
    const product = await ProductModel.findOne({ _id: order.product._id })
    const user = await UserModel.findOne({ _id: order.buyer._id })
    product.isAvailable = true
    product.status = 'On Sale'
    user.wallet += Number(order.product.price)
    order.status = 'Cancelled'
    await user.save()
    await order.save()
    await product.save()
    res.send({ message: 'Order has been cancelled' })
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
