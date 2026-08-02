import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import env from './config/env.js';
import connectDB from './database/connection.js';
import { registerSocketHandlers } from './sockets/index.js';

async function startServer() {
  await connectDB();

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  registerSocketHandlers(io);

  httpServer.listen(env.port, () => {
    console.log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
