import express from 'express';
import { env } from './utils/env';
import cookieParser from 'cookie-parser';
import { errorLogger, expressLogger } from './utils/logger';
import { errorHandler } from './errors/ErrorHandler';
import { notFound } from './errors/notFound';
import { constants } from './utils/constant';

//security
import helmet from 'helmet';

//middleware
import { generalLimiterMiddleware } from './api/middleware/rateLimiterMiddleware';

//routes
import userRouter from './api/routes/user.routes';
import profileRouter from './api/routes/profile.routes';

const server = express();

server.use(helmet());
server.use(express.json({ limit: constants.JSON_LIMIT }));
server.use(cookieParser(env.COOKIE_SECRET));
server.use(expressLogger);
server.use(generalLimiterMiddleware);

server.use('/api/v1/auth', userRouter);
server.use('/api/v1/profile', profileRouter);

server.use(notFound);
server.use(errorLogger);
server.use(errorHandler);

export default server;
