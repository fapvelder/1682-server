import express from 'express'
import {
  authSteam,
  getInformation,
  getItem,
  getPriceItem,
  getParams,
  steamReturn,
  handleAuthError,
  deleteSteamID,
  updateSteamURL,
  getSteamItem,
  checkStatus,
  sendSteamItem,
} from '../controllers/steam.js'
import { isAuth } from '../utils.js'

const router = express.Router()

// router.post('/auth/steam/', authSteam)

router.get('/auth/steam/return/', authSteam, steamReturn)
router.put('/item', getItem)
router.post('/get-price', getPriceItem)
router.post('/information', getInformation)
router.post('/delete', deleteSteamID)
router.put('/update/steamURL', updateSteamURL)
router.post('/getItem', getSteamItem)
router.post('/sendItem', sendSteamItem)
router.post('/checkStatus', checkStatus)

export default router
