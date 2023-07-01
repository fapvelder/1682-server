import { getUserFeedback } from '../controllers/feedback.js'
import { isAdmin } from '../utils.js'

import express from 'express'

const router = express.Router()
router.post('/get', getUserFeedback)

export default router
