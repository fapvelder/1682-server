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
} from '../controllers/steam.js'
import { isAuth } from '../utils.js'

const router = express.Router()

router.get('/auth/steam/return/', authSteam, isAuth, steamReturn)
router.put('/item', isAuth, getItem)
router.post('/get-price', isAuth, getPriceItem)
router.post('/information', isAuth, getInformation)
router.post('/delete', isAuth, deleteSteamID)
router.put('/update/steamURL', isAuth, updateSteamURL)
router.post('/getItem', isAuth, getSteamItem)
router.post('/sendItem', isAuth, sendSteamItem)
router.post('/checkStatus', isAuth, checkStatus)

export default router
