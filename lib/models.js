import mongoose from "mongoose";
const UserSchema=new mongoose.Schema({cartVersion:{type:Number,default:0},name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,trim:true},passwordHash:{type:String,required:true},role:{type:String,enum:["buyer","seller"],required:true}},{timestamps:true});
export const User=mongoose.models.SavdochiUser||mongoose.model("SavdochiUser",UserSchema);

const ProductSchema=new mongoose.Schema({
  seller:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true,index:true},
  supplier:{type:String,required:true},name:{type:String,required:true},category:{type:String,required:true},
  price:{type:Number,required:true,min:1},unit:{type:String,required:true},stock:{type:Number,required:true,min:0},
  minOrder:{type:Number,default:1,min:1},description:{type:String,default:''},active:{type:Boolean,default:true,index:true}
},{timestamps:true});
export const Product=mongoose.models.SavdochiProduct||mongoose.model('SavdochiProduct',ProductSchema);
const OrderSchema=new mongoose.Schema({
  buyer:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true,index:true},
  buyerName:String,seller:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true,index:true},supplier:String,
  requestId:{type:String,required:true},phone:String,address:String,note:String,
  location:{type:new mongoose.Schema({lat:Number,lng:Number},{_id:false}),default:null},
  items:[{_id:false,productId:mongoose.Schema.Types.ObjectId,name:String,unit:String,price:Number,quantity:Number}],
  total:Number,status:{type:String,enum:['pending','confirmed','shipped','delivered','cancelled'],default:'pending'}
},{timestamps:true});
OrderSchema.index({buyer:1,requestId:1,seller:1},{unique:true});
export const Order=mongoose.models.SavdochiOrder||mongoose.model('SavdochiOrder',OrderSchema);

const ChatSchema=new mongoose.Schema({
 buyer:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true},
 seller:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true},
 lastMessage:{type:String,default:''},lastMessageAt:Date
},{timestamps:true});
ChatSchema.index({buyer:1,seller:1},{unique:true});
export const Chat=mongoose.models.SavdochiChat||mongoose.model('SavdochiChat',ChatSchema);
const MessageSchema=new mongoose.Schema({
 chat:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiChat',required:true,index:true},
 sender:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true},
 text:{type:String,required:true,maxlength:2000},clientId:{type:String,required:true}
},{timestamps:true});
MessageSchema.index({chat:1,sender:1,clientId:1},{unique:true});
MessageSchema.index({chat:1,_id:-1});
export const Message=mongoose.models.SavdochiMessage||mongoose.model('SavdochiMessage',MessageSchema);

const ReservationSchema=new mongoose.Schema({
 buyer:{type:mongoose.Schema.Types.ObjectId,required:true},
 product:{type:mongoose.Schema.Types.ObjectId,required:true},
 quantity:{type:Number,required:true,min:1},expiresAt:{type:Date,required:true,index:true}
},{timestamps:true});
ReservationSchema.index({buyer:1,product:1},{unique:true});
export const Reservation=mongoose.models.SavdochiReservation||mongoose.model('SavdochiReservation',ReservationSchema);
