import { OrderModel } from '../models/order.js'
import { ProductModel } from '../models/product.js'
import { UserModel } from '../models/user.js'
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
      .populate('buyer', 'fullName displayName slug')
      .populate('seller', 'fullName displayName slug')
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
      .populate('buyer', 'fullName displayName slug')
      .populate('seller', 'fullName displayName slug')
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
    user.wallet -= product.price

    // Create the order
    const order = new OrderModel({
      product: req.body.productID,
      seller: product.listingBy,
      buyer: req.body.userID,
      status: 'Pending',
    })

    await Promise.all([product.save(), user.save(), order.save()])

    res.status(200).send('Product purchased successfully')
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}
export const completeProduct = async (req, res) => {
  try {
    const product = await ProductModel.findOne({ _id: req.body.productID })
    if (product.purchaseBy === req.body.userID) {
      product.status = 'Completed'
      await product.save()
      res.status(200).send({ message: 'Thanks for your purchase' })
    } else {
      res.status(403).send({ message: 'You are not purchaser of this product' })
    }
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}
