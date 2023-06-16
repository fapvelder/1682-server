import { isAdmin, isAuth } from '../utils.js'
import {
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  getCategory,
  updateCategory,
} from '../controllers/category.js'
import express from 'express'

const router = express.Router()
router.get('/', getCategory)
router.post('/create', createCategory)
router.delete('/delete/:id', isAdmin, deleteCategory)
router.put('/update', isAdmin, updateCategory)
router.put('/update/subCategory', isAuth, createSubCategory)
router.put('/delete/subCategory', isAuth, deleteSubCategory)

export default router
