import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { buildPrompt, PROMPT_VERSION } from '../prompts/mystery.js';
import { validateMystery } from '../validators/mystery.js';
import { AppError } from '../utils/errors.js';

export async function generateMystery(input){
  if(!env.geminiApiKey)throw new AppError(503,'AI_PROVIDER_ERROR','Mystery generation is not configured yet. Add a Gemini API key to the server environment.');
  const ai=new GoogleGenAI({apiKey:env.geminiApiKey});let lastFailure='invalid_output';
  for(let attempt=0;attempt<2;attempt++){
    const prompt=buildPrompt(input)+(attempt?'\nCorrect the previous output so it strictly follows the required schema and references. Return JSON only.':'');
    let response; let providerError;
    const config={responseMimeType:'application/json'};
    if(!env.geminiModel.startsWith('gemini-3.'))config.temperature=0.8;
    // Provider 503s and transient connection failures should not immediately
    // fail the user's request. Keep this retry bounded to one extra call.
    for(let providerAttempt=0;providerAttempt<2;providerAttempt++){
      try{
        response=await ai.models.generateContent({model:env.geminiModel,contents:prompt,config});
        providerError=undefined;
        break;
      }catch(error){
        providerError=error;
        const providerStatus=Number(error?.status||error?.statusCode);
        const transient=!Number.isInteger(providerStatus)||providerStatus===408||providerStatus===429||providerStatus>=500;
        console.warn(JSON.stringify({level:'warn',event:'gemini_request_failed',attempt:attempt+1,providerAttempt:providerAttempt+1,providerStatus:Number.isInteger(providerStatus)?providerStatus:undefined,errorType:error?.name||'Error'}));
        if(!transient||providerAttempt===1)break;
        await new Promise(resolve=>setTimeout(resolve,500));
      }
    }
    if(providerError){
      throw new AppError(503,'AI_PROVIDER_ERROR','Gemini could not generate the case. Check the configured model, API key permissions, quota, and network, then try again.');
    }
    const text=response.text;
    if(!text){lastFailure='empty_response';continue;}
    let generated;
    try{generated=JSON.parse(text);}catch{lastFailure='invalid_json';continue;}
    const check=validateMystery(generated,input.evidenceTypes);
    if(check.ok)return {...check.data,promptVersion:PROMPT_VERSION};
    lastFailure='schema_validation';
    const issuePaths=check.issues.slice(0,8).map(issue=>Array.isArray(issue.path)?issue.path.join('.'):undefined).filter(Boolean);
    console.warn(JSON.stringify({level:'warn',event:'gemini_output_rejected',attempt:attempt+1,reason:lastFailure,issueCount:check.issues.length,issuePaths}));
  }
  console.warn(JSON.stringify({level:'warn',event:'mystery_generation_failed',attempts:2,reason:lastFailure}));
  throw new AppError(502,'AI_OUTPUT_INVALID','Gemini returned a case that did not meet the mystery requirements after two attempts. Please try again.');
}
