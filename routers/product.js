import {
  createProduct,
  findProduct,
  getMyProducts,
  getProductDetails,
  getProducts,
  getUserProducts,
} from '../controllers/product.js'
import { isAdmin, isAuth } from '../utils.js'

import express from 'express'

const router = express.Router()
router.get('/', isAuth, getProducts)
router.post('/myProducts', isAuth, getMyProducts)
router.post('/details', isAuth, getProductDetails)
router.post('/user', isAuth, getUserProducts)
router.post('/create', isAuth, createProduct)
router.get('/search/product', isAuth, findProduct)
export default router
