import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    message: String,
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

export const NotificationModel = mongoose.model(
  'Notification',
  notificationSchema
)
