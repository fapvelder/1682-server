import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import morgan from 'morgan'
import { v2 as cloudinary } from 'cloudinary'
import { fileURLToPath } from 'url'
import path from 'path'
import cookieParser from 'cookie-parser'
import http from 'http'
import { Server } from 'socket.io'
import users from './routers/user.js'
import chat from './routers/message.js'
import dotenv from 'dotenv'
import roles from './routers/role.js'
import categories from './routers/category.js'
import platforms from './routers/platform.js'
import steam from './routers/steam.js'
import paypal from './routers/paypal.js'
import vnpay from './routers/vnpay.js'
import products from './routers/product.js'
import comments from './routers/comment.js'
import feedbacks from './routers/feedback.js'
import chatGPT from './routers/chatGPT.js'
import notifications from './routers/notifications.js'
import orders from './routers/order.js'
import session from 'express-session'
import { loginSteam } from './controllers/steam.js'
import { UserModel } from './models/user.js'
import { NotificationModel } from './models/notification.js'
import { sendNotification } from './controllers/notification.js'

dotenv.config()
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

export const app = express()
const PORT = process.env.port || 5000
app.use(bodyParser.json({ limit: '30mb' }))
app.use(bodyParser.urlencoded({ limit: '30mb' }))
app.use(morgan('combined'))
app.use(cookieParser())
const allowOrigin = [
  process.env.FRONTEND_URL,
  process.env.BACKEND_URL,
  'http://localhost:5000',
  'http://localhost:3000',
  'https://one682-client.onrender.com',
  'https://one682.onrender.com',
  'https://steamcommunity.com/',
  'https://steamcommunity.com/openid/login',
  'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  '*',
]

const corsOptions = {
  credentials: true,
  origin: allowOrigin,
  allowedHeaders: [
    'Origin',
    'Content-Type',
    'Accept',
    'x-access-token',
    'authorization',
    'x-signature',
  ],
  methods: 'GET, HEAD, OPTIONS, PUT, PATCH, POST, DELETE',
  preflightContinue: false,
}
app.use(cors(corsOptions))

app.get('/', (req, res) => {
  res.send('SUCCESS')
  console.log('SUCCESS')
})

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  })
)
//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

mongoose
  .connect(process.env.URI_MONGODB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch((err) => {
    console.log('ERR', err)
  })
const server = app.listen(5000, () => {
  console.log('server is listening on port 5000')
})
//steam config
// loginSteam()
//
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

app.use('/users', users)
app.use('/roles', roles)
app.use('/platforms', platforms)
app.use('/categories', categories)
app.use('/chat', chat)
app.use('/products', products)
app.use('/steam', steam)
app.use('/paypal', paypal)
app.use('/vnpay', vnpay)
app.use('/orders', orders)
app.use('/comments', comments)
app.use('/feedbacks', feedbacks)
app.use('/chatGPT', chatGPT)
app.use('/notifications', notifications)
global.onlineUsers = new Map()
io.on('connection', (socket) => {
  let authenticatedUsers = new Set()
  global.chatsocket = socket

  socket.on('addUser', (id) => {
    onlineUsers.set(id, socket.id)
  })

  socket.on('updateUserDetails', () => {
    io.emit('userDetailsUpdated')
  })

  socket.on('send-notify', async (data) => {
    try {
      const { userID, type, url } = data
      let typeMessages = {
        Purchase: 'Someone has purchased your product',
        Comment: 'Someone has commented on your product',
        Complete: 'Your product has been completed by the seller',
        Cancel: 'Your product has been cancelled by the buyer',
        Feedback: 'You have a feedback from the seller',
      }
      const message = typeMessages[type]

      const user = await UserModel.findOne({ _id: userID }).exec()
      if (user) {
        const newNotification = new NotificationModel({
          userID: user._id,
          message: message,
          url: url,
        })
        const notification = await newNotification.save()
        io.emit('receive-notify', notification)
      }
    } catch (err) {
      console.error('Error saving notification:', err)
    }
  })

  socket.on('send-msg', (data) => {
    const sendUserSocket = onlineUsers.get(data.to)
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit('msg-receive', data.message)
    }
    io.emit('msg-count', data)
  })
  socket.on('disconnect', () => {
    // Remove user from authenticated users set when they disconnect
    authenticatedUsers.forEach((userID) => {
      if (onlineUsers.get(userID) === socket.id) {
        authenticatedUsers.delete(userID)
        console.log(`User with ID ${userID} disconnected`)
      }
    })
  })
})
export { io }
