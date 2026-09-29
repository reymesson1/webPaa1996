import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { guardrailsMiddleware } from '../middleware/guardrails.middleware';
import { rateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.use(authenticateJwt);
router.use(rateLimiter.middleware());

// Configuration endpoints
router.get('/providers', AIController.getProviders);
router.get('/prompts', AIController.getPrompts);

// Chat & RAG endpoints
router.post('/chat/sync', guardrailsMiddleware, AIController.chatSync);
router.post('/chat/stream', guardrailsMiddleware, AIController.chatStream);

// Session history & Feedback
router.get('/session/:documentId', AIController.getSession);
router.post('/feedback', AIController.feedback);

export default router;
