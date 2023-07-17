import joi from 'joi'

//users
export const registerUserSchema = joi.object({
  email: joi.string().email().lowercase().required(),
  fullName: joi.string().min(3).max(20).required(),
  password: joi.string().min(6).max(20).required(),
  slug: joi.string().allow(),
})

export const updatePasswordSchema = joi.object({
  userID: joi.string().required(),
  oldPassword: joi.string().min(6).max(20).required(),
  newPassword: joi.string().min(6).max(20).required(),
})
export const updateUserRoleSchema = joi.object({
  userID: joi.string().required(),
  roleID: joi.string().required(),
})
export const updateUserAvatarSchema = joi.object({
  userID: joi.string().required(),
  data: joi.string().required(),
})
export const updateUserBioSchema = joi.object({
  userID: joi.string().required(),
  bio: joi.string().min(10).max(200).required(),
})
export const updateUserDisplayNameSchema = joi.object({
  userID: joi.string().required(),
  displayName: joi.string().min(3).max(20).required(),
})
export const updateUserCommunicationSchema = joi.object({
  userID: joi.string().required(),
  language: joi.string().required(),
  proficiency: joi
    .string()
    .valid('Fluent', 'Native', 'Conversational', 'Basic')
    .required(),
})
export const deleteUserCommunicationSchema = joi.object({
  userID: joi.string().required(),
  communicationID: joi.string().required(),
})
export const forgotPasswordSchema = joi.object({
  email: joi.string().email().required(),
})
export const resetPasswordSchema = joi.object({
  token: joi.string().required(),
  newPassword: joi.string().min(6).required(),
})
export const addFundWalletSchema = joi.object({
  userID: joi.string().required(),
  amount: joi.number().required(),
})
export const sendSecretSchema = joi.object({
  userID: joi.string().required(),
})
export const updateUserSchema = joi.object({
  fullName: joi.string().min(3).allow(''),
  data: joi.string().allow(''),
  userID: joi.string().required(),
  language: joi.string().allow(''),
  proficiency: joi.string().allow(''),
})
//Categories
export const createCategorySchema = joi.object({
  img: joi.string().required(),
  name: joi.string().required(),
  categoryDesc: joi.string().required(),
})
export const deleteCategorySchema = joi.object({
  id: joi.string().required(),
})
//SubCategories
export const createSubCategorySchema = joi.object({
  img: joi.string().required(),
  subCategory: joi.string().required(),
  title: joi.string().required(),
  categoryID: joi.string().required(),
})

export const deleteSubCategorySchema = joi.object({
  categoryID: joi.string().required(),
  subCategoryID: joi.string().required(),
})
//Comments
export const createCommentSchema = joi.object({
  userID: joi.string().required(),
  comment: joi.string().min(3).max(100).required(),
  productID: joi.string().required(),
})
export const getCommentByProductIDSchema = joi.object({
  productID: joi.string().required(),
})
//Feedbacks
// No validate for feedbacks

//Messages
export const sendMessageSchema = joi.object({
  from: joi.string().required(),
  to: joi.string().required(),
  message: joi.string().required(),
})
//Notifications
export const sendNotificationSchema = joi.object({
  userID: joi.string().required(),
  message: joi.string().required(),
})
export const deleteNotificationSchema = joi.object({
  id: joi.string().required(),
})
//Orders
export const buyProductSchema = joi.object({
  productID: joi.string().required(),
  userID: joi.string().required(),
})
export const getItemOrderSchema = joi.object({
  orderID: joi.string().required(),
  receiverID: joi.string().required(),
})
export const completeOrderSchema = joi.object({
  orderID: joi.string().required(),
  userID: joi.string().required(),
})
export const feedbackOrderSchema = joi.object({
  orderID: joi.string().required(),
  feedback: joi.string().allow(''),
  rating: joi.string().valid('Good', 'Bad', 'Neutral').required(),
})
export const transferItemSchema = joi.object({
  orderID: joi.string().required(),
  userID: joi.string().required(),
  code: joi.string().allow(''),
})
export const cancelOrderSchema = joi.object({
  orderID: joi.string().required(),
  userID: joi.string().required(),
})
//Paypal
export const createOrderSchema = joi.object({
  cost: joi.number().required(),
})
export const capturePaymentSchema = joi.object({
  orderID: joi.string().required(),
})
export const payoutSchema = joi.object({
  userID: joi.string().required(),
  secretToken: joi.string().required(),
  amount: joi.number().required(),
})
export const pollTransactionStatusSchema = joi.object({
  payoutID: joi.string().required(),
})
//Platform
export const createPlatformSchema = joi.object({
  name: joi.string().required(),
})
export const deletePlatformSchema = joi.object({
  id: joi.string().required(),
})
//Product
export const createProductSchema = joi.object({
  userID: joi.string().required(),
  title: joi.string().min(3).max(100).required(),
  description: joi.string().min(10).max(2000).required(),
  category: joi.string().required(),
  gameTitle: joi.string().allow(''),
  subCategory: joi.string().allow(''),
  url: joi.string().required(),
  price: joi.number().min(1).required(),
  visibility: joi.string().valid('Public', 'Unlisted').required(),
  deliveryMethod: joi.string().required(),
  deliveryIn: joi.string().required(),
  item: joi.allow(''),
  code: joi.string().allow(''),
})
export const findProductSchema = joi.object({
  search: joi.string().allow(''),
  category: joi.string().allow(''),
  subCategory: joi.string().allow(''),
  platform: joi.string().allow(''),
  isAvailable: joi.string().allow(''),
  min: joi.number().allow(''),
  max: joi.number().allow(''),
  page: joi.number().allow(''),
  pageSize: joi.number().allow(''),
})
// Role
export const createRoleSchema = joi.object({
  roleName: joi.string().required(),
})
export const deleteRoleSchema = joi.object({
  id: joi.string().required(),
})
export const updateRoleSchema = joi.object({
  _id: joi.string().required(),
  name: joi.string().required(),
})

//Steam
export const deleteSteamIDSchema = joi.object({
  steamID: joi.string().required(),
})
export const updateSteamURLSchema = joi.object({
  userID: joi.string().required(),
  steamURL: joi.string().required(),
})
export const sendSteamItemSchema = joi.object({
  appID: joi.string().required(),
  version: joi.string().required(),
  classID: joi.string().required(),
  userID: joi.string().required(),
  receiverID: joi.string().required(),
})
export const checkStatusSchema = joi.object({
  offerID: joi.string().required(),
})

//VNPay
export const createPaymentURLSchema = joi.object({
  userID: joi.string().required(),
  amount: joi.number().required(),
  bankCode: joi.string().allow(''),
  language: joi.string().allow(''),
})
