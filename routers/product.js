import {
  createProduct,
  editProduct,
  findProduct,
  getMyProducts,
  getProductDetails,
  getProducts,
  getUserProducts,
} from '../controllers/product.js'
import { isAdmin, isAuth } from '../utils.js'

import express from 'express'

const router = express.Router()
router.get('/', getProducts)
router.post('/myProducts', getMyProducts)
router.post('/details', getProductDetails)
router.post('/user', getUserProducts)
router.post('/create', isAuth, createProduct)
router.post('/edit', isAuth, editProduct)
router.get('/search/product', findProduct)
export default router
