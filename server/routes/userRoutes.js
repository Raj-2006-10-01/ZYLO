import express from 'express'
import { acceptconnectionrequest, discoversUsers, followUser, getUserConnection, getUserData, getUserProfiles, sendConnectionRequest, unfollowUser, updateUserData } from '../controller/UserController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../configs/multer.js';
import { getUserReccentMessages } from '../controller/MessageController.js';

const userRouter = express.Router();

userRouter.get('/data', protect, getUserData)

userRouter.post('/update', protect, upload.fields([{ name: 'profile', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), updateUserData)

userRouter.post('/discover', protect, discoversUsers)

userRouter.post('/follow', protect, followUser)

userRouter.post('/unfollow', protect, unfollowUser)

userRouter.post('/connect', protect, sendConnectionRequest)

userRouter.post('/accept', protect, acceptconnectionrequest)

userRouter.get('/connections', protect, getUserConnection)

userRouter.post('/profiles', getUserProfiles)

userRouter.get('/recent-messages', protect, getUserReccentMessages)


export default userRouter