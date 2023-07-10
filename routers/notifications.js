import {
  deleteNotification,
  getAllNotifications,
  sendNotification,
} from '../controllers/notification.js'
import express from 'express'
import { isAuth } from '../utils.js'
const router = express.Router()

router.post('/', isAuth, getAllNotifications)
router.post('/send', isAuth, sendNotification)
router.delete('/delete/:id', isAuth, deleteNotification)

export default router
