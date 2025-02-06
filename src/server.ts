import express from 'express';
import userRouter from './api/routes/user.routes';
import { errorLogger, expressLogger } from './utils/logger';
import { errorHandler } from './errors/ErrorHandler';
import { notFound } from './errors/notFound';

const server = express();

server.use(express.json());
server.use(expressLogger);

server.use('/api/v1/auth', userRouter);

server.use(notFound);
server.use(errorLogger);
server.use(errorHandler);

export default server;
