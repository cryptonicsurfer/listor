import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, isAllowedDomain } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!isAllowedDomain(email)) {
      return NextResponse.json(
        { error: 'Email domain not allowed' },
        { status: 403 }
      );
    }

    const user = authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Return user data without password
    const { password, ...userData } = user;

    // In a real app, you'd set proper cookies/tokens here
    return NextResponse.json({
      user: userData,
      token: 'authenticated',
    }, { 
      status: 200,
      headers: {
        'Set-Cookie': `auth=${btoa(JSON.stringify(userData))}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}` // 7 days
      }
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}