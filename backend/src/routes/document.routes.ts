import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { guardrailsMiddleware } from '../middleware/guardrails.middleware';
import { rateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.use(authenticateJwt);
router.use(rateLimiter.middleware());

router.post('/', guardrailsMiddleware, DocumentController.create);
router.get('/', DocumentController.list);
router.get('/:id', DocumentController.getOne);
router.delete('/:id', DocumentController.delete);
router.post('/:id/reextract', DocumentController.reextract);

export default router;
