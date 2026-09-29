import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

interface RateLimitRecord {
  count: number;
  resetAt: number;
  tokensUsedThisWindow: number;
}

class CostAndRateLimiter {
  private clients = new Map<string, RateLimitRecord>();
  // Max tokens allowed per minute per user/IP (e.g. 50,000 tokens)
  private readonly maxTokensPerWindow = 50000;

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Key can be authenticated user ID or client IP
      const key = (req as any).user?.id || req.ip || 'anonymous';
      const now = Date.now();
      const record = this.clients.get(key);

      if (!record || now > record.resetAt) {
        this.clients.set(key, {
          count: 1,
          resetAt: now + config.rateLimitWindowMs,
          tokensUsedThisWindow: 0,
        });
        return next();
      }

      if (record.count >= config.rateLimitMaxRequests) {
        const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait before making more requests.',
          retryAfterSeconds: retryAfterSec,
        });
      }

      if (record.tokensUsedThisWindow >= this.maxTokensPerWindow) {
        const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({
          error: 'Token budget exhausted for the current window to prevent cost overrun.',
          retryAfterSeconds: retryAfterSec,
        });
      }

      record.count += 1;
      next();
    };
  }

  public recordTokenUsage(key: string, tokens: number) {
    const record = this.clients.get(key);
    if (record) {
      record.tokensUsedThisWindow += tokens;
    }
  }

  // Periodic cleanup of stale records every 10 minutes
  constructor() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, rec] of this.clients.entries()) {
        if (now > rec.resetAt) {
          this.clients.delete(key);
        }
      }
    }, 600000);
  }
}

export const rateLimiter = new CostAndRateLimiter();
