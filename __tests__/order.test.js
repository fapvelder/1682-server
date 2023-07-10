import {
  getOrders,
  getOrderDetails,
  buyProduct,
  getItemOrder,
  completeOrder,
  feedbackOrder,
  transferItem,
  cancelOrder,
} from '../controllers/order.js'
import { sendSteamItem } from '../controllers/steam.js'
import {
  buyProductSchema,
  cancelOrderSchema,
  completeOrderSchema,
  feedbackOrderSchema,
  getItemOrderSchema,
  transferItemSchema,
} from '../helpers/validation_schema.js'
import { FeedbackModel, OrderModel } from '../models/order.js'
import { ProductModel } from '../models/product.js'
import { UserModel } from '../models/user.js'

jest.mock('../models/order.js')
jest.mock('../models/product.js')
jest.mock('../helpers/validation_schema.js')
jest.mock('../models/user.js')
jest.mock('../controllers/steam.js', () => ({
  sendSteamItem: jest.fn(),
}))
describe('getOrders', () => {
  const req = {}
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should fetch orders and send them as a response', async () => {
    const orders = [{}, {}]

    const findMock = {
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(orders),
    }
    OrderModel.find.mockReturnValueOnce(findMock)

    await getOrders(req, res)

    expect(OrderModel.find).toHaveBeenCalledWith({})

    expect(findMock.populate).toHaveBeenCalledWith({
      path: 'product',
      populate: [
        { path: 'category', model: 'Category' },
        { path: 'platform', model: 'Platform' },
      ],
    })
    expect(findMock.populate).toHaveBeenCalledWith(
      'buyer',
      'fullName displayName slug avatar profile'
    )
    expect(findMock.populate).toHaveBeenCalledWith(
      'seller',
      'fullName displayName slug avatar profile'
    )

    expect(findMock.sort).toHaveBeenCalledTimes(1)
    expect(findMock.sort).toHaveBeenCalledWith({ createdAt: -1 })

    expect(findMock.exec).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(orders)
  })

  test('should send an error response if the database operation fails', async () => {
    const error = new Error('Database error')
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValueOnce(error),
    }
    OrderModel.find.mockReturnValueOnce(findMock)

    await getOrders(req, res)

    expect(OrderModel.find).toHaveBeenCalledTimes(1)
    expect(OrderModel.find).toHaveBeenCalledWith({})

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
describe('getOrderDetails', () => {
  const req = {
    body: {
      orderID: 'order-123',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should fetch order details and send them as a response', async () => {
    const order = {}
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(order),
    }

    OrderModel.findOne.mockReturnValueOnce(findMock)

    await getOrderDetails(req, res)

    expect(OrderModel.findOne).toHaveBeenCalledTimes(1)
    expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: req.body.orderID })

    expect(findMock.populate).toHaveBeenCalledTimes(3)
    expect(findMock.populate).toHaveBeenCalledWith({
      path: 'product',
      populate: [
        { path: 'category', model: 'Category' },
        { path: 'platform', model: 'Platform' },
      ],
    })
    expect(findMock.populate).toHaveBeenCalledWith(
      'buyer',
      'fullName displayName slug avatar profile'
    )
    expect(findMock.populate).toHaveBeenCalledWith(
      'seller',
      'fullName displayName slug avatar profile'
    )

    expect(findMock.exec).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(order)
  })

  test('should send an error response if the database operation fails', async () => {
    const error = new Error('Database error')
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValueOnce(error),
    }

    OrderModel.findOne.mockReturnValueOnce(findMock)

    await getOrderDetails(req, res)

    expect(OrderModel.findOne).toHaveBeenCalledTimes(1)
    expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: req.body.orderID })

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
describe('buyProduct', () => {
  const req = {
    body: {
      productID: 'product-123',
      userID: 'user-123',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should buy a product and create an order', async () => {
    const product = {
      _id: 'product-123',
      listingBy: 'seller-123',
      price: 100,
      isAvailable: true,
      status: 'Available',
      save: jest.fn(),
    }
    const user = {
      _id: 'user-123',
      profile: {
        steam: {
          steamTradeURL: 'https://steamtradeurl.com',
        },
      },
      wallet: 200,
      save: jest.fn(),
    }
    const order = {
      _id: 'order-123',
      product: 'product-123',
      seller: 'seller-123',
      buyer: 'user-123',
      status: 'Pending',
      isBotSent: false,
      isFeedback: false,
      isTransfer: false,
      save: jest.fn(),
    }

    buyProductSchema.validateAsync.mockResolvedValue()
    ProductModel.findOne.mockResolvedValueOnce(product)
    UserModel.findOne.mockResolvedValueOnce(user)
    OrderModel.mockReturnValueOnce(order)

    await buyProduct(req, res)

    expect(buyProductSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(ProductModel.findOne).toHaveBeenCalledWith({
      _id: req.body.productID,
    })
    expect(UserModel.findOne).toHaveBeenCalledWith({ _id: req.body.userID })

    expect(product.isAvailable).toBe(false)
    expect(product.status).toBe('Sold')
    expect(user.wallet).toBe(100)
    expect(order.save).toHaveBeenCalledTimes(1)

    expect(product.save).toHaveBeenCalledTimes(1)
    expect(user.save).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(order)
  })

  test('should send an error response if the database operation fails', async () => {
    const error = new Error('Database error')

    buyProductSchema.validateAsync.mockResolvedValue()
    ProductModel.findOne.mockRejectedValueOnce(error)

    await buyProduct(req, res)

    expect(buyProductSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(ProductModel.findOne).toHaveBeenCalledWith({
      _id: req.body.productID,
    })

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })

  // Add more test cases to cover other error scenarios in the buyProduct function
})
describe('getItemOrder', () => {
  const req = {
    body: {
      orderID: 'order-123',
      userID: 'user-123',
      receiverID: 'receiver-123',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should fetch item order and send the response', async () => {
    const order = {
      _id: 'order-123',
      seller: {
        _id: 'user-123',
      },
      buyer: {
        _id: 'receiver-123',
      },
      isBotSent: false,
      save: jest.fn(),
    }
    const orderStatus = 'ACCEPTED'

    getItemOrderSchema.validateAsync.mockResolvedValue()
    OrderModel.findOne.mockResolvedValueOnce(order)
    sendSteamItem.mockResolvedValueOnce(orderStatus)

    await getItemOrder(req, res)

    expect(getItemOrderSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: req.body.orderID })

    expect(sendSteamItem).toHaveBeenCalledWith(req)
    expect(order.isBotSent).toBe(true)
    expect(order.save).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith('Trade offer has been accepted')
  })

  test('should send an error response if the database operation fails', async () => {
    const error = new Error('Database error')

    getItemOrderSchema.validateAsync.mockResolvedValue()
    OrderModel.findOne.mockRejectedValueOnce(error)

    await getItemOrder(req, res)

    expect(getItemOrderSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: req.body.orderID })

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })

  // Add more test cases to cover other error scenarios in the getItemOrder function
})
describe('completeOrder', () => {
  const req = {
    body: {
      orderID: 'order-123',
      userID: 'user-123',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should complete the order and send the response', async () => {
    const order = {
      _id: 'order-123',
      status: 'Pending',
      buyer: {
        _id: 'user-123',
      },
      product: {
        _id: 'product-123',
        price: 100,
        status: 'Available',
        save: jest.fn(),
      },
      seller: {
        _id: 'seller-123',
        wallet: 200,
        save: jest.fn(),
      },
      save: jest.fn(),
    }
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(order),
    }
    completeOrderSchema.validateAsync.mockResolvedValue()
    OrderModel.findOne.mockReturnValueOnce(findMock)
    ProductModel.findOne.mockResolvedValueOnce(order.product)
    UserModel.findOne.mockResolvedValueOnce(order.seller)

    await completeOrder(req, res)

    expect(completeOrderSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: req.body.orderID })
    expect(findMock.populate).toHaveBeenCalledWith('product')
    expect(findMock.exec).toHaveBeenCalledTimes(1)

    expect(ProductModel.findOne).toHaveBeenCalledWith({
      _id: order.product._id,
    })
    expect(UserModel.findOne).toHaveBeenCalledWith({ _id: order.seller._id })

    expect(order.status).toBe('Completed')
    expect(order.product.status).toBe('Completed')
    expect(order.seller.wallet).toBe(290)
    expect(order.save).toHaveBeenCalledTimes(1)
    expect(order.product.save).toHaveBeenCalledTimes(1)
    expect(order.seller.save).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith('Order is completed')
  })

  test('should send an error response if the database operation fails', async () => {
    const error = new Error('Database error')
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValueOnce(error),
    }
    completeOrderSchema.validateAsync.mockResolvedValue()
    OrderModel.findOne.mockReturnValueOnce(findMock)

    await completeOrder(req, res)

    expect(completeOrderSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: req.body.orderID })

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
describe('feedbackOrder', () => {
  const req = {
    body: {
      orderID: 'order-123',
      feedback: 'Great service!',
      rating: 5,
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should save the feedback and send the response', async () => {
    const order = {
      _id: 'order-123',
      isFeedback: false,
      buyer: {
        _id: 'buyer-123',
      },
      seller: {
        _id: 'seller-123',
      },
      save: jest.fn(),
    }

    feedbackOrderSchema.validateAsync.mockResolvedValue()
    OrderModel.findOne.mockResolvedValueOnce(order)

    await feedbackOrder(req, res)

    expect(feedbackOrderSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: req.body.orderID })

    expect(order.isFeedback).toBe(true)
    expect(order.save).toHaveBeenCalledTimes(1)

    expect(FeedbackModel).toHaveBeenCalledWith({
      order: req.body.orderID,
      user: order.buyer._id,
      feedbackOn: order.seller._id,
      comment: req.body.feedback,
      rating: req.body.rating,
    })
    expect(FeedbackModel.prototype.save).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith({
      message: 'Feedback has been saved',
    })
  })

  test('should send an error response if the database operation fails', async () => {
    const error = new Error('Database error')

    feedbackOrderSchema.validateAsync.mockResolvedValue()
    OrderModel.findOne.mockRejectedValueOnce(error)

    await feedbackOrder(req, res)

    expect(feedbackOrderSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: req.body.orderID })

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })

  // Add more test cases to cover other error scenarios in the feedbackOrder function
})

describe('transferItem', () => {
  const req = {
    body: {
      orderID: 'order-123',
      userID: 'user-123',
      code: '123456',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should transfer the item and send the response', async () => {
    const order = {
      _id: 'order-123',
      status: 'Pending',
      buyer: {
        _id: 'user-456',
      },
      product: {
        _id: 'product-123',
        price: 100,
        status: 'Available',
        category: {
          _id: 'category-123',
          name: ' Items',
        },
        digitalCode: '',
        save: jest.fn(),
      },
      seller: {
        _id: 'user-123',
        wallet: 200,
        save: jest.fn(),
      },
      save: jest.fn(),
    }

    const findMock = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(order),
    }

    transferItemSchema.validateAsync.mockResolvedValue()
    OrderModel.findOne.mockReturnValueOnce(findMock)
    ProductModel.findOne.mockResolvedValueOnce(order.product)

    await transferItem(req, res)

    expect(transferItemSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: req.body.orderID })
    expect(findMock.populate).toHaveBeenCalledWith({
      path: 'product',
      populate: [
        { path: 'category', model: 'Category' },
        { path: 'platform', model: 'Platform' },
      ],
    })
    expect(findMock.exec).toHaveBeenCalledTimes(1)

    expect(order.seller._id.toString()).toBe(req.body.userID)
    expect(order.product.category.name).not.toBe('Game Items')
    expect(ProductModel.findOne).toHaveBeenCalledWith({
      _id: order.product._id,
    })
    expect(order.product.digitalCode).toBe(req.body.code)
    expect(order.product.save).toHaveBeenCalledTimes(1)
    expect(order.isTransfer).toBe(true)
    expect(order.save).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith({
      message: 'Item has been transferred successfully',
    })
  })
})
describe('cancelOrder', () => {
  const req = {
    body: {
      orderID: 'order-123',
      userID: 'user-123',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should cancel the order and send the response', async () => {
    const order = {
      _id: 'order-123',
      status: 'Pending',
      buyer: {
        _id: 'user-123',
        wallet: 50,
        save: jest.fn(),
      },
      product: {
        _id: 'product-123',
        price: 10,
        isAvailable: false,
        status: 'Sold',
        save: jest.fn(),
      },
      save: jest.fn(),
    }
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(order),
    }
    cancelOrderSchema.validateAsync.mockResolvedValue()
    OrderModel.findOne.mockReturnValueOnce(findMock)
    ProductModel.findOne.mockResolvedValueOnce(order.product)
    UserModel.findOne.mockResolvedValueOnce(order.buyer)

    await cancelOrder(req, res)

    expect(cancelOrderSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: req.body.orderID })
    expect(findMock.populate).toHaveBeenCalledWith('product')
    expect(findMock.exec).toHaveBeenCalledTimes(1)
    expect(order.status).toBe('Cancelled')
    expect(order.buyer._id.toString()).toBe(req.body.userID)
    expect(order.product.isAvailable).toBe(true)
    expect(order.product.status).toBe('On Sale')
    expect(order.save).toHaveBeenCalledTimes(1)

    expect(ProductModel.findOne).toHaveBeenCalledWith({
      _id: order.product._id,
    })
    expect(order.product.isAvailable).toBe(true)
    expect(order.product.status).toBe('On Sale')
    expect(order.product.save).toHaveBeenCalledTimes(1)

    expect(UserModel.findOne).toHaveBeenCalledWith({ _id: order.buyer._id })
    expect(order.buyer.wallet).toBe(60)
    expect(order.buyer.save).toHaveBeenCalledTimes(1)

    expect(res.send).toHaveBeenCalledWith({
      message: 'Order has been cancelled',
    })
  })

  test('should send an error response if the database operation fails', async () => {
    const error = new Error('Database error')
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValueOnce(error),
    }
    cancelOrderSchema.validateAsync.mockResolvedValue()
    OrderModel.findOne.mockReturnValueOnce(findMock)

    await cancelOrder(req, res)

    expect(cancelOrderSchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: req.body.orderID })

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })

  // Add more test cases to cover other error scenarios in the cancelOrder function
})
