import mongoose from "mongoose";
import env from "../config/env.js";

const connectDB = async () => {
  try {
    await mongoose.connect(env.mongoUri);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;