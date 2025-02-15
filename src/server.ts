import express from 'express';
import { env } from './utils/env';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorLogger, expressLogger } from './utils/logger';
import { errorHandler } from './errors/ErrorHandler';
import { notFound } from './errors/notFound';
import { constants } from './utils/constant';
import path from 'path';
//security
import helmet from 'helmet';

//middleware
import { generalLimiterMiddleware } from './api/middleware/rateLimiterMiddleware';

//routes
import userRouter from './api/routes/user.routes';
import profileRouter from './api/routes/profile.routes';
import MovieModel from './models/Movie.model';

const server = express();

// server.use(helmet());
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

server.use(notFound);
server.use(errorLogger);
server.use(errorHandler);

export default server;
