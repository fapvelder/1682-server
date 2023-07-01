import { createComment, getCommentByProductID } from '../controllers/comment.js'
import { isAdmin } from '../utils.js'

import express from 'express'

const router = express.Router()
router.post('/productComment', getCommentByProductID)
router.post('/create', createComment)

export default router
