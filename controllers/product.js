import { ProductModel } from '../models/Product.js'
import { CategoryModel } from '../models/category.js'
import { UserModel } from '../models/user.js'

export const getProducts = async (req, res) => {
  try {
    const products = await ProductModel.find({})
    res.status(200).send(products)
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}
export const getProductDetails = async (req, res) => {
  try {
    const product = await ProductModel.findOne({ _id: req.body._id })
      .populate('sellBy', 'slug fullName displayName avatar')
      .populate('category')
      .populate('platform')
    res.status(200).send(product)
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}
export const getUserProducts = async (req, res) => {
  try {
    const user = await UserModel.findOne({ slug: req.body.slug })
    const products = await ProductModel.find({ sellBy: user._id })
      .populate('sellBy', 'slug fullName displayName avatar')
      .populate('category')
      .populate('platform')
    if (user) {
      res.status(200).send(products)
    } else {
      res.status(404).send({ message: 'User not found' })
    }
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}
export const createProduct = async (req, res) => {
  try {
    const body = req.body
    const category = await CategoryModel.findOne({
      name: body.category,
    }).exec()
    const subCategory = category.subCategory.find(
      (sub) => sub.title === body.gameTitle
    )
    const product = ProductModel({
      sellBy: body.userID,
      title: body.title,
      description: body.description,
      category: category._id,
      platform: subCategory.subCategoryName,
      gameTitle: subCategory.title,
      photos: body.url,
      price: body.price,
      visibility: body.visibility,
      deliveryMethod: body.deliveryMethod,
      deliveryIn: body.deliveryIn,
    })
    await product.save()
    res.status(200).send(product)
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}
