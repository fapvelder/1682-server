import {
  buyProduct,
  completeProduct,
  getOrderDetails,
  getOrders,
} from '../controllers/order.js'
import { isAdmin } from '../utils.js'

import express from 'express'

const router = express.Router()
router.get('/', getOrders)
router.get('/details', getOrderDetails)
router.post('/buy', buyProduct)
router.post('/complete', completeProduct)

export default router
