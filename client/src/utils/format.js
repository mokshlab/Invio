/**
 * Shared formatting utilities used across the application.
 */

/** Format a number as USD currency — e.g. $1,234.56 */
export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    value || 0
  );

/** Compact currency for chart axes — e.g. $1.2K */
export const fmtCompact = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0);

/** Format a date string — long form: "January 1, 2024" */
export const formatDateLong = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

/** Format a date string — short form: "Jan 1, 2024" */
export const formatDateShort = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
