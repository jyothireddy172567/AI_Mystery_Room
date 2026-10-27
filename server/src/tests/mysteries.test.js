import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateMystery, isValidCaseTimestamp } from '../validators/mystery.js';
import { createCase, getCase, getEvidenceImage, accuse, getSavedResult } from '../services/mysteries.js';
import { deleteCaseImageDirectory } from '../services/imageAssets.js';
import { buildImageGenerationConfig } from '../services/imageGeneration.js';
import { asyncRoute } from '../middleware/asyncRoute.js';

function fixture(){
  const suspects=Array.from({length:4},(_,i)=>({id:`s${i+1}`,name:`Suspect ${i+1}`,occupation:'Archivist',background:'Works at the museum.',motive:'Wanted the ledger.',relationship:'Colleague',alibi:'Was in the gallery.'}));
  const evidence=Array.from({length:8},(_,i)=>({id:`e${i+1}`,type:['witness','physical','chat','timeline','image','cctv','physical','witness'][i],title:`Exhibit ${i+1}`,description:'A fictional clue.',timestamp:`2025-01-01T0${i}:00:00Z`,content:{},relatedSuspectIds:[`s${(i%4)+1}`]}));
  return {title:'The Quiet Archive',summary:'A ledger disappeared from a locked archive.',setting:'North Gallery',incidentTime:'2025-01-01T08:00:00Z',suspects,evidence,timeline:[],solution:{culpritId:'s2',reasoningSummary:'The access log contradicts the alibi.',supportingEvidenceIds:['e2','e4'],contradictions:['The ledger record places them at the archive.'],finalExplanation:'The timestamp places Suspect 2 inside the archive during the disappearance.'}};
}

test('validates a complete case and rejects broken references',()=>{
  const good=fixture();assert.equal(validateMystery(good).ok,true);
  assert.equal(validateMystery(good,['witness']).ok,false);
  assert.equal(isValidCaseTimestamp('10:45 PM'),true);
  assert.equal(isValidCaseTimestamp('22:45'),true);
  assert.equal(isValidCaseTimestamp('25:75'),false);
  const bad=fixture();bad.solution.culpritId='missing';assert.equal(validateMystery(bad).ok,false);
  const duplicate=fixture();duplicate.suspects[3].id='s3';assert.equal(validateMystery(duplicate).ok,false);
});

test('uses the Gemini GenerateContent image configuration fields',()=>{
  assert.deepEqual(buildImageGenerationConfig(),{
    responseModalities:['IMAGE'],imageConfig:{aspectRatio:'4:3',imageSize:'1K'},
  });
});

test('forwards asynchronous route failures to Express error handling',async()=>{
  const failure=new Error('expected failure');let forwarded;
  asyncRoute(async()=>{throw failure;})({}, {}, error=>{forwarded=error;});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(forwarded,failure);
});

test('public case omits solution and case access is session-owned',async()=>{
  const owner=`owner-${randomUUID()}`;const data=await createCase({difficulty:'medium',scenario:'A sufficiently detailed fictional scenario.'},owner,async()=>fixture());
  assert.equal(Object.hasOwn(data,'solution'),false);assert.equal(Object.hasOwn(data,'culpritId'),false);
  await assert.rejects(()=>getCase(data.caseId,'another-session'),{code:'CASE_NOT_FOUND'});
  assert.equal((await getCase(data.caseId,owner)).suspects.length,4);
});

test('scores the accusation on the server and prevents duplicate submissions',async()=>{
  const owner=`owner-${randomUUID()}`;const data=await createCase({difficulty:'hard',scenario:'A sufficiently detailed fictional scenario.'},owner,async()=>fixture());
  const result=await accuse(data.caseId,owner,'s2');assert.equal(result.isCorrect,true);assert.equal(result.score,200);assert.equal(result.solution.culprit.id,'s2');
  const retried=await accuse(data.caseId,owner,'s2');assert.equal(retried.resultId,result.resultId);assert.equal(retried.score,200);
  assert.equal((await getSavedResult(data.caseId,owner)).resultId,result.resultId);
  await assert.rejects(()=>accuse(data.caseId,owner,'s1'),{code:'ALREADY_SUBMITTED'});
});

test('stores generated evidence images and returns them only to the case owner',async()=>{
  const owner=`owner-${randomUUID()}`;const bytes=Buffer.from([137,80,78,71,13,10,26,10]);
  const data=await createCase({difficulty:'medium',scenario:'A sufficiently detailed fictional scenario.'},owner,async()=>fixture(),{
    imageGenerator:async()=>({buffer:bytes,mimeType:'image/png'}),
  });
  try{
    const imageEvidence=data.evidence.find(item=>item.type==='image');
    assert.equal(imageEvidence.assetStatus,'ready');assert.match(imageEvidence.assetUrl,/\/image$/);
    const saved=await getEvidenceImage(data.caseId,owner,imageEvidence.id);
    assert.equal(saved.mimeType,'image/png');assert.deepEqual(saved.buffer,bytes);
    await assert.rejects(()=>getEvidenceImage(data.caseId,'another-session',imageEvidence.id),{code:'CASE_NOT_FOUND'});
  }finally{await deleteCaseImageDirectory(data.caseId);}
});

test('keeps a case playable and marks a placeholder when image generation fails',async()=>{
  const owner=`owner-${randomUUID()}`;
  const data=await createCase({difficulty:'medium',scenario:'A sufficiently detailed fictional scenario.'},owner,async()=>fixture(),{
    imageGenerator:async()=>{throw new Error('provider unavailable');},
  });
  const imageEvidence=data.evidence.find(item=>item.type==='image');
  assert.equal(data.status,'ready');assert.equal(imageEvidence.assetStatus,'failed');assert.equal(imageEvidence.assetUrl,undefined);
  assert.equal((await getCase(data.caseId,owner)).title,data.title);
});
