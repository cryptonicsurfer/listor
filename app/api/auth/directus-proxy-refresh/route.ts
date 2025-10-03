import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.DIRECTUS_INTERNAL_URL || "https://cms.businessfalkenberg.se";

export async function POST(request: NextRequest) {
  try {
    const refreshTokenFromCookie = request.cookies.get('directus_refresh_token')?.value;

    if (!refreshTokenFromCookie) {
      console.error('[BFF Directus Refresh Proxy] Refresh token cookie not found.');
      return NextResponse.json({ error: 'Refresh token cookie not found. User may need to log in again.' }, { status: 401 });
    }

    console.log(`[BFF Directus Refresh Proxy] Attempting token refresh to ${DIRECTUS_URL}/auth/refresh`);

    const directusResponse = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshTokenFromCookie, mode: "json" }),
    });

    const responseBody = await directusResponse.json();

    if (!directusResponse.ok) {
      console.error('[BFF Directus Refresh Proxy] Directus token refresh failed:', responseBody);
      const errorMessage = responseBody?.errors?.[0]?.message || 'Directus token refresh failed';
      return NextResponse.json({ error: errorMessage, details: responseBody }, { status: directusResponse.status });
    }

    console.log('[BFF Directus Refresh Proxy] Directus token refresh successful.');

    const response = NextResponse.json(responseBody, { status: 200 });

    if (responseBody.data && responseBody.data.access_token && responseBody.data.refresh_token && responseBody.data.expires) {
      const { access_token, refresh_token, expires } = responseBody.data;
      const expiresInMs = parseInt(expires as string, 10);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const secureFlag = appUrl.startsWith('https://');

      response.cookies.set('directus_access_token', access_token, {
        httpOnly: true,
        secure: secureFlag,
        sameSite: 'lax',
        path: '/',
        maxAge: 3600, // 1 hour
      });

      response.cookies.set('directus_refresh_token', refresh_token, {
        httpOnly: true,
        secure: secureFlag,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;

  } catch (error) {
    console.error('[BFF Directus Refresh Proxy] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error during token refresh proxy' }, { status: 500 });
  }
}
