import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';
import { ensureImageStorage } from './services/imageAssets.js';

if(env.mongoUri){try{await mongoose.connect(env.mongoUri);console.info('MongoDB connected');}catch(error){console.error('MongoDB connection failed:',error.message);if(env.nodeEnv==='production')process.exit(1);}}
else if(env.nodeEnv==='production'){throw new Error('MONGODB_URI is required in production');}
else console.warn('MONGODB_URI is empty; using process-local demo storage. Cases disappear on restart.');
await ensureImageStorage();
app.listen(env.port, '0.0.0.0',()=>console.info(`AI Mystery Room listening on 0.0.0.0:${env.port}`));
