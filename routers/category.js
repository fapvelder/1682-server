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
router.get('/', isAuth, getCategory)
router.post('/create', isAdmin, createCategory)
router.delete('/delete/:id', isAdmin, deleteCategory)
router.put('/update', isAdmin, updateCategory)
router.put('/update/subCategory', isAdmin, createSubCategory)
router.put('/delete/subCategory', isAdmin, deleteSubCategory)

export default router
