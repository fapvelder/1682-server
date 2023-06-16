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
import products from './routers/product.js'
import session from 'express-session'
import SteamUser from 'steam-user'
import SteamTotp from 'steam-totp'
import TradeOfferSteam from 'steam-tradeoffer-manager'
import SteamCommunity from 'steamcommunity'
import { config } from './config.js'
import axios from 'axios'
//paypal config

//
dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const client = new SteamUser()
const community = new SteamCommunity()
const manager = new TradeOfferSteam({
  steam: client,
  community: community,
  language: 'en',
})
const app = express()
const PORT = process.env.port || 5000
app.use(bodyParser.json({ limit: '30mb' }))
app.use(bodyParser.urlencoded({ limit: '30mb' }))
app.use(morgan('combined'))
app.use(cookieParser())
const allowOrigin = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://steamcommunity.com/',
  'https://steamcommunity.com/openid/login',
  'https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.ns.sreg=http%3A%2F%2Fopenid.net%2Fextensions%2Fsreg%2F1.1&openid.sreg.optional=nickname%2Cemail%2Cfullname%2Cdob%2Cgender%2Cpostcode%2Ccountry%2Clanguage%2Ctimezone&openid.ns.ax=http%3A%2F%2Fopenid.net%2Fsrv%2Fax%2F1.0&openid.ax.mode=fetch_request&openid.ax.type.fullname=http%3A%2F%2Faxschema.org%2FnamePerson&openid.ax.type.firstname=http%3A%2F%2Faxschema.org%2FnamePerson%2Ffirst&openid.ax.type.lastname=http%3A%2F%2Faxschema.org%2FnamePerson%2Flast&openid.ax.type.email=http%3A%2F%2Faxschema.org%2Fcontact%2Femail&openid.ax.required=fullname%2Cfirstname%2Clastname%2Cemail&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.return_to=http%3A%2F%2Flocalhost%3A5000%2Fsteam%2Fauth%2Fsteam%2Freturn&openid.realm=http%3A%2F%2Flocalhost%3A5000%2F',
  '*',
]
const logInOptions = {
  accountName: process.env.ACCOUNT_NAME,
  password: process.env.PASSWORD,
  twoFactorCode: SteamTotp.generateAuthCode(process.env.SHARED_SECRET),
}
client.logOn(logInOptions)
client.on('loggedOn', () => {
  console.log('logged on')
  client.setPersona(SteamUser.EPersonaState.Online)
})
// client.on('webSession', (sessionID, cookies) => {
//   manager.setCookies(cookies)
//   community.setCookies(cookies)
//   community.startConfirmationChecker(20000, config.identitySecret)
//   // sendCSGOItem()
//   // sendSteamItem()
//   // getSteamItem()
// })

client.on('webSession', function (sessionID, cookies) {
  console.log('set cookie')
  manager.setCookies(cookies, function (err) {
    if (err) {
      console.log('err', err)
    }
    console.log('Got API key: ' + manager.apiKey)
  })
  community.setCookies(cookies, function (err) {
    if (err) {
      console.log('err', err)
    }
    console.log('Got API key: ' + manager.apiKey)
  })
})
community.on('debug', console.log)

manager.on('newOffer', (offer) => {
  console.log('offer deteced')
  if (offer.partner.getSteamID64 === '76561198255066121') {
    // id của người gửi, nếu đúng sẽ accept
    offer.accept((err, status) => {
      if (err) {
        console.log(err)
      } else {
        console.log(status)
      }
    })
  } else {
    console.log('unknown sender')
    offer.decline((err) => {
      if (err) {
        console.log(err)
      } else {
        console.log('trade from stranger decline')
      }
    })
  }
})
function sendCSGOItem() {
  console.log('sending trade csgo')
  manager.loadInventory(730, 2, true, (err, inventory) => {
    if (err) {
      console.log('err', err)
    } else {
      const offer = manager.createOffer('76561198356336294')
      // Gửi đến id người nhận
      console.log(inventory)
      inventory.forEach(function (item) {
        // if (item.assetid === '30797927279') {
        console.log('item', item)
        offer.addTheirItem(item.assetid)
        offer.setMessage('You traded an item')
        offer.send((err, status) => {
          if (err) {
            console.log(err)
          } else {
            console.log('trade sent')
            console.log('status', status)
            if (status === 'pending') {
              // confirmTradeOffer(offer.id)
              community.acceptConfirmationForObject(
                process.env.IDENTITY_SECRET,
                offer.id,
                function (err) {
                  if (err) {
                    console.log('err', err)
                  } else {
                    console.log('Offer confirmed')
                  }
                }
              )
            } else {
              console.log(`Offer #${offer.id} sent successfully`)
            }
          }
        })
        // }
      })
    }
  })
}
function sendSteamItem() {
  console.log('sending trade steam')

  manager.loadInventory(753, 6, true, (err, inventory) => {
    if (err) {
      console.log(err)
    } else {
      const offer = manager.createOffer('76561198255066121')
      // Gửi đến id người nhận
      inventory.forEach(function (item) {
        if (item.assetid === '20531227411') {
          offer.addTheirItem(item)
          offer.setMessage('You traded an item')
          offer.send((err, status) => {
            if (err) {
              console.log(err)
            } else {
              console.log('trade sent')
              console.log('status', status)
              if (status === 'pending') {
                // confirmTradeOffer(offer.id)
                community.acceptConfirmationForObject(
                  process.env.IDENTITY_SECRET,
                  offer.id,
                  function (err) {
                    if (err) {
                      console.log('err', err)
                    } else {
                      console.log('Offer confirmed')
                    }
                  }
                )
              } else {
                console.log(`Offer #${offer.id} sent successfully`)
              }
            }
          })
        }
      })
    }
  })
}
function getSteamItem() {
  console.log('sending trade steam')

  // manager.loadInventory(753, 6, true, (err, inventory) => {
  //   if (err) {
  //     console.log(err)
  //   } else {
  const offer = manager.createOffer('76561198255066121')
  // Load recipient's inventory
  manager.getUserInventoryContents(
    '76561198255066121',
    730,
    2,
    true,
    (err, inventory) => {
      if (err) {
        console.log('err', err)
      } else {
        console.log('sending')

        // Add recipient's items to the offer
        inventory.forEach(function (item) {
          if (item.assetid === '28790214943') {
            offer.addTheirItem(item)
            console.log('offer')

            offer.setMessage('You traded an item')
            offer.send((err, status) => {
              if (err) {
                console.log('err', err)
              } else {
                console.log('trade sent')
                console.log('status', status)
                if (status === 'pending') {
                  // confirmTradeOffer(offer.id)
                  community.acceptConfirmationForObject(
                    process.env.IDENTITY_SECRET,
                    offer.id,
                    function (err) {
                      if (err) {
                        console.log('err', err)
                      } else {
                        console.log('Offer confirmed')
                      }
                    }
                  )
                } else {
                  console.log(`Offer #${offer.id} sent successfully`)
                }
              }
            })
          }
        })
      }
    }
  )
  // }
}
//   )
// }

function confirmTradeOffer(offerId) {
  community.acceptConfirmationForObject(
    process.env.IDENTITY_SECRET,
    offerId,
    (err) => {
      if (err) {
        console.error('Error confirming trade offer:', err)
        return
      }

      console.log(`Trade offer #${offerId} confirmed successfully`)
    }
  )
}

const corsOptions = {
  credentials: true,
  // origin: '*',

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

//paypal function
// create a new order

//payout paypal

// let clientId = process.env.CLIENT_ID
// let clientSecret = process.env.APP_SECRET
// let environment = new paypal.core.SandboxEnvironment(clientId, clientSecret)
// let clientPaypal = new paypal.core.PayPalHttpClient(environment)
// let requestBody = {
//   sender_batch_header: {
//     recipient_type: 'EMAIL',
//     email_message: 'SDK payouts test txn',
//     note: 'Enjoy your Payout!!',
//     sender_batch_id: 'Test_sdk_fail',
//     email_subject: 'This is a test transaction from SDK',
//   },
//   items: [
//     {
//       note: 'Your new  10$ Payout!',
//       amount: {
//         currency: 'USD',
//         value: '10.00',
//       },
//       receiver: 'sb-bety4726266845@business.example.com',
//       sender_item_id: 'New payout',
//     },
//   ],
// }

// // Construct a request object and set desired parameters
// // Here, PayoutsPostRequest() creates a POST request to /v1/payments/payouts
// let request = new paypal.payouts.PayoutsPostRequest()
// request.requestBody(requestBody)

// Call API with your client and get a response for your call
// let createPayouts = async () => {
//   try {
//     let response = await clientPaypal.execute(request)
//     console.log(`Response: ${JSON.stringify(response)}`)
//     // If call returns body in response, you can get the deserialized version from the result attribute of the response.
//     console.log(`Payouts Create Response: ${JSON.stringify(response.result)}`)
//   } catch (e) {
//     if (e.statusCode) {
//       //Handle server side/API failure response
//       console.log('Status code: ', e.statusCode)
//       // Parse failure response to get the reason for failure
//       const error = JSON.parse(e.message)
//       console.log('Failure response: ', error)
//       console.log('Headers: ', e.headers)
//     } else {
//       //Hanlde client side failure
//       console.log(e)
//     }
//   }
// }
// createPayouts()
//////////////////////
// PayPal API helpers
//////////////////////

// use the orders api to create an order
app.use('/users', users)
app.use('/roles', roles)
app.use('/platforms', platforms)
app.use('/categories', categories)
app.use('/chat', chat)
app.use('/products', products)
app.use('/steam', steam)
app.use('/paypal', paypal)
mongoose
  .connect(process.env.URI_MONGODB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  // .then(() => {
  //   console.log('Connected to DB')
  //   app.listen(PORT, () => {
  //     console.log('Server is running on port', PORT)
  //   })
  // })
  .catch((err) => {
    console.log('ERR', err)
  })
const server = app.listen(5000, () => {
  console.log('server is listening on port 5000')
})

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
global.onlineUsers = new Map()
io.on('connection', (socket) => {
  global.chatsocket = socket

  socket.on('addUser', (id) => {
    onlineUsers.set(id, socket.id)
  })
  socket.on('updateUserDetails', () => {
    io.emit('userDetailsUpdated')
  })

  socket.on('send-msg', (data) => {
    const sendUserSocket = onlineUsers.get(data.to)
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit('msg-receive', data.message)
    }
  })
})
