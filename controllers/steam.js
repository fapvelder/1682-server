// Controller
import session from 'express-session'
import passport from 'passport'
import express from 'express'
import { Strategy as SteamStrategy } from 'passport-steam'
import {
  SteamInventoryIterator,
  PrivateInventoryError,
  getInventory,
} from 'steam-inventory-iterator'
import SteamMarketFetcher from 'steam-market-fetcher'
import { generateSteamToken } from '../utils.js'
import jwt from 'jsonwebtoken'
import { UserModel } from '../models/user.js'
import convertor from 'steam-id-convertor'
import market from 'steam-market-pricing'
import SteamTradeOffers from 'steam-tradeoffers'

const app = express()
app.use(passport.initialize())
app.use(passport.session())
const offers = new SteamTradeOffers()

passport.use(
  new SteamStrategy(
    {
      returnURL: 'http://localhost:5000/steam/auth/steam/return',
      realm: 'http://localhost:5000/',
      apiKey: 'A2491051D5688C195EFF726164CB0E06',
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
    res.redirect('http://localhost:3000/settings')
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

    const lastItemRetrieval = user.profile.steam.lastItemRetrieval
    if (lastItemRetrieval && currentTime - lastItemRetrieval < cooldownPeriod) {
      return res
        .status(403)
        .json({ message: 'You can only refresh inventory every 3 hours' })
    }

    const items = await getInventory(steamID, 730, 2)
    if (items) {
      user.profile.steam.steamInventory = items
      user.profile.steam.lastItemRetrieval = currentTime
      await user.save()
      res.status(200).send('Refreshed inventory successfully')
    } else {
      res.status(404).json({ message: 'Failed to retrieve items' })
    }
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
    console.error('An error occurred: ')
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
