import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DocIntel AI Backend',
    version: '1.0.0',
  });
});

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/ai', aiRoutes);

export default router;
