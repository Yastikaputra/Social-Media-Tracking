import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ZoomProvider } from '@/context/ZoomContext';

export const metadata: Metadata = {
  title: 'Kumtura - Social Media Tracking & Leads Monitoring',
  description: 'Multi-Brand Social Media Tracking System for Medispro, Eleventrent, Kuuva, Pikago, and Kumtura',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans" suppressHydrationWarning>
        <AuthProvider>
          <ZoomProvider>
            {children}
          </ZoomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
