import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HowItWorks from '../HowItWorks';

describe('HowItWorks', () => {
  it('renders the page heading', () => {
    render(<HowItWorks />);
    expect(screen.getByText('How the Trajectory Calculator Works')).toBeInTheDocument();
  });

  it('renders all 7 section headings', () => {
    render(<HowItWorks />);
    // Each heading appears in both the TOC and the section, so use getAllByText
    expect(screen.getAllByText('1. Shot Setup').length).toBe(2);
    expect(screen.getAllByText(/2\. Zeroing/).length).toBe(2);
    expect(screen.getAllByText('3. RK4 Trajectory Integration').length).toBe(2);
    expect(screen.getAllByText(/4\. G1 Drag Model/).length).toBe(2);
    expect(screen.getAllByText('5. The 50-Yard Reference Line').length).toBe(2);
    expect(screen.getAllByText('6. Reading the Trajectory Chart').length).toBe(2);
    expect(screen.getAllByText('7. Glossary').length).toBe(2);
  });

  it('renders the table of contents', () => {
    render(<HowItWorks />);
    expect(screen.getByText('On this page')).toBeInTheDocument();
  });

  it('renders glossary terms', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/BC — Ballistic Coefficient/)).toBeInTheDocument();
    expect(screen.getByText(/MOA — Minute of Angle/)).toBeInTheDocument();
    expect(screen.getByText(/RK4 — Runge-Kutta/)).toBeInTheDocument();
  });
});
