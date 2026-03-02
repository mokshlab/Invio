import { describe, it, expect } from 'vitest';
import {
  getPasswordStrength,
  strengthLabels,
  strengthColors,
} from '../utils/passwordStrength';

describe('getPasswordStrength', () => {
  it('returns 0 for empty string', () => {
    expect(getPasswordStrength('')).toBe(0);
  });

  it('returns 0 for short passwords', () => {
    expect(getPasswordStrength('abc')).toBe(0);
  });

  it('returns 1 for a 6-char lowercase-only password', () => {
    expect(getPasswordStrength('abcdef')).toBe(1);
  });

  it('scores higher for longer passwords with mixed chars', () => {
    expect(getPasswordStrength('Abcdef1!')).toBeGreaterThanOrEqual(4);
  });

  it('returns 5 for a strong password with all criteria', () => {
    expect(getPasswordStrength('MyP@ssw0rd12')).toBe(5);
  });
});

describe('strength metadata', () => {
  it('has 6 labels and 6 colors', () => {
    expect(strengthLabels).toHaveLength(6);
    expect(strengthColors).toHaveLength(6);
  });

  it('first entries are empty strings', () => {
    expect(strengthLabels[0]).toBe('');
    expect(strengthColors[0]).toBe('');
  });
});
