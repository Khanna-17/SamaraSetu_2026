import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is required");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 10000
  });

  console.log("MongoDB connected");
}
