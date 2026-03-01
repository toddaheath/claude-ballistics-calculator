import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import NotFoundPage from '../NotFoundPage';

describe('NotFoundPage', () => {
  it('renders 404 heading and message', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText("The page you're looking for doesn't exist.")).toBeInTheDocument();
  });

  it('renders a link back to the calculator', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: 'Back to Calculator' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
