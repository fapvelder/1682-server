import {
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  getCategory,
} from '../controllers/category.js'
import {
  createCategorySchema,
  createSubCategorySchema,
  deleteCategorySchema,
  deleteSubCategorySchema,
} from '../helpers/validation_schema.js'
import { CategoryModel } from '../models/category.js'
import { v2 as cloudinary } from 'cloudinary'

jest.mock('../helpers/validation_schema.js')
jest.mock('../models/category.js')
jest.mock('cloudinary')

describe('get all categories', () => {
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }
  afterEach(() => jest.clearAllMocks())
  test('Should fetch all categories', async () => {
    const mockCategories = [
      {
        _id: '646b3b5c326a6ef74bc1e280',
        name: 'Game Items',
        image:
          'http://res.cloudinary.com/dzje1nabd/image/upload/v1684749148/v3g1wks4dcgcgc0nhuyo.png',
        categoryDesc: 'Game',
        subCategory: [
          {
            subCategoryName: {
              _id: '64673023aa485d63989bdc7a',
              name: 'Steam',
              __v: 0,
            },
            title: 'CS:GO',
            image:
              'http://res.cloudinary.com/dzje1nabd/image/upload/v1684749169/pm24abidfey0agkhsnlk.png',
            _id: '646b3b71326a6ef74bc1e2b9',
          },
          {
            subCategoryName: {
              _id: '64673023aa485d63989bdc7a',
              name: 'Steam',
              __v: 0,
            },
            title: 'Steam Items',
            image:
              'http://res.cloudinary.com/dzje1nabd/image/upload/v1687272282/ialahnnxersgjlsp7moc.png',
            _id: '6491bb59bccf365b1b9b2e3e',
          },
        ],
        __v: 0,
      },
    ]
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockCategories),
    }
    CategoryModel.find.mockReturnValueOnce(findMock)
    await getCategory({}, res)
    expect(CategoryModel.find).toHaveBeenCalledWith({})
    expect(findMock.populate).toHaveBeenCalledWith(
      'subCategory.subCategoryName'
    )
    expect(findMock.lean).toHaveBeenCalledTimes(1)
    expect(res.send).toHaveBeenCalledWith(mockCategories)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  test('should send an error response if the database operation fails', async () => {
    const error = new Error('Database error')
    const findMock = {
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(error),
    }
    CategoryModel.find.mockReturnValueOnce(findMock)
    await getCategory({}, res)
    expect(CategoryModel.find).toHaveBeenCalledWith({})
    expect(findMock.populate).toHaveBeenCalledWith(
      'subCategory.subCategoryName'
    )
    expect(findMock.lean).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
describe('create a category with cloudinary', () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
    send: jest.fn(),
  }
  const req = {
    body: {
      name: 'Test Category',
      img: 'test-image-url',
      categoryDesc: 'Test Category Description',
    },
  }
  const next = jest.fn()

  afterEach(() => jest.clearAllMocks())
  test('Should create a category and return success response', async () => {
    const uploadedResponse = {
      url: 'uploaded-image-url',
    }
    const saveMock = jest.fn()
    const categoryInstance = {
      save: saveMock,
      _id: 'category-123',
      name: req.body.name,
      image: uploadedResponse.url,
      categoryDesc: req.body.categoryDesc,
    }
    cloudinary.uploader.upload.mockResolvedValueOnce(uploadedResponse)
    CategoryModel.mockImplementationOnce(() => categoryInstance)
    await createCategory(req, res, next)

    expect(createCategorySchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith(req.body.img)
    expect(CategoryModel).toHaveBeenCalledWith({
      name: req.body.name,
      image: uploadedResponse.url,
      categoryDesc: req.body.categoryDesc,
    })
    expect(saveMock).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(categoryInstance)
    expect(next).not.toHaveBeenCalled()
  })

  test('should handle other errors and call the next middleware', async () => {
    const otherError = new Error('Other Error')

    createCategorySchema.validateAsync.mockRejectedValueOnce(otherError)

    await createCategory(req, res, next)

    expect(createCategorySchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(next).toHaveBeenCalledWith(otherError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
    expect(res.send).not.toHaveBeenCalled()
  })
})
describe('delete a category', () => {
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }
  const req = {
    params: {
      id: 'category-123',
    },
  }
  beforeEach(() => jest.clearAllMocks())
  test('delete a category with success response', async () => {
    deleteCategorySchema.validateAsync.mockResolvedValue()
    const deletedCategory = { _id: 'category-123', name: 'category 123' }
    CategoryModel.findByIdAndDelete.mockResolvedValue(deletedCategory)

    await deleteCategory(req, res)
    expect(deleteCategorySchema.validateAsync).toHaveBeenCalledWith(req.params)
    expect(CategoryModel.findByIdAndDelete).toHaveBeenCalledWith(
      req.params.id,
      { new: true }
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(deletedCategory)
  })
  test('database error with error response', async () => {
    const error = new Error('Database error')
    deleteCategorySchema.validateAsync.mockResolvedValue()
    CategoryModel.findByIdAndDelete.mockRejectedValue(error)
    await deleteCategory(req, res)
    expect(deleteCategorySchema.validateAsync).toHaveBeenCalledWith(req.params)
    expect(CategoryModel.findByIdAndDelete).toHaveBeenCalledWith(
      req.params.id,
      { new: true }
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
describe('create a subcategory', () => {
  const req = {
    body: {
      categoryID: 'test-category-id',
      subCategory: 'Subcategory Name',
      title: 'Subcategory Title',
      img: 'Subcategory test image',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }
  beforeEach(() => jest.clearAllMocks())
  test('create a subcategory with success response', async () => {
    const uploadedResponse = { url: 'uploaded-image-url' }
    createSubCategorySchema.validateAsync.mockResolvedValue()
    cloudinary.uploader.upload.mockResolvedValueOnce(uploadedResponse)
    CategoryModel.findOneAndUpdate.mockResolvedValue({
      _id: 'test-category-id',
      name: 'Test Category',
    })
    await createSubCategory(req, res)
    expect(createSubCategorySchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith(req.body.img)
    expect(CategoryModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: req.body.categoryID },
      {
        $push: {
          subCategory: {
            subCategoryName: req.body.subCategory,
            title: req.body.title,
            image: uploadedResponse.url,
          },
        },
      },
      { new: true }
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith({
      message: 'SubCategory updated',
      category: { _id: 'test-category-id', name: 'Test Category' },
    })
  })
  test('should handle error and return error response', async () => {
    const error = new Error('Test Error')

    createSubCategorySchema.validateAsync.mockRejectedValue(error)

    await createSubCategory(req, res)

    expect(createSubCategorySchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
describe('delete a subcategory', () => {
  const req = {
    body: {
      categoryID: 'category-123',
      subCategoryID: 'subcategory-123',
    },
  }
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  }
  beforeEach(() => jest.clearAllMocks())
  test('should delete a subcategory base on categoryID and subcategoryID', async () => {
    deleteSubCategorySchema.validateAsync.mockResolvedValue()
    const deletedSubCategory = {
      _id: 'category-123',
      name: 'category',
      subCategory: {
        _id: 'subcategory-123',
        name: 'subcategory',
      },
    }
    CategoryModel.updateOne.mockResolvedValue(deletedSubCategory)
    await deleteSubCategory(req, res)
    expect(deleteCategorySchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(CategoryModel.updateOne).toHaveBeenCalledWith(
      {
        _id: req.body.categoryID,
      },
      { $pull: { subCategory: { _id: req.body.subCategoryID } } },
      { new: true }
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith({
      message: 'SubCategory updated',
      category: deletedSubCategory,
    })
  })
  test('database error with error response', async () => {
    const error = new Error('Database error')
    deleteSubCategorySchema.validateAsync.mockResolvedValue()
    CategoryModel.updateOne.mockRejectedValue(error)
    await deleteSubCategory(req, res)
    expect(deleteSubCategorySchema.validateAsync).toHaveBeenCalledWith(req.body)
    expect(CategoryModel.updateOne).toHaveBeenCalledWith(
      {
        _id: req.body.categoryID,
      },
      { $pull: { subCategory: { _id: req.body.subCategoryID } } },
      { new: true }
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith({ message: error.message })
  })
})
