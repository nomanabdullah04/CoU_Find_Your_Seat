import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageToggle from '../components/common/LanguageToggle';
import '../i18n/i18n';
import i18n from 'i18next';

describe('LanguageToggle Component', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('bn');
  });

  it('renders language toggle button with current language label', () => {
    render(<LanguageToggle />);
    const button = screen.getByRole('button', { name: /toggle language/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('English');
  });

  it('switches language between Bengali and English when clicked', async () => {
    render(<LanguageToggle />);
    const button = screen.getByRole('button', { name: /toggle language/i });

    // Initial state is 'bn', button shows 'English'
    expect(i18n.language).toBe('bn');
    expect(button).toHaveTextContent('English');

    // Click to switch to English
    fireEvent.click(button);
    expect(i18n.language).toBe('en');
    expect(button).toHaveTextContent('বাংলা');

    // Click again to switch back to Bengali
    fireEvent.click(button);
    expect(i18n.language).toBe('bn');
    expect(button).toHaveTextContent('English');
  });
});

