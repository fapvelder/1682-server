import express from 'express'
import {
  createRole,
  deleteRole,
  getRole,
  updateRole,
} from '../controllers/role.js'
import { isAdmin } from '../utils.js'
const router = express.Router()
router.get('/', isAdmin, getRole)
router.post('/create', isAdmin, createRole)
router.delete('/delete/:id', isAdmin, deleteRole)
router.put('/update', isAdmin, updateRole)
export default router
