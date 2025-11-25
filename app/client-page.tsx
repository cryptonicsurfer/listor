'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CompanyContactFinder from '@/components/CompanyContactFinder';
import { Navbar } from '@/components/navbar';
import { getAuthDetails, tryRefreshFromCookies, clearAuthCookies, removeToken } from '@/lib/auth';

export default function HomeClientPage() {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user has valid auth tokens
    const checkAuth = async () => {
      try {
        const authDetails = getAuthDetails();
        if (authDetails) {
          // User has auth details in localStorage, allow access
          setIsChecking(false);
          return;
        }

        // No localStorage tokens, but middleware let us through (means cookies exist)
        // Try to refresh tokens to sync localStorage with cookies
        console.log('No localStorage tokens, attempting to refresh from cookies...');
        const accessToken = await tryRefreshFromCookies();

        if (accessToken) {
          // Refresh worked, tokens are now in localStorage
          console.log('Token refresh successful, user authenticated');
          setIsChecking(false);
          return;
        }

        // Refresh failed - clear cookies via API and redirect to login
        console.log('Token refresh failed, clearing cookies and redirecting to login');
        removeToken(); // Clear localStorage
        await clearAuthCookies(); // Clear HttpOnly cookies via API
        router.push('/login');
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear cookies to prevent redirect loop
        removeToken(); // Clear localStorage
        await clearAuthCookies(); // Clear HttpOnly cookies via API
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen p-4">
        <CompanyContactFinder />
      </main>
    </>
  );
}