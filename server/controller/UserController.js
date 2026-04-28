
import imagekit from "../configs/imagekit.js"
import Connection from "../model/Connection.js";
import User from "../model/User.js"
import fs from 'fs'

// get user data using userid

export const getUserData = async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId)
        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }
        res.json({ success: true, user })
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message })
    }
}

//  update data using userid

export const updateUserData = async (req, res) => {
    try {
        const { userId } = req.auth();
        let { username, bio, location, full_name } = req.body;

        const tempUser = await User.findById(userId)

        !username && (username = tempUser.username)

        if (tempUser.username !== username) {
            const user = await User.findOne({ username })
            if (user) {
                // we will not change the username if it is already taken
                username = tempUser.username
            }
        }

        const updatedData = {
            username,
            bio,
            location,
            full_name
        }

        const profile = req.files.profile && req.files.profile[0]
        const cover = req.files.cover && req.files.cover[0]

        if (profile) {
            const buffer = fs.readFileSync(profile.path)
            const responce = await imagekit.upload({
                file: buffer,
                fileName: profile.originalname,
            })

            const url = imagekit.url({
                path: responce.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '512' }
                ]
            })
            updatedData.profile_picture = url;
        }
        if (cover) {
            const buffer = fs.readFileSync(cover.path)
            const responce = await imagekit.upload({
                file: buffer,
                fileName: profile.originalname,
            })

            const url = imagekit.url({
                path: responce.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' }
                ]
            })
            updatedData.cover_photo = url;
        }

        const user = await User.findByIdAndUpdate(userId, updatedData, { new: true })

        res.json({ success: true, user, message: 'Profile updated successfully' })

    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message })
    }
}


// find user using username email location name

export const discoversUsers = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { input } = req.body;
        const allUsers = await User.find({
            $or: [
                { username: new RegExp(input, 'i') },
                { email: new RegExp(input, 'i') },
                { full_name: new RegExp(input, 'i') },
                { location: new RegExp(input, 'i') },
            ]
        })
        const filterUsers = allUsers.filter(user => user._id !== userId);
        res.json({ success: true, user: filterUsers })

    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message })
    }
}

// to follow any user

export const followUser = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        const user = await User.findById(userId)
        if (user.following.includes(id)) {
            return res.json({ success: false, message: 'you are already following this user' })
        }
        user.following.push(id);
        await user.save()

        const toUser = await User.findById(id)
        toUser.followers.push(userId)
        await toUser.save()

        res.json({ success: true, message: 'Now you are following this user' })


    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message })
    }
}

// to unfollow user

export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        const user = await User.findById(userId)
        user.following = user.following.filter(user => user !== id);
        await user.save()

        const toUser = await User.findById(id)
        toUser.followers = user.followers.filter(user => user !== userId);
        await toUser.save()

        res.json({ success: true, message: 'You are no longer following this user' })


    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message })
    }
}


// send connection request
export const sendConnectionRequest = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { id } = req.body;

        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const connectionrequests = await Connection.find({ from_user_id: userId, created_at: { $gt: last24Hours } })
        if (connectionrequests.length >= 20) {
            return res.json({ success: false, message: 'You have send more then 20 connection request in last 24 hours' })
        }
        // check if user already connected
        const connection = await Connection.findOne({
            $or: [
                { from_user_id: userId, to_user_id: id },
                { from_user_id: id, to_user_id: userId },
            ]
        })

        if (!connection) {
            await Connection.create({
                from_user_id: userId,
                to_user_id: id
            })
            return res.json({success:true,message:'Connection request send successfully'})
        }else if(connection && connection.status === 'accepted'){
            return res.json({ success: false, message: 'You have already connected with this user' })
        }
        return  res.json({ success: false, message: 'connection request pending' })

    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message })
    }
}

// get user connection
export const getUserConnection = async (req, res) => {
    try {
        const { userId } = req.auth()
        const user=await User.findById(userId).populate('connections followers following')

        const connection=user.connections
        const followers=user.followers
        const following=user.following

        const pendingConnection=(await Connection.find({to_user_id:userId,status:'pending'}).populate('from_user_id')).map(connection=>connection.from_user_id)
        res.json({success:true,connection,followers,following,pendingConnection})


        
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message })
    }
}

// Accept user connection
export const acceptconnectionrequest = async (req, res) => {
    try {
        const { userId } = req.auth()
        const {id}=req.body;

        const connection=await Connection.findOne({from_user_id:id,to_user_id:userId})

        if (!connection) {
            return res.json({success:false,message:'Connection Not found'})
        }
        
        const user=await User.findById(userId);
        user.connections.push(id);
        await user.save()
        
        const toUser=await User.findById(id);
        toUser.connections.push(userId);
        await toUser.save()

        connection.status='accepted'
        await connection.save()

        res.json({success:true,message:'Connection accepted successfully'})

    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message })
    }
}