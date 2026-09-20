import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import messageRoutes from './messageRoutes.js';
import keyRoutes from './keyRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/conversations', conversationRoutes);
apiRouter.use('/messages', messageRoutes);
apiRouter.use('/keys', keyRoutes);

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'cipherchat-backend',
    timestamp: new Date().toISOString(),
    e2eeReady: true,
  });
});

export default apiRouter;
