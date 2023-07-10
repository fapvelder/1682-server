import express from 'express'
import { capturePayment, createOrder, payout } from '../controllers/paypal.js'
import { isAuth } from '../utils.js'

const router = express.Router()
router.post('/my-server/create-paypal-order', isAuth, createOrder)
router.post('/my-server/capture-paypal-order', isAuth, capturePayment)
router.post('/my-server/payout', isAuth, payout)
export default router
