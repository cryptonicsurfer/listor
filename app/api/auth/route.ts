import { NextRequest, NextResponse } from 'next/server';
import { isAllowedDomain } from '@/lib/auth';
import { authenticateUser } from './users';

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

    console.log('Login attempt:', { email });
    
    const user = authenticateUser(email, password);
    
    if (!user) {
      console.log('Authentication failed for:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('Authentication successful for:', email);

    // Return user data without password
    const userData = {
      email: user.email,
      name: user.name
    };

    // Set cookie for authentication
    const response = NextResponse.json({
      user: userData,
      success: true
    }, { status: 200 });
    
    // Set secure cookie with user data (7 days expiry)
    const cookieValue = Buffer.from(JSON.stringify(userData)).toString('base64');
    response.cookies.set({
      name: 'auth',
      value: cookieValue,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}