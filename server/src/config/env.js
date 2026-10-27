import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// npm workspaces run server scripts with server/ as the working directory.
// Resolve the shared development env file relative to this module instead.
dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-nano-banana-2.1',
  // The production app serves the client and API from one origin, so CORS is
  // disabled there unless a separate client origin is explicitly configured.
  clientOrigin: process.env.CLIENT_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173'),
  sessionSecret: process.env.SESSION_SECRET || 'development-only-change-this-session-secret',
  imageStorageDir: process.env.IMAGE_STORAGE_DIR || '',
  trustProxy: process.env.NODE_ENV === 'production' ? 1 : false,
};
if (env.nodeEnv === 'production') {
  for (const key of ['MONGODB_URI', 'SESSION_SECRET', 'GEMINI_API_KEY', 'IMAGE_STORAGE_DIR']) {
    if (!process.env[key]) throw new Error(`${key} is required in production`);
  }
  if (env.sessionSecret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters in production');
}
