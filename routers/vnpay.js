import express from 'express'
import {
  VNPayReturn,
  checkVNPayTransaction,
  createPaymentURL,
} from '../controllers/vnpay.js'
import { isAuth } from '../utils.js'

const router = express.Router()

router.post('/create-url', createPaymentURL)
router.post('/transaction', checkVNPayTransaction)
router.get('/vnpay_return', VNPayReturn)
export default router
