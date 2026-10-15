'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useZoom } from '@/context/ZoomContext';
import { 
  BarChart3, 
  Users, 
  LogOut, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Menu, 
  X,
  Monitor
} from 'lucide-react';
import UtmHelperModal from './UtmHelperModal';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const { isFullWidth } = useZoom();
  const [showUtmModal, setShowUtmModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerClass = `${isFullWidth ? 'w-full max-w-[2000px]' : 'max-w-7xl'} mx-auto px-3 sm:px-6 lg:px-8 transition-all duration-300`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        {/* Top bar with branding, user info & actions */}
        <div className={containerClass}>
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & title */}
            <div className="flex items-center space-x-3">
              <Link href={mounted && !isAdmin ? "/brands/medispro" : "/"} className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-base sm:text-lg text-gray-900 tracking-tight flex items-center gap-1.5">
                    Kumtura <span className="text-blue-600 font-semibold text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">Tracking</span>
                  </span>
                  <p className="text-[11px] sm:text-xs text-gray-500 -mt-0.5 hidden xs:block">Multi-Brand Social Media Monitoring</p>
                </div>
              </Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {/* UTM / WA Helper Tool */}
              <button
                onClick={() => setShowUtmModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
                title="Buka WA Link & UTM Generator"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Link & WA Helper</span>
              </button>

              {/* Dashboard link (Admin only) */}
              {mounted && isAdmin && (
                <Link
                  href="/"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                    pathname === '/'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
              )}

              {/* User management link (Admin only) */}
              {mounted && isAdmin && (
                <Link
                  href="/users"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                    pathname === '/users'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Pengaturan User</span>
                </Link>
              )}

              {/* User Profile & Logout */}
              {mounted ? (
                user ? (
                  <div className="flex items-center pl-3 border-l border-gray-200 space-x-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900 leading-none">{user.name}</p>
                      <span className={`inline-block mt-0.5 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-md ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                  >
                    Login
                  </Link>
                )
              ) : (
                <div className="w-16 h-8" />
              )}
            </div>

            {/* Mobile Actions: Menu Toggle */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-4 space-y-2.5">
            <button
              onClick={() => { setShowUtmModal(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-100"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Link & WA Helper</span>
            </button>

            {mounted && isAdmin && (
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-100"
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Dashboard</span>
              </Link>
            )}

            {mounted && isAdmin && (
              <Link
                href="/users"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-100"
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>Pengaturan User</span>
              </Link>
            )}

            {mounted && user && (
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* UTM Helper Modal */}
      {showUtmModal && <UtmHelperModal onClose={() => setShowUtmModal(false)} />}
    </>
  );
}
