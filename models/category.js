import mongoose from 'mongoose'
const Schema = mongoose.Schema

const subCategorySchema = new mongoose.Schema({
  subCategoryName: { type: Schema.Types.ObjectId, ref: 'Platform' },
  title: { type: String, required: false },
  image: { type: String, required: false },
})

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  categoryDesc: { type: String, required: true },
  subCategory: [subCategorySchema],
})
export const CategoryModel = mongoose.model('Category', categorySchema)
export const SubCategory = mongoose.model('SubCategory', subCategorySchema)
