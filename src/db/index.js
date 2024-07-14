import mongoose from 'mongoose';
import express from 'express';
import {DB_NAME} from '../constants.js'
const app = express();

const connectDB = async () => {
  try {

   const connectionInstance =  await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
   console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
   app.on("error", (error)=>{
    console.log("ERROR: ", error);
   })
  
  }
  catch(error){
    console.log("MONGODB guigui connection error", error);
    process.exit(1)
  }
}

export default connectDB;