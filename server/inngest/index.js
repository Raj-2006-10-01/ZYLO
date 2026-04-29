import { Inngest } from "inngest";
import User from "../model/User.js";
import Connection from "../model/Connection.js";
import sendEmail from "../configs/nodemailer.js";
import Story from "../model/Story.js";
import Message from "../model/Messages.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "pingUp-app" });

// Inngest Function to save the user data to a database..
const syncUserCreation = inngest.createFunction(
    {
        id: "create-user-from-clerk",
        triggers: [{ event: "clerk/user.created" }],
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;

        let username = email_addresses[0].email_address.split('@')[0];

        const user = await User.findOne({ username });

        if (user) {
            username = username + Math.floor(Math.random() * 10000);
        }

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            full_name: first_name + " " + last_name,
            profile_picture: image_url,
            username
        };

        await User.create(userData);
    }
);

// Inngest function to update user data in database
const syncUserUpdation = inngest.createFunction(
    {
        id: "update-user-from-clerk",
        triggers: [{ event: "clerk/user.updated" }],
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data

        const updateUserData = {
            email: email_addresses[0].email_address,
            full_name: first_name + ' ' + last_name,
            profile_picture: image_url
        }
        await User.findByIdAndUpdate(id, updateUserData)
    }
)

// Inngest function to delete user data in database
const syncUserDeletion = inngest.createFunction(
    {
        id: "delete-user-from-clerk",
        triggers: [{ event: "clerk/user.deleted" }]
    },
    async ({ event }) => {
        const { id } = event.data

        await User.findByIdAndDelete(id)
    }
)
// Inngest function to send reminder when a new connection is added
const sendNewConnectionRequestRemider = inngest.createFunction(
    {
        id: "send-new-connection-request-reminder",
        triggers: [{ event: "app/connection-request" }]
    },
    async (event, step) => {
        const { connectionId } = event.data;

        await step.run('send-connection-request-mail', async () => {
            const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id')
            const subject = `✌ New connection request`
            const body = `
            <div style="font-family:Arial, sans-serif; padding:20px;">
            <h2>Hi ${connection.to_user_id.full_name},</h2>
            <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
            <p>Click <a href="${process.env.FRONTEND_URL}/connection" style="color:#10b981;">here</a> to accept or reject the request</p>
            <br/>
            <p>Thanks,<br/>PingUp-stay connected</p>
            </div>
            `

            await sendEmail({
                to: connection.to_user_id.email,
                subject,
                body
            })
            return { message: 'reminder send.' }
        })

    }

)

// Inmgest function to delete story in 24 hr
const deleteStory = inngest.createFunction(
    {
        id: "story-delete",
        triggers: [{ event: "app/story-.delete" }]
    },
    async ({ event, step }) => {
        const { storyId } = event.data
        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000)
        await step.sleepUntil('wait-for-24-hours', in24Hours)
        await step.run("delete-story", async () => {
            await Story.findByIdAndDelete(storyId)
            return { message: "story deleted." }
        })
    }
)


const sendNotificationOfUnseenMessages = inngest.createFunction(
    {
        id: "send-unseen-messages-notification",
        triggers: [{ cron: "TZ=America/New_York 0 9 * * *" }] //Every day at 9 am 
    },
    async ({ step }) => {
        const messages = await Message.find({ seen: false }).populate('to_user_id')
        const unseencount = {}

        messages.map(message => {
            unseencount[message.to_user_id._id] = (unseencount[message.to_user_id._id] || 0)
                + 1;
        })

        for (const userId in unseencount) {
            const user = await User.findById(userId);

            const subject = `📫 You have ${unseencount[userId]} unseen messages`

            const body = `
        <div style="font-family: Arial,sans-serif; padding:20px;">
                <h2>Hi ${user.full_name},</h2>
                <p>You can ${unssenCount[userId]} unseen message</p>
                <p>Click <a href="${process.env.FRONTEND_URL}/message" style="color: #10b981;">here</a>to view them</p>
                <br />
                <p>Thanks,<br />PingUp- stay Connected</p>
        </div>
            `;

            await sendEmail({
                to:user.email,
                subject,
                body
            })
        }

        return {message:'Notification send'}
    }
)
// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    sendNewConnectionRequestRemider,
    deleteStory,
    sendNotificationOfUnseenMessages
];