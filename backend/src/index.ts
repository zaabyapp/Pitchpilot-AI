import dotenv from 'dotenv';
dotenv.config();

import { createServer as createHttpServer } from 'http';
import { createServer } from './server';
import { setupVoiceWebSocket } from './services/voice.websocket';

const PORT = process.env.PORT || 3001;
const app = createServer();
const httpServer = createHttpServer(app);

setupVoiceWebSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`PitchPilot AI Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`Voice WebSocket: ws://localhost:${PORT}/ws/voice`);
});
