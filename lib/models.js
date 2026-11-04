import mongoose from "mongoose";
const ProfileSchema=new mongoose.Schema({phone:String,region:String,district:String,address:String,description:String,logo:String,brands:[String],deliveryAreas:[String],deliveryDays:[String],deliveryLeadDays:{type:Number,default:1},minOrderTotal:{type:Number,default:0},deliveryFee:{type:Number,default:0},freeDeliveryFrom:{type:Number,default:0},paymentMethods:{type:[String],default:['Naqd','Bank o‘tkazmasi']},holdLimit:{type:Number,default:100000},partnerOnlyHolds:{type:Boolean,default:false}},{_id:false});
const UserSchema=new mongoose.Schema({profile:{type:ProfileSchema,default:()=>({})},verification:{type:String,enum:['unverified','pending','verified','rejected'],default:'unverified'},verificationNote:String,blocked:{type:Boolean,default:false},authVersion:{type:Number,default:0},recoveryHash:String,favorites:[mongoose.Schema.Types.ObjectId],telegramChatId:String,telegramLinkHash:String,telegramLinkExpires:Date,cartVersion:{type:Number,default:0},name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,trim:true},passwordHash:{type:String,required:true},role:{type:String,enum:["buyer","seller"],required:true}},{timestamps:true});
export const User=mongoose.models.SavdochiUser||mongoose.model("SavdochiUser",UserSchema);

const ProductSchema=new mongoose.Schema({
  seller:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true,index:true},
  supplier:{type:String,required:true},name:{type:String,required:true},category:{type:String,required:true},
  imageKey:{type:String,default:''},image:{type:String,default:''},packSize:{type:Number,default:1},innerUnit:{type:String,default:'dona'},priceTiers:[{_id:false,min:Number,price:Number}],priceVersion:{type:Number,default:0},price:{type:Number,required:true,min:1},unit:{type:String,required:true},stock:{type:Number,required:true,min:0},
  minOrder:{type:Number,default:1,min:1},description:{type:String,default:''},active:{type:Boolean,default:true,index:true}
},{timestamps:true});
export const Product=mongoose.models.SavdochiProduct||mongoose.model('SavdochiProduct',ProductSchema);
const ProposalSchema=new mongoose.Schema({items:[{_id:false,productId:mongoose.Schema.Types.ObjectId,quantity:Number,price:Number}],deliveryDate:String,reason:String,deliveryFee:Number,createdAt:Date},{_id:false});
const OrderSchema=new mongoose.Schema({proposal:{type:ProposalSchema,default:null},deliveryDate:String,deliveryFee:{type:Number,default:0},subtotal:Number,region:String,paymentMethod:String,paymentStatus:{type:String,enum:['unpaid','reported','paid'],default:'unpaid'},refundStatus:{type:String,enum:['none','pending','refunded'],default:'none'},paymentNote:String,cancellationReason:String,receivedAt:Date,history:[{_id:false,action:String,actor:String,note:String,at:Date}],
  buyer:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true,index:true},
  buyerName:String,seller:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true,index:true},supplier:String,
  requestId:{type:String,required:true},phone:String,address:String,note:String,
  location:{type:new mongoose.Schema({lat:Number,lng:Number},{_id:false}),default:null},
  items:[{_id:false,productId:mongoose.Schema.Types.ObjectId,name:String,unit:String,price:Number,quantity:Number}],
  total:Number,status:{type:String,enum:['pending','proposed','confirmed','shipped','delivered','received','cancelled'],default:'pending'}
},{timestamps:true});
OrderSchema.index({buyer:1,requestId:1,seller:1},{unique:true});
export const Order=mongoose.models.SavdochiOrder||mongoose.model('SavdochiOrder',OrderSchema);

const ChatSchema=new mongoose.Schema({
 buyer:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true},
 seller:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true},
 buyerReadAt:Date,sellerReadAt:Date,lastMessage:{type:String,default:''},lastMessageAt:Date
},{timestamps:true});
ChatSchema.index({buyer:1,seller:1},{unique:true});
export const Chat=mongoose.models.SavdochiChat||mongoose.model('SavdochiChat',ChatSchema);
const MessageSchema=new mongoose.Schema({
 chat:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiChat',required:true,index:true},
 sender:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true},
 order:{type:mongoose.Schema.Types.ObjectId,default:null},text:{type:String,required:true,maxlength:2000},clientId:{type:String,required:true}
},{timestamps:true});
MessageSchema.index({chat:1,sender:1,clientId:1},{unique:true});
MessageSchema.index({chat:1,_id:-1});
MessageSchema.index({chat:1,createdAt:1,sender:1});
export const Message=mongoose.models.SavdochiMessage||mongoose.model('SavdochiMessage',MessageSchema);

const ReservationSchema=new mongoose.Schema({
 buyer:{type:mongoose.Schema.Types.ObjectId,required:true},
 product:{type:mongoose.Schema.Types.ObjectId,required:true},
 quantity:{type:Number,required:true,min:1},expiresAt:{type:Date,required:true,index:true}
},{timestamps:true});
ReservationSchema.index({buyer:1,product:1},{unique:true});
export const Reservation=mongoose.models.SavdochiReservation||mongoose.model('SavdochiReservation',ReservationSchema);

const PartnershipSchema=new mongoose.Schema({buyer:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true},seller:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true},requestedBy:{type:mongoose.Schema.Types.ObjectId,required:true},status:{type:String,enum:['pending','accepted','rejected'],default:'pending'},discount:{type:Number,default:0},terms:{type:String,default:''}},{timestamps:true});
PartnershipSchema.index({buyer:1,seller:1},{unique:true});
export const Partnership=mongoose.models.SavdochiPartnership||mongoose.model('SavdochiPartnership',PartnershipSchema);
const NotificationSchema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,required:true,index:true},key:{type:String,required:true},text:String,href:String,read:{type:Boolean,default:false},telegramSent:{type:Boolean,default:false},telegramClaimUntil:Date},{timestamps:true});
NotificationSchema.index({user:1,key:1},{unique:true});
NotificationSchema.index({user:1,createdAt:-1});
export const Notification=mongoose.models.SavdochiNotification||mongoose.model('SavdochiNotification',NotificationSchema);
const TicketSchema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiUser',required:true},order:{type:mongoose.Schema.Types.ObjectId,ref:'SavdochiOrder',default:null},subject:String,text:String,status:{type:String,enum:['open','reviewing','resolved'],default:'open'},reply:String},{timestamps:true});
export const Ticket=mongoose.models.SavdochiTicket||mongoose.model('SavdochiTicket',TicketSchema);
const ImportSchema=new mongoose.Schema({seller:mongoose.Schema.Types.ObjectId,key:String,count:Number},{timestamps:true});ImportSchema.index({seller:1,key:1},{unique:true});
export const ProductImport=mongoose.models.SavdochiImport||mongoose.model('SavdochiImport',ImportSchema);
const RateLimitSchema=new mongoose.Schema({_id:String,count:{type:Number,default:0},expiresAt:Date});RateLimitSchema.index({expiresAt:1},{expireAfterSeconds:0});
export const RateLimit=mongoose.models.SavdochiRateLimit||mongoose.model('SavdochiRateLimit',RateLimitSchema);
