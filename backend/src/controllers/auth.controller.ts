import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  public static async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const result = await AuthService.register(email, password, name);
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Registration failed' });
    }
  }

  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const result = await AuthService.login(email, password);
      return res.json(result);
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Authentication failed' });
    }
  }

  public static async demoLogin(_req: Request, res: Response) {
    try {
      const result = await AuthService.createDemoAccount();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to create demo session' });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { passwordHash: _, ...safeUser } = req.user;
    return res.json({ user: safeUser });
  }
}
