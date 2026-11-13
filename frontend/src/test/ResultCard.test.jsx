import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResultPage from '../pages/ResultPage';
import '../i18n/i18n';
import i18n from 'i18next';

// Mock QRCode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockqr'),
  },
}));

// Mock MapView to avoid Leaflet DOM complications in jsdom
vi.mock('../components/MapView', () => ({
  default: () => <div data-testid="mock-map-view">Map View Loaded</div>,
}));

describe('Result Card (ResultPage)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('bn');
  });

  const mockResultData = {
    found: true,
    candidate: {
      roll: '100201',
      name: 'Abdullah Al Noman',
      unit: 'A',
    },
    seat: {
      building: 'বিজ্ঞান অনুষদ ভবন',
      room: '৪০২',
      seat_no: '৪৩',
      exam_date: '2026-12-05',
      exam_time: '10:00',
      reporting_time: '09:00',
    },
    center: {
      id: 1,
      code: 'CUC-01',
      name_en: 'Comilla University Campus',
      name_bn: 'কুমিল্লা বিশ্ববিদ্যালয় ক্যাম্পাস',
      address: 'কোটবাড়ী, কুমিল্লা',
      latitude: 23.41902,
      longitude: 91.13783,
      gate_info: 'প্রধান ফটক (গেট ১)',
      instructions_bn: 'গেট ১ দিয়ে প্রবেশ করে ডানদিকের বিজ্ঞান অনুষদ লিফট বা সিঁড়ি দিয়ে চারতলায় উঠুন।',
      instructions_en: 'Enter through Gate 1, proceed to Science building 4th floor.',
      photo_url: null,
    },
  };

  it('renders candidate details, LARGE seat number badge, and exam schedule', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/result', state: { resultData: mockResultData } }]}>
        <ResultPage />
      </MemoryRouter>
    );

    // Candidate details
    expect(screen.getByText('Abdullah Al Noman')).toBeInTheDocument();
    expect(screen.getByText('100201')).toBeInTheDocument();

    // Large Seat number badge (can appear in badge and summary row)
    const seatBadges = screen.getAllByText('৪৩');
    expect(seatBadges.length).toBeGreaterThanOrEqual(1);

    // Building and room (can appear in badge and summary row)
    const buildingElements = screen.getAllByText('বিজ্ঞান অনুষদ ভবন');
    expect(buildingElements.length).toBeGreaterThanOrEqual(1);

    const roomElements = screen.getAllByText('৪০২');
    expect(roomElements.length).toBeGreaterThanOrEqual(1);

    // Action buttons: Get directions & Save PDF
    expect(screen.getByText(/গুগল ম্যাপে রাস্তা দেখুন/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF সংরক্ষণ/i)).toBeInTheDocument();
  });

  it('renders friendly bilingual not-found message when candidate is not found', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/result',
            state: {
              notFound: true,
              searchedRoll: '999999',
              helpdesk: {
                phone: '01711-223344',
                email: 'helpdesk@cou.ac.bd',
              },
            },
          },
        ]}
      >
        <ResultPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/কোনো সিট পাওয়া যায়নি/i)).toBeInTheDocument();
    const rollElements = screen.getAllByText(/999999/);
    expect(rollElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/01711-223344/)).toBeInTheDocument();
  });
});
