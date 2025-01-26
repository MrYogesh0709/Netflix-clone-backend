import express from 'express';

const server = express();

server.get('/', (req, res) => {
  res.send('hello man');
});

export default server;
