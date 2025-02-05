import express from 'express';
import userRouter from './api/routes/user.routes';

const server = express();

server.use(express.json());

server.use('/api/v1/', userRouter);

server.use((req, res) => {
  res.status(404).json({ msg: 'Route does not exists' });
});

export default server;
