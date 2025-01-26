import { env } from './config/env';
import server from './server';

const PORT = env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running  on http://localhost:${PORT}`);
});
