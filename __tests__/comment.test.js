import { createComment, getCommentByProductID } from '../controllers/comment.js'
import {
  createCommentSchema,
  getCommentByProductIDSchema,
} from '../helpers/validation_schema.js'
import { CommentModel } from '../models/comment.js'

jest.mock('../helpers/validation_schema.js')
jest.mock('../models/comment.js')
describe('getCommentByProductID', () => {
  const req = {
    body: {
      productID: 'product-123',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should fetch comments by product ID and send them as a response', async () => {
    const comments = [
      {
        _id: '64a7b8f9eebdc05abc30e0bb',
        commenter: {
          _id: '6471ab7dbc43a4483a56911b',
          fullName: 'Phát Lý',
          avatar:
            'http://res.cloudinary.com/dzje1nabd/image/upload/v1688711993/n4y8kgobwnrmnnnwje1l.jpg',
          slug: 'phát-lý-d25f7472-98d3-43ea-b5b0-b76d727a3ef6',
          displayName: 'Fap Velder',
        },
        product: '64a695e3f200efe55a9b3595',
        comment: 'Hee',
        createdAt: '2023-07-07T07:04:25.663Z',
        updatedAt: '2023-07-07T07:04:25.663Z',
        __v: 0,
      },
      {
        _id: '64a7b7f43c9a44b4064bd79c',
        commenter: {
          _id: '6471ab7dbc43a4483a56911b',
          fullName: 'Phát Lý',
          avatar:
            'http://res.cloudinary.com/dzje1nabd/image/upload/v1688711993/n4y8kgobwnrmnnnwje1l.jpg',
          slug: 'phát-lý-d25f7472-98d3-43ea-b5b0-b76d727a3ef6',
          displayName: 'Fap Velder',
        },
        product: '64a695e3f200efe55a9b3595',
        comment: 'Hi there',
        createdAt: '2023-07-07T07:00:04.144Z',
        updatedAt: '2023-07-07T07:00:04.144Z',
        __v: 0,
      },
    ]
    getCommentByProductIDSchema.validateAsync.mockResolvedValue()

    const findMock = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(comments),
    }
    CommentModel.find.mockReturnValueOnce(findMock)
    await getCommentByProductID(req, res)

    expect(getCommentByProductIDSchema.validateAsync).toHaveBeenCalledWith(
      req.body
    )
    expect(CommentModel.find).toHaveBeenCalledWith({
      product: req.body.productID,
    })
    expect(findMock.populate).toHaveBeenCalledWith(
      'commenter',
      'slug fullName displayName avatar'
    )

    expect(findMock.sort).toHaveBeenCalledWith({ createdAt: -1 })
    expect(findMock.exec).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(comments)
  })
  test('should send an error response if the database operation fails', async () => {
    const error = new Error('Database error')

    getCommentByProductIDSchema.validateAsync.mockResolvedValue()

    const findMock = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValueOnce(error),
    }

    CommentModel.find.mockReturnValueOnce(findMock)

    await getCommentByProductID(req, res)

    expect(getCommentByProductIDSchema.validateAsync).toHaveBeenCalledWith(
      req.body
    )
    expect(CommentModel.find).toHaveBeenCalledWith({
      product: req.body.productID,
    })
    expect(findMock.populate).toHaveBeenCalledWith(
      'commenter',
      'slug fullName displayName avatar'
    )
    expect(findMock.sort).toHaveBeenCalledWith({ createdAt: -1 })
    expect(findMock.exec).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})

describe('Create a Comment', () => {
  const req = {
    body: {
      userID: 'commenter-123',
      comment: 'This is a comment',
      productID: 'product-123',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should create a comment and return success response', async () => {
    createCommentSchema.validateAsync.mockResolvedValue()
    CommentModel.mockReturnValueOnce({
      save: jest.fn().mockResolvedValue(),
    })

    await createComment(req, res)

    expect(createCommentSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(CommentModel).toHaveBeenCalledWith({
      commenter: req.body.userID,
      comment: req.body.comment,
      product: req.body.productID,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith('Comment successfully')
  })

  test('should handle error and return error response', async () => {
    const errorMessage = 'Something went wrong'

    createCommentSchema.validateAsync.mockResolvedValue()

    CommentModel.mockReturnValueOnce({
      save: jest.fn().mockRejectedValue(new Error(errorMessage)),
    })

    await createComment(req, res)

    expect(createCommentSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(CommentModel).toHaveBeenCalledWith({
      commenter: req.body.userID,
      comment: req.body.comment,
      product: req.body.productID,
    })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: errorMessage })
  })
})
