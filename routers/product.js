import {
  createProduct,
  getProductDetails,
  getProducts,
  getUserProducts,
} from '../controllers/product.js'
import { isAdmin } from '../utils.js'

import express from 'express'

const router = express.Router()
router.get('/', getProducts)
router.post('/details', getProductDetails)
router.post('/user', getUserProducts)
router.post('/create', createProduct)

export default router
