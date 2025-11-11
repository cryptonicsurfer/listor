'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CompanyContactFinder from '@/components/CompanyContactFinder';
import { Navbar } from '@/components/navbar';
import { getAuthDetails } from '@/lib/auth';

export default function HomeClientPage() {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user has valid auth tokens
    const checkAuth = async () => {
      try {
        const authDetails = getAuthDetails();
        if (!authDetails) {
          // No auth details found, redirect to login
          router.push('/login');
          return;
        }
        // User has auth details, allow access
        setIsChecking(false);
      } catch (error) {
        console.error('Auth check failed:', error);
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