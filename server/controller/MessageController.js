import fs from 'fs'
import imagekit from '../configs/imagekit.js';
import Message from '../model/Messages.js';
// create an empty object to store server-site event connection
const connection = {};

// Controller function for the SSE endpoint
export const sseController = (req, res) => {
    const { userId } = req.params;
    console.log('New client connected :', userId)

    // set SSE headers
    res.setHeader('Content-type', 'text/event-stream')
    res.setHeader('cache-Control', 'no-cache')
    res.setHeader('Connection', 'Keep-alive')
    res.setHeader('Access-Control-Allow-origin', '*')

    // Add the client's responce object to the connection object
    connection[userId] = res

    // send and initial event to the client
    res.write('log: Connection to SSE stream\n\n')

    // handle client disconnection
    req.on('close', () => {
        // remove the client responce object from the connection array
        delete connection[userId];
        console.log('Client desconnected');

    })

}


// Send Message
export const  sendMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id, text } = req.body;
        const image = req.file;

        let media_url = '';
        let message_type = image ? 'image' : 'text';
        if (message_type === 'image') {
            const fileBuffer = fs.readFileSync(image.path);
            const responce = await imagekit.upload({
                file: fileBuffer,
                fileName: image.originalname,
            });
            media_url = imagekit.url({
                path: responce.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' },
                ]
            })
        }

        const messsage = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url
        })

        res.json({ success: true, messsage });

        // Send message to user id SSE

        const messageWithUserData = await Message.findById(messsage._id).populate('from-user-id');

        if (connection[to_user_id]) {
            connection[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`)
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Get chat message
export const getChatMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id } = req.body;

        const messages = await Message.find({
            $or: [
                { from_user_id: userId, to_user_id },
                { from_user_id: to_user_id, to_user_id: userId },
            ]
        }).sort({ created_at: -1 })
        await Message.updateMany({ from_user_id: to_user_id, to_user_id: userId }, { seen: true })

        res.json({ success: true, messages })


    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


// get user recent message

export const getUserReccentMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const messages = (await Message.find({ to_user_id: userId }.populate('from_user_id to_user_id'))).sort({ created_at: -1 });

        res.json({ success: true, messages })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}