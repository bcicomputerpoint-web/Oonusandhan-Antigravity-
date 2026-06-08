import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Protected Routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based client-side redirects can also be enforced here by checking a custom cookie,
    // but doing role-based redirection on page component mount is more flexible.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
