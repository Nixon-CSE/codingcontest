import express from 'express';
import cors from 'cors';
import { apiRouter } from '../server/routes';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'contest-platform',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'contest-platform',
  });
});

app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
