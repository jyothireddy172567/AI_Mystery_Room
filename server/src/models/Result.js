import mongoose from 'mongoose';
const ResultSchema=new mongoose.Schema({caseId:{type:mongoose.Schema.Types.ObjectId,ref:'Mystery',required:true},owner:{type:String,required:true},selectedSuspectId:{type:String,required:true},isCorrect:{type:Boolean,required:true},score:{type:Number,required:true},createdAt:{type:Date,default:Date.now}},{versionKey:false});
ResultSchema.index({caseId:1,owner:1},{unique:true});
export const Result=mongoose.models.Result||mongoose.model('Result',ResultSchema);
