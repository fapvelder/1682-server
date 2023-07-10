import { getFeedback, getUserFeedback } from '../controllers/feedback.js'
import { FeedbackModel } from '../models/order.js'
import { UserModel } from '../models/user.js'

jest.mock('../helpers/validation_schema.js')
jest.mock('../models/order.js')
jest.mock('../models/user.js')

describe('get a user feedback', () => {
  const req = {
    body: {
      slug: 'user-slug-123',
      rating: 'Good',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }
  const user = {
    _id: 'user-123',
    slug: 'user-slug-123',
  }
  const feedbacks = [
    {
      _id: 'feedback-123',
      feedBackOn: 'user-123',
      order: 'order-123',
      user: 'user-456',
      rating: 'Good',
      comment: 'This is a feedback',
    },
  ]
  beforeEach(() => jest.clearAllMocks())
  test('get a user feedback with success response', async () => {
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(feedbacks),
    }
    UserModel.findOne.mockResolvedValue(user)
    FeedbackModel.find.mockReturnValueOnce(findMock)

    await getUserFeedback(req, res)
    expect(UserModel.findOne).toHaveBeenCalledWith({ slug: req.body.slug })
    expect(FeedbackModel.find).toHaveBeenCalledWith({
      feedbackOn: user._id,
      rating: req.body.rating,
    })
    expect(findMock.populate).toHaveBeenCalledWith(
      'user',
      'displayName fullName'
    )
    expect(findMock.populate).toHaveBeenCalledWith({
      path: 'order',
      populate: {
        path: 'product',
        select: 'title',
        populate: { path: 'category', select: 'name' },
      },
    })
    expect(findMock.exec).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(feedbacks)
  })
  test('database error with failure response', async () => {
    const error = new Error('database error')
    UserModel.findOne.mockResolvedValue(user)
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(error),
    }
    FeedbackModel.find.mockReturnValueOnce(findMock)
    await getUserFeedback(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
describe('get feedback on a user', () => {
  const req = {
    body: {
      userID: 'user-123',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }

  const feedbacks = [
    {
      _id: 'feedback-123',
      feedBackOn: 'user-123',
      order: 'order-123',
      user: 'user-456',
      rating: 'Good',
      comment: 'This is a feedback',
    },
  ]
  beforeEach(() => jest.clearAllMocks())

  test('get feedbacks on a user with success response', async () => {
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(feedbacks),
    }
    FeedbackModel.find.mockReturnValueOnce(findMock)
    await getFeedback(req, res)
    expect(FeedbackModel.find).toHaveBeenCalledWith({
      feedbackOn: req.body.userID,
    })
    expect(findMock.populate).toHaveBeenCalledWith(
      'user',
      'displayName fullName'
    )
    expect(findMock.populate).toHaveBeenCalledWith({
      path: 'order',
      populate: {
        path: 'product',
        select: 'title',
        populate: { path: 'category', select: 'name' },
      },
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(feedbacks)
  })
  test('database error with failure response', async () => {
    const error = new Error('database error')
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(error),
    }
    FeedbackModel.find.mockReturnValueOnce(findMock)
    await getFeedback(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
