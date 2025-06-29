import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch(eroor){
        console.log("Error connecting to MongoDB:", error);
        process.exit(1); //1 mean failure 
    }
}