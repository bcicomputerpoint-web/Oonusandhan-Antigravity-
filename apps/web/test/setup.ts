import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js navigation hooks globally
vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
    }),
    usePathname: () => '/dashboard',
    useParams: () => ({}),
  };
});
