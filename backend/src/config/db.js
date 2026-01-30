//Handles MongoDB connection (only for database connection logic)
import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(" MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;

//Here in db.js, you connect to MongoDB using Mongoose, handling connection success and errors appropriately.
//You import config.js to access the MONGO_URI environment variable for the connection string.
///This keeps your database connection logic modular and separate from other application logic.
//instead of reaching into process.env again, you just import from config.

