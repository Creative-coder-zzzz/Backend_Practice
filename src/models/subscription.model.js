import mongoose, {Schema} from "mongoose";
import { refreshAccessToken } from "../controllers/user.controller";
import { User } from "./user.model";

const subscriptionSchema = new Schema({
  subscriber:{
    typeof : Schema.Types.ObjectId, //one who is subscribing
    ref : "User"
  },
  channel: {
    type : Schema.Types.ObjectId, //one to whom subscriber is subscribing 
    ref : "User"
  }
},{timestamps: true})


export const Subscription = mongoose.model("subscription", subscriptionSchema)
