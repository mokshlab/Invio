import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with role="status" and aria-label', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('applies fullScreen wrapper classes', () => {
    const { container } = render(<LoadingSpinner fullScreen />);
    const wrapper = container.firstChild;
    expect(wrapper.className).toContain('min-h-screen');
  });

  it('renders inline without wrapper padding', () => {
    const { container } = render(<LoadingSpinner inline />);
    const wrapper = container.firstChild;
    expect(wrapper.className).not.toContain('py-8');
    expect(wrapper.className).not.toContain('min-h-screen');
  });

  it('uses correct size classes', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('w-5');
  });
});
