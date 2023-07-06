import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    message: String,
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    url: { type: String },
  },
  { timestamps: true }
)

export const NotificationModel = mongoose.model(
  'Notification',
  notificationSchema
)
