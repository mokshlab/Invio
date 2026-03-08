import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema } from '../../validators/authValidator.js';

describe('signupSchema', () => {
  const valid = { name: 'Alice', email: 'alice@test.com', password: 'secret123' };

  it('accepts valid input', () => {
    expect(() => signupSchema.parse(valid)).not.toThrow();
  });

  it('lowercases email', () => {
    const result = signupSchema.parse({ ...valid, email: 'ALICE@TEST.COM' });
    expect(result.email).toBe('alice@test.com');
  });

  it('trims name', () => {
    const result = signupSchema.parse({ ...valid, name: '  Alice  ' });
    expect(result.name).toBe('Alice');
  });

  it('rejects missing name', () => {
    const result = signupSchema.safeParse({ email: 'a@b.com', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejects short name', () => {
    const result = signupSchema.safeParse({ ...valid, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects name over 50 chars', () => {
    const result = signupSchema.safeParse({ ...valid, name: 'A'.repeat(51) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = signupSchema.safeParse({ ...valid, email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = signupSchema.safeParse({ ...valid, password: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects password over 100 chars', () => {
    const result = signupSchema.safeParse({ ...valid, password: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid input', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'x' })).not.toThrow();
  });

  it('lowercases email', () => {
    const result = loginSchema.parse({ email: 'A@B.COM', password: 'x' });
    expect(result.email).toBe('a@b.com');
  });

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com' });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'x' });
    expect(result.success).toBe(false);
  });
});
