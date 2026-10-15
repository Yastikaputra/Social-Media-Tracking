'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useZoom } from '@/context/ZoomContext';
import { api } from '@/lib/api';
import { Brand, Platform, DashboardAnalytics } from '@/types';
import { 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  ExternalLink, 
  Maximize2, 
  Calendar,
  Layers
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, ThreadsIcon, WhatsAppIcon } from '@/components/SocialIcons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import ScreenshotModal from '@/components/ScreenshotModal';
import Link from 'next/link';

const COLORS = ['#25D366', '#E1306C', '#1877F2', '#111827', '#6366f1'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isFullWidth } = useZoom();

  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  // Per Unit Usaha selection (Defaults to 'medispro')
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
        return <InstagramIcon className="w-3.5 h-3.5 text-zinc-700" />;
      case 'facebook':
        return <FacebookIcon className="w-3.5 h-3.5 text-zinc-700" />;
      case 'threads':
        return <ThreadsIcon className="w-3.5 h-3.5 text-zinc-700" />;
      case 'whatsapp':
        return <WhatsAppIcon className="w-3.5 h-3.5 text-zinc-700" />;
      default:
        return <BarChart3 className="w-3.5 h-3.5 text-zinc-700" />;
    }
  };

  if (authLoading || loading || !user || user.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeBrand = brands.find((b) => b.slug === selectedBrandSlug);
  const isUnitMode = Boolean(selectedBrandSlug && activeBrand);

  const totalLeads = analytics?.summary?.total_leads || 0;
  const targetLeads = isUnitMode ? (activeBrand?.monthly_lead_target || 100) : 750;
  const pctLeads = Math.round((totalLeads / targetLeads) * 100);
  const totalReach = analytics?.summary?.total_reach || 0;

  return (
    <div className={`${isFullWidth ? 'w-full max-w-[2000px]' : 'max-w-6xl'} mx-auto px-4 sm:px-6 py-6 space-y-6 transition-all duration-300`}>
      
      {/* 1. Header & Brand Navigation (Flat, restrained, zero container nesting) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-zinc-200 pb-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              {isUnitMode ? `Ringkasan Performa — ${activeBrand?.name}` : 'Ringkasan Pemantauan Multi-Brand'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Evaluasi kinerja saluran WhatsApp, Instagram, Facebook, dan Threads
            </p>
          </div>

          {isUnitMode && activeBrand && (
            <Link
              href={`/brands/${activeBrand.slug}`}
              className="inline-flex items-center gap-1 text-xs text-zinc-700 hover:text-zinc-950 font-medium transition-colors"
            >
              <span>Kelola Catatan {activeBrand.name}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Brand Underline Navigation */}
        <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Brand Selector">
          {brands.map((b) => {
            const isSelected = selectedBrandSlug === b.slug;
            return (
              <button
                key={b.slug}
                onClick={() => setSelectedBrandSlug(b.slug)}
                className={`text-xs whitespace-nowrap pb-2 font-medium border-b-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
                }`}
              >
                {b.name}
              </button>
            );
          })}
          <button
            onClick={() => setSelectedBrandSlug('')}
            className={`text-xs whitespace-nowrap pb-2 font-medium border-b-2 transition-colors cursor-pointer ${
              !selectedBrandSlug
                ? 'border-zinc-900 text-zinc-900 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
            }`}
          >
            Semua Unit
          </button>
        </nav>
      </div>

      {/* 2. Key Metrics Row (Information-first, typography-driven) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="border border-zinc-200 rounded-md bg-white p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block">
            {isUnitMode ? `Total Leads (${activeBrand?.name})` : 'Total Leads Gabungan'}
          </span>
          <span className="text-2xl font-semibold text-zinc-900 tabular-nums mt-1 block">
            {totalLeads}
          </span>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Dari seluruh saluran</span>
        </div>

        <div className="border border-zinc-200 rounded-md bg-white p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block">
            Target Bulanan
          </span>
          <span className="text-2xl font-semibold text-zinc-900 tabular-nums mt-1 block">
            {targetLeads}
          </span>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Sasaran periode aktif</span>
        </div>

        <div className="border border-zinc-200 rounded-md bg-white p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block">
            Pencapaian Target
          </span>
          <span className="text-2xl font-semibold text-zinc-900 tabular-nums mt-1 block">
            {pctLeads}%
          </span>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Rasio konversi target</span>
        </div>

        <div className="border border-zinc-200 rounded-md bg-white p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block">
            Total Jangkauan (Reach)
          </span>
          <span className="text-2xl font-semibold text-zinc-900 tabular-nums mt-1 block">
            {totalReach.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Total audiens terpapar</span>
        </div>
      </div>

      {/* 3. Platform Breakdown Cards (Practical & Compact) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
            Kinerja Saluran Sosial Media
          </h2>
          <span className="text-[11px] text-zinc-400 tabular-nums">
            {isUnitMode ? activeBrand?.name : 'Seluruh Brand'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(analytics?.leads_by_platform || []).map((p) => (
            <div key={p.platform_id} className="border border-zinc-200 rounded-md bg-white p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {getPlatformIcon(p.slug)}
                    <span className="text-xs font-medium text-zinc-900">{p.name}</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 tabular-nums">{p.percentage}%</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-semibold text-zinc-900 tabular-nums">{p.leads}</span>
                  <span className="text-[11px] text-zinc-500">leads</span>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 tabular-nums">
                <span>{p.tasks_count} konten</span>
                <span>{p.reach?.toLocaleString('id-ID') || 0} jangkauan</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Charts: Bar & Donut in flat surfaces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 border border-zinc-200 rounded-md bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                Perolehan Leads per Saluran
              </h3>
              <p className="text-[11px] text-zinc-400">Komparasi jumlah leads masuk</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics?.leads_by_platform || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} Leads`, 'Total']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e4e4e7', fontSize: '12px' }}
                />
                <Bar dataKey="leads" fill="#18181b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="border border-zinc-200 rounded-md bg-white p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
              Proporsi Saluran
            </h3>
            <p className="text-[11px] text-zinc-400">Distribusi kontribusi leads</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.leads_by_platform || []}
                  dataKey="leads"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {(analytics?.leads_by_platform || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} Leads`, 'Total']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e4e4e7', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-100">
            {(analytics?.leads_by_platform || []).map((plat, idx) => (
              <div key={plat.platform_id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-zinc-700">{plat.name}</span>
                </div>
                <span className="font-medium text-zinc-900 tabular-nums">{plat.leads} ({plat.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Matrix Komparasi 5 Brand */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
            Performa Saluran per Unit Usaha
          </h2>
          <span className="text-[11px] text-zinc-400">5 Unit Bisnis</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                onClick={() => setSelectedBrandSlug(item.brand_slug)}
                className={`border rounded-md p-3.5 bg-white cursor-pointer transition-colors ${
                  isSelected ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
                  <span className="text-xs font-semibold text-zinc-900">{item.brand_name}</span>
                  <span className="text-xs font-semibold text-zinc-900 tabular-nums">{total}</span>
                </div>

                <div className="space-y-1.5 text-[11px] text-zinc-600 tabular-nums">
                  <div className="flex items-center justify-between">
                    <span>WhatsApp</span>
                    <span className="font-medium text-zinc-900">{waLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Instagram</span>
                    <span className="font-medium text-zinc-900">{igLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Facebook</span>
                    <span className="font-medium text-zinc-900">{fbLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Threads</span>
                    <span className="font-medium text-zinc-900">{thLeads}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Recent Activity Table */}
      <div className="border border-zinc-200 rounded-md bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-900">
              Catatan Tracking Terbaru
            </span>
            <span className="text-xs text-zinc-400 tabular-nums">
              &middot; {analytics?.recent_tasks?.length || 0} entri
            </span>
          </div>

          {isUnitMode && activeBrand && (
            <Link
              href={`/brands/${activeBrand.slug}`}
              className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
            >
              Buka Form Tracking &rarr;
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold bg-zinc-50/75">
                <th className="py-2.5 px-3.5">Tanggal & PIC</th>
                <th className="py-2.5 px-3.5">Unit</th>
                <th className="py-2.5 px-3.5">Saluran</th>
                <th className="py-2.5 px-3.5">Judul Konten</th>
                <th className="py-2.5 px-3.5">Follow Up</th>
                <th className="py-2.5 px-3.5 text-center">Bukti</th>
                <th className="py-2.5 px-3.5 text-right">Leads</th>
                <th className="py-2.5 px-3.5 text-center">Tautan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(analytics?.recent_tasks || []).map((task) => (
                <tr key={task.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="font-medium text-zinc-900 tabular-nums block">{task.task_date}</span>
                    <span className="text-[11px] text-zinc-500 block">{task.pic_name || task.user?.name || 'Staf'}</span>
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-zinc-900">
                    {task.brand?.name}
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap text-zinc-700">
                    {task.platform?.name}
                  </td>
                  <td className="py-2.5 px-3.5 max-w-xs">
                    <p className="font-medium text-zinc-900 line-clamp-1">{task.title}</p>
                  </td>
                  <td className="py-2.5 px-3.5 max-w-xs">
                    <p className="text-zinc-600 line-clamp-1">{task.follow_up || task.notes || '—'}</p>
                  </td>
                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                    {task.screenshot_url ? (
                      <button
                        onClick={() => {
                          setViewScreenshotUrl(task.screenshot_url || null);
                          setViewScreenshotTitle(`${task.brand?.name} - ${task.platform?.name}: ${task.title}`);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 hover:text-zinc-950 border border-zinc-200 px-2 py-0.5 rounded hover:bg-zinc-50 cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Bukti</span>
                      </button>
                    ) : (
                      <span className="text-zinc-300">&mdash;</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-semibold text-zinc-900 tabular-nums whitespace-nowrap">
                    {task.leads_count}
                  </td>
                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                    {task.link_url ? (
                      <a
                        href={task.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-zinc-700 inline-block p-1"
                        title={task.link_url}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-zinc-300">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Screenshot Zoom */}
      <ScreenshotModal
        isOpen={!!viewScreenshotUrl}
        onClose={() => setViewScreenshotUrl(null)}
        imageUrl={viewScreenshotUrl}
        title={viewScreenshotTitle}
      />
    </div>
  );
}
