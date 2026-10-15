'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BarChart3, Lock, Mail, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@kumtura.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser?.role === 'admin') {
        router.push('/');
      } else {
        router.push('/brands/medispro');
      }
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Login gagal. Periksa kembali email dan kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Logo and title */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-md bg-zinc-900 text-white flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900">Kumtura Tracking</span>
        </div>
        <p className="text-xs text-center text-zinc-500">
          Sistem Pemantauan Multi-Brand &amp; Analisis Leads
        </p>
      </div>

      {/* Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-white py-6 px-5 sm:px-6 border border-zinc-200 rounded-lg">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-zinc-900">Masuk Akun</h2>
            <p className="text-[11px] text-zinc-500">
              Masukkan email dan kata sandi untuk melanjutkan
            </p>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kumtura.com"
                  className="w-full border border-zinc-300 rounded-md px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-zinc-300 rounded-md px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 bg-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Akun Cepat:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@kumtura.com')}
                className={`p-2 text-left rounded border transition-colors cursor-pointer text-xs ${
                  email === 'admin@kumtura.com'
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <div className="font-medium text-zinc-900 flex items-center justify-between">
                  <span>Admin</span>
                  {email === 'admin@kumtura.com' && <Check className="w-3 h-3 text-zinc-900" />}
                </div>
                <div className="text-[10px] text-zinc-500 tabular-nums truncate">admin@kumtura.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('staff@kumtura.com')}
                className={`p-2 text-left rounded border transition-colors cursor-pointer text-xs ${
                  email === 'staff@kumtura.com'
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <div className="font-medium text-zinc-900 flex items-center justify-between">
                  <span>Staf PIC</span>
                  {email === 'staff@kumtura.com' && <Check className="w-3 h-3 text-zinc-900" />}
                </div>
                <div className="text-[10px] text-zinc-500 tabular-nums truncate">staff@kumtura.com</div>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 text-center mt-2.5">
              Kata sandi: <span className="font-mono text-zinc-600">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
