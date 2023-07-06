import { MessageModel } from '../models/message.js'
import { UserModel } from '../models/user.js'
import bcrypt from 'bcryptjs'
import { v2 as cloudinary } from 'cloudinary'
import jwt from 'jsonwebtoken'
export const sendMessage = async (req, res) => {
  try {
    const { from, to, message } = req.body
    const newMessage = await MessageModel.create({
      message: message,
      chatUsers: [from, to],
      sender: from,
    })
    return res.status(200).json(newMessage)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
export const getMessage = async (req, res) => {
  try {
    const from = req.params.user1Id
    const to = req.params.user2Id
    const newMessage = await MessageModel.find({
      chatUsers: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 })
    const allMessages = newMessage.map((msg) => {
      return {
        id: msg._id,
        myself: msg.sender.toString() === from,
        message: msg.message,
      }
    })
    return res.status(200).json(allMessages)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
export const getLastMessage = async (req, res) => {
  try {
    const from = req.params.user1Id
    const to = req.params.user2Id

    const lastMessage = await MessageModel.findOne({
      chatUsers: {
        $all: [from, to],
      },
    }).sort({ updatedAt: -1 })

    if (!lastMessage) {
      return res.status(200).json(null) // Return null if there are no messages
    }

    const formattedMessage = {
      id: lastMessage._id,
      myself: lastMessage.sender.toString() === from,
      message: lastMessage.message,
    }

    return res.status(200).json(formattedMessage)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
export const haveChattedBefore = async (req, res) => {
  try {
    const id = req.body._id
    const allUsers = await UserModel.find({})
    const chattedUsers = []
    for (const user of allUsers) {
      const users = user._id.toString()
      if (id !== users) {
        const from = id
        const to = users
        const message = await MessageModel.find({
          chatUsers: {
            $all: [from, to],
          },
        }).sort({ updatedAt: 1 })

        if (message.length > 0) {
          chattedUsers.push(users)
        }
      }
    }
    res.send(chattedUsers)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
