import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  fmtCompact,
  formatDateLong,
  formatDateShort,
} from '../utils/format';

describe('formatCurrency', () => {
  it('formats a number as USD currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles null/undefined gracefully', () => {
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
  });

  it('formats negative values', () => {
    expect(formatCurrency(-50)).toBe('-$50.00');
  });
});

describe('fmtCompact', () => {
  it('formats large numbers in compact notation', () => {
    const result = fmtCompact(1500);
    expect(result).toMatch(/\$1\.5K/);
  });

  it('handles zero', () => {
    expect(fmtCompact(0)).toMatch(/\$0/);
  });
});

describe('formatDateLong', () => {
  it('formats a date string in long format', () => {
    const result = formatDateLong('2024-01-15');
    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});

describe('formatDateShort', () => {
  it('formats a date string in short format', () => {
    const result = formatDateShort('2024-01-15');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});
