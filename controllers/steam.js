// Controller
import passport from 'passport'
import express from 'express'
import { Strategy as SteamStrategy } from 'passport-steam'

import jwt from 'jsonwebtoken'
import { UserModel } from '../models/user.js'
import convertor from 'steam-id-convertor'
import SteamUser from 'steam-user'
import SteamTotp from 'steam-totp'
import TradeOfferSteam from 'steam-tradeoffer-manager'
import SteamCommunity from 'steamcommunity'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { io } from '../index.js'
import {
  checkStatusSchema,
  deleteSteamIDSchema,
  sendSteamItemSchema,
  updateSteamURLSchema,
} from '../helpers/validation_schema.js'
import { LoginSession, EAuthTokenPlatformType } from 'steam-session'

const app = express()
app.use(passport.initialize())
app.use(passport.session())

const client = new SteamUser()
const community = new SteamCommunity()
const manager = new TradeOfferSteam({
  steam: client,
  community: community,
  language: 'en',
})
const logInOptions = {
  accountName: process.env.ACCOUNT_NAME,
  password: process.env.PASSWORD,
  twoFactorCode: SteamTotp.generateAuthCode(process.env.SHARED_SECRET),
}

export const loginSteam = async () => {
  client.logOn(logInOptions)
  client.on('loggedOn', () => {
    console.log('logged on')
    client.setPersona(SteamUser.EPersonaState.Online)
  })
  setTimeout(() => {
    let session = new LoginSession(EAuthTokenPlatformType.WebBrowser)
    session.startWithCredentials({
      accountName: process.env.ACCOUNT_NAME,
      password: process.env.PASSWORD,
      steamGuardCode: SteamTotp.generateAuthCode(process.env.SHARED_SECRET),
    })
    session.on('authenticated', async () => {
      let webCookies = await session.getWebCookies()
      let sessionIdCookie = webCookies.find((c) => c.startsWith('sessionid='))
      community.setCookies(webCookies)
      console.log('community set cookie')
      // console.log({
      //   sessionID: sessionIdCookie.split('=')[1],
      //   cookies: webCookies,
      //   steamguard: session.steamGuardMachineToken,
      // })
    })
    session.on('error', (err) => {
      console.log(err)
    })
  }, 35000)

  client.on('webSession', (sessionID, cookies) => {
    manager.setCookies(cookies)
    // community.setCookies(cookies)
  })
  community.on('debug', console.log)

  manager.on('newOffer', (offer) => {
    console.log('offer detected')
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
}
passport.use(
  new SteamStrategy(
    {
      returnURL: process.env.STEAM_RETURN_URL,
      realm: process.env.STEAM_REALM,
      apiKey: process.env.STEAM_API,
      passReqToCallback: true,
    },
    (req, identifier, profile, done) => {
      const userID = req.cookies.refresh
      if (userID) {
        jwt.verify(
          userID,
          process.env.JWT_REFRESH_SECRET,
          async (err, decoded) => {
            if (err) {
              return done(err) // Pass the error to done function
            } else {
              const user = await UserModel.findOne({ _id: decoded._id })
              if (user) {
                try {
                  const id = convertor.to32(profile.id)
                  user.profile.steam.steamID = profile.id
                  user.profile.steam.steamURL = profile._json.profileurl
                  user.profile.steam.partnerID = id
                  await user.save()
                  // Handle additional operations or responses here
                  return done(null, profile) // Pass the user profile to done function
                } catch (err) {
                  return done(err) // Pass the error to done function
                }
              }
            }
          }
        )
      } else {
        // Handle the case when userID is not available
        return done(new Error('Unauthorized'))
      }
    }
  )
)
export const handleAuthError = (req, res, next) => {
  passport.authenticate('steam', { failureRedirect: '/login' }),
    function (req, res) {
      res.redirect('localhost:3000/settings?err')
    }
}
export const deleteSteamID = async (req, res) => {
  try {
    await deleteSteamIDSchema.validateAsync(req.body)
    const user = await UserModel.updateOne(
      {
        'profile.steam.steamID': req.body.steamID,
        'profile.steam': { $exists: true },
      },
      { $unset: { 'profile.steam': 1 } }
    )
    res.status(200).send('Delete successfully')
  } catch (error) {
    console.error('Error deleting email:', error)
  }
}
passport.serializeUser((user, done) => {
  // Serialize the user (e.g., store user ID in the session)
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  // Deserialize the user (e.g., retrieve user data from the session)
  const user = { id: id, username: 'exampleUser' } // Replace with your implementation
  done(null, user)
})

export const authSteam = passport.authenticate('steam')
export const getParams = (req, res, next) => {
  const userid = req.params
  if (!userid) {
    return res.status(400).json({ message: 'userid is required' })
  }
  next()
}

export const steamReturn = (req, res) => {
  try {
    res.redirect(`${process.env.FRONTEND_URL}/settings`)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getItem = async (req, res) => {
  try {
    const steamID = req.body.steamID
    const currentTime = new Date()
    const cooldownPeriod = 3 * 60 * 60 * 1000
    const user = await UserModel.findOne({ _id: req.body.userID })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // const lastItemRetrieval = user.profile.steam.lastItemRetrieval
    // if (lastItemRetrieval && currentTime - lastItemRetrieval < cooldownPeriod) {
    //   return res
    //     .status(403)
    //     .json({ message: 'You can only refresh inventory every 3 hours' })
    // }
    let item

    function getUserInventory() {
      return new Promise((resolve, reject) => {
        const inventoryPromises = []

        inventoryPromises.push(
          new Promise((resolve, reject) => {
            manager.getUserInventoryContents(
              user.profile.steam.steamID,
              753,
              6,
              true,
              (err, inventory) => {
                if (err) {
                  console.log('err', err)
                  reject(err)
                } else {
                  resolve(inventory)
                }
              }
            )
          })
        )
        inventoryPromises.push(
          new Promise((resolve, reject) => {
            manager.getUserInventoryContents(
              user.profile.steam.steamID,
              730,
              2,
              true,
              (err, inventory) => {
                if (err) {
                  console.log('err', err)
                  reject(err)
                } else {
                  resolve(inventory)
                }
              }
            )
          })
        )

        Promise.all(inventoryPromises)
          .then((inventories) => {
            resolve(inventories)
          })
          .catch((err) => {
            reject(err)
          })
      })
    }

    getUserInventory()
      .then(async (inventories) => {
        if (inventories) {
          user.profile.steam.steamInventory = inventories
          // user.profile.steam.lastItemRetrieval = currentTime
          await user.save()
          res.status(200).send('Refreshed inventory successfully')
        } else {
          res.status(404).json({ message: 'Failed to retrieve items' })
        }
      })
      .catch((err) => {
        console.log('Error retrieving inventories:', err)
      })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Internal server error' })
  }
}
export const getPriceItem = async (req, res) => {
  try {
    const hashname = 'Recoil Case'
    const result = await axios.get(
      `https://gameflip.com/api/v1/steam/price/730/${hashname}`
    )
    res.send(result)
  } catch (error) {
    console.error('An error occurred: ', error.message)
  }
}
export const getInformation = async (req, res) => {
  if (req.cookies.userSteam) {
    const userToken = req.cookies.userSteam
    jwt.verify(userToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(406).json({ message: 'Unauthorized' })
      } else {
        return res.json({ id: decoded.id })
      }
    })
  }
}
export const updateSteamURL = async (req, res) => {
  try {
    await updateSteamURLSchema.validateAsync(req.body)
    const user = await UserModel.findOne({ _id: req.body.userID })
    const userPartnerID = user.profile.steam.partnerID
    const url = req.body.steamURL
    const partnerID = url.match(/partner=(\d+)/)[1]
    const tokenMatch = url.match(/token=([A-Za-z0-9]{8})(?![A-Za-z0-9])/) // Updated regex
    const token = tokenMatch ? tokenMatch[1] : null
    const isValidURL = url.startsWith(
      'https://steamcommunity.com/tradeoffer/new/'
    )

    if (
      isValidURL &&
      partnerID === userPartnerID &&
      token &&
      token.length === 8
    ) {
      user.profile.steam.steamTradeURL =
        req.body.steamURL || user.profile.steam.steamTradeURL
      await user.save()
      res.status(200).send('Steam URL updated successfully')
    } else {
      res.status(400).json({ message: 'Bad Request' })
    }
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getItemOrder = async (req, res) => {
  try {
    console.log('started')
    const orderStatus = await sendSteamItem(req)
    console.log('status Order', orderStatus)
    res.status(200).send({ orderStatus })
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}

export async function sendSteamItem(req) {
  await sendSteamItemSchema.validateAsync(req.body)
  return new Promise(async (resolve, reject) => {
    const appID = req.body.appID
    const version = req.body.version
    const classID = req.body.classID
    const assetID = req.body.assetID
    const user = await UserModel.findOne({ _id: req.body.userID })
    const receiver = await UserModel.findOne({ _id: req.body.receiverID })

    if (!user) {
      reject(new Error('User not found'))
    }

    // const item = user.itemHeld.find((item) => item.assetid === assetID)
    // if (!item) {
    //   reject(new Error("Item not found in user's inventory"))
    // }

    console.log('find item')
    manager.loadInventory(appID, version, true, (err, inventory) => {
      if (err) {
        console.log(err)
        reject(new Error('Failed to load inventory'))
      } else {
        let itemFound = false
        const offer = manager.createOffer(receiver.profile.steam.steamTradeURL)
        // Gửi đến id người nhận
        inventory.forEach(function (item) {
          if (itemFound === false) {
            if (item.classid === classID) {
              itemFound = true
              console.log(item)
              offer.addMyItem(item)
              console.log('add item')
              offer.setMessage('We send you item')
              offer.send((err, status) => {
                if (err) {
                  console.log(err)
                  reject(new Error('Failed to send offer'))
                } else {
                  console.log('status', status)
                  if (status === 'pending') {
                    community.acceptConfirmationForObject(
                      process.env.IDENTITY_SECRET,
                      offer.id,
                      async function (err) {
                        if (err) {
                          console.log('err', err)
                        } else {
                          io.emit('tradeOfferURL', {
                            tradeOfferURL: `https://steamcommunity.com/tradeoffer/${offer.id}/`,
                          })
                          const { status } = await pollItemStatus(offer.id)
                          if (status === 'ACCEPTED') {
                            user.itemHeld = user.itemHeld.filter(
                              (item) => item.assetid !== assetID
                            )
                            await user.save()
                            io.emit('tradeOfferStatus', {
                              messageSuccess: 'Trade offer has been accepted',
                            })
                            resolve('ACCEPTED')
                          } else {
                            io.emit('tradeOfferStatus', {
                              messageFailure: 'Trade offer has been declined',
                            })
                            resolve('DENIED')
                          }
                        }
                      }
                    )
                  } else {
                    console.log(`Offer #${offer.id} sent successfully`)
                    resolve('Sent')
                  }
                }
              })
            }
          }
        })

        if (!itemFound) {
          reject(new Error('Item not found'))
        }
      }
    })
  })
}

export async function getSteamItem(req, res) {
  const user = await UserModel.findOne({ _id: req.body.userID })

  const appID = req.body.appID
  const version = req.body.version
  const classID = req.body.classID
  const assetID = req.body.assetID
  if (user) {
    const offer = manager.createOffer(user.profile.steam.steamTradeURL)
    console.log(user.profile.steam.steamTradeURL)
    // Load recipient's inventory
    manager.getUserInventoryContents(
      user.profile.steam.steamID,
      appID,
      version,
      true,
      (err, inventory) => {
        if (err) {
          console.log('err', err)
        } else {
          console.log('sending')
          let itemFound = false
          // Add recipient's items to the offer
          inventory.forEach(function (item) {
            if (item.classid === classID) {
              itemFound = true
              const uuid = uuidv4()
              offer.addTheirItem(item)
              offer.setMessage(`You traded an item ${uuid}`)
              offer.send(async (err, status) => {
                if (err) {
                  console.log('err', err)
                } else {
                  console.log('status', status)
                  if (status === 'pending') {
                    console.log('pending')
                  } else {
                    const response = {
                      id: uuid,
                      tradeOfferUrl: `https://steamcommunity.com/tradeoffer/${offer.id}/`,
                    }
                    user.pendingOffer = [...user.pendingOffer, offer.id]
                    await user.save()
                    res.status(200).send(response)

                    // const status = await pollItemStatus(offer.id)
                    // if (status === 'ACCEPTED') {
                    //   console.log(status)
                    // } else {
                    //   console.log(status)
                    // }
                  }
                }
              })
            }
          })
          if (!itemFound) {
            res.status(404).send({ message: 'Item not found' })
          }
        }
      }
    )
  } else {
    res.status(404).send({ message: 'User not found' })
  }
}
export async function getInventory(req, res) {
  try {
    console.log('get item')
    const user = await UserModel.findOne({ _id: req.body.userID })
    if (!user) {
      res.status(404).json({ message: 'User not found' })
    }
    const steamID = user.profile.steam.steamID

    const lastReset = user.lastInventoryResetAt
    const now = Date.now()
    const timeDiff = now - lastReset
    const minResetDuration = 5 * 60 * 1000

    if (lastReset && timeDiff < minResetDuration) {
      console.log('need to wait 5 min')
      return res.status(400).json({
        message: 'Cannot reset inventory again so soon before 5 minutes',
      })
    }
    console.log('request')

    const userInventory = await axios.get(
      `https://steamcommunity.com/inventory/${steamID}/730/2?l=english`
    )
    const adminInventory = await axios.get(
      'https://steamcommunity.com/inventory/76561199509269691/730/2?l=english'
    )
    user.lastInventoryResetAt = now
    user.tradeItem = {
      user: userInventory.data,
      admin: adminInventory.data,
    }
    await user.save()
    res.status(200).send({ message: 'Successfully' })
  } catch (error) {
    console.error('An error occurred: ', error.message)
  }
}
export async function getAdminInventory(req, res) {
  try {
    const result = await axios.get(
      'https://steamcommunity.com/inventory/76561198798991800/730/2?l=english'
    )
    res.send(result.data)
  } catch (error) {
    console.error('An error occurred: ', error.message)
  }
}
export const checkStatus = async (req, res) => {
  await checkStatusSchema.validateAsync(req.body)
  const user = await UserModel.findOne({ pendingOffer: req.body.offerID })
  if (user) {
    const { status, item } = await pollItemStatus(req.body.offerID, 12)
    if (status === 'ACCEPTED') {
      user.pendingOffer = user.pendingOffer.filter(
        (id) => id !== req.body.offerID
      )
      const itemObject = JSON.parse(JSON.stringify(...item))
      user.itemHeld.push(itemObject)
      await user.save()
      res.status(200).send({ message: 'ACCEPTED' })
    } else {
      res.status(400).send({ message: 'Denied or Pending trade offer' })
    }
  } else {
    res.status(404).send({ message: 'User not found' })
  }
}
export const pollItemStatus = async (offerID, maxPollAttempts) => {
  let status = ''
  let item = ''
  const state = TradeOfferSteam.ETradeOfferState
  const deniedState = [
    state.Countered,
    state.Expired,
    state.Invalid,
    state.Canceled,
    state.Declined,
  ]
  const checkOfferStatus = () => {
    manager.getOffer(offerID, (err, offer) => {
      if (err) {
        console.error('Error retrieving trade offer:', err)
        return
      }
      item = offer.itemsToReceive

      if (offer.state === 3) {
        status = 'ACCEPTED'
      } else if (deniedState.includes(offer.state)) {
        status = 'DENIED'
      } else {
        console.log('PENDING')
      }
    })
  }

  const pollInterval = 5000 // Interval in milliseconds
  const shouldContinuePolling = () =>
    (typeof maxPollAttempts !== 'number' || pollCount < maxPollAttempts) &&
    status !== 'ACCEPTED' &&
    status !== 'DENIED'

  let pollCount = 0
  while (shouldContinuePolling()) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
    checkOfferStatus()
    pollCount++
  }
  return { status, item }
}
export async function tradeCSGOItems(req, res) {
  const user = await UserModel.findOne({ _id: req.body.userID })

  const appID = req.body.appID
  const version = req.body.version
  const adminItems = req.body.adminItems
  const userItems = req.body.userItems
  const totalAdmin = req.body.totalAdmin
  const totalUser = req.body.totalUser
  if (user) {
    const offer = manager.createOffer(user.profile.steam.steamTradeURL)
    // Load recipient's inventory
    const userItemPromises = []
    const adminItemPromises = []
    const priceDifference = Number(totalAdmin) - Number(totalUser)
    if (priceDifference > 0) {
      // Case 2: totalAdmin is greater than totalUser
      // Check if user has enough money in the account
      if (user.wallet >= priceDifference) {
        console.log('deduct money')
        // Deduct money from the user's account and proceed with the trade offer
        user.wallet = Number(user.wallet) - Number(priceDifference)
        // await user.save();
        // Proceed with the trade offer creation and sending
      } else {
        // User does not have enough money, send an error response
        return res
          .status(400)
          .send({ message: 'Insufficient funds in the user account' })
      }
    } else {
      // Case 3: totalAdmin is less than totalUser
      // Add money to the user's account
      console.log('add money')
      user.wallet = Number(user.wallet) + Number(Math.abs(priceDifference))
      // await user.save();
      // Proceed with the trade offer creation and sending
    }

    if (userItems.length > 0) {
      // Iterate through user's inventory and add matching items to the offer
      const addItemPromise = new Promise((resolve, reject) => {
        manager.getUserInventoryContents(
          user.profile.steam.steamID,
          appID,
          version,
          true,
          (err, inventory) => {
            if (err) {
              console.log('err', err)
            } else {
              const classidCounts = {}

              userItems.forEach((user) => {
                inventory.forEach((item) => {
                  if (item.classid === user.classid) {
                    const count = classidCounts[user.classid] || 0
                    if (count < 1) {
                      offer.addTheirItem(item)
                      console.log('add user item')
                      classidCounts[user.classid] = count + 1
                    }
                  }
                })
              })
              resolve()
            }
          }
        )
      })
      userItemPromises.push(addItemPromise)
    }

    if (adminItems.length > 0) {
      // Load admin's inventory and add matching items to the offer
      const loadInventoryPromise = new Promise((resolve, reject) => {
        manager.loadInventory(appID, version, true, (err, inventory) => {
          if (err) {
            reject(err)
          } else {
            const classidCounts = {}
            adminItems.forEach((admin) => {
              inventory.forEach((item) => {
                if (item.classid === admin.classid) {
                  const count = classidCounts[admin.classid] || 0
                  if (count < 1) {
                    offer.addMyItem(item)
                    console.log('add admin item')
                    classidCounts[admin.classid] = count + 1
                  }
                }
              })
            })
            resolve()
          }
        })
      })
      adminItemPromises.push(loadInventoryPromise)
    }

    // Wait for all item addition promises to resolve
    Promise.all([...userItemPromises, ...adminItemPromises])
      .then(() => {
        // All items have been added, send the offer
        offer.send((err, status) => {
          if (err) {
            console.log('err sent', err)
          } else {
            console.log('status', status)
            if (status === 'pending') {
              community.acceptConfirmationForObject(
                process.env.IDENTITY_SECRET,
                offer.id,
                async function (err) {
                  if (err) {
                    console.log(err)
                  } else {
                    console.log('sent trade')
                    io.emit('tradeOfferURL', {
                      tradeOfferURL: `https://steamcommunity.com/tradeoffer/${offer.id}/`,
                    })
                    const { status } = await pollItemStatus(offer.id)
                    if (status === 'ACCEPTED') {
                      console.log('ACCEPTED')

                      io.emit('tradeOfferStatus', {
                        code: 0,
                        message: 'Trade offer has been accepted',
                      })
                      await user.save()
                      // resolve('ACCEPTED')
                    } else {
                      console.log('DENIED')
                      io.emit('tradeOfferStatus', {
                        code: 1,
                        message: 'Trade offer has been declined',
                      })
                      // resolve('DENIED')
                    }
                  }
                }
              )
            } else {
              console.log(`Offer #${offer.id} sent successfully`)
              // resolve('Sent')
            }
          }
        })
      })
      .catch((error) => {
        console.error('Error adding items to the offer:', error)
      })
  } else {
    res.status(404).send({ message: 'User not found' })
  }
}
