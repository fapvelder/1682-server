import {
  buyProduct,
  cancelOrder,
  completeOrder,
  feedbackOrder,
  getItemOrder,
  getOrderDetails,
  getOrders,
  transferItem,
} from '../controllers/order.js'
import { isAdmin } from '../utils.js'

import express from 'express'

const router = express.Router()
router.get('/', getOrders)
router.post('/details', getOrderDetails)
router.post('/buy', buyProduct)
// router.post('/complete', completeProduct)
router.post('/getItem', getItemOrder)
router.post('/complete', completeOrder)
router.post('/cancel', cancelOrder)
router.post('/feedback', feedbackOrder)
router.post('/transfer', transferItem)
export default router
