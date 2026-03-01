import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '../App';

function ThrowOnRender({ error }: { error: Error }): never {
  throw error;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress React's error boundary console.error output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Hello world</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows generic error message for regular errors', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender error={new Error('Something broke')} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('shows chunk load error for dynamic import failures', () => {
    const chunkError = new Error('Failed to fetch dynamically imported module: /assets/chunk-abc123.js');

    render(
      <ErrorBoundary>
        <ThrowOnRender error={chunkError} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load page.')).toBeInTheDocument();
    expect(screen.getByText('Check your network connection and try again.')).toBeInTheDocument();
  });

  it('shows chunk load error for ChunkLoadError name', () => {
    const chunkError = new Error('Loading chunk 5 failed');
    chunkError.name = 'ChunkLoadError';

    render(
      <ErrorBoundary>
        <ThrowOnRender error={chunkError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Failed to load page.')).toBeInTheDocument();
  });
});
