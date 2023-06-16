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
export default router
