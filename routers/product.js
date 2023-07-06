import {
  createProduct,
  findProduct,
  getMyProducts,
  getProductDetails,
  getProducts,
  getUserProducts,
} from '../controllers/product.js'
import { isAdmin } from '../utils.js'

import express from 'express'

const router = express.Router()
router.get('/', getProducts)
router.post('/myProducts', getMyProducts)
router.post('/details', getProductDetails)
router.post('/user', getUserProducts)
router.post('/create', createProduct)
router.get('/search/product', findProduct)
export default router
