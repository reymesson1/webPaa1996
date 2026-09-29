import { describe, it, expect } from 'vitest';
import { AuthService } from '../services/auth.service';

describe('AuthService', () => {
  it('should register a new user and return a signed JWT', async () => {
    const email = `test_${Date.now()}@example.com`;
    const result = await AuthService.register(email, 'securePassword123', 'Alice Engineer');

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(email);
    expect(result.user.name).toBe('Alice Engineer');
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });

  it('should reject duplicate email registrations', async () => {
    const email = `dup_${Date.now()}@example.com`;
    await AuthService.register(email, 'password123', 'User One');

    await expect(AuthService.register(email, 'password456', 'User Two')).rejects.toThrow(
      'already exists'
    );
  });

  it('should authenticate valid credentials and reject invalid passwords', async () => {
    const email = `login_${Date.now()}@example.com`;
    await AuthService.register(email, 'correctPassword', 'Bob Tester');

    const success = await AuthService.login(email, 'correctPassword');
    expect(success.user.email).toBe(email);

    await expect(AuthService.login(email, 'wrongPassword')).rejects.toThrow(
      'Invalid email or password'
    );
  });

  it('should provision a demo account with 1-click', async () => {
    const demo = await AuthService.createDemoAccount();
    expect(demo.user.email).toBe('reviewer@demo.docintel.ai');
    expect(demo.token).toBeDefined();
  });
});
