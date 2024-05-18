

import   mongoose, { Schema,Model } from "mongoose";

const subscription_schema = new Schema({

    subscriber:{
        type:Schema.Types.ObjectId, //one who is subscribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId, //one to whom subcriber is subscribing
        ref:"User"
    },
},{timestamps:true});

const Subscription = mongoose.model("Subscription",subscription_schema);


export default Subscription;