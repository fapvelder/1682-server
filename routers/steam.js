import express from 'express'
import {
  authSteam,
  getInformation,
  getItem,
  getPriceItem,
  steamReturn,
  deleteSteamID,
  updateSteamURL,
  getSteamItem,
  checkStatus,
  sendSteamItem,
  getInventory,
  tradeCSGOItems,
  redirect,
  authenticate,
} from '../controllers/steam.js'
import { isAuth } from '../utils.js'

const router = express.Router()

// router.get('/auth/steam/return/', authSteam, steamReturn)
// router.get('/auth/steam/return/', authenticate)
// router.get('/auth/steam/', authenticate)
router.put('/item', isAuth, getItem)
router.post('/get-price', isAuth, getPriceItem)
router.post('/information', isAuth, getInformation)
router.post('/delete', isAuth, deleteSteamID)
router.put('/update/steamURL', isAuth, updateSteamURL)
router.post('/getItem', isAuth, getSteamItem)
router.post('/sendItem', isAuth, sendSteamItem)
router.post('/checkStatus', isAuth, checkStatus)
router.post('/inventory/', getInventory)
router.post('/trade/csgo', tradeCSGOItems)
router.get('/auth/steam/return/', redirect)
router.get('/auth/steam/authenticate', authenticate)
// router.get('/inventory/user', getUserInventory)
export default router
