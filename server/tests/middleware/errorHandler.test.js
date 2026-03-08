import { describe, it, expect, vi } from 'vitest';

// Mock config before importing errorHandler
vi.mock('../../config/index.js', () => ({
  default: { nodeEnv: 'production' },
}));

const { errorHandler, notFound } = await import('../../middleware/errorHandler.js');

function mockRes() {
  const res = {
    _status: 200,
    _json: null,
    statusCode: 200,
    status(code) {
      this._status = code;
      this.statusCode = code;
      return this;
    },
    json(data) {
      this._json = data;
      return this;
    },
  };
  return res;
}

describe('errorHandler', () => {
  it('uses err.statusCode when provided', () => {
    const err = new Error('bad');
    err.statusCode = 400;
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res._status).toBe(400);
    expect(res._json.message).toBe('bad');
  });

  it('falls back to 500 for generic errors', () => {
    const err = new Error('oops');
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res._status).toBe(500);
  });

  it('handles Mongoose CastError', () => {
    const err = new Error('Cast failed');
    err.name = 'CastError';
    err.kind = 'ObjectId';
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res._status).toBe(400);
    expect(res._json.message).toBe('Resource not found');
  });

  it('handles Mongoose duplicate key error', () => {
    const err = new Error('dup');
    err.code = 11000;
    err.keyValue = { email: 'a@b.com' };
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res._status).toBe(400);
    expect(res._json.message).toContain('email already exists');
  });

  it('handles Mongoose ValidationError', () => {
    const err = new Error('validation');
    err.name = 'ValidationError';
    err.errors = {
      name: { message: 'Name is required' },
      email: { message: 'Invalid email' },
    };
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res._status).toBe(400);
    expect(res._json.message).toContain('Name is required');
    expect(res._json.message).toContain('Invalid email');
  });

  it('does not include stack trace in production', () => {
    const err = new Error('fail');
    err.statusCode = 500;
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res._json.stack).toBeUndefined();
  });
});

describe('notFound', () => {
  it('sets 404 and passes error to next', () => {
    const req = { originalUrl: '/api/missing' };
    const res = mockRes();
    let passedErr = null;
    const next = (err) => {
      passedErr = err;
    };
    notFound(req, res, next);
    expect(res._status).toBe(404);
    expect(passedErr).toBeInstanceOf(Error);
    expect(passedErr.message).toContain('/api/missing');
  });
});
