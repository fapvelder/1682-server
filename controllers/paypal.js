import axios from 'axios'
import { UserModel } from '../models/user.js'
import moment from 'moment'
import querystring from 'qs'
import crypto from 'crypto'
import {
  capturePaymentSchema,
  createOrderSchema,
  payoutSchema,
  pollTransactionStatusSchema,
} from '../helpers/validation_schema.js'
const { CLIENT_ID, APP_SECRET } = process.env
const baseURL = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  production: 'https://api-m.paypal.com',
}

export async function createOrder(req, res) {
  // await createOrderSchema.validateAsync(req.body)
  const accessToken = await generatePaypalAccessToken()
  const url = `${baseURL.sandbox}/v2/checkout/orders`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: req.body.cost,
          },
        },
      ],
    }),
  })
  const data = await response.json()
  res.send(data)
}

// use the orders api to capture payment for an order
export async function capturePayment(req, res) {
  // await capturePaymentSchema.validateAsync(req.body)
  const { orderID } = req.body

  const accessToken = await generatePaypalAccessToken()
  const url = `${baseURL.sandbox}/v2/checkout/orders/${orderID}/capture`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await response.json()
  const amount = data.purchase_units[0].payments.captures[0].amount.value
  if (data.status === 'COMPLETED') {
    const newTransaction = {
      paymentMethod: 'Paypal',
      status: 'Success',
      amount: amount,
      date: new Date(),
    }
    await UserModel.findOneAndUpdate(
      { _id: req.body.userID },
      { $push: { transactions: newTransaction } },
      { new: true }
    )
    console.log('successfully')
  } else {
    const newTransaction = {
      paymentMethod: 'Paypal',
      status: 'Denied',
      amount: amount,
      date: new Date(),
    }
    await UserModel.findOneAndUpdate(
      { _id: req.body.userID },
      { $push: { transactions: newTransaction } },
      { new: true }
    )
  }
  res.send(data)
}
export async function payout(req, res) {
  // await payoutSchema.validateAsync(req.body)
  const accessToken = await generatePaypalAccessToken()
  const user = await UserModel.findOne({ _id: req.body.userID })
  const date = new Date()

  try {
    if (user.secretToken === req.body.secretToken) {
      user.secretToken = undefined
      await user.save()
      if (user && user.wallet > req.body.amount) {
        const response = await axios.post(
          `${baseURL.sandbox}/v1/payments/payouts`,
          {
            sender_batch_header: {
              sender_batch_id: Math.random(),
              email_subject: 'You have a payout!',
              email_message:
                'You have received a payout! Thanks for using our service!',
            },
            items: [
              {
                recipient_type: 'EMAIL',
                amount: {
                  value: `${req.body.amount}`,
                  currency: 'USD',
                },
                note: 'Thanks for your patronage!',
                sender_item_id: '201403140001',
                receiver: `${req.body.email}`,
                notification_language: 'en-US',
              },
            ],
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        const payoutID = response.data.batch_header.payout_batch_id
        const status = await pollTransactionStatus(payoutID)
        console.log(status)

        if (status === 'SUCCESS') {
          console.log(status)
          user.wallet =
            Number(user.wallet) -
            Number(req.body.amount) -
            Number(req.body.withdrawalFee)
          await user.save()
          res.status(200).send('Successfully')
        } else {
          console.log(status)

          res.status(403).send({ message: 'Failed due to Denied by Paypal' })
        }
      } else {
        res.status(403).send({ message: 'Do not have sufficient funds.' })
      }
    } else {
      res.status(403).send({ message: 'Wrong secret code' })
    }
  } catch (error) {
    // Handle errors here
    console.error(error)
  }
}
export const checkPaypalTransaction = async (payoutID) => {
  try {
    const accessToken = await generatePaypalAccessToken()
    const payoutStatus = await axios.get(
      `${baseURL.sandbox}/v1/payments/payouts/${payoutID}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    console.log(accessToken)
    console.log(`${baseURL.sandbox}/v1/payments/payouts/${payoutID}`)
    return payoutStatus.data.batch_header.batch_status
  } catch (err) {
    console.error(err)
  }
}
export async function pollTransactionStatus(payoutID) {
  // await pollTransactionStatusSchema.validateAsync({ payoutID })
  let status = ''
  while (status !== 'SUCCESS') {
    status = await checkPaypalTransaction(payoutID)
    if (status === 'SUCCESS') {
      return status
    } else if (status === 'PROCESSING') {
      await new Promise((resolve) => setTimeout(resolve, 3000))
    } else {
      return status
    }
  }
}

// generate an access token using client id and app secret
export async function generatePaypalAccessToken() {
  const auth = Buffer.from(CLIENT_ID + ':' + APP_SECRET).toString('base64')
  const response = await fetch(`${baseURL.sandbox}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  })
  const data = await response.json()

  return data.access_token
}
