import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function buildImageGenerationConfig() {
  return {
    responseModalities: ['IMAGE'],
    imageConfig: { aspectRatio: '4:3', imageSize: '1K' },
  };
}

export async function generateEvidenceImage({ scenario, setting, title, description }) {
  if (!env.geminiApiKey) throw new Error('Image generation is not configured.');
  if (!env.geminiImageModel) throw new Error('No image generation model is configured.');

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
  const prompt = [
    'Create one polished cinematic evidence illustration for a fictional detective mystery.',
    'Depict only the fictional scene described below. Invented people and places only; no real person, no readable text, no logos, no gore.',
    'Use a restrained midnight navy, cool cyan, and warm brass palette. The image should look like a believable atmospheric case exhibit, not a UI screenshot.',
    `Fictional setting: ${setting}`,
    `Fictional case scenario: ${scenario}`,
    `Evidence title: ${title}`,
    `Evidence description: ${description}`,
  ].join('\n\n');

  const response = await ai.models.generateContent({
    model: env.geminiImageModel,
    contents: prompt,
    config: buildImageGenerationConfig(),
  });

  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      const mimeType = part.inlineData?.mimeType;
      const base64 = part.inlineData?.data;
      if (!base64 || !IMAGE_MIME_TYPES.has(mimeType)) continue;
      const buffer = Buffer.from(base64, 'base64');
      if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error('Generated image size is outside the allowed range.');
      return { buffer, mimeType };
    }
  }
  throw new Error('The image provider returned no supported image.');
}
