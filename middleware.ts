import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === '/login';
  const isApiPath = path.startsWith('/api/');

  // Get the Directus authentication cookie
  const directusAccessToken = request.cookies.get('directus_access_token')?.value;
  const directusRefreshToken = request.cookies.get('directus_refresh_token')?.value;
  const isAuthenticated = !!(directusAccessToken || directusRefreshToken);

  // If the path is public or an API endpoint, allow the request
  if (isPublicPath || isApiPath) {
    return NextResponse.next();
  }

  // If user is not authenticated and tries to access a protected route, redirect to login
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and tries to access login, redirect to home
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};