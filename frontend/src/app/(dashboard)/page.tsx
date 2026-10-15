'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useZoom } from '@/context/ZoomContext';
import { api } from '@/lib/api';
import { Brand, Platform, DashboardAnalytics, UserMonitoring, TrackingTask } from '@/types';
import { 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  ExternalLink, 
  Maximize2, 
  Calendar,
  Layers,
  Sparkles,
  Download,
  Filter,
  RefreshCw,
  Search,
  Trophy,
  Award,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  Info
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
  Legend,
} from 'recharts';
import ScreenshotModal from '@/components/ScreenshotModal';
import Link from 'next/link';

const PLATFORM_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  instagram: '#E1306C',
  facebook: '#1877F2',
  threads: '#111827',
};

const BRAND_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; lightBg: string }> = {
  medispro: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: '#0284c7', lightBg: '#f0f9ff' },
  eleventrent: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: '#7c3aed', lightBg: '#f5f3ff' },
  kuuva: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: '#059669', lightBg: '#ecfdf5' },
  pikago: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: '#d97706', lightBg: '#fffbeb' },
  kumtura: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: '#dc2626', lightBg: '#fff1f2' },
};

type ActiveSheetTab = 'user_monitoring' | 'unit_analytics' | 'raw_tracking';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isFullWidth } = useZoom();

  // Active Google Sheet tab
  const [activeSheet, setActiveSheet] = useState<ActiveSheetTab>('user_monitoring');

  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchUser, setSearchUser] = useState<string>('');
  const [searchTask, setSearchTask] = useState<string>('');
  const [filterBrandRaw, setFilterBrandRaw] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'leads' | 'tasks'>('leads');

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
      console.error('Error fetching dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'admin') {
      loadData();
    }
  }, [authLoading, user, startDate, endDate]);

  const getPlatformIcon = (slug: string, className = "w-3.5 h-3.5") => {
    switch (slug) {
      case 'instagram':
        return <InstagramIcon className={`${className} text-[#E1306C]`} />;
      case 'facebook':
        return <FacebookIcon className={`${className} text-[#1877F2]`} />;
      case 'threads':
        return <ThreadsIcon className={`${className} text-[#111827]`} />;
      case 'whatsapp':
        return <WhatsAppIcon className={`${className} text-[#25D366]`} />;
      default:
        return <BarChart3 className={`${className} text-blue-600`} />;
    }
  };

  // CSV Export utility
  const handleExportCsv = () => {
    if (activeSheet === 'user_monitoring') {
      const headers = [
        'No', 'Nama User', 'Email', 'Role', 
        'Medispro Tasks', 'Pikago Tasks', 'Eleventrent Tasks', 'Kuuva Tasks', 'Kumtura Tasks',
        'Instagram Tasks', 'Facebook Tasks', 'Threads Tasks', 'WhatsApp Tasks',
        'Total Tasks', 'Total Leads'
      ];
      const rows = (analytics?.user_monitoring || []).map((u, i) => [
        i + 1,
        u.name,
        u.email,
        u.role,
        u.brand_tasks?.medispro || 0,
        u.brand_tasks?.pikago || 0,
        u.brand_tasks?.eleventrent || 0,
        u.brand_tasks?.kuuva || 0,
        u.brand_tasks?.kumtura || 0,
        u.platform_tasks?.instagram || 0,
        u.platform_tasks?.facebook || 0,
        u.platform_tasks?.threads || 0,
        u.platform_tasks?.whatsapp || 0,
        u.total_tasks,
        u.total_leads
      ]);
      downloadCsv('Pemantauan_User_Spreadsheet.csv', headers, rows);
    } else if (activeSheet === 'unit_analytics') {
      const headers = [
        'Unit Usaha', 'Instagram Leads', 'Facebook Leads', 'Threads Leads', 'WhatsApp Leads',
        'Total Leads', 'Saluran Terbaik'
      ];
      const rows = (analytics?.brand_platform_matrix || []).map((b) => [
        b.brand_name,
        b.instagram || 0,
        b.facebook || 0,
        b.threads || 0,
        b.whatsapp || 0,
        b.total_leads || 0,
        b.top_platform?.name || '-'
      ]);
      downloadCsv('Analitik_Unit_Usaha_Sosmed.csv', headers, rows);
    } else {
      const headers = [
        'No', 'Tanggal', 'PIC', 'Brand', 'Saluran', 'Judul Konten', 'Follow Up', 'Leads', 'Link URL'
      ];
      const rows = (analytics?.all_tasks || analytics?.recent_tasks || []).map((t, i) => [
        i + 1,
        t.task_date,
        t.pic_name || t.user?.name || '-',
        t.brand?.name || '-',
        t.platform?.name || '-',
        t.title,
        t.follow_up || t.notes || '-',
        t.leads_count,
        t.link_url || '-'
      ]);
      downloadCsv('Data_Mentah_Tracking.csv', headers, rows);
    }
  };

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered users for Sheet 1
  const filteredUsers = useMemo(() => {
    if (!analytics?.user_monitoring) return [];
    if (!searchUser.trim()) return analytics.user_monitoring;
    const q = searchUser.toLowerCase();
    return analytics.user_monitoring.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [analytics?.user_monitoring, searchUser]);

  // Group sums for Sheet 1
  const userMonitoringSums = useMemo(() => {
    const users = analytics?.user_monitoring || [];
    const sums = {
      medispro: 0,
      pikago: 0,
      eleventrent: 0,
      kuuva: 0,
      kumtura: 0,
      instagram: 0,
      facebook: 0,
      threads: 0,
      whatsapp: 0,
      total_tasks: 0,
      total_leads: 0,
    };
    users.forEach((u) => {
      sums.medispro += u.brand_tasks?.medispro || 0;
      sums.pikago += u.brand_tasks?.pikago || 0;
      sums.eleventrent += u.brand_tasks?.eleventrent || 0;
      sums.kuuva += u.brand_tasks?.kuuva || 0;
      sums.kumtura += u.brand_tasks?.kumtura || 0;
      sums.instagram += u.platform_tasks?.instagram || 0;
      sums.facebook += u.platform_tasks?.facebook || 0;
      sums.threads += u.platform_tasks?.threads || 0;
      sums.whatsapp += u.platform_tasks?.whatsapp || 0;
      sums.total_tasks += u.total_tasks || 0;
      sums.total_leads += u.total_leads || 0;
    });
    return sums;
  }, [analytics?.user_monitoring]);

  // Grouped Bar Chart Data for Sheet 2
  const groupedChartData = useMemo(() => {
    return (analytics?.brand_platform_matrix || []).map((b) => ({
      name: b.brand_name,
      slug: b.brand_slug,
      Instagram: chartMetric === 'leads' ? (b.instagram || 0) : (b.instagram_tasks || 0),
      Facebook: chartMetric === 'leads' ? (b.facebook || 0) : (b.facebook_tasks || 0),
      Threads: chartMetric === 'leads' ? (b.threads || 0) : (b.threads_tasks || 0),
      WhatsApp: chartMetric === 'leads' ? (b.whatsapp || 0) : (b.whatsapp_tasks || 0),
      totalLeads: b.total_leads || 0,
      topPlatform: b.top_platform?.name || 'Instagram',
      topPlatformLeads: b.top_platform?.leads || 0,
    }));
  }, [analytics?.brand_platform_matrix, chartMetric]);

  // Filtered raw tasks for Sheet 3
  const rawTasks = useMemo(() => {
    const list = analytics?.all_tasks || analytics?.recent_tasks || [];
    return list.filter((t) => {
      if (filterBrandRaw !== 'all' && t.brand?.slug !== filterBrandRaw) return false;
      if (searchTask.trim()) {
        const q = searchTask.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchPic = (t.pic_name || t.user?.name || '').toLowerCase().includes(q);
        const matchNotes = (t.follow_up || t.notes || '').toLowerCase().includes(q);
        return matchTitle || matchPic || matchNotes;
      }
      return true;
    });
  }, [analytics?.all_tasks, analytics?.recent_tasks, filterBrandRaw, searchTask]);

  if (authLoading || loading || !user || user.role !== 'admin') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 space-y-3">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-medium">Memuat lembar kerja spreadsheet...</p>
      </div>
    );
  }

  // Active Formula Bar text
  const formulaString = useMemo(() => {
    switch (activeSheet) {
      case 'user_monitoring':
        return `=QUERY(InputTasks, "SELECT User, Medispro, Pikago, Eleventrent, Kuuva, Kumtura, IG, FB, Threads, WA, TotalTasks, TotalLeads ORDER BY TotalTasks DESC")`;
      case 'unit_analytics':
        return `=CHART(UnitsByPlatform, "COMPARE Leads BY SocialMedia WHERE TopChannel = MAX(Leads)")`;
      case 'raw_tracking':
        return `=FILTER(TrackingEntries, Date >= "${startDate || 'All'}" AND Brand IN (${filterBrandRaw === 'all' ? '"All"' : `"${filterBrandRaw}"`}))`;
    }
  }, [activeSheet, startDate, filterBrandRaw]);

  return (
    <div className={`${isFullWidth ? 'w-full max-w-[2000px]' : 'max-w-7xl'} mx-auto px-3 sm:px-6 py-4 space-y-4 transition-all duration-300 font-sans`}>
      
      {/* ========================================================================= */}
      {/* 1. GOOGLE SHEETS APP HEADER & TOOLBAR                                     */}
      {/* ========================================================================= */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
        
        {/* Spreadsheet Top Title Row */}
        <div className="px-4 py-2.5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-zinc-900 tracking-tight">
                  Monitoring Pemantauan Media Sosial & Staff
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Google Sheet View
                </span>
                <span className="text-[10px] text-zinc-400 hidden md:inline">
                  &middot; Terhubung Realtime
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Kumtura Group &middot; 5 Unit Usaha (Medispro, Pikago, Eleventrent, Kuuva, Kumtura)
              </p>
            </div>
          </div>

          {/* Quick Toolbar Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Date Range Filters */}
            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded px-2 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-[11px] text-zinc-700 focus:outline-hidden bg-transparent"
                title="Dari Tanggal"
              />
              <span className="text-zinc-400 text-xs">&ndash;</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-[11px] text-zinc-700 focus:outline-hidden bg-transparent"
                title="Sampai Tanggal"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-[10px] text-red-600 hover:text-red-800 ml-1 font-medium cursor-pointer"
                  title="Reset Filter Tanggal"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded transition-colors cursor-pointer"
              title="Perbarui Data"
            >
              <RefreshCw className="w-3 h-3 text-zinc-500" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer shadow-2xs"
              title="Unduh Data Lembar Kerja Ini ke Format CSV"
            >
              <Download className="w-3 h-3 text-emerald-600" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        {/* Formula Bar (`fx`) - True Google Sheet Identity */}
        <div className="px-3 py-1.5 border-b border-zinc-200 flex items-center gap-2 bg-white text-xs">
          <div className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-mono text-[11px] font-semibold border border-zinc-200 shrink-0 select-none">
            {activeSheet === 'user_monitoring' ? 'A1:O' + ((analytics?.user_monitoring?.length || 0) + 1) : activeSheet === 'unit_analytics' ? 'B1:G6' : 'A1:I200'}
          </div>
          <div className="text-zinc-400 font-mono font-bold text-xs select-none">fx</div>
          <div className="flex-1 font-mono text-[11px] text-zinc-700 truncate bg-zinc-50/50 px-2 py-0.5 rounded border border-zinc-100 select-all">
            {formulaString}
          </div>
          <div className="text-[11px] text-zinc-400 shrink-0 font-medium hidden lg:inline">
            Total {analytics?.summary?.total_tasks || 0} tasks &middot; {analytics?.summary?.total_leads || 0} leads
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. GOOGLE SHEETS TABS (SHEET 1, SHEET 2, SHEET 3)                         */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-3 pt-2 bg-zinc-100/70 border-b border-zinc-200 overflow-x-auto no-scrollbar">
          <div className="flex items-end gap-1">
            {/* Sheet 1: Pemantauan User */}
            <button
              onClick={() => setActiveSheet('user_monitoring')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-md border-t-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSheet === 'user_monitoring'
                  ? 'bg-white text-zinc-900 border-t-emerald-600 border-x border-zinc-200 shadow-2xs font-semibold'
                  : 'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 border-t-transparent'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeSheet === 'user_monitoring' ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span>Sheet 1: Pemantauan Input User</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium tabular-nums ${
                activeSheet === 'user_monitoring' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
              }`}>
                {analytics?.user_monitoring?.length || 0} user
              </span>
            </button>

            {/* Sheet 2: Analitik & Diagram Leads Unit Usaha */}
            <button
              onClick={() => setActiveSheet('unit_analytics')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-md border-t-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSheet === 'unit_analytics'
                  ? 'bg-white text-zinc-900 border-t-emerald-600 border-x border-zinc-200 shadow-2xs font-semibold'
                  : 'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 border-t-transparent'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeSheet === 'unit_analytics' ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span>Sheet 2: Diagram & Analitik Unit Usaha</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                activeSheet === 'unit_analytics' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
              }`}>
                5 Unit &middot; 4 Sosmed
              </span>
            </button>

            {/* Sheet 3: Data Log Tracking Mentah */}
            <button
              onClick={() => setActiveSheet('raw_tracking')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-md border-t-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSheet === 'raw_tracking'
                  ? 'bg-white text-zinc-900 border-t-emerald-600 border-x border-zinc-200 shadow-2xs font-semibold'
                  : 'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 border-t-transparent'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${activeSheet === 'raw_tracking' ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span>Sheet 3: Data Mentah Catatan Tracking</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium tabular-nums ${
                activeSheet === 'raw_tracking' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
              }`}>
                {rawTasks.length} entri
              </span>
            </button>
          </div>

          <div className="pb-2 hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span>Formula Google Sheet otomatis aktif</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT: SHEET 1 — PEMANTAUAN USER (USER MONITORING SPREADSHEET)      */}
      {/* ========================================================================= */}
      {activeSheet === 'user_monitoring' && (
        <div className="space-y-4">
          
          {/* Quick KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-zinc-200 rounded-md p-3">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold block">Total Pengguna Aktif</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-zinc-900 tabular-nums">{analytics?.user_monitoring?.length || 0}</span>
                <span className="text-[11px] text-zinc-500">Akun terdaftar</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-md p-3">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold block">Total Task Diinput</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-blue-600 tabular-nums">{userMonitoringSums.total_tasks}</span>
                <span className="text-[11px] text-zinc-500">Catatan konten</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-md p-3">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold block">Total Leads Dihasilkan</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-emerald-600 tabular-nums">{userMonitoringSums.total_leads}</span>
                <span className="text-[11px] text-emerald-600 font-medium">Prospek masuk</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-md p-3">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold block">Top Contributor Input</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-bold text-indigo-700 truncate max-w-[140px]">
                  {analytics?.user_monitoring?.[0]?.name || '-'}
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold tabular-nums">
                  {analytics?.user_monitoring?.[0]?.total_tasks || 0} task
                </span>
              </div>
            </div>
          </div>

          {/* Spreadsheet Table Container */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
            {/* Table Action Bar */}
            <div className="px-4 py-2 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-900">
                  Matriks Aktivitas Input Task Pengguna
                </span>
                <span className="text-[11px] text-zinc-400">
                  &middot; Pemantauan distribusi task per unit usaha dan per platform media sosial
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Cari nama atau email user..."
                  className="w-full sm:w-56 pl-7 pr-2.5 py-1 text-xs border border-zinc-300 rounded-md focus:outline-hidden focus:border-emerald-600 bg-white text-zinc-900 placeholder:text-zinc-400"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Google Sheets Styled Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-zinc-200 min-w-[980px]">
                <thead>
                  {/* Row 1: Section Headers */}
                  <tr className="bg-zinc-100 text-zinc-700 font-semibold text-[11px] border-b border-zinc-200 uppercase tracking-wider">
                    <th colSpan={3} className="py-2 px-3 border-r border-zinc-200 bg-zinc-100 text-zinc-800">
                      IDENTITAS USER (PIC)
                    </th>
                    <th colSpan={5} className="py-2 px-3 border-r border-zinc-200 text-center bg-blue-50/70 text-blue-900">
                      INPUT TASK PER UNIT USAHA
                    </th>
                    <th colSpan={4} className="py-2 px-3 border-r border-zinc-200 text-center bg-purple-50/70 text-purple-900">
                      INPUT TASK PER MEDIA SOSIAL
                    </th>
                    <th colSpan={3} className="py-2 px-3 text-center bg-emerald-50/70 text-emerald-900">
                      TOTAL PERFORMA
                    </th>
                  </tr>

                  {/* Row 2: Detailed Column Sub-Headers */}
                  <tr className="bg-zinc-50/90 text-zinc-600 font-medium text-[11px] border-b border-zinc-200">
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-center w-10 text-zinc-400 font-mono">#</th>
                    <th className="py-1.5 px-3 border-r border-zinc-200 min-w-[140px]">Nama User</th>
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-center w-20">Role</th>

                    {/* Brands */}
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-right w-24">
                      <span className="flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                        <span>Medispro</span>
                      </span>
                    </th>
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-right w-24">
                      <span className="flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                        <span>Pikago</span>
                      </span>
                    </th>
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-right w-24">
                      <span className="flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
                        <span>Eleventrent</span>
                      </span>
                    </th>
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-right w-24">
                      <span className="flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                        <span>Kuuva</span>
                      </span>
                    </th>
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-right w-24">
                      <span className="flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                        <span>Kumtura</span>
                      </span>
                    </th>

                    {/* Platforms */}
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-right w-24">
                      <span className="flex items-center justify-end gap-1">
                        <InstagramIcon className="w-3 h-3 text-[#E1306C]" />
                        <span>Instagram</span>
                      </span>
                    </th>
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-right w-24">
                      <span className="flex items-center justify-end gap-1">
                        <FacebookIcon className="w-3 h-3 text-[#1877F2]" />
                        <span>Facebook</span>
                      </span>
                    </th>
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-right w-24">
                      <span className="flex items-center justify-end gap-1">
                        <ThreadsIcon className="w-3 h-3 text-[#111827]" />
                        <span>Threads</span>
                      </span>
                    </th>
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-right w-24">
                      <span className="flex items-center justify-end gap-1">
                        <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                        <span>WhatsApp</span>
                      </span>
                    </th>

                    {/* Totals */}
                    <th className="py-1.5 px-3 border-r border-zinc-200 text-right w-24 font-semibold text-zinc-900 bg-zinc-50">
                      Total Tasks
                    </th>
                    <th className="py-1.5 px-3 border-r border-zinc-200 text-right w-24 font-semibold text-emerald-700 bg-emerald-50/50">
                      Total Leads
                    </th>
                    <th className="py-1.5 px-3 text-right w-24 font-semibold text-zinc-700">
                      Rata-rata
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-200 bg-white">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-8 text-center text-zinc-400">
                        Tidak ada data pengguna yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => {
                      const avgLeadsPerTask = u.total_tasks > 0 ? (u.total_leads / u.total_tasks).toFixed(1) : '0';
                      return (
                        <tr key={u.user_id} className="hover:bg-zinc-50/80 transition-colors">
                          {/* Row Number */}
                          <td className="py-2 px-2.5 border-r border-zinc-200 text-center font-mono text-[11px] text-zinc-400 bg-zinc-50/40">
                            {idx + 1}
                          </td>

                          {/* User info */}
                          <td className="py-2 px-3 border-r border-zinc-200 whitespace-nowrap">
                            <span className="font-semibold text-zinc-900 block">{u.name}</span>
                            <span className="text-[11px] text-zinc-400 block">{u.email}</span>
                          </td>

                          <td className="py-2 px-2.5 border-r border-zinc-200 text-center whitespace-nowrap">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              u.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {u.role}
                            </span>
                          </td>

                          {/* Brand Task counts */}
                          <td className="py-2 px-2.5 border-r border-zinc-200 text-right font-medium tabular-nums">
                            {(u.brand_tasks?.medispro || 0) > 0 ? (
                              <span className="text-zinc-900 font-semibold">{u.brand_tasks?.medispro}</span>
                            ) : (
                              <span className="text-zinc-300">0</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 border-r border-zinc-200 text-right font-medium tabular-nums">
                            {(u.brand_tasks?.pikago || 0) > 0 ? (
                              <span className="text-zinc-900 font-semibold">{u.brand_tasks?.pikago}</span>
                            ) : (
                              <span className="text-zinc-300">0</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 border-r border-zinc-200 text-right font-medium tabular-nums">
                            {(u.brand_tasks?.eleventrent || 0) > 0 ? (
                              <span className="text-zinc-900 font-semibold">{u.brand_tasks?.eleventrent}</span>
                            ) : (
                              <span className="text-zinc-300">0</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 border-r border-zinc-200 text-right font-medium tabular-nums">
                            {(u.brand_tasks?.kuuva || 0) > 0 ? (
                              <span className="text-zinc-900 font-semibold">{u.brand_tasks?.kuuva}</span>
                            ) : (
                              <span className="text-zinc-300">0</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 border-r border-zinc-200 text-right font-medium tabular-nums">
                            {(u.brand_tasks?.kumtura || 0) > 0 ? (
                              <span className="text-zinc-900 font-semibold">{u.brand_tasks?.kumtura}</span>
                            ) : (
                              <span className="text-zinc-300">0</span>
                            )}
                          </td>

                          {/* Platform Task counts */}
                          <td className="py-2 px-2.5 border-r border-zinc-200 text-right font-medium tabular-nums">
                            {(u.platform_tasks?.instagram || 0) > 0 ? (
                              <span className="text-[#E1306C] font-semibold">{u.platform_tasks?.instagram}</span>
                            ) : (
                              <span className="text-zinc-300">0</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 border-r border-zinc-200 text-right font-medium tabular-nums">
                            {(u.platform_tasks?.facebook || 0) > 0 ? (
                              <span className="text-[#1877F2] font-semibold">{u.platform_tasks?.facebook}</span>
                            ) : (
                              <span className="text-zinc-300">0</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 border-r border-zinc-200 text-right font-medium tabular-nums">
                            {(u.platform_tasks?.threads || 0) > 0 ? (
                              <span className="text-zinc-900 font-semibold">{u.platform_tasks?.threads}</span>
                            ) : (
                              <span className="text-zinc-300">0</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 border-r border-zinc-200 text-right font-medium tabular-nums">
                            {(u.platform_tasks?.whatsapp || 0) > 0 ? (
                              <span className="text-[#25D366] font-semibold">{u.platform_tasks?.whatsapp}</span>
                            ) : (
                              <span className="text-zinc-300">0</span>
                            )}
                          </td>

                          {/* Productivity Totals */}
                          <td className="py-2 px-3 border-r border-zinc-200 text-right font-bold text-zinc-900 tabular-nums bg-zinc-50/50">
                            {u.total_tasks}
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 text-right font-bold text-emerald-600 tabular-nums bg-emerald-50/30">
                            {u.total_leads}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-zinc-600 tabular-nums">
                            {avgLeadsPerTask} <span className="text-[10px] text-zinc-400">leads/task</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Google Sheet Formula Total Summary Row: =SUM(...) */}
                <tfoot>
                  <tr className="bg-zinc-100 font-bold text-zinc-900 border-t-2 border-zinc-300">
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-center font-mono text-[10px] text-emerald-800 bg-emerald-100">
                      Σ
                    </td>
                    <td className="py-2.5 px-3 border-r border-zinc-200 font-mono text-[11px] text-zinc-700">
                      =SUM(Total Seluruh Tim)
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-center text-zinc-400">
                      &mdash;
                    </td>

                    {/* Brands Sum */}
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right tabular-nums text-zinc-900">
                      {userMonitoringSums.medispro}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right tabular-nums text-zinc-900">
                      {userMonitoringSums.pikago}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right tabular-nums text-zinc-900">
                      {userMonitoringSums.eleventrent}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right tabular-nums text-zinc-900">
                      {userMonitoringSums.kuuva}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right tabular-nums text-zinc-900">
                      {userMonitoringSums.kumtura}
                    </td>

                    {/* Platforms Sum */}
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right tabular-nums text-[#E1306C]">
                      {userMonitoringSums.instagram}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right tabular-nums text-[#1877F2]">
                      {userMonitoringSums.facebook}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right tabular-nums text-zinc-900">
                      {userMonitoringSums.threads}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right tabular-nums text-[#25D366]">
                      {userMonitoringSums.whatsapp}
                    </td>

                    {/* Productivity Grand Totals */}
                    <td className="py-2.5 px-3 border-r border-zinc-200 text-right font-black text-blue-700 tabular-nums bg-blue-50/50">
                      {userMonitoringSums.total_tasks}
                    </td>
                    <td className="py-2.5 px-3 border-r border-zinc-200 text-right font-black text-emerald-700 tabular-nums bg-emerald-100/60">
                      {userMonitoringSums.total_leads}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-zinc-700 tabular-nums">
                      {userMonitoringSums.total_tasks > 0 
                        ? (userMonitoringSums.total_leads / userMonitoringSums.total_tasks).toFixed(1)
                        : '0'} leads/task
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: SHEET 2 — ANALITIK & DIAGRAM SALURAN UNIT USAHA               */}
      {/* (Memantau Unit usaha mana yg banyak dapat leads & paling bagus)           */}
      {/* ========================================================================= */}
      {activeSheet === 'unit_analytics' && (
        <div className="space-y-5">
          
          {/* SECTION A: WINNER CARDS - "Mana Saluran yang Paling Bagus per Unit Usaha" */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Saluran Terbaik & Paling Menghasilkan per Unit Usaha</span>
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Ringkasan platform media sosial yang paling banyak mendatangkan leads untuk tiap unit bisnis
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(analytics?.brand_platform_matrix || []).map((b) => {
                const top = b.top_platform;
                const totalLeads = b.total_leads || 0;
                const topLeads = top?.leads || 0;
                const pct = totalLeads > 0 && top ? Math.round((topLeads / totalLeads) * 100) : 0;
                const bStyle = BRAND_COLORS[b.brand_slug] || { dot: '#0284c7', border: 'border-zinc-200', text: 'text-zinc-900', bg: 'bg-zinc-50' };

                return (
                  <div
                    key={b.brand_slug}
                    className="bg-white border border-zinc-200 rounded-lg p-3.5 flex flex-col justify-between shadow-2xs relative overflow-hidden"
                  >
                    {/* Top Accent Strip */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: b.brand_color || bStyle.dot }}
                    />

                    <div>
                      {/* Brand Header */}
                      <div className="flex items-center justify-between mt-1 mb-2">
                        <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: b.brand_color || bStyle.dot }}
                          />
                          <span>{b.brand_name}</span>
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          {totalLeads} Leads
                        </span>
                      </div>

                      {/* Best Performer Platform Spotlight */}
                      <div className="bg-zinc-50 rounded-md p-2.5 border border-zinc-100 my-2">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Award className="w-3 h-3" />
                            <span>Paling Bagus</span>
                          </span>
                          <span className="font-semibold text-zinc-700">{pct}% dari unit</span>
                        </div>

                        {top ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {getPlatformIcon(top.slug, "w-4 h-4")}
                              <span className="text-xs font-bold text-zinc-900">{top.name}</span>
                            </div>
                            <span className="text-sm font-black text-emerald-600 tabular-nums">
                              {top.leads} <span className="text-[10px] font-normal text-zinc-400">leads</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">Belum ada data</span>
                        )}
                      </div>

                      {/* Mini Breakdown of all 4 channels */}
                      <div className="space-y-1.5 mt-3 pt-2 border-t border-zinc-100 text-[11px]">
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="flex items-center gap-1">
                            <InstagramIcon className="w-2.5 h-2.5 text-[#E1306C]" />
                            <span>Instagram</span>
                          </span>
                          <span className="font-medium tabular-nums text-zinc-900">{b.instagram || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="flex items-center gap-1">
                            <FacebookIcon className="w-2.5 h-2.5 text-[#1877F2]" />
                            <span>Facebook</span>
                          </span>
                          <span className="font-medium tabular-nums text-zinc-900">{b.facebook || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="flex items-center gap-1">
                            <ThreadsIcon className="w-2.5 h-2.5 text-[#111827]" />
                            <span>Threads</span>
                          </span>
                          <span className="font-medium tabular-nums text-zinc-900">{b.threads || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="flex items-center gap-1">
                            <WhatsAppIcon className="w-2.5 h-2.5 text-[#25D366]" />
                            <span>WhatsApp</span>
                          </span>
                          <span className="font-medium tabular-nums text-zinc-900">{b.whatsapp || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-100">
                      <Link
                        href={`/brands/${b.brand_slug}`}
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center justify-between"
                      >
                        <span>Buka Tab Form {b.brand_name}</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION B: CORE REQUESTED DIAGRAM — Grouped Bar Chart Unit Usaha vs Media Sosial */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Diagram Komparasi Saluran per Unit Usaha</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Grafik perbandingan perolehan tiap media sosial (Instagram, Facebook, Threads, WhatsApp) di seluruh unit
                </p>
              </div>

              {/* Metric Toggle: Leads vs Tasks */}
              <div className="inline-flex rounded-md border border-zinc-200 p-0.5 bg-zinc-50 self-start sm:self-auto text-xs">
                <button
                  onClick={() => setChartMetric('leads')}
                  className={`px-3 py-1 font-medium rounded transition-all cursor-pointer ${
                    chartMetric === 'leads'
                      ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Berdasarkan Leads Dihasilkan
                </button>
                <button
                  onClick={() => setChartMetric('tasks')}
                  className={`px-3 py-1 font-medium rounded transition-all cursor-pointer ${
                    chartMetric === 'tasks'
                      ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Berdasarkan Jumlah Konten (Tasks)
                </button>
              </div>
            </div>

            {/* Recharts Grouped Bar Chart */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={groupedChartData}
                  margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    fontFamily="inherit"
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    fontFamily="inherit"
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} ${chartMetric === 'leads' ? 'Leads' : 'Konten'}`,
                      name
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                  />
                  <Bar dataKey="Instagram" name="Instagram" fill="#E1306C" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Facebook" name="Facebook" fill="#1877F2" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Threads" name="Threads" fill="#111827" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="WhatsApp" name="WhatsApp" fill="#25D366" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SECTION C: HEATMAP SPREADSHEET MATRIX (Unit Usaha x Media Sosial) */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                  Matriks Perolehan Leads: Unit Usaha vs Media Sosial
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Sel berwarna hijau menandakan saluran paling dominan pada unit usaha terkait
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-zinc-200 min-w-[700px]">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 font-semibold text-[11px] border-b border-zinc-200">
                    <th className="py-2 px-3 border-r border-zinc-200">Unit Usaha</th>
                    <th className="py-2 px-3 border-r border-zinc-200 text-right">
                      <span className="flex items-center justify-end gap-1 text-[#E1306C]">
                        <InstagramIcon className="w-3 h-3" />
                        <span>Instagram</span>
                      </span>
                    </th>
                    <th className="py-2 px-3 border-r border-zinc-200 text-right">
                      <span className="flex items-center justify-end gap-1 text-[#1877F2]">
                        <FacebookIcon className="w-3 h-3" />
                        <span>Facebook</span>
                      </span>
                    </th>
                    <th className="py-2 px-3 border-r border-zinc-200 text-right">
                      <span className="flex items-center justify-end gap-1 text-zinc-900">
                        <ThreadsIcon className="w-3 h-3" />
                        <span>Threads</span>
                      </span>
                    </th>
                    <th className="py-2 px-3 border-r border-zinc-200 text-right">
                      <span className="flex items-center justify-end gap-1 text-[#25D366]">
                        <WhatsAppIcon className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </span>
                    </th>
                    <th className="py-2 px-3 border-r border-zinc-200 text-right font-bold text-zinc-900 bg-zinc-50">
                      Total Leads
                    </th>
                    <th className="py-2 px-3 text-left font-semibold text-zinc-800">
                      Saluran Terbaik
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {(analytics?.brand_platform_matrix || []).map((b) => {
                    const top = b.top_platform;
                    const ig = b.instagram || 0;
                    const fb = b.facebook || 0;
                    const th = b.threads || 0;
                    const wa = b.whatsapp || 0;
                    const maxVal = Math.max(ig, fb, th, wa);

                    return (
                      <tr key={b.brand_slug} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-3 border-r border-zinc-200 font-semibold text-zinc-900 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.brand_color }} />
                            <span>{b.brand_name}</span>
                          </span>
                        </td>

                        {/* Instagram Cell */}
                        <td className={`py-2.5 px-3 border-r border-zinc-200 text-right tabular-nums ${
                          ig === maxVal && ig > 0 ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-zinc-700'
                        }`}>
                          {ig}
                        </td>

                        {/* Facebook Cell */}
                        <td className={`py-2.5 px-3 border-r border-zinc-200 text-right tabular-nums ${
                          fb === maxVal && fb > 0 ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-zinc-700'
                        }`}>
                          {fb}
                        </td>

                        {/* Threads Cell */}
                        <td className={`py-2.5 px-3 border-r border-zinc-200 text-right tabular-nums ${
                          th === maxVal && th > 0 ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-zinc-700'
                        }`}>
                          {th}
                        </td>

                        {/* WhatsApp Cell */}
                        <td className={`py-2.5 px-3 border-r border-zinc-200 text-right tabular-nums ${
                          wa === maxVal && wa > 0 ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-zinc-700'
                        }`}>
                          {wa}
                        </td>

                        {/* Total Leads */}
                        <td className="py-2.5 px-3 border-r border-zinc-200 text-right font-black text-zinc-900 tabular-nums bg-zinc-50/60">
                          {b.total_leads || 0}
                        </td>

                        {/* Best Platform */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {top && top.leads > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <Trophy className="w-3 h-3 text-amber-600" />
                              <span>{top.name} ({top.leads} leads)</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION D: Donut Chart & Channel Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Donut Chart */}
            <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                  Pangsa Leads per Media Sosial
                </h3>
                <p className="text-[11px] text-zinc-400">Kontribusi persentase seluruh platform</p>
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
                      {(analytics?.leads_by_platform || []).map((entry) => (
                        <Cell 
                          key={entry.slug} 
                          fill={PLATFORM_COLORS[entry.slug] || '#2563eb'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value} Leads`, 'Total Leads']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e4e4e7', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-100">
                {(analytics?.leads_by_platform || []).map((plat) => (
                  <div key={plat.platform_id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: PLATFORM_COLORS[plat.slug] || '#2563eb' }} 
                      />
                      <span className="text-zinc-700 font-medium">{plat.name}</span>
                    </div>
                    <span className="font-semibold text-zinc-900 tabular-nums">
                      {plat.leads} <span className="text-zinc-400 font-normal">({plat.percentage}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Leaderboard Ranking */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                    Peringkat Efektivitas Saluran Media Sosial
                  </h3>
                  <span className="text-[11px] text-zinc-400">Urut berdasarkan perolehan leads</span>
                </div>

                <div className="space-y-2 mt-3">
                  {(analytics?.leads_by_platform || []).map((p, idx) => {
                    const avgLeads = p.tasks_count > 0 ? (p.leads / p.tasks_count).toFixed(1) : '0';
                    const platColor = PLATFORM_COLORS[p.slug] || '#3b82f6';
                    return (
                      <div 
                        key={p.platform_id}
                        className="p-3 rounded-md border border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(p.slug, "w-4 h-4")}
                            <span className="text-xs font-bold text-zinc-900">{p.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs tabular-nums">
                          <div>
                            <span className="text-[10px] text-zinc-400 block">Total Konten</span>
                            <span className="font-semibold text-zinc-700">{p.tasks_count} post</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 block">Rata-rata/Post</span>
                            <span className="font-semibold text-blue-600">{avgLeads} leads</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 block">Total Perolehan</span>
                            <span className="font-bold text-emerald-600 text-sm">{p.leads} leads</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-800 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Tip: Optimalkan posting konten pada platform dengan rata-rata leads tertinggi untuk meningkatkan ROI promosi.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: SHEET 3 — DATA MENTAH CATATAN TRACKING                       */}
      {/* ========================================================================= */}
      {activeSheet === 'raw_tracking' && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
            {/* Toolbar Filters */}
            <div className="px-4 py-2.5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-zinc-900">
                  Data Mentah Seluruh Catatan Tracking
                </span>
                <span className="text-[11px] text-zinc-400 tabular-nums">
                  &middot; {rawTasks.length} entri ditemukan
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Filter Brand */}
                <select
                  value={filterBrandRaw}
                  onChange={(e) => setFilterBrandRaw(e.target.value)}
                  className="text-xs border border-zinc-300 rounded-md px-2 py-1 bg-white text-zinc-800 focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="all">Semua Unit Usaha</option>
                  {brands.map((b) => (
                    <option key={b.slug} value={b.slug}>{b.name}</option>
                  ))}
                </select>

                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchTask}
                    onChange={(e) => setSearchTask(e.target.value)}
                    placeholder="Cari konten, PIC, follow up..."
                    className="w-full sm:w-56 pl-7 pr-2.5 py-1 text-xs border border-zinc-300 rounded-md focus:outline-hidden focus:border-emerald-600 bg-white text-zinc-900 placeholder:text-zinc-400"
                  />
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-zinc-200 min-w-[900px]">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-600 font-semibold text-[11px] border-b border-zinc-200">
                    <th className="py-2 px-2.5 border-r border-zinc-200 text-center w-10 text-zinc-400 font-mono">#</th>
                    <th className="py-2 px-3 border-r border-zinc-200 w-28">Tanggal & PIC</th>
                    <th className="py-2 px-3 border-r border-zinc-200 w-28">Unit Usaha</th>
                    <th className="py-2 px-3 border-r border-zinc-200 w-28">Saluran</th>
                    <th className="py-2 px-3 border-r border-zinc-200 min-w-[200px]">Judul Konten</th>
                    <th className="py-2 px-3 border-r border-zinc-200 min-w-[220px]">Follow Up</th>
                    <th className="py-2 px-3 border-r border-zinc-200 text-center w-20">Bukti SS</th>
                    <th className="py-2 px-3 border-r border-zinc-200 text-right w-16">Leads</th>
                    <th className="py-2 px-3 text-center w-14">Tautan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {rawTasks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-400">
                        Tidak ada catatan tracking yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    rawTasks.map((task, idx) => {
                      const bStyle = BRAND_COLORS[task.brand?.slug || ''] || { bg: 'bg-zinc-50', text: 'text-zinc-700', border: 'border-zinc-200' };
                      return (
                        <tr key={task.id} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="py-2 px-2.5 border-r border-zinc-200 text-center font-mono text-[11px] text-zinc-400 bg-zinc-50/40">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 whitespace-nowrap">
                            <span className="font-semibold text-zinc-900 tabular-nums block">{task.task_date}</span>
                            <span className="text-[11px] text-blue-700 font-medium block">{task.pic_name || task.user?.name || 'Staf'}</span>
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}>
                              {task.brand?.name}
                            </span>
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {getPlatformIcon(task.platform?.slug || '')}
                              <span className="text-zinc-800 font-medium">{task.platform?.name}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 max-w-xs">
                            <p className="font-medium text-zinc-900 line-clamp-1">{task.title}</p>
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 max-w-xs">
                            {task.follow_up || task.notes ? (
                              <div className="border-l-2 border-emerald-500 pl-2 text-zinc-700 text-xs line-clamp-1">
                                {task.follow_up || task.notes}
                              </div>
                            ) : (
                              <span className="text-zinc-300">&mdash;</span>
                            )}
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 text-center whitespace-nowrap">
                            {task.screenshot_url ? (
                              <button
                                onClick={() => {
                                  setViewScreenshotUrl(task.screenshot_url || null);
                                  setViewScreenshotTitle(`${task.brand?.name} - ${task.platform?.name}: ${task.title}`);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                <Maximize2 className="w-2.5 h-2.5" />
                                <span>Lihat SS</span>
                              </button>
                            ) : (
                              <span className="text-zinc-300">&mdash;</span>
                            )}
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 text-right font-black text-emerald-600 tabular-nums whitespace-nowrap">
                            {task.leads_count}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            {task.link_url ? (
                              <a
                                href={task.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-block p-1"
                                title={task.link_url}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-zinc-300">&mdash;</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Screenshot Preview */}
      <ScreenshotModal
        isOpen={!!viewScreenshotUrl}
        onClose={() => setViewScreenshotUrl(null)}
        imageUrl={viewScreenshotUrl}
        title={viewScreenshotTitle}
      />
    </div>
  );
}
