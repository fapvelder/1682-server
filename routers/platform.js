import { isAdmin } from '../utils.js'
import {
  createPlatform,
  deletePlatform,
  getPlatform,
  updatePlatform,
} from '../controllers/platform.js'
import express from 'express'

const router = express.Router()
router.get('/', getPlatform)
router.post('/create', createPlatform)
router.delete('/delete/:id', isAdmin, deletePlatform)
router.put('/update', isAdmin, updatePlatform)
export default router
