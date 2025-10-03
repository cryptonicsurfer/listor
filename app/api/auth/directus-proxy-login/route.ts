import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.DIRECTUS_INTERNAL_URL || "https://cms.businessfalkenberg.se";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    console.log(`[BFF Directus Login Proxy] Attempting login for ${email} to ${DIRECTUS_URL}/auth/login`);

    const directusResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, mode: "json" }),
    });

    const responseBody = await directusResponse.json();

    if (!directusResponse.ok) {
      console.error('[BFF Directus Login Proxy] Directus login failed:', responseBody);
      const errorMessage = responseBody?.errors?.[0]?.message || 'Directus authentication failed';
      return NextResponse.json({ error: errorMessage, details: responseBody }, { status: directusResponse.status });
    }

    console.log('[BFF Directus Login Proxy] Directus login successful.');

    const response = NextResponse.json(responseBody, { status: 200 });

    if (responseBody.data && responseBody.data.access_token && responseBody.data.refresh_token && responseBody.data.expires) {
      const { access_token, refresh_token, expires } = responseBody.data;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const secureFlag = appUrl.startsWith('https://');

      const expiresInMs = parseInt(expires as string, 10);

      if (!isNaN(expiresInMs)) {
        response.cookies.set('directus_access_token', access_token, {
          httpOnly: true,
          secure: secureFlag,
          sameSite: 'lax',
          path: '/',
          maxAge: 3600, // 1 hour
        });
      }

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
    console.error('[BFF Directus Login Proxy] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error during login proxy' }, { status: 500 });
  }
}
