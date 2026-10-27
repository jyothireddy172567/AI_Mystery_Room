import { z } from 'zod';
export const generateSchema=z.object({scenario:z.string().trim().min(30).max(2000),difficulty:z.enum(['easy','medium','hard']),evidenceTypes:z.array(z.enum(['chat','image','cctv','witness','physical','timeline'])).min(1).max(6)});
export const accusationSchema=z.object({suspectId:z.string().min(1).max(80)});
const entityId=z.string().regex(/^[A-Za-z0-9_-]{1,80}$/);
const suspect=z.object({id:entityId,name:z.string(),occupation:z.string(),background:z.string(),motive:z.string(),relationship:z.string(),alibi:z.string()});
const evidence=z.object({id:entityId,type:z.enum(['chat','image','cctv','witness','physical','timeline']),title:z.string(),description:z.string(),timestamp:z.string(),content:z.record(z.string(),z.unknown()).optional(),relatedSuspectIds:z.array(entityId).default([])});
export const mysterySchema=z.object({title:z.string(),summary:z.string(),setting:z.string(),incidentTime:z.string(),suspects:z.array(suspect).length(4),evidence:z.array(evidence).length(8),timeline:z.array(z.object({timestamp:z.string(),description:z.string(),relatedEvidenceIds:z.array(z.string()).default([])})).default([]),solution:z.object({culpritId:z.string(),reasoningSummary:z.string(),supportingEvidenceIds:z.array(z.string()).min(2),contradictions:z.array(z.string()).default([]),finalExplanation:z.string()})});
export function isValidCaseTimestamp(value){
  if(Number.isFinite(Date.parse(value)))return true;
  const time24=/^(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
  const time12=/^(?:0?[1-9]|1[0-2]):[0-5]\d(?::[0-5]\d)?\s*(?:AM|PM)$/i;
  const relative=/^(?:day\s+\d+\s*[,·-]\s*)?(?:T\+)?(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/i;
  return time24.test(value)||time12.test(value)||relative.test(value);
}
export function validateMystery(raw,requestedTypes){const parsed=mysterySchema.safeParse(raw);if(!parsed.success)return {ok:false,issues:parsed.error.issues};const c=parsed.data;const suspectIds=c.suspects.map(x=>x.id),evidenceIds=c.evidence.map(x=>x.id);if(new Set(suspectIds).size!==4||new Set(evidenceIds).size!==8)return {ok:false,issues:[{message:'IDs must be unique'}]};if(!suspectIds.includes(c.solution.culpritId))return {ok:false,issues:[{message:'Culprit does not exist'}]};if(c.solution.supportingEvidenceIds.some(id=>!evidenceIds.includes(id)))return {ok:false,issues:[{message:'Solution references unknown evidence'}]};if(c.evidence.some(e=>e.relatedSuspectIds.some(id=>!suspectIds.includes(id))))return {ok:false,issues:[{message:'Evidence references unknown suspect'}]};if(c.evidence.some(e=>!isValidCaseTimestamp(e.timestamp))||c.timeline.some(item=>!isValidCaseTimestamp(item.timestamp)))return {ok:false,issues:[{message:'Evidence timestamps must use ISO date-time or a consistent case clock'}]};if(requestedTypes&&c.evidence.some(e=>!requestedTypes.includes(e.type)))return {ok:false,issues:[{message:'Evidence contains an unrequested type'}]};return {ok:true,data:c};}
