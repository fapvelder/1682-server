import express from 'express'
import {
  getLastMessage,
  getMessage,
  haveChattedBefore,
  sendMessage,
} from '../controllers/message.js'
// import { isAuth, isAdmin } from '../utils.js'
const router = express.Router()

router.post('/sendMessage', sendMessage)
router.get('/get/msg/:user1Id/:user2Id', getMessage)
router.get('/get/lastMsg/:user1Id/:user2Id', getLastMessage)
router.post('/have-chatted-before', haveChattedBefore)
export default router
