import {
  getAllNotifications,
  sendNotification,
  deleteNotification,
} from '../controllers/notification.js'
import { NotificationModel } from '../models/notification.js'
import { UserModel } from '../models/user.js'
import {
  sendNotificationSchema,
  deleteNotificationSchema,
} from '../helpers/validation_schema.js'

jest.mock('../models/notification.js')
jest.mock('../models/user.js')
jest.mock('../helpers/validation_schema.js')
const req = {
  body: {
    userID: 'user-123',
  },
}

const res = {
  status: jest.fn(() => res),
  send: jest.fn(),
  json: jest.fn(),
}

const notifications = [
  { _id: 'notification-1', message: 'Notification 1', userID: 'user-123' },
  { _id: 'notification-2', message: 'Notification 2', userID: 'user-123' },
]

describe('get all notifications', () => {
  test('get all notifications with success response', async () => {
    NotificationModel.find.mockResolvedValue(notifications)
    await getAllNotifications(req, res)
    expect(NotificationModel.find).toHaveBeenCalledWith({
      userID: req.body.userID,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(notifications)
  })
  test('should handle error and return error response', async () => {
    const error = new Error('Test Error')
    NotificationModel.find.mockRejectedValue(error)

    await getAllNotifications(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})

describe('send notification', () => {
  beforeEach(() => jest.clearAllMocks())

  test('send notification with success response', async () => {
    const userID = 'user-123'
    const message = 'Someone have purchased your item'
    const user = {
      _id: 'user-123',
      name: 'user123',
    }
    const newNotification = {
      save: jest.fn(),
      userID: 'user-123',
      message: 'Someone have purchased your item',
    }
    sendNotificationSchema.validateAsync.mockResolvedValue()
    UserModel.findOne.mockResolvedValue(user)
    NotificationModel.mockImplementationOnce(() => newNotification)
    await sendNotification(userID, message)
    expect(sendNotificationSchema.validateAsync).toHaveBeenCalledWith({
      userID,
      message,
    })
    expect(UserModel.findOne).toHaveBeenCalledWith({ _id: userID })
    expect(NotificationModel).toHaveBeenCalledWith({
      message: message,
      userID: user._id,
    })
  })
})
describe('delete notifications', () => {
  const req = {
    params: {
      id: 'notification-1',
    },
  }

  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
    json: jest.fn(),
  }

  beforeEach(() => jest.clearAllMocks())
  test('delete a notification with success response', async () => {
    const deletedNotification = {
      _id: 'notification-1',
      message: 'Notification 1',
      userID: 'user-123',
    }
    deleteNotificationSchema.validateAsync.mockResolvedValue()
    NotificationModel.findByIdAndDelete.mockResolvedValue(deletedNotification)
    await deleteNotification(req, res)
    expect(deleteNotificationSchema.validateAsync).toHaveBeenCalledWith(
      req.params
    )
    expect(NotificationModel.findByIdAndDelete).toHaveBeenCalledWith(
      req.params.id,
      { new: true }
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(deletedNotification)
  })
})
