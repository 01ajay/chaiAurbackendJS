
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({path:'./env'})


connectDB();

//second approach













/*   // this 1st aproach to make datbase connection and the listen on port 
//this is polluting the main index file  
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.error("Error", error);
      throw error;
    });

    app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
    })

  } catch (error) {
    console.error("ERROR: ", error);
    throw error;
  }
})();
*/