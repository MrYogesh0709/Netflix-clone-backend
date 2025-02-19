import express from 'express';
import { env } from './utils/env';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorLogger, expressLogger } from './utils/logger';
import { errorHandler } from './errors/ErrorHandler';
import { notFound } from './errors/notFound';
import { constants } from './utils/constant';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';

//middleware
import { generalLimiterMiddleware } from './api/middleware/rateLimiterMiddleware';

//routes
import userRouter from './api/routes/user.routes';
import profileRouter from './api/routes/profile.routes';
import stripeRouter from './api/routes/stripe.routes';

import MovieModel from './models/Movie.model';
import StipeController from './api/controllers/stripe.controller';

const server = express();

server.use(express.urlencoded({ extended: true }));
server.post('/webhook', express.raw({ type: 'application/json' }), StipeController.handleWebhook);

server.use(express.json());
server.use('/stripe', stripeRouter);

server.use(helmet());
server.use(cors());
server.use(express.json({ limit: constants.JSON_LIMIT }));
server.use(cookieParser(env.COOKIE_SECRET));
server.use(expressLogger);
server.use(generalLimiterMiddleware);

server.use('/api/v1/auth', userRouter);
server.use('/api/v1/profile', profileRouter);

server.get('/movies/:id', async (req, res) => {
  try {
    const movie = await MovieModel.findById(req.params.id);
    if (!movie) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }
    res.json({
      ...movie.toObject(),
      videoUrl: `${env.VIDEO_BASE_URL}/${movie.videoFolder}/master.m3u8`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.get('/movies/:id/thumbnails', async (req, res) => {
  const { id } = req.params;
  const movie = await MovieModel.findById(id);
  if (!movie) {
    res.status(404).json({ error: 'Movie not found' });
    return;
  }
  const { second } = req.query;
  if (!second) {
    res.status(400).json({ error: 'Second parameter is required' });
    return;
  }

  const folderPath = path.join(__dirname, `../videos/${movie.videoFolder}/thumbnails`);

  const thumbnailFile = `thumbnail_${String(second).padStart(3, '0')}.png`;

  const filePath = path.join(folderPath, thumbnailFile);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Thumbnail not found' });
    return;
  }
  const thumbnailUrl = `${env.VIDEO_BASE_URL}/${movie.videoFolder}/thumbnails/${thumbnailFile}`;
  res.json({ thumbnailUrl });
});

server.use(notFound);
server.use(errorLogger);
server.use(errorHandler);

export default server;
