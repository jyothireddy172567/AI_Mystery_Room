import { generateSchema,accusationSchema } from '../validators/mystery.js';
import { createCase,getCase,getEvidenceImage,accuse,getSavedResult } from '../services/mysteries.js';
import { generateMystery } from '../services/generation.js';
import { generateEvidenceImage } from '../services/imageGeneration.js';
import { AppError } from '../utils/errors.js';
function parse(schema,value){const parsed=schema.safeParse(value);if(!parsed.success)throw new AppError(400,'VALIDATION_ERROR','Please check the fields and try again.');return parsed.data;}
export async function generate(req,res){const input=parse(generateSchema,req.body);const data=await createCase(input,req.sessionId,generateMystery,{imageGenerator:generateEvidenceImage});res.status(201).json(data);}
export async function get(req,res){res.json(await getCase(req.params.caseId,req.sessionId));}
export async function evidenceImage(req,res){const image=await getEvidenceImage(req.params.caseId,req.sessionId,req.params.evidenceId);res.set('Cache-Control','private, max-age=3600').set('X-Content-Type-Options','nosniff').type(image.mimeType).send(image.buffer);}
export async function accusation(req,res){const {suspectId}=parse(accusationSchema,req.body);res.json(await accuse(req.params.caseId,req.sessionId,suspectId));}
export async function result(req,res){res.json(await getSavedResult(req.params.caseId,req.sessionId));}
