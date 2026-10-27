import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

const STORAGE_ROOT = path.resolve(env.imageStorageDir || fileURLToPath(new URL('../../storage/generated/', import.meta.url)));
const EXTENSIONS = new Map([['image/png', 'png'], ['image/jpeg', 'jpg'], ['image/webp', 'webp']]);
const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function ensureImageStorage() {
  await mkdir(STORAGE_ROOT, { recursive: true });
}

function matchesImageSignature(buffer, mimeType) {
  if (mimeType === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

function validateIds(caseId, evidenceId) {
  if (!/^[a-f\d]{24}$/i.test(caseId) || !SAFE_ID.test(evidenceId)) throw new Error('Invalid generated asset identifiers.');
}

export async function saveEvidenceImage(caseId, evidenceId, { buffer, mimeType }) {
  validateIds(caseId, evidenceId);
  const extension = EXTENSIONS.get(mimeType);
  if (!extension || !Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES || !matchesImageSignature(buffer, mimeType)) throw new Error('Invalid image asset.');
  const directory = path.join(STORAGE_ROOT, caseId);
  const fileName = `${evidenceId}.${extension}`;
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), buffer);
  return { fileName, mimeType };
}

export async function readEvidenceImage(caseId, fileName, mimeType) {
  if (!/^[a-f\d]{24}$/i.test(caseId) || typeof fileName !== 'string' || path.basename(fileName) !== fileName || !/^[A-Za-z0-9_-]{1,80}\.(png|jpg|webp)$/.test(fileName) || !EXTENSIONS.has(mimeType)) return null;
  try {
    const buffer = await readFile(path.join(STORAGE_ROOT, caseId, fileName));
    return { buffer, mimeType };
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function deleteCaseImageDirectory(caseId) {
  if (!/^[a-f\d]{24}$/i.test(caseId)) return;
  await rm(path.join(STORAGE_ROOT, caseId), { recursive: true, force: true });
}
