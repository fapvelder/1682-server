import express from 'express'
import {
  VNPayReturn,
  checkVNPayTransaction,
  createPaymentURL,
} from '../controllers/vnpay.js'
import { isAuth } from '../utils.js'

const router = express.Router()

router.post('/create-url', isAuth, createPaymentURL)
router.post('/transaction', isAuth, checkVNPayTransaction)
router.get('/vnpay_return', isAuth, VNPayReturn)
export default router
