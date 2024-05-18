import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({
content:{
    type:String,
    required:true
},
owner:{
    type:Schema.ObjectId,
    ref:"User",
}

},{timestamps:true});

const Tweet = mongoose.model("Tweet",tweetSchema);
export default Tweet;