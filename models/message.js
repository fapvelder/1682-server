import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    chatUsers: {
      type: Array,
      require: true,
    },
    message: {
      type: String,
      require: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
    },
  },
  {
    timestamps: true,
  }
)
export const MessageModel = mongoose.model('Message', messageSchema)
