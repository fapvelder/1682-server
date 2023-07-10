import { sendMessageChatGPT } from '../controllers/chatGPT.js'

import express from 'express'

const router = express.Router()
router.post('/chat', sendMessageChatGPT)

export default router
