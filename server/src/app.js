import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express();

// The client is served from a different origin (Vercel vs. Render in production,
// a different port in dev), so uploaded images must be allowed cross-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/uploads/complaints',
  express.static(path.join(process.cwd(), 'src/uploads/complaints')),
);

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
