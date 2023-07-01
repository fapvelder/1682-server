import { ProductModel } from '../models/product.js'
import { CategoryModel } from '../models/category.js'
import { UserModel } from '../models/user.js'
import { v2 as cloudinary } from 'cloudinary'

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
      .populate('listingBy', 'slug fullName displayName avatar')
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
    const products = await ProductModel.find({ listingBy: user._id })
      .populate('listingBy', 'slug fullName displayName avatar')
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
    const category = await CategoryModel.findOne({ name: body.category }).exec()
    const subCategory = category.subCategory.find(
      (sub) => sub.title === body.gameTitle || sub.title === body.subCategory
    )
    let allPhotos = []
    if (body.url.length > 5) {
      return res.status(403).send({ message: 'Cannot list more than 5 photos' })
    }
    if (body.url.length > 0) {
      let photoUrl
      if (typeof body.url === 'string' && body.url.startsWith('https://')) {
        photoUrl = body.url
      } else {
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
    })

    if (body.deliveryMethod === 'Bot') {
      product.item = body.item
    } else if (body.deliveryMethod === 'Auto') {
      product.digitalCode = body.code
    }
    await product.save()
    res.status(200).send('Product created successfully')
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
}

// export const createProduct = async (req, res) => {
//   try {
//     const body = req.body
//     const category = await CategoryModel.findOne({
//       name: body.category,
//     }).exec()
//     const subCategory = category.subCategory.find(
//       (sub) => sub.title === body.gameTitle || sub.title === body.subCategory
//     )

//     if (body.deliveryMethod === 'Bot') {
//       const product = ProductModel({
//         listingBy: body.userID,
//         title: body.title,
//         description: body.description,
//         category: category._id,
//         platform: subCategory.subCategoryName,
//         gameTitle: subCategory.title,
//         photos: body.url,
//         price: body.price,
//         visibility: body.visibility,
//         deliveryMethod: body.deliveryMethod,
//         deliveryIn: body.deliveryIn,
//         item: body.item,
//         isAvailable: true,
//       })
//       await product.save()
//       res.status(200).send('Product created successfully')
//     } else if (body.deliverMethod === 'Auto') {
//       let allPhotos = []
//       if (body.url.length > 0) {
//         for (const item of body.url) {
//           const uploadedResponse = await cloudinary.uploader.upload(item)
//           allPhotos.push(uploadedResponse.url)
//         }
//       }
//       const product = ProductModel({
//         listingBy: body.userID,
//         title: body.title,
//         description: body.description,
//         category: category._id,
//         platform: subCategory.subCategoryName,
//         gameTitle: subCategory.title,
//         photos: allPhotos,
//         price: body.price,
//         visibility: body.visibility,
//         deliveryMethod: body.deliveryMethod,
//         deliveryIn: body.deliveryIn,
//         isAvailable: true,
//         digitalCode: body.code,
//       })
//       console.log(product)
//       // await product.save()
//     } else {
//       let allPhotos = []
//       if (body.url.length > 0) {
//         for (const item of body.url) {
//           const uploadedResponse = await cloudinary.uploader.upload(item)
//           allPhotos.push(uploadedResponse.url)
//         }
//       }
//       const product = ProductModel({
//         listingBy: body.userID,
//         title: body.title,
//         description: body.description,
//         category: category._id,
//         platform: subCategory.subCategoryName,
//         gameTitle: subCategory.title,
//         photos: allPhotos,
//         price: body.price,
//         visibility: body.visibility,
//         deliveryMethod: body.deliveryMethod,
//         deliveryIn: body.deliveryIn,
//         isAvailable: true,
//       })
//       await product.save()
//       res.status(200).send('Product created successfully')
//     }
//   } catch (err) {
//     res.status(500).send({ error: err.message })
//   }
// }
