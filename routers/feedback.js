import { getFeedback, getUserFeedback } from '../controllers/feedback.js'
import { isAdmin } from '../utils.js'

import express from 'express'

const router = express.Router()
router.post('/get', getUserFeedback)
router.post('/getRating', getFeedback)

export default router
