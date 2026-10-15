'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useZoom } from '@/context/ZoomContext';
import { api } from '@/lib/api';
import { DashboardAnalytics, Brand, Platform, TrackingTask } from '@/types';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Plus, 
  Sparkles, 
  ExternalLink, 
  Calendar,
  Filter,
  CheckCircle2,
  Award,
  ArrowUpRight,
  Eye,
  MessageCircle,
  Share2,
  Maximize2,
  Building2,
  Layers,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, ThreadsIcon, WhatsAppIcon } from '@/components/SocialIcons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import ScreenshotModal from '@/components/ScreenshotModal';
import Link from 'next/link';

const COLORS = ['#25D366', '#E1306C', '#1877F2', '#111827', '#8b5cf6'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isFullWidth } = useZoom();

  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  // Per Unit Usaha selection (Defaults to 'medispro' so user immediately sees per-unit monitoring)
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string>('medispro');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);
  const [viewScreenshotTitle, setViewScreenshotTitle] = useState<string>('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        // Staff tidak diizinkan melihat dashboard; alihkan ke tab brand
        router.push('/brands/medispro');
      }
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    try {
      const [analyticsRes, brandsRes, platformsRes] = await Promise.all([
        api.getDashboardAnalytics({
          brand_slug: selectedBrandSlug || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
        api.getBrands(),
        api.getPlatforms(),
      ]);

      setAnalytics(analyticsRes);
      setBrands(brandsRes.brands || []);
      setPlatforms(platformsRes.platforms || []);
    } catch (err: any) {
      if (err?.status === 401 || err?.message === 'Unauthenticated.' || err?.isAuthError) {
        router.push('/login');
        return;
      }
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'admin') {
      loadData();
    }
  }, [authLoading, user, selectedBrandSlug, startDate, endDate]);

  const getPlatformIcon = (slug: string) => {
    switch (slug) {
      case 'instagram':
        return <InstagramIcon className="w-4 h-4 text-[#E1306C]" />;
      case 'facebook':
        return <FacebookIcon className="w-4 h-4 text-[#1877F2]" />;
      case 'threads':
        return <ThreadsIcon className="w-4 h-4 text-gray-900" />;
      case 'whatsapp':
        return <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  if (authLoading || loading || !user || user.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeBrand = brands.find((b) => b.slug === selectedBrandSlug);
  const topPlatform = analytics?.summary?.top_platform;
  const isUnitMode = Boolean(selectedBrandSlug && activeBrand);

  return (
    <div className={`${isFullWidth ? 'w-full max-w-[2000px]' : 'max-w-7xl'} mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8 transition-all duration-300`}>
      
      {/* 1. Dashboard Header */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Social Media Tracking & Leads Monitoring</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
            Dashboard Pemantauan Media Sosial
          </h1>
          <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1 max-w-2xl">
            Pemantauan performa WhatsApp, Instagram, Facebook, dan Threads per masing-masing unit bisnis (Medispro, Eleventrent, Kuuva, Pikago, Kumtura).
          </p>
        </div>

        {isUnitMode && activeBrand && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href={`/brands/${activeBrand.slug}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs sm:text-sm font-bold transition-all"
            >
              <span>Buka Tab {activeBrand.name}</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* 2. PENGATURAN PEMANTAUAN PER UNIT USAHA (HERO TAB BAR) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Pilih Unit Usaha (Pemantauan Terfokus)
            </span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">
            Pilih unit untuk melihat perbandingan WhatsApp, Threads, IG, & FB di unit tersebut
          </span>
        </div>

        {/* Tab Buttons for 5 Brands + Semua */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
          {/* 5 Brands Tabs */}
          {brands.map((b) => {
            const isSelected = selectedBrandSlug === b.slug;
            return (
              <button
                key={b.slug}
                onClick={() => setSelectedBrandSlug(b.slug)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-white text-gray-950 shadow-md ring-2'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                }`}
                style={{
                  borderColor: isSelected ? b.color : undefined,
                  boxShadow: isSelected ? `0 4px 14px 0 ${b.color}35` : undefined,
                }}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-sm font-black">{b.name}</span>
                {isSelected ? (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-black text-white"
                    style={{ backgroundColor: b.color }}
                  >
                    Aktif
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400 font-medium">
                    {b.total_leads || 0} leads
                  </span>
                )}
              </button>
            );
          })}

          {/* Button Semua Unit Usaha */}
          <button
            onClick={() => setSelectedBrandSlug('')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              !selectedBrandSlug
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Semua Unit Usaha (Gabungan)</span>
          </button>
        </div>
      </div>

      {/* 3. ACTIVE UNIT USAHA CONTEXT BANNER */}
      {isUnitMode && activeBrand && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs relative overflow-hidden">
          {/* Brand Accent Top Line */}
          <div 
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: activeBrand.color }}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span 
                  className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full text-white shadow-2xs"
                  style={{ backgroundColor: activeBrand.color }}
                >
                  Unit Usaha Aktif
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-950">
                  {activeBrand.name}
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1 max-w-2xl">
                {activeBrand.description || 'Pemantauan saluran media sosial: WhatsApp, Instagram, Facebook, Threads.'}
              </p>
            </div>

            {/* Quick action buttons for this brand */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/brands/${activeBrand.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 text-xs font-bold transition-colors"
              >
                <span>Buka Halaman {activeBrand.name}</span>
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
              </Link>
            </div>
          </div>

          {/* Key Stats Bar for this brand */}
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200/60">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Target Bulanan</span>
              <span className="text-lg sm:text-xl font-black text-gray-950 mt-0.5 block">{activeBrand.monthly_lead_target || 100} Leads</span>
            </div>

            <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/60">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Leads {activeBrand.name}</span>
              <span className="text-lg sm:text-xl font-black text-emerald-800 mt-0.5 block">{analytics?.summary?.total_leads || 0} Leads</span>
            </div>

            <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-200/60">
              <span className="text-[10px] font-bold text-purple-700 uppercase block">Sosmed Juara Leads</span>
              <span className="text-lg sm:text-xl font-black text-purple-900 mt-0.5 block truncate">
                {topPlatform?.name || '-'} ({topPlatform?.leads || 0})
              </span>
            </div>

            <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200/60">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Total Reach</span>
              <span className="text-lg sm:text-xl font-black text-blue-900 mt-0.5 block">
                {analytics?.summary?.total_reach?.toLocaleString('id-ID') || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. PERBANDINGAN 4 SALURAN MEDIA SOSIAL (WHATSAPP, INSTAGRAM, FACEBOOK, THREADS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>
              {isUnitMode 
                ? `Perbandingan Saluran di ${activeBrand?.name}: WhatsApp vs Threads vs IG vs Facebook`
                : 'Perbandingan Saluran Media Sosial (Semua Unit Usaha)'}
            </span>
          </h2>
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            Diurutkan dari yang paling banyak menghasilkan leads
          </span>
        </div>

        {/* 4 Platform Ranking Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(analytics?.leads_by_platform || []).map((p, idx) => {
            const isTop = idx === 0;
            return (
              <div 
                key={p.platform_id}
                className={`bg-white p-5 rounded-3xl border transition-all relative overflow-hidden ${
                  isTop 
                    ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-md' 
                    : 'border-gray-200 shadow-xs hover:border-gray-300'
                }`}
              >
                {/* Ranking Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 shadow-2xs">
                      {getPlatformIcon(p.slug)}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-950 text-sm">{p.name}</h3>
                      <span className="text-[10px] text-gray-400 font-medium">{p.tasks_count} konten di-track</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isTop 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    #{idx + 1} {isTop ? 'Paling Kena 🏆' : ''}
                  </span>
                </div>

                <div className="space-y-2 mt-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-gray-950">{p.leads}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {p.percentage}% dari total
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max(4, p.percentage)}%`, 
                        backgroundColor: p.color || '#3b82f6' 
                      }}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500 font-medium border-t border-gray-50">
                    <span>👁️ Reach: <strong>{p.reach?.toLocaleString('id-ID') || 0}</strong></span>
                    <span>💬 Leads: <strong>{p.leads}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. DIAGRAM PEMANTAUAN UTAMA (DIAGRAM BATANG & DIAGRAM DONUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Diagram Batang: Perbandingan Leads Antar Saluran */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-black text-gray-950 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>
                  {isUnitMode 
                    ? `Diagram Perolehan Leads di ${activeBrand?.name}`
                    : 'Diagram Perolehan Leads per Media Sosial'}
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Perbandingan langsung mana saluran yang paling banyak menghasilkan leads
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
              {isUnitMode ? activeBrand?.name : 'Semua Unit'}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics?.leads_by_platform || []}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} Leads`, 'Total Leads']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="leads" radius={[10, 10, 0, 0]}>
                  {(analytics?.leads_by_platform || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Platform Metrics Table below chart */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
            {(analytics?.leads_by_platform || []).map((plat) => (
              <div key={plat.platform_id} className="p-3 bg-gray-50/70 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getPlatformIcon(plat.slug)}
                    <span className="text-xs font-bold text-gray-800">{plat.name}</span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plat.color }} />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-black text-gray-950">{plat.leads} Leads</span>
                  <span className="text-xs font-bold text-blue-600">{plat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagram Lingkaran: Donut Chart Proporsi Leads */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-gray-950 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <span>Proporsi Kontribusi Saluran</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Pangsa prospek calon pelanggan per channel
            </p>

            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.leads_by_platform || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="leads"
                  >
                    {(analytics?.leads_by_platform || []).map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} Leads`, 'Leads']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-2 pt-2 border-t border-gray-100">
            {(analytics?.leads_by_platform || []).map((plat) => (
              <div key={plat.platform_id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plat.color }} />
                  <span className="text-gray-800 font-semibold">{plat.name}</span>
                </div>
                <span className="font-black text-gray-950">{plat.leads} leads ({plat.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. PEMANTAUAN KOMPARASI LENGKAP 5 UNIT USAHA (WhatsApp, Threads, IG, FB di Setiap Brand) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-black text-gray-950 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Pemantauan Komparasi di 5 Unit Bisnis</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Lihat performa WhatsApp, Instagram, Facebook, dan Threads di masing-masing unit bisnis secara berdampingan
            </p>
          </div>
        </div>

        {/* 5 Brand Cards with Platform Breakdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {(analytics?.brand_platform_matrix || []).map((item) => {
            const isSelected = selectedBrandSlug === item.brand_slug;
            const waLeads = item.whatsapp || 0;
            const igLeads = item.instagram || 0;
            const fbLeads = item.facebook || 0;
            const thLeads = item.threads || 0;
            const total = item.total_leads || (waLeads + igLeads + fbLeads + thLeads);

            return (
              <div 
                key={item.brand_slug}
                className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                  isSelected 
                    ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' 
                    : 'border-gray-200 shadow-xs hover:border-gray-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.brand_color }} />
                      <span className="font-black text-gray-950 text-sm">{item.brand_name}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {total} Leads
                    </span>
                  </div>

                  {/* 4 Platforms Bars for this brand */}
                  <div className="space-y-2.5">
                    {/* WhatsApp */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 font-bold text-gray-700 text-[11px]">
                          <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                          <span>WhatsApp</span>
                        </span>
                        <span className="font-black text-gray-900 text-xs">{waLeads}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#25D366] h-full rounded-full"
                          style={{ width: `${total > 0 ? (waLeads / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Instagram */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 font-bold text-gray-700 text-[11px]">
                          <InstagramIcon className="w-3.5 h-3.5 text-[#E1306C]" />
                          <span>Instagram</span>
                        </span>
                        <span className="font-black text-gray-900 text-xs">{igLeads}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#E1306C] h-full rounded-full"
                          style={{ width: `${total > 0 ? (igLeads / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Facebook */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 font-bold text-gray-700 text-[11px]">
                          <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                          <span>Facebook</span>
                        </span>
                        <span className="font-black text-gray-900 text-xs">{fbLeads}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#1877F2] h-full rounded-full"
                          style={{ width: `${total > 0 ? (fbLeads / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Threads */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 font-bold text-gray-700 text-[11px]">
                          <ThreadsIcon className="w-3.5 h-3.5 text-black" />
                          <span>Threads</span>
                        </span>
                        <span className="font-black text-gray-900 text-xs">{thLeads}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gray-900 h-full rounded-full"
                          style={{ width: `${total > 0 ? (thLeads / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <button
                  onClick={() => setSelectedBrandSlug(item.brand_slug)}
                  className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>{isSelected ? 'Sedang Dipantau ✓' : `Pantau ${item.brand_name}`}</span>
                  {!isSelected && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. DIAGRAM TREN LEADS WAKTU KE WAKTU */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-gray-950 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>
                {isUnitMode 
                  ? `Tren Pertumbuhan Leads Harian di ${activeBrand?.name}`
                  : 'Tren Pertumbuhan Leads Harian'}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Pergerakan total leads harian per platform</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics?.leads_trend || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="formatted_date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="total_leads"
                name="Total Leads"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
              />
              <Line type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="#25D366" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="instagram" name="Instagram" stroke="#E1306C" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="facebook" name="Facebook" stroke="#1877F2" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="threads" name="Threads" stroke="#111827" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 8. TABEL CATATAN TRACKING AKTIVITAS */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-gray-950 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>
                {isUnitMode 
                  ? `Catatan Tracking Terbaru ${activeBrand?.name}`
                  : 'Catatan Tracking Aktivitas Terbaru'}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Riwayat postingan konten, link tracking, dan bukti pemantauan leads
            </p>
          </div>

          {isUnitMode && activeBrand && (
            <Link
              href={`/brands/${activeBrand.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 self-start sm:self-auto transition-colors"
            >
              <span>Kelola di Tab {activeBrand.name}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl">
          <table className="w-full min-w-[760px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold bg-gray-50/70">
                <th className="py-3.5 px-4">Tanggal & PIC</th>
                <th className="py-3.5 px-4">Brand</th>
                <th className="py-3.5 px-4">Platform</th>
                <th className="py-3.5 px-4">Judul Konten / Aktivitas</th>
                <th className="py-3.5 px-4 text-center">Bukti SS</th>
                <th className="py-3.5 px-4 text-right">Leads</th>
                <th className="py-3.5 px-4 text-right">Reach</th>
                <th className="py-3.5 px-4 text-center">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(analytics?.recent_tasks || []).map((task) => (
                <tr key={task.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-gray-900 block">{task.task_date}</span>
                    <span className="text-[10px] text-blue-700 font-semibold">
                      PIC: {task.pic_name || task.user?.name || 'Staff'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px]"
                      style={{ backgroundColor: `${task.brand?.color}15`, color: task.brand?.color }}
                    >
                      {task.brand?.name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      {getPlatformIcon(task.platform?.slug || '')}
                      <span className="font-bold text-gray-800">{task.platform?.name}</span>
                    </div>
                    <span className="block text-[10px] text-gray-400 font-medium">{task.content_type}</span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-bold text-gray-900 truncate">{task.title}</p>
                    {(task.follow_up || task.notes) && (
                      <p className="text-[11px] text-gray-500 truncate">
                        <span className="font-semibold text-emerald-700">Follow up:</span> {task.follow_up || task.notes}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {task.screenshot_url ? (
                      <button
                        onClick={() => {
                          setViewScreenshotUrl(task.screenshot_url || null);
                          setViewScreenshotTitle(`${task.brand?.name} - ${task.platform?.name}: ${task.title}`);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-xl border border-purple-200 cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Lihat SS</span>
                      </button>
                    ) : (
                      <span className="text-gray-300 text-[11px] font-medium">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm">
                    {task.leads_count}
                  </td>
                  <td className="py-3.5 px-4 text-right text-gray-700 font-semibold">
                    {task.reach_count.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {task.link_url ? (
                      <a
                        href={task.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                        title={task.link_url}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screenshot Modal for viewing proof images */}
      <ScreenshotModal
        isOpen={!!viewScreenshotUrl}
        onClose={() => setViewScreenshotUrl(null)}
        imageUrl={viewScreenshotUrl}
        title={viewScreenshotTitle}
      />
    </div>
  );
}
