import express from 'express'
import {
  addFundWallet,
  deleteUser,
  deleteUserCommunication,
  forgotPassword,
  getUserById,
  getUserBySlug,
  getUsers,
  loginGoogleUsers,
  loginUser,
  refresh,
  registerGoogleUsers,
  registerUser,
  resetPassword,
  sendSecret,
  updatePassword,
  updateUserAvatar,
  updateUserBio,
  updateUserCommunication,
  updateUserDisplayName,
  updateUserRole,
} from '../controllers/user.js'
import { isAdmin, isAuth } from '../utils.js'
// import { isAuth, isAdmin } from '../utils.js'
const router = express.Router()

router.get('/', isAuth, getUsers)
router.get('/refresh', isAuth, refresh)
router.post('/getUserByID/', getUserById)
router.post('/getProfile/', getUserBySlug)
router.post('/login', loginUser)
router.post('/google/login', loginGoogleUsers)
router.post('/register', registerUser)
router.post('/google/register', registerGoogleUsers)
router.delete('/deleteUser/:id', isAdmin, deleteUser)
router.put('/update/role', isAdmin, updateUserRole)
router.put('/update/avatar/', isAuth, updateUserAvatar)
router.put('/update/bio', isAuth, updateUserBio)
router.put('/update/displayName', isAuth, updateUserDisplayName)
router.put('/update/communication', isAuth, updateUserCommunication)
router.put('/delete/communication', isAuth, deleteUserCommunication)
router.put('/changePassword', isAuth, updatePassword)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/addFund', isAuth, addFundWallet)
router.post('/sendSecret', isAuth, sendSecret)
export default router
