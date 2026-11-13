import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import * as api from '../api';
import '../i18n/i18n';
import i18n from 'i18next';

// Mock API module
vi.mock('../api', () => ({
  searchSeat: vi.fn(),
  getSiteSettings: vi.fn().mockResolvedValue({
    data: {
      require_verification: false,
      verification_field_label_bn: '',
      verification_field_label_en: '',
    },
  }),
  getNotices: vi.fn().mockResolvedValue({ data: [] }),
}));

describe('Search Form (HomePage)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('bn');
  });

  const renderHomePage = () => {
    return render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
  };

  it('renders hero title, admission roll input and search button', () => {
    renderHomePage();
    expect(screen.getByText(/আপনার সিট খুঁজুন/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ভর্তি পরীক্ষার রোল লিখুন/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /সিট খুঁজুন/i })).toBeInTheDocument();
  });

  it('validates non-numeric roll input and shows error message', async () => {
    renderHomePage();
    const input = screen.getByPlaceholderText(/ভর্তি পরীক্ষার রোল লিখুন/i);
    const form = input.closest('form');

    // Type non-numeric characters
    fireEvent.change(input, { target: { value: 'ABCDEF' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/রোল নম্বর শুধুমাত্র সংখ্যা/i)).toBeInTheDocument();
    });
    expect(api.searchSeat).not.toHaveBeenCalled();
  });

  it('calls searchSeat API with clean roll when valid number is submitted', async () => {
    api.searchSeat.mockResolvedValueOnce({
      data: {
        found: true,
        candidate: { roll: '100201', name: 'Al Noman', unit: 'A' },
        seat: { building: 'Science', room: '101', seat_no: '25' },
        center: { name_bn: 'কুমিল্লা বিশ্ববিদ্যালয়' },
      },
    });

    renderHomePage();
    const input = screen.getByPlaceholderText(/ভর্তি পরীক্ষার রোল লিখুন/i);
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: '100201' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(api.searchSeat).toHaveBeenCalledWith('100201', null);
    });
  });
});
