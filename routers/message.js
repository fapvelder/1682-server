import express from 'express'
import {
  getLastMessage,
  getMessage,
  haveChattedBefore,
  sendMessage,
} from '../controllers/message.js'
import { isAuth } from '../utils.js'
// import { isAuth, isAdmin } from '../utils.js'
const router = express.Router()

router.post('/sendMessage', isAuth, sendMessage)
router.get('/get/msg/:user1Id/:user2Id', isAuth, getMessage)
router.get('/get/lastMsg/:user1Id/:user2Id', isAuth, getLastMessage)
router.post('/have-chatted-before', isAuth, haveChattedBefore)
export default router
