'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BarChart3, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
      console.error(err);
      setError(err?.data?.message || err?.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo and title */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-3">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-950 tracking-tight">Kumtura Social Tracking</h1>
        <p className="text-sm font-medium text-gray-600 mt-1">
          Sistem Pemantauan Multi-Brand & Analisis Leads Media Sosial
        </p>
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-gray-200">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-950">Masuk ke Akun Anda</h2>
            <p className="text-xs text-gray-500 mt-1">
              Pilih akun atau masukkan email dan password untuk login
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kumtura.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900 bg-white placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900 bg-white placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Memproses Masuk...</span>
              ) : (
                <>
                  <span>Masuk Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Klik Akun Demo Cepat:</span>
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillCredentials('admin@kumtura.com')}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer text-xs ${
                  email === 'admin@kumtura.com'
                    ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
              >
                <div className="font-bold text-gray-900 flex items-center justify-between">
                  <span>Admin</span>
                  {email === 'admin@kumtura.com' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <div className="text-[11px] text-gray-600 font-mono mt-0.5 truncate">admin@kumtura.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('staff@kumtura.com')}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer text-xs ${
                  email === 'staff@kumtura.com'
                    ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
              >
                <div className="font-bold text-gray-900 flex items-center justify-between">
                  <span>Staff PIC</span>
                  {email === 'staff@kumtura.com' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <div className="text-[11px] text-gray-600 font-mono mt-0.5 truncate">staff@kumtura.com</div>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 text-center mt-3">
              Password default: <span className="font-mono font-bold text-gray-700">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
