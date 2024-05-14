import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {

     const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
     console.log(`\n MongoDB connected !! DB HOST:
     ${connectionInstance.connection.host}
     \n connection Instance - ${connectionInstance}`);
  
    } catch (error) {
      console.error("MONGO DB connection ERROR: ", error);
      process.exit(1);
    }
  }

  export default connectDB; 