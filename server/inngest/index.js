import { Inngest } from "inngest";
import User from "../model/User.js";
import Connection from "../model/Connection.js";
import sendEmail from "../configs/nodemailer.js";

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
                to:connection.to_user_id.email,
                subject,
                body
            })
            return {message:'reminder send.'}
        })

    }

)

// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    sendNewConnectionRequestRemider
];