import connectToMongoDB from './config/mongodb.config';
import { env } from './utils/env';
import server from './server';

const PORT = env.PORT || 3000;

server.listen(PORT, async () => {
  await connectToMongoDB();
  console.log(`Server is  on http://localhost:${PORT}`);
});
