import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../app.js';
import { createCase } from '../services/mysteries.js';
import { deleteCaseImageDirectory } from '../services/imageAssets.js';

function caseFixture(){
  const suspects=Array.from({length:4},(_,index)=>({id:`s${index+1}`,name:`Suspect ${index+1}`,occupation:'Archivist',background:'Works at the museum.',motive:'Wanted the ledger.',relationship:'Colleague',alibi:'Was in the gallery.'}));
  const evidence=Array.from({length:8},(_,index)=>({id:`e${index+1}`,type:'witness',title:`Exhibit ${index+1}`,description:'A fictional clue.',timestamp:`2025-01-01T0${index}:00:00Z`,relatedSuspectIds:[]}));
  return {title:'The Quiet Archive',summary:'A ledger disappeared from a locked archive.',setting:'North Gallery',incidentTime:'2025-01-01T08:00:00Z',suspects,evidence,timeline:[],solution:{culpritId:'s2',reasoningSummary:'The access log contradicts the alibi.',supportingEvidenceIds:['e2','e4'],contradictions:[],finalExplanation:'The timestamp places Suspect 2 in the archive.'}};
}

test('accusation API retries return the saved result and conflicting retries preserve it',async()=>{
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  try{
    const base=`http://127.0.0.1:${server.address().port}/api/v1`;
    const health=await fetch(`${base}/health`);const cookie=health.headers.get('set-cookie').split(';')[0];
    const owner=cookie.slice('amr_session='.length).split('.')[0];
    const created=await createCase({scenario:'A sufficiently detailed fictional scenario.',difficulty:'medium'},owner,async()=>caseFixture());
    const submit=async suspectId=>fetch(`${base}/mysteries/${created.caseId}/accusations`,{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({suspectId})});
    const firstResponse=await submit('s2');const first=await firstResponse.json();
    const retryResponse=await submit('s2');const retry=await retryResponse.json();
    assert.equal(firstResponse.status,200);assert.equal(retryResponse.status,200);assert.equal(retry.resultId,first.resultId);assert.equal(retry.score,150);
    const conflictResponse=await submit('s1');const conflict=await conflictResponse.json();
    assert.equal(conflictResponse.status,409);assert.equal(conflict.error.code,'ALREADY_SUBMITTED');
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('case image API returns stored image bytes only to the owning session',async()=>{
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');let caseId;
  try{
    const base=`http://127.0.0.1:${server.address().port}/api/v1`;
    const health=await fetch(`${base}/health`);const cookie=health.headers.get('set-cookie').split(';')[0];
    const owner=cookie.slice('amr_session='.length).split('.')[0];const bytes=Buffer.from([137,80,78,71,13,10,26,10]);
    const generated=caseFixture();generated.evidence[4].type='image';
    const created=await createCase({scenario:'A sufficiently detailed fictional scenario.',difficulty:'medium'},owner,async()=>generated,{
      imageGenerator:async()=>({buffer:bytes,mimeType:'image/png'}),
    });
    caseId=created.caseId;
    const publicResponse=await fetch(`${base}/mysteries/${caseId}`,{headers:{cookie}});const publicCase=await publicResponse.json();
    const imageEvidence=publicCase.evidence.find(item=>item.type==='image');
    assert.equal(imageEvidence.assetStatus,'ready');assert.equal(Object.hasOwn(imageEvidence,'assetFileName'),false);
    const imageResponse=await fetch(`http://127.0.0.1:${server.address().port}${imageEvidence.assetUrl}`,{headers:{cookie}});
    assert.equal(imageResponse.status,200);assert.match(imageResponse.headers.get('content-type'),/image\/png/);assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()),bytes);
    const foreignResponse=await fetch(`http://127.0.0.1:${server.address().port}${imageEvidence.assetUrl}`);
    assert.equal(foreignResponse.status,404);
  }finally{
    if(caseId)await deleteCaseImageDirectory(caseId);
    await new Promise(resolve=>server.close(resolve));
  }
});
