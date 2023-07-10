import { createComment, getCommentByProductID } from '../controllers/comment.js'
import { isAdmin, isAuth } from '../utils.js'

import express from 'express'

const router = express.Router()
router.post('/productComment', isAuth, getCommentByProductID)
router.post('/create', isAuth, createComment)

export default router
