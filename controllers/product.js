import { ProductModel } from '../models/product.js'
import { CategoryModel } from '../models/category.js'
import { UserModel } from '../models/user.js'
import { v2 as cloudinary } from 'cloudinary'
import {
  createProductSchema,
  findProductSchema,
} from '../helpers/validation_schema.js'

export const getProducts = async (req, res) => {
  try {
    const products = await ProductModel.find({}).sort({ createdAt: -1 })
    res.status(200).send(products)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const getMyProducts = async (req, res) => {
  try {
    const products = await ProductModel.find({ listingBy: req.body.userID })
      .populate('listingBy', 'slug fullName displayName avatar')
      .populate('category')
      .populate('platform')
      .sort({ createdAt: -1 })
    res.status(200).send(products)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const getProductDetails = async (req, res) => {
  try {
    const product = await ProductModel.findOne({ _id: req.body._id })
      .populate('listingBy', 'slug fullName displayName avatar')
      .populate('category')
      .populate('platform')
    res.status(200).send(product)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const getUserProducts = async (req, res) => {
  try {
    const user = await UserModel.findOne({ slug: req.body.slug })
    const products = await ProductModel.find({ listingBy: user._id })
      .populate('listingBy', 'slug fullName displayName avatar')
      .populate('category')
      .populate('platform')
      .sort({ createdAt: -1 })
    if (user) {
      res.status(200).send(products)
    } else {
      res.status(404).send({ message: 'User not found' })
    }
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const createProduct = async (req, res) => {
  try {
    await createProductSchema.validateAsync(req.body)
    const body = req.body
    const category = await CategoryModel.findOne({ name: body.category }).exec()
    const subCategory = category.subCategory.find(
      (sub) => sub.title === body.gameTitle || sub.title === body.subCategory
    )
    let allPhotos = []

    if (body.url.length > 0) {
      let photoUrl
      if (typeof body.url === 'string' && body.url.startsWith('https://')) {
        photoUrl = body.url
      } else {
        if (body.url.length > 5) {
          return res
            .status(403)
            .send({ message: 'Cannot list more than 5 photos' })
        }
        for (const item of body.url) {
          const uploadedResponse = await cloudinary.uploader.upload(item)
          photoUrl = uploadedResponse.url
        }
      }
      allPhotos.push(photoUrl)
    }
    const product = ProductModel({
      listingBy: body.userID,
      title: body.title,
      description: body.description,
      category: category._id,
      platform: subCategory.subCategoryName,
      gameTitle: subCategory.title,
      photos: allPhotos,
      price: body.price,
      visibility: body.visibility,
      deliveryMethod: body.deliveryMethod,
      deliveryIn: body.deliveryIn,
      isAvailable: true,
      status: 'On Sale',
    })

    if (body.deliveryMethod === 'Bot') {
      product.item = body.item
    } else if (body.deliveryMethod === 'Auto') {
      product.digitalCode = body.code
    }
    await product.save()
    res.status(200).send('Product created successfully')
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const findProduct = async (req, res) => {
  try {
    await findProductSchema.validateAsync(req.query)
    const {
      search,
      category,
      subCategory,
      platform,
      isAvailable,
      min,
      max,
      page,
      pageSize,
    } = req.query

    const filter = {}

    if (search) {
      const regex = new RegExp(search, 'i')
      filter.title = { $regex: regex }
    }

    if (category) {
      filter.category = category
    }

    if (subCategory) {
      if (subCategory === '') {
        filter.gameTitle = { $exists: true } // Filter products with any subcategory
      } else {
        filter.gameTitle = subCategory // Filter by subcategory ID
      }
    }
    if (platform) {
      filter.platform = platform
    }

    if (isAvailable === 'true' || isAvailable === 'false') {
      filter.isAvailable = isAvailable === 'true'
    }

    if (min && !isNaN(min)) {
      filter.price = { $gte: parseFloat(min) }
    }

    if (max && !isNaN(max)) {
      filter.price = { ...filter.price, $lte: parseFloat(max) }
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize)

    let query = ProductModel.find(filter)
      .populate('listingBy', 'slug fullName displayName avatar')
      .populate('category')
      .populate('platform')
      .sort({ createdAt: -1 })

    const totalDocs = await ProductModel.countDocuments(filter)

    let products = await query.exec()
    products = products.slice(skip, skip + parseInt(pageSize))

    res.send({
      products,
      totalDocs,
      totalPages: Math.ceil(totalDocs / parseInt(pageSize)),
      currentPage: parseInt(page),
    })
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const editProduct = async (req, res) => {
  try {
    const product = await ProductModel.findOne({ _id: req.body.productID })
    if (!product) {
      return res.status(404).send({ message: 'Product not found' })
    }
    if (product.listingBy._id.toString() !== req.body.userID) {
      return res
        .status(403)
        .send({ message: 'You do not have permission to do this' })
    }
    product.title = req.body.title || product.title
    product.description = req.body.description || product.description
    product.price = req.body.price || product.price
    product.visibility = req.body.visibility || product.visibility
    await product.save()
    res.status(200).send({ message: 'Edit product successfully' })
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
