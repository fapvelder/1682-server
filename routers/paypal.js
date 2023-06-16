import express from 'express'
import { capturePayment, createOrder, payout } from '../controllers/paypal.js'

const router = express.Router()
router.post('/my-server/create-paypal-order', createOrder)
router.post('/my-server/capture-paypal-order', capturePayment)
router.post('/my-server/payout', payout)
export default router
