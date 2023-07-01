import { io } from '../index.js'
import { NotificationModel } from '../models/notification.js'
import { UserModel } from '../models/user.js'
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({
      userID: req.body.userID,
    })
    res.status(200).send(notifications)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const sendNotification = async (userID, message) => {
  try {
    const user = await UserModel.findOne({ _id: userID })
    if (user) {
      const newNotification = new NotificationModel({
        message: message,
        userID: user._id,
      })
      await newNotification.save()
      //   io.to(user.socketID).emit('newNotification', notification)
    }
  } catch (err) {
    console.error('Error saving notification:', err)
  }
}
export const deleteNotification = async (req, res) => {
  try {
    const deleteNotification = req.params.id
    const notification = await NotificationModel.findByIdAndDelete(
      deleteNotification,
      {
        new: true,
      }
    )
    res.status(200).json(notification)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
