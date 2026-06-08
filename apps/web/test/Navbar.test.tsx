import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from '../src/components/Navbar';

// Setup mock contexts
const mockLogout = vi.fn().mockResolvedValue({ success: true });
const mockSetLanguage = vi.fn();

let mockUser: any = null;
let mockLanguage = 'en';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({
    language: mockLanguage,
    setLanguage: mockSetLanguage,
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard': 'Dashboard',
        'logout': 'Logout',
        'login': 'Login',
        'register': 'Sign Up',
        'language': mockLanguage === 'en' ? 'বাংলা' : 'English',
        'roles.SCHOLAR': 'Research Scholar',
        'roles.ADMIN': 'Platform Admin'
      };
      return translations[key] || key;
    },
  }),
}));

describe('Navbar Component Tests', () => {
  beforeEach(() => {
    mockUser = null;
    mockLanguage = 'en';
    vi.clearAllMocks();
  });

  it('renders sign-in links when guest user views page', () => {
    mockUser = null;
    render(<Navbar />);

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('renders dashboard options and logout button for signed-in scholars', () => {
    mockUser = {
      id: 'scholar-1',
      name: 'Tasnim Ahmed',
      role: 'SCHOLAR'
    };
    render(<Navbar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Tasnim Ahmed (Research Scholar)')).toBeInTheDocument();
  });

  it('triggers language toggle on button click', () => {
    render(<Navbar />);
    const langBtn = screen.getByText('বাংলা');
    expect(langBtn).toBeInTheDocument();

    fireEvent.click(langBtn);
    expect(mockSetLanguage).toHaveBeenCalledWith('bn');
  });

  it('triggers logout operation on button click', async () => {
    mockUser = { id: 'scholar-1', name: 'Tasnim', role: 'SCHOLAR' };
    render(<Navbar />);

    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalled();
  });
});
