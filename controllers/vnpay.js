import moment from 'moment'
import querystring from 'qs'
import crypto from 'crypto'
import request from 'request'
import { UserModel } from '../models/user.js'
import { createPaymentURLSchema } from '../helpers/validation_schema.js'
export const createPaymentURL = async (req, res) => {
  await createPaymentURLSchema.validateAsync(req.body)
  const user = await UserModel.findOne({ _id: req.body.userID })
  if (user) {
    let date = new Date()
    let createDate = moment(date).format('YYYYMMDDHHmmss')
    let ipAddr =
      req?.headers['x-forwarded-for'] ||
      req?.connection.remoteAddress ||
      req?.socket.remoteAddress ||
      req?.connection?.socket?.remoteAddress
    let tmnCode = process.env.vnp_TmnCode
    let secretKey = process.env.vnp_HashSecret
    let vnpUrl = process.env.vnp_Url
    let returnUrl = process.env.vnp_ReturnUrl
    let orderId = moment(date).format('DDHHmmss')
    let amount = req.body.amount
    let bankCode = req.body.bankCode || ''
    let locale = req.body.language || 'vn'
    if (locale === null || locale === '') {
      locale = 'vn'
    }
    let currCode = 'VND'
    let vnp_Params = {}
    vnp_Params['vnp_Version'] = '2.1.0'
    vnp_Params['vnp_Command'] = 'pay'
    vnp_Params['vnp_TmnCode'] = tmnCode
    vnp_Params['vnp_Locale'] = locale
    vnp_Params['vnp_CurrCode'] = currCode
    vnp_Params['vnp_TxnRef'] = orderId
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId
    vnp_Params['vnp_OrderType'] = 'other'
    vnp_Params['vnp_Amount'] = amount * 100
    vnp_Params['vnp_ReturnUrl'] = returnUrl
    vnp_Params['vnp_IpAddr'] = ipAddr
    vnp_Params['vnp_CreateDate'] = createDate
    if (bankCode !== null && bankCode !== '') {
      vnp_Params['vnp_BankCode'] = bankCode
    }
    let vnp_TxnRef = vnp_Params['vnp_TxnRef']
    let vnp_TransactionDate = vnp_Params['vnp_CreateDate']
    let vnp_IpAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress
    vnp_Params = sortObject(vnp_Params)

    let signData = querystring.stringify(vnp_Params, { encode: false })
    let hmac = crypto.createHmac('sha512', secretKey)
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex')
    vnp_Params['vnp_SecureHash'] = signed
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false })
    res.send(vnpUrl)

    const status = await pollVNPayStatus(
      vnp_TxnRef,
      vnp_TransactionDate,
      vnp_IpAddr
    )
    const amountVNPay = req.body.amount / 24000
    if (status === '00') {
      user.wallet = Number(user.wallet) + Number(amountVNPay)
      const newTransaction = {
        paymentMethod: 'VNPay',
        status: 'Success',
        amount: amountVNPay.toFixed(2),
        date: new Date(),

        VNPayID: vnp_TxnRef,
        VNPayDate: vnp_TransactionDate,
      }

      await UserModel.findOneAndUpdate(
        { _id: req.body.userID },
        { $push: { transactions: newTransaction } },
        { new: true }
      )
      await user.save()
      console.log('successfully')
    } else {
      const newTransaction = {
        paymentMethod: 'VNPay',
        status: 'Processing or Denied',
        amount: amountVNPay.toFixed(2),
        date: new Date(),

        VNPayID: vnp_TxnRef,
        VNPayDate: vnp_TransactionDate,
      }
      await UserModel.findOneAndUpdate(
        { _id: req.body.userID },
        { $push: { transactions: newTransaction } },
        { new: true }
      )
    }
  } else {
    res.status(404).send({ message: 'User not found' })
  }
}
export const pollVNPayStatus = async (
  vnp_TxnRef,
  vnp_TransactionDate,
  vnp_IpAddr
) => {
  let status = ''
  while (status !== '00') {
    const result = await checkVNPayTransaction(
      vnp_TxnRef,
      vnp_TransactionDate,
      vnp_IpAddr
    )
    const status = result.vnp_TransactionStatus
    if (status === '00') {
      console.log(status)

      return status
    } else if (status === '01' || status === undefined) {
      console.log(status)
      await new Promise((resolve) => setTimeout(resolve, 3000))
    } else {
      console.log(status)
      return status
    }
  }
}
export const VNPayReturn = (req, res) => {
  let vnp_Params = req.query

  let secureHash = vnp_Params['vnp_SecureHash']

  delete vnp_Params['vnp_SecureHash']
  delete vnp_Params['vnp_SecureHashType']

  vnp_Params = sortObject(vnp_Params)

  let tmnCode = process.env.vnp_TmnCode
  let secretKey = process.env.vnp_HashSecret

  let signData = querystring.stringify(vnp_Params, { encode: false })
  let hmac = crypto.createHmac('sha512', secretKey)
  let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex')
  if (secureHash === signed) {
    //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
    const status = vnp_Params['vnp_ResponseCode']
    res.redirect(
      `${process.env.FRONTEND_URL}/wallet?vnp_TransactionStatus=${status}`
    )
  } else {
    res.render('success', { code: '97' })
  }
}
export const checkVNPayTransaction = async (
  vnp_TxnRef,
  vnp_TransactionDate,
  vnp_IpAddr
) => {
  let date = new Date()
  let vnp_TmnCode = process.env.vnp_TmnCode
  let secretKey = process.env.vnp_HashSecret
  let vnp_Api = process.env.vnp_Api

  let vnp_RequestId = moment(date).format('HHmmss')
  let vnp_Version = '2.1.0'
  let vnp_Command = 'querydr'
  let vnp_OrderInfo = 'Truy van GD ma:' + vnp_TxnRef

  let currCode = 'VND'
  let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss')

  let data =
    vnp_RequestId +
    '|' +
    vnp_Version +
    '|' +
    vnp_Command +
    '|' +
    vnp_TmnCode +
    '|' +
    vnp_TxnRef +
    '|' +
    vnp_TransactionDate +
    '|' +
    vnp_CreateDate +
    '|' +
    vnp_IpAddr +
    '|' +
    vnp_OrderInfo

  let hmac = crypto.createHmac('sha512', secretKey)
  let vnp_SecureHash = hmac.update(new Buffer(data, 'utf-8')).digest('hex')

  let dataObj = {
    vnp_RequestId: vnp_RequestId,
    vnp_Version: vnp_Version,
    vnp_Command: vnp_Command,
    vnp_TmnCode: vnp_TmnCode,
    vnp_TxnRef: vnp_TxnRef,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_TransactionDate: vnp_TransactionDate,
    vnp_CreateDate: vnp_CreateDate,
    vnp_IpAddr: vnp_IpAddr,
    vnp_SecureHash: vnp_SecureHash,
  }
  // /merchant_webapi/api/transaction
  const result = await new Promise((resolve, reject) => {
    request(
      {
        url: vnp_Api,
        method: 'POST',
        json: true,
        body: dataObj,
      },
      function (error, response, body) {
        if (error) {
          reject(error)
        } else {
          resolve(response.body)
        }
      }
    )
  })

  return result
}
function sortObject(obj) {
  let sorted = {}
  let str = []
  let key
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key))
    }
  }
  str.sort()
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+')
  }
  return sorted
}
