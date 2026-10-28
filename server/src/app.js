import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import mysteries from './routes/mysteries.js';
import { requestId } from './middleware/request.js';
import { session } from './middleware/session.js';
import { errorHandler,AppError } from './utils/errors.js';

const app=express();
app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientOrigins, credentials: true, optionsSuccessStatus: 200 }));
app.use(express.json({limit:'32kb'}));
app.use(cookieParser());
app.use(requestId);
app.use(session);
app.get('/api/v1/health',(_req,res)=>res.json({status:'ok'}));
app.use('/api/v1/mysteries',mysteries);

// Never let the SPA fallback turn an unknown API path into a successful HTML response.
app.use('/api',(_req,_res,next)=>next(new AppError(404,'CASE_NOT_FOUND','That API route does not exist.')));
if (env.nodeEnv === 'production') {
  const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
  app.get('*',(req,res,next)=>res.sendFile(path.join(clientDist,'index.html'), error => error && next(error)));
}
app.use((req,_res,next)=>next(new AppError(404,'CASE_NOT_FOUND','That route does not exist.')));
app.use(errorHandler);
export default app;
