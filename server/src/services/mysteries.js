import mongoose from 'mongoose';
import { Mystery } from '../models/Mystery.js';
import { Result } from '../models/Result.js';
import { memoryMysteries, memoryResults } from '../repositories/memory.js';
import { saveEvidenceImage, readEvidenceImage, deleteCaseImageDirectory } from './imageAssets.js';
import { AppError } from '../utils/errors.js';

const useMongo = () => mongoose.connection.readyState === 1;
const scoreByDifficulty = { easy: 100, medium: 150, hard: 200 };

function publicCase(doc) {
  const caseId = String(doc._id);
  return {
    caseId,
    title: doc.title,
    summary: doc.summary,
    setting: doc.setting,
    difficulty: doc.difficulty,
    incidentTime: doc.incidentTime,
    suspects: doc.suspects,
    evidence: doc.evidence.map(({ assetFileName, assetMimeType, ...item }) => ({
      ...item,
      assetStatus: item.type === 'image' ? (item.assetStatus || 'failed') : 'not_required',
      ...(item.type === 'image' && item.assetStatus === 'ready' && assetFileName
        ? { assetUrl: `/api/v1/mysteries/${caseId}/evidence/${encodeURIComponent(item.id)}/image` }
        : {}),
    })),
    timeline: doc.timeline,
    status: doc.status,
  };
}

function findCase(id, owner) {
  if (useMongo()) return Mystery.findOne({ _id: id, owner }).lean();
  const found = memoryMysteries.get(id);
  return Promise.resolve(found?.owner === owner ? found : null);
}

export async function createCase(input, owner, generator, { imageGenerator = null, imageWriter = saveEvidenceImage } = {}) {
  const generated = await generator(input);
  const caseId = new mongoose.Types.ObjectId().toString();
  const evidence = [];

  for (const item of generated.evidence) {
    if (item.type !== 'image') {
      evidence.push({ ...item, assetStatus: 'not_required' });
      continue;
    }
    if (!imageGenerator) {
      evidence.push({ ...item, assetStatus: 'failed' });
      continue;
    }
    try {
      const generatedAsset = await imageGenerator({
        scenario: input.scenario,
        setting: generated.setting,
        title: item.title,
        description: item.description,
      });
      const storedAsset = await imageWriter(caseId, item.id, generatedAsset);
      evidence.push({
        ...item,
        assetStatus: 'ready',
        assetFileName: storedAsset.fileName,
        assetMimeType: storedAsset.mimeType,
      });
    } catch (error) {
      const providerStatus = Number(error?.status || error?.statusCode);
      const providerCode = typeof error?.code === 'string' && /^[A-Z_]{2,40}$/.test(error.code) ? error.code : undefined;
      console.warn(JSON.stringify({
        level: 'warn', event: 'evidence_image_failed', caseId, evidenceId: item.id,
        providerStatus: Number.isInteger(providerStatus) ? providerStatus : undefined,
        providerCode, errorType: error?.name || 'Error',
      }));
      evidence.push({ ...item, assetStatus: 'failed' });
    }
  }

  const fields = { ...generated, evidence, _id: caseId, owner, difficulty: input.difficulty, scenario: input.scenario, status: 'ready' };
  let doc;
  if (useMongo()) {
    try {
      doc = await Mystery.create(fields);
    } catch (error) {
      await deleteCaseImageDirectory(caseId).catch(() => {});
      throw error;
    }
  } else {
    doc = { ...fields, createdAt: new Date() };
    memoryMysteries.set(caseId, doc);
  }
  return publicCase(doc);
}

export async function getCase(id, owner) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(400, 'VALIDATION_ERROR', 'That case ID is not valid.');
  const doc = await findCase(id, owner);
  if (!doc) throw new AppError(404, 'CASE_NOT_FOUND', 'We could not find that case.');
  return publicCase(doc);
}

export async function getEvidenceImage(id, owner, evidenceId) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(400, 'VALIDATION_ERROR', 'That case ID is not valid.');
  const doc = await findCase(id, owner);
  if (!doc) throw new AppError(404, 'CASE_NOT_FOUND', 'We could not find that case.');
  const item = doc.evidence.find((entry) => entry.id === evidenceId && entry.type === 'image');
  if (!item || item.assetStatus !== 'ready' || !item.assetFileName || !item.assetMimeType) {
    throw new AppError(404, 'CASE_NOT_FOUND', 'This evidence image is unavailable.');
  }
  const asset = await readEvidenceImage(String(doc._id), item.assetFileName, item.assetMimeType);
  if (!asset) throw new AppError(404, 'CASE_NOT_FOUND', 'This evidence image is unavailable.');
  return asset;
}

function buildResult(doc, result) {
  return {
    resultId: String(result._id || `${result.caseId}-result`),
    isCorrect: result.isCorrect,
    selectedSuspectId: result.selectedSuspectId,
    selectedSuspect: doc.suspects.find((suspect) => suspect.id === result.selectedSuspectId),
    score: result.score,
    difficulty: doc.difficulty,
    solution: { ...doc.solution, culprit: doc.suspects.find((suspect) => suspect.id === doc.solution.culpritId) },
    evidence: publicCase(doc).evidence,
  };
}

function alreadySubmitted() {
  return new AppError(409, 'ALREADY_SUBMITTED', 'An accusation has already been submitted for this case. The original result is unchanged.');
}

async function existingResult(id, owner) {
  return useMongo() ? Result.findOne({ caseId: id, owner }).lean() : memoryResults.get(id);
}

function toResult(doc, storedResult, suspectId) {
  if (storedResult.selectedSuspectId !== suspectId) throw alreadySubmitted();
  return buildResult(doc, storedResult);
}

export async function accuse(id, owner, suspectId) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(400, 'VALIDATION_ERROR', 'That case ID is not valid.');
  const doc = await findCase(id, owner);
  if (!doc) throw new AppError(404, 'CASE_NOT_FOUND', 'We could not find that case.');
  if (doc.status !== 'ready') throw new AppError(409, 'CASE_NOT_READY', 'This case is not ready for an accusation.');
  if (!doc.suspects.some((suspect) => suspect.id === suspectId)) throw new AppError(400, 'VALIDATION_ERROR', 'Select a suspect from this case.');

  const previous = await existingResult(id, owner);
  if (previous) return toResult(doc, previous, suspectId);

  const isCorrect = doc.solution.culpritId === suspectId;
  const score = isCorrect ? (scoreByDifficulty[doc.difficulty] || 0) : 0;
  const values = { caseId: id, owner, selectedSuspectId: suspectId, isCorrect, score };

  if (useMongo()) {
    try {
      const saved = await Result.create(values);
      return buildResult(doc, saved);
    } catch (error) {
      if (error.code === 11000) {
        const concurrentResult = await existingResult(id, owner);
        if (concurrentResult) return toResult(doc, concurrentResult, suspectId);
        throw alreadySubmitted();
      }
      throw error;
    }
  }

  const concurrentResult = memoryResults.get(id);
  if (concurrentResult) return toResult(doc, concurrentResult, suspectId);
  const saved = { ...values, createdAt: new Date() };
  memoryResults.set(id, saved);
  return buildResult(doc, saved);
}

export async function getSavedResult(id, owner) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(400, 'VALIDATION_ERROR', 'That case ID is not valid.');
  const doc = await findCase(id, owner);
  if (!doc) throw new AppError(404, 'CASE_NOT_FOUND', 'We could not find that case.');
  const result = await existingResult(id, owner);
  if (!result) throw new AppError(409, 'CASE_NOT_READY', 'Submit an accusation to see the solution.');
  return buildResult(doc, result);
}
