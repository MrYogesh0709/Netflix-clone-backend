import express from 'express';
import userRouter from './api/routes/user.routes';
import { errorLogger, expressLogger } from './utils/logger';

const server = express();

server.use(express.json());
server.use(expressLogger);

server.use('/api/v1/', userRouter);

server.use(errorLogger);

server.use((req, res) => {
  res.status(404).json({ msg: 'Route does not exists' });
});

export default server;
