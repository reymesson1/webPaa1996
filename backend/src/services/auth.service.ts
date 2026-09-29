import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { config } from '../config/env';
import { User, AuthTokenPayload } from '../models/types';

export class AuthService {
  public static async register(email: string, password: string, name: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const existing = db.findUserByEmail(email);
    if (existing) {
      throw new Error('A user with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user: User = {
      id: uuidv4(),
      email,
      name,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    db.saveUser(user);

    const token = this.generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public static async login(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const user = db.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password credentials.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password credentials.');
    }

    const token = this.generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  /**
   * Fast 1-click Demo Account creation for recruiters and reviewers
   */
  public static async createDemoAccount(): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const demoEmail = 'reviewer@demo.docintel.ai';
    let user = db.findUserByEmail(demoEmail);

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('ReviewerPassword2026!', salt);
      user = {
        id: `demo_${uuidv4().substring(0, 8)}`,
        email: demoEmail,
        name: 'AI Engineering Reviewer',
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      db.saveUser(user);
    }

    const token = this.generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  private static generateToken(user: User): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
    };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
  }
}
