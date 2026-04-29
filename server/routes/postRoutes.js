import express from 'express'
import { upload } from '../configs/multer.js'
import { protect } from '../middleware/auth.js'
import { addPost, getfeedPosts, likePost } from '../controller/postcontroller.js'

const postRouter=express.Router()


postRouter.post('/add',upload.array('images',4),protect,addPost)

postRouter.get('/feed',protect,getfeedPosts)

postRouter.post('/like',protect,likePost)


export default postRouter