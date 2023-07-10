import { getFeedback, getUserFeedback } from '../controllers/feedback.js'
import { isAdmin, isAuth } from '../utils.js'

import express from 'express'

const router = express.Router()
router.post('/get', isAuth, getUserFeedback)
router.post('/getRating', isAuth, getFeedback)

export default router
