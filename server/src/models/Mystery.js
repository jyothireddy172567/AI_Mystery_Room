import mongoose from 'mongoose';
const {Schema}=mongoose;
const MysterySchema=new Schema({owner:{type:String,required:true,index:true},title:{type:String,required:true},summary:{type:String,required:true},setting:String,incidentTime:String,difficulty:{type:String,enum:['easy','medium','hard'],required:true},scenario:String,status:{type:String,enum:['ready'],default:'ready'},suspects:[Schema.Types.Mixed],evidence:[Schema.Types.Mixed],timeline:[Schema.Types.Mixed],solution:{type:Schema.Types.Mixed,required:true},promptVersion:String,createdAt:{type:Date,default:Date.now,expires:60*60*24*14}},{versionKey:false});
MysterySchema.index({owner:1,_id:1});
export const Mystery=mongoose.models.Mystery||mongoose.model('Mystery',MysterySchema);
