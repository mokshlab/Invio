import { describe, it, expect } from 'vitest';
import AppError from '../../utils/AppError.js';

describe('AppError', () => {
  it('sets message and statusCode', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
  });

  it('is an instance of Error', () => {
    const err = new AppError('fail', 500);
    expect(err).toBeInstanceOf(Error);
  });

  it('sets isOperational to true', () => {
    const err = new AppError('bad', 400);
    expect(err.isOperational).toBe(true);
  });

  it('has a stack trace', () => {
    const err = new AppError('test', 500);
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('AppError');
  });
});
