import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Get hostname of request (e.g. admin.avanthikafashions.com, or localhost:3000)
  const hostname = req.headers.get('host') || '';

  // Check if the current request is for the admin subdomain
  if (hostname.startsWith('admin.')) {
    // If they are on the admin subdomain but trying to access the root, rewrite to /admin
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', req.url));
    }
    
    // Rewrite all other requests on the admin subdomain to be prefixed with /admin
    // (e.g., admin.avanthikafashions.com/settings -> /admin/settings)
    // Note: If you only have the single /admin page, everything can just rewrite to /admin
    // but the below handles nested routes under /admin if you add them later.
    return NextResponse.rewrite(new URL(`/admin${url.pathname}`, req.url));
  }

  // If not on the admin subdomain, let the request continue normally
  return NextResponse.next();
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
