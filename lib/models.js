import mongoose from "mongoose";
const UserSchema=new mongoose.Schema({name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,trim:true},passwordHash:{type:String,required:true},role:{type:String,enum:["buyer","seller"],required:true}},{timestamps:true});
export const User=mongoose.models.SavdochiUser||mongoose.model("SavdochiUser",UserSchema);
