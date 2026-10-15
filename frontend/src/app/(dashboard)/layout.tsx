import Navbar from '@/components/Navbar';
import { Suspense } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col">
      <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
