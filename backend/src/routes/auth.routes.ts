import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/demo', AuthController.demoLogin);
router.get('/me', authenticateJwt, AuthController.me);

export default router;
