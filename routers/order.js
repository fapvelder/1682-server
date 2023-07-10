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
import { isAuth } from '../utils.js'

import express from 'express'

const router = express.Router()
router.get('/', isAuth, getOrders)
router.post('/details', isAuth, getOrderDetails)
router.post('/buy', isAuth, buyProduct)
// router.post('/complete', completeProduct)
router.post('/getItem', isAuth, getItemOrder)
router.post('/complete', isAuth, completeOrder)
router.post('/cancel', isAuth, cancelOrder)
router.post('/feedback', isAuth, feedbackOrder)
router.post('/transfer', isAuth, transferItem)
export default router
