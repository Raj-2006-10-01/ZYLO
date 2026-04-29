
import fs from 'fs'
import imagekit from "../configs/imagekit.js";
import Post from "../model/Post.js";
import User from "../model/User.js";

// Add post
export const addPost = async (req, res) => {
    try {
        const { userId } = req.auth;
        const { content, post_type } = req.body;
        const images = req.files;

        let image_urls = []
        if (images.length) {
            image_urls = await Promise.all(
                image_urls.map(async (image) => {
                    const filebuffer = fs.readFileSync(image.path)
                    const responce = await imagekit.upload({
                        file: filebuffer,
                        fileName: image.originalname,
                        folder: "posts",
                    })

                    const url = imagekit.url({
                        path: responce.filePath,
                        transformation: [
                            { quality: 'auto' },
                            { format: 'webp' },
                            { width: '1280' }
                        ]
                    })
                    return url
                })
            )
        }

        await Post.create({
            user: userId,
            content,
            image_url,
            post_type
        })

        res.json({ success: true, message: "Post created successfully" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// get post
export const getfeedPosts = async (req, res) => {
    try {
        const { userId } = req.auth
        const user = await User.findById(userId)
        // user connection and following
        const userIds = [userId, ...user.connections, ...user.following]
        const posts = await Post.find({ user: { $in: userIds } }).populate('user').sort({ createdAt: -1 })
        res.json({ success: true, posts })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Like post
export const likePost = async (req, res) => {
    try {
        const { userId } = req.auth
        const { postId } = req.body;

        const post = await Post.findById(postId)

        if (post.likes_count.includes(userId)) {
            post.likes_count = post.likes_count.filter(user => user !== userId)
            await post.save()
            res.json({success:true,message:'Post unliked'})
        }else{
            post.likes_count.push(userId)
            await post.save()
            res.json({success:true,message:'Post Liked'})
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}
