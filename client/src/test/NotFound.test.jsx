import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../pages/NotFound';

describe('NotFound page', () => {
  const renderNotFound = () =>
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

  it('renders 404 heading', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders a "Page Not Found" message', () => {
    renderNotFound();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('has a link to the dashboard', () => {
    renderNotFound();
    const link = screen.getByRole('link', { name: /go to dashboard/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('has a "Go Back" button', () => {
    renderNotFound();
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });
});
