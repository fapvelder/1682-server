import { isAdmin, isAuth } from '../utils.js'
import {
  createPlatform,
  deletePlatform,
  getPlatform,
  updatePlatform,
} from '../controllers/platform.js'
import express from 'express'

const router = express.Router()
router.get('/', isAuth, getPlatform)
router.post('/create', isAuth, createPlatform)
router.delete('/delete/:id', isAuth, isAdmin, deletePlatform)
router.put('/update', isAuth, isAdmin, updatePlatform)
export default router
