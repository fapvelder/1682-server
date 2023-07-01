import {
  deleteNotification,
  getAllNotifications,
  sendNotification,
} from '../controllers/notification.js'
import express from 'express'
const router = express.Router()

router.post('/', getAllNotifications)
router.post('/send', sendNotification)
router.delete('/delete/:id', deleteNotification)

export default router
