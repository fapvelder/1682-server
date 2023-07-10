import {
  createCategorySchema,
  createSubCategorySchema,
  deleteCategorySchema,
  deleteSubCategorySchema,
} from '../helpers/validation_schema.js'
import { CategoryModel } from '../models/category.js'
import { PlatformModel } from '../models/platform.js'
import { v2 as cloudinary } from 'cloudinary'
export const getCategory = async (req, res) => {
  try {
    const category = await CategoryModel.find({})
      .populate('subCategory.subCategoryName')
      .lean()
    res.status(200).send(category)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const createCategory = async (req, res, next) => {
  try {
    await createCategorySchema.validateAsync(req.body)
    const fileStr = req.body.img
    let imgURL
    if (fileStr) {
      const uploadedResponse = await cloudinary.uploader.upload(fileStr)
      imgURL = uploadedResponse.url
    }
    const newCategory = {
      name: req.body.name,
      image: imgURL,
      categoryDesc: req.body.categoryDesc,
    }
    const category = new CategoryModel(newCategory)

    await category.save()
    res.status(200).json(category)
  } catch (err) {
    if (err.isJoi === true) {
      res.status(422).send({ message: `${err.details[0].message}` })
    }
    next(err)
  }
}
export const deleteCategory = async (req, res) => {
  try {
    await deleteCategorySchema.validateAsync(req.params)
    const deleteCategory = req.params.id
    const category = await CategoryModel.findByIdAndDelete(deleteCategory, {
      new: true,
    })
    res.status(200).send(category)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const updateCategory = async (req, res, next) => {
  try {
    const updateCategory = req.body
    const category = await CategoryModel.findByIdAndUpdate(
      { _id: updateCategory._id },
      updateCategory,
      { new: true }
    )
    res.status(200).json(category)
  } catch (err) {
    if (err.isJoi === true) {
      res.status(422).send({ message: `${err.details[0].message}` })
    }
    next(err)
  }
}
// subcate
export const createSubCategory = async (req, res) => {
  try {
    await createSubCategorySchema.validateAsync(req.body)
    const fileStr = req.body.img
    let imgURL
    if (fileStr) {
      const uploadedResponse = await cloudinary.uploader.upload(fileStr)
      imgURL = uploadedResponse.url
    }
    const newSubCategory = {
      subCategoryName: req.body.subCategory,
      title: req.body.title,
      image: imgURL,
    }
    const category = await CategoryModel.findOneAndUpdate(
      { _id: req.body.categoryID },
      { $push: { subCategory: newSubCategory } },
      { new: true }
    )

    if (category) {
      res
        .status(200)
        .send({ message: 'SubCategory updated', category: category })
    } else {
      res.status(404).send({ message: 'Category not found' })
    }
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const deleteSubCategory = async (req, res, next) => {
  try {
    await deleteSubCategorySchema.validateAsync(req.body)
    const category = await CategoryModel.updateOne(
      { _id: req.body.categoryID },
      { $pull: { subCategory: { _id: req.body.subCategoryID } } },
      { new: true }
    )
    if (category) {
      res
        .status(200)
        .send({ message: 'SubCategory updated', category: category })
    } else {
      res.status(404).send({ message: 'Category not found' })
    }
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
