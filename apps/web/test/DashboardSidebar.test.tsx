import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardSidebar from '../src/components/DashboardSidebar';

// Setup mock contexts
let mockUser: any = null;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    t: (key: string) => {
      const translations: Record<string, string> = {
        'sidebar.dashboard': 'Dashboard Menu',
        'sidebar.profile': 'My Profile',
        'sidebar.documents': 'Documents Desk',
        'sidebar.courses': 'Courses Desk',
        'roles.SCHOLAR': 'Research Scholar',
        'roles.ADMIN': 'Platform Admin'
      };
      return translations[key] || key;
    },
  }),
}));

describe('DashboardSidebar Component Tests', () => {
  beforeEach(() => {
    mockUser = {
      id: 'scholar-1',
      name: 'Tasnim Ahmed',
      role: 'SCHOLAR'
    };
    vi.clearAllMocks();
  });

  it('renders user details and primary navigation tabs', () => {
    render(<DashboardSidebar activeSection="dashboard" />);

    expect(screen.getByText('Tasnim Ahmed')).toBeInTheDocument();
    expect(screen.getByText('Research Scholar')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Menu')).toBeInTheDocument();
    expect(screen.getByText('Documents Desk')).toBeInTheDocument();
  });

  it('correctly reports selection click updates', () => {
    const handleSelect = vi.fn();
    render(<DashboardSidebar activeSection="dashboard" onSelectSection={handleSelect} />);

    const profileTab = screen.getByText('My Profile');
    fireEvent.click(profileTab);

    expect(handleSelect).toHaveBeenCalledWith('profile');
  });
});
