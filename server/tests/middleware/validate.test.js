import { describe, it, expect } from 'vitest';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().positive(),
});

function mockReqResNext(body) {
  const req = { body };
  const res = {
    _status: null,
    _json: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(data) {
      this._json = data;
      return this;
    },
  };
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };
  return { req, res, next, wasNextCalled: () => nextCalled };
}

describe('validate middleware', () => {
  const middleware = validate(testSchema);

  it('calls next() on valid input', () => {
    const { req, res, next, wasNextCalled } = mockReqResNext({ name: 'Alice', age: 30 });
    middleware(req, res, next);
    expect(wasNextCalled()).toBe(true);
    expect(res._status).toBeNull();
  });

  it('returns 400 with errors on invalid input', () => {
    const { req, res, next, wasNextCalled } = mockReqResNext({ name: '', age: -1 });
    middleware(req, res, next);
    expect(wasNextCalled()).toBe(false);
    expect(res._status).toBe(400);
    expect(res._json.message).toBe('Validation failed');
    expect(res._json.errors).toBeInstanceOf(Array);
    expect(res._json.errors.length).toBeGreaterThan(0);
  });

  it('returns structured error with field and message', () => {
    const { req, res, next } = mockReqResNext({});
    middleware(req, res, next);
    const errors = res._json.errors;
    expect(errors[0]).toHaveProperty('field');
    expect(errors[0]).toHaveProperty('message');
  });

  it('returns 400 on missing required fields', () => {
    const { req, res, next, wasNextCalled } = mockReqResNext({});
    middleware(req, res, next);
    expect(wasNextCalled()).toBe(false);
    expect(res._status).toBe(400);
  });
});
