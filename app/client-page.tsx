'use client';

import CompanyContactFinder from '@/components/CompanyContactFinder';
import { Navbar } from '@/components/navbar';

export default function HomeClientPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen p-4">
        <CompanyContactFinder />
      </main>
    </>
  );
}