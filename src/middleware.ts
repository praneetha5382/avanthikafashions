import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // --- Basic Authentication for Admin ---
  const isAdminRoute = hostname.startsWith('admin.') || url.pathname.startsWith('/admin');
  
  if (isAdminRoute) {
    const basicAuth = req.headers.get('authorization');
    const expectedUser = process.env.ADMIN_USERNAME || 'admin';
    const expectedPass = process.env.ADMIN_PASSWORD || 'avanthika2026';

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      if (!(user === expectedUser && pwd === expectedPass)) {
        return new NextResponse('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } });
      }
    } else {
      return new NextResponse('Auth Required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } });
    }
  }

  // Check if the current request is for the admin subdomain
  if (hostname.startsWith('admin.')) {
    // If it's a static file from the public folder, don't rewrite it to /admin
    if (url.pathname.match(/\.(png|jpg|jpeg|svg|ico)$/)) {
      return NextResponse.next();
    }

    // If they are on the admin subdomain but trying to access the root, rewrite to /admin
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', req.url));
    }
    
    // Rewrite all other requests on the admin subdomain to be prefixed with /admin
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
