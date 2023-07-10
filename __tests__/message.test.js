import {
  getLastMessage,
  getMessage,
  sendMessage,
} from '../controllers/message.js'
import { sendMessageSchema } from '../helpers/validation_schema.js'
import { MessageModel } from '../models/message.js'

jest.mock('../helpers/validation_schema.js')
jest.mock('../models/user.js')
jest.mock('../models/message.js')

describe('send a message', () => {
  const req = {
    body: {
      from: 'user-123',
      to: 'user-456',
      message: 'Hello world',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }
  const user = [
    {
      _id: 'user-123',
      name: 'User123',
    },
    {
      _id: 'user-456',
      name: 'User456',
    },
  ]
  beforeEach(() => jest.clearAllMocks())
  test('send a message with success response', async () => {
    sendMessageSchema.validateAsync.mockResolvedValue()
    const newMessage = {
      message: 'This is a message',
      chatUsers: ['user-123', 'user-456'],
      sender: 'user-123',
    }
    MessageModel.create.mockResolvedValue(newMessage)
    await sendMessage(req, res)
    expect(sendMessageSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(MessageModel.create).toHaveBeenCalledWith({
      message: req.body.message,
      chatUsers: [req.body.from, req.body.to],
      sender: req.body.from,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(newMessage)
  })
  test('database error with failure response', async () => {
    const error = new Error('database error')
    sendMessageSchema.validateAsync.mockResolvedValue()
    MessageModel.create.mockRejectedValue(error)
    await sendMessage(req, res)
    expect(sendMessageSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
describe('get messages', () => {
  const req = {
    params: {
      user1Id: 'user-123',
      user2Id: 'user-456',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }
  const messages = [
    {
      _id: 'message-1',
      sender: 'user-123',
      message: 'Hello',
    },
    {
      _id: 'message-2',
      sender: 'user-456',
      message: 'Hi',
    },
  ]

  test('get all messages with success response', async () => {
    MessageModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(messages),
    })
    await getMessage(req, res)
    expect(MessageModel.find).toHaveBeenCalledWith({
      chatUsers: {
        $all: [req.params.user1Id, req.params.user2Id],
      },
    })
    expect(MessageModel.find().sort).toHaveBeenCalledWith({ updatedAt: 1 })
    expect(MessageModel.find().sort().exec).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith([
      {
        id: 'message-1',
        myself: true,
        message: 'Hello',
      },
      {
        id: 'message-2',
        myself: false,
        message: 'Hi',
      },
    ])
  })
  test('should handle error and return error response', async () => {
    const error = new Error('Database Error')
    MessageModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(error),
    })

    await getMessage(req, res)

    expect(MessageModel.find).toHaveBeenCalledWith({
      chatUsers: {
        $all: [req.params.user1Id, req.params.user2Id],
      },
    })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
describe('get last message', () => {
  const req = {
    params: {
      user1Id: 'user-1',
      user2Id: 'user-2',
    },
  }

  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }

  const lastMessage = {
    _id: 'message-1',
    sender: 'user-1',
    message: 'Hello',
  }

  beforeEach(() => jest.clearAllMocks)

  test('should fetch the last message between users and return success response', async () => {
    MessageModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(lastMessage),
    })
    await getLastMessage(req, res)

    expect(MessageModel.findOne).toHaveBeenCalledWith({
      chatUsers: {
        $all: [req.params.user1Id, req.params.user2Id],
      },
    })
    // expect(MessageModel.find().sort).toHaveBeenCalledWith({ updatedAt: 1 })
    expect(MessageModel.findOne().sort).toHaveBeenCalledWith({ updatedAt: -1 })
    expect(MessageModel.findOne().sort().exec).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith({
      id: 'message-1',
      myself: true,
      message: 'Hello',
    })
  })

  test('should handle error and return error response', async () => {
    const error = new Error('Test Error')

    MessageModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(error),
    })

    await getLastMessage(req, res)

    expect(MessageModel.findOne).toHaveBeenCalledWith({
      chatUsers: {
        $all: [req.params.user1Id, req.params.user2Id],
      },
    })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
