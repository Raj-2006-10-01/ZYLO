import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL;

        if (!mongoUrl) {
            throw new Error("MONGODB_URL is not configured");
        }

        mongoose.connection.on('connected', () => console.log('Database connected'))
        await mongoose.connect(mongoUrl, {
            dbName: process.env.MONGODB_DB_NAME || 'ZYLO'
        })
    } catch (error) {
        console.log(error.message)
        throw error;
    }
}

export default connectDB
