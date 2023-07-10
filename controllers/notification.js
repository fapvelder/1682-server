import {
  deleteNotificationSchema,
  sendNotificationSchema,
} from '../helpers/validation_schema.js'
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
    await sendNotificationSchema.validateAsync({ userID, message })
    const user = await UserModel.findOne({ _id: userID })
    if (user) {
      const newNotification = new NotificationModel({
        message: message,
        userID: user._id,
      })
      await newNotification.save()
    }
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const deleteNotification = async (req, res) => {
  try {
    await deleteNotificationSchema.validateAsync(req.params)
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
