import express from 'express';
import userRouter from './api/routes/user.routes';
import { errorLogger, expressLogger } from './utils/logger';
import { errorHandler } from './errors/ErrorHandler';
import { notFound } from './errors/notFound';
import cookieParser from 'cookie-parser';
import { env } from './utils/env';
import { constants } from './utils/constant';
import helmet from 'helmet';
import { generalLimiterMiddleware } from './api/middleware/rateLimiterMiddleware';

const server = express();

server.use(helmet());
server.use(express.json({ limit: constants.JSON_LIMIT }));
server.use(cookieParser(env.COOKIE_SECRET));
server.use(expressLogger);
server.use(generalLimiterMiddleware);

server.use('/api/v1/auth', userRouter);

server.use(notFound);
server.use(errorLogger);
server.use(errorHandler);

export default server;
