import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import CartridgeReference from '../CartridgeReference';

describe('CartridgeReference', () => {
  it('renders the page heading', () => {
    render(<CartridgeReference />);
    expect(screen.getByText('Cartridge Reference')).toBeInTheDocument();
  });

  it('shows all 43 cartridges by default', () => {
    render(<CartridgeReference />);
    expect(screen.getByText('Showing 43 of 43 cartridges')).toBeInTheDocument();
  });

  it('renders category filter tabs', () => {
    render(<CartridgeReference />);
    // Category names appear in both tabs and table badges; check tabs via class
    const tabs = document.querySelectorAll('.cat-tab');
    const tabTexts = Array.from(tabs).map(t => t.textContent?.replace(/\d+/g, '').trim());
    expect(tabTexts).toContain('All');
    expect(tabTexts).toContain('Handgun');
    expect(tabTexts).toContain('Intermediate');
    expect(tabTexts).toContain('Standard Rifle');
    expect(tabTexts).toContain('Magnum');
  });

  it('filters by Handgun category', async () => {
    const user = userEvent.setup();
    render(<CartridgeReference />);

    // Click the Handgun tab (first one containing "Handgun" text)
    const buttons = screen.getAllByRole('button');
    const handgunTab = buttons.find(btn => btn.textContent?.includes('Handgun'));
    await user.click(handgunTab!);

    expect(screen.getByText('Showing 12 of 43 cartridges')).toBeInTheDocument();
    expect(screen.getByText('.380 ACP 95gr FMJ')).toBeInTheDocument();
    expect(screen.queryByText('.308 Win 168gr BTHP Match')).not.toBeInTheDocument();
  });

  it('filters by Magnum category', async () => {
    const user = userEvent.setup();
    render(<CartridgeReference />);

    const buttons = screen.getAllByRole('button');
    const magnumTab = buttons.find(btn => btn.textContent?.includes('Magnum'));
    await user.click(magnumTab!);

    expect(screen.getByText('Showing 9 of 43 cartridges')).toBeInTheDocument();
    expect(screen.getByText('.50 BMG 750gr A-MAX')).toBeInTheDocument();
  });

  it('filters by search text', async () => {
    const user = userEvent.setup();
    render(<CartridgeReference />);

    const search = screen.getByPlaceholderText(/search/i);
    await user.type(search, '.308');

    // Should show .308 Win cartridges
    expect(screen.getByText('.308 Win 168gr BTHP Match')).toBeInTheDocument();
    expect(screen.getByText('.308 Win 175gr SMK')).toBeInTheDocument();
    expect(screen.queryByText('9mm Luger 115gr FMJ')).not.toBeInTheDocument();
  });

  it('combines category and search filters', async () => {
    const user = userEvent.setup();
    render(<CartridgeReference />);

    // First filter by Standard Rifle
    const buttons = screen.getAllByRole('button');
    const rifleTab = buttons.find(btn => btn.textContent?.includes('Standard Rifle'));
    await user.click(rifleTab!);

    // Then search for ".308"
    const search = screen.getByPlaceholderText(/search/i);
    await user.type(search, '.308');

    // Should only show .308 Win in Standard Rifle category
    expect(screen.getByText('.308 Win 168gr BTHP Match')).toBeInTheDocument();
    // .300 Win Mag is Magnum, not Standard Rifle
    expect(screen.queryByText('.300 Win Mag 190gr BTHP Match')).not.toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<CartridgeReference />);
    expect(screen.getByText('Cartridge')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Bullet Type')).toBeInTheDocument();
    expect(screen.getByText('BC G1')).toBeInTheDocument();
  });

  it('shows bullet type popover when clicking a type', async () => {
    const user = userEvent.setup();
    render(<CartridgeReference />);

    // No popover initially
    expect(document.querySelector('.bullet-popover')).toBeNull();

    // Click the first FMJ button in the table
    const fmjButtons = screen.getAllByRole('button').filter(btn => btn.textContent === 'FMJ');
    await user.click(fmjButtons[0]);

    // Popover should appear
    const popover = document.querySelector('.bullet-popover');
    expect(popover).not.toBeNull();
    expect(popover!.textContent).toContain('Full Metal Jacket');
  });

  it('closes bullet type popover when clicking close', async () => {
    const user = userEvent.setup();
    render(<CartridgeReference />);

    // Open popover
    const fmjButtons = screen.getAllByRole('button').filter(btn => btn.textContent === 'FMJ');
    await user.click(fmjButtons[0]);
    expect(document.querySelector('.bullet-popover')).not.toBeNull();

    // Close it
    await user.click(screen.getByText('×'));
    expect(document.querySelector('.bullet-popover')).toBeNull();
  });

  it('renders bullet type glossary section', () => {
    render(<CartridgeReference />);
    expect(screen.getByText('Bullet Type Glossary')).toBeInTheDocument();
  });

  it('renders data notes section', () => {
    render(<CartridgeReference />);
    expect(screen.getByText('Data Notes')).toBeInTheDocument();
  });

  it('returns to all cartridges when clicking All tab', async () => {
    const user = userEvent.setup();
    render(<CartridgeReference />);

    // Filter by Handgun first
    const buttons = screen.getAllByRole('button');
    const handgunTab = buttons.find(btn => btn.textContent?.includes('Handgun'));
    await user.click(handgunTab!);
    expect(screen.getByText('Showing 12 of 43 cartridges')).toBeInTheDocument();

    // Click All to reset
    const allTab = buttons.find(btn => btn.textContent?.includes('All'));
    await user.click(allTab!);
    expect(screen.getByText('Showing 43 of 43 cartridges')).toBeInTheDocument();
  });
});
