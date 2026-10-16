'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useZoom } from '@/context/ZoomContext';
import { api } from '@/lib/api';
import { Brand, Platform, DashboardAnalytics, UserMonitoring, TrackingTask } from '@/types';
import { 
  BarChart3, 
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
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  Info,
  X,
  UserCheck
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

type ActiveSheetTab = 'user_monitoring' | 'unit_tracking';
type DatePreset = 'all' | 'today' | 'yesterday' | 'last7' | 'custom';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isFullWidth } = useZoom();

  // Active Sheet tab: Sheet 1 (Pemantauan User) or Sheet 2 (Tracking Unit x Medsos)
  const [activeSheet, setActiveSheet] = useState<ActiveSheetTab>('user_monitoring');

  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Filters
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // User Selection & Social Media Selection Drill-Down
  const [selectedUserId, setSelectedUserId] = useState<number | 'all'>('all');
  const [selectedPlatformSlug, setSelectedPlatformSlug] = useState<string>('all');
  const [searchUser, setSearchUser] = useState<string>('');

  // Sheet 2 chart metric
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

  // Date preset handler
  const handleDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const formatYMD = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const todayStr = formatYMD(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = formatYMD(yesterday);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === 'last7') {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 6);
      setStartDate(formatYMD(last7));
      setEndDate(formatYMD(today));
    }
  };

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

  // User Performance Status calculation (Siapa paling banyak & siapa sama sekali tidak mengerjakan)
  const userPerformanceMap = useMemo(() => {
    const list = analytics?.user_monitoring || [];
    if (list.length === 0) return { maxTasks: 0, inactiveUsers: [], topUsers: [] };

    const maxTasks = Math.max(...list.map((u) => u.total_tasks), 0);
    const inactiveUsers = list.filter((u) => u.total_tasks === 0);
    const topUsers = maxTasks > 0 ? list.filter((u) => u.total_tasks === maxTasks) : [];

    return { maxTasks, inactiveUsers, topUsers };
  }, [analytics?.user_monitoring]);

  // Filtered users for Sheet 1
  const filteredUsers = useMemo(() => {
    if (!analytics?.user_monitoring) return [];
    if (!searchUser.trim()) return analytics.user_monitoring;
    const q = searchUser.toLowerCase();
    return analytics.user_monitoring.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [analytics?.user_monitoring, searchUser]);

  // Active selected user object
  const activeSelectedUser = useMemo(() => {
    if (selectedUserId === 'all') return null;
    return (analytics?.user_monitoring || []).find((u) => u.user_id === selectedUserId) || null;
  }, [selectedUserId, analytics?.user_monitoring]);

  // Tasks for the selected user drill-down
  const selectedUserTasks = useMemo(() => {
    if (!activeSelectedUser) return [];
    const all = analytics?.all_tasks || analytics?.recent_tasks || [];
    let list = all.filter(
      (t) => t.user_id === activeSelectedUser.user_id || (t.pic_name && t.pic_name.toLowerCase() === activeSelectedUser.name.toLowerCase())
    );
    if (selectedPlatformSlug !== 'all') {
      list = list.filter((t) => t.platform?.slug === selectedPlatformSlug);
    }
    return list;
  }, [activeSelectedUser, analytics?.all_tasks, analytics?.recent_tasks, selectedPlatformSlug]);

  // Sums for Sheet 1 bottom formula row
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

  // Grouped Chart Data for Sheet 2
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

  // CSV Export utility
  const handleExportCsv = () => {
    if (activeSheet === 'user_monitoring') {
      const headers = [
        'No', 'Nama User', 'Email', 'Role', 'Status Kinerja',
        'Medispro Tasks', 'Pikago Tasks', 'Eleventrent Tasks', 'Kuuva Tasks', 'Kumtura Tasks',
        'Instagram Tasks', 'Facebook Tasks', 'Threads Tasks', 'WhatsApp Tasks',
        'Total Tasks', 'Total Leads'
      ];
      const rows = (analytics?.user_monitoring || []).map((u, i) => {
        let status = 'Aktif Mengerjakan';
        if (u.total_tasks === 0) status = 'Sama Sekali Tidak Mengerjakan';
        else if (u.total_tasks === userPerformanceMap.maxTasks && userPerformanceMap.maxTasks > 0) status = 'Paling Banyak Mengerjakan';

        return [
          i + 1,
          u.name,
          u.email,
          u.role,
          status,
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
        ];
      });
      downloadCsv('Pemantauan_Kinerja_Anak_Magang.csv', headers, rows);
    } else {
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
      downloadCsv('Tracking_Unit_Usaha_Media_Sosial.csv', headers, rows);
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

  if (authLoading || loading || !user || user.role !== 'admin') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 space-y-3">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-medium">Memuat sistem spreadsheet pemantauan...</p>
      </div>
    );
  }

  // Formula bar label
  const formulaString = activeSheet === 'user_monitoring'
    ? `=QUERY(InternTracking, "SELECT InternName, StatusHarian, UnitUsaha, MediaSosial, TasksInput WHERE Date = '${startDate || 'All'}'")`
    : `=CHART(UnitsByPlatform, "COMPARE Leads BY SocialMedia WHERE TopChannel = MAX(Leads)")`;

  return (
    <div className={`${isFullWidth ? 'w-full max-w-[2000px]' : 'max-w-7xl'} mx-auto px-3 sm:px-6 py-4 space-y-4 transition-all duration-300 font-sans`}>
      
      {/* ========================================================================= */}
      {/* 1. GOOGLE SHEETS HEADER, PRESET FILTERS & FORMULA BAR                     */}
      {/* ========================================================================= */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
        
        {/* Top Header Row */}
        <div className="px-4 py-2.5 border-b border-zinc-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-zinc-900 tracking-tight">
                  Pemantauan Kinerja Harian Anak Magang & Media Sosial
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Google Sheet Mode
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Pantau siapa yang aktif, siapa yang sama sekali tidak mengerjakan, dan progres medsos tiap unit usaha
              </p>
            </div>
          </div>

          {/* Date Presets & Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Date Presets */}
            <div className="inline-flex rounded-md border border-zinc-200 p-0.5 bg-white text-xs">
              <button
                onClick={() => handleDatePreset('all')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                  datePreset === 'all'
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => handleDatePreset('today')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                  datePreset === 'today'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => handleDatePreset('yesterday')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                  datePreset === 'yesterday'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Kemarin
              </button>
              <button
                onClick={() => handleDatePreset('last7')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                  datePreset === 'last7'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                7 Hari
              </button>
            </div>

            {/* Manual Date Input */}
            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded px-2 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setStartDate(e.target.value);
                }}
                className="text-[11px] text-zinc-700 focus:outline-hidden bg-transparent"
                title="Dari Tanggal"
              />
              <span className="text-zinc-400 text-xs">&ndash;</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setEndDate(e.target.value);
                }}
                className="text-[11px] text-zinc-700 focus:outline-hidden bg-transparent"
                title="Sampai Tanggal"
              />
            </div>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
              title="Unduh Lembar Kerja Ini ke CSV"
            >
              <Download className="w-3 h-3 text-emerald-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Formula Bar (`fx`) */}
        <div className="px-3 py-1.5 border-b border-zinc-200 flex items-center gap-2 bg-white text-xs">
          <div className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-mono text-[11px] font-semibold border border-zinc-200 shrink-0 select-none">
            {activeSheet === 'user_monitoring' ? 'A1:P' + ((analytics?.user_monitoring?.length || 0) + 1) : 'A1:H6'}
          </div>
          <div className="text-zinc-400 font-mono font-bold text-xs select-none">fx</div>
          <div className="flex-1 font-mono text-[11px] text-zinc-700 truncate bg-zinc-50/50 px-2 py-0.5 rounded border border-zinc-100 select-all">
            {formulaString}
          </div>
          <div className="text-[11px] text-zinc-500 shrink-0 font-medium hidden sm:inline">
            Periode: <span className="font-semibold text-zinc-800">{startDate ? (startDate === endDate ? startDate : `${startDate} s/d ${endDate}`) : 'Seluruh Waktu'}</span>
          </div>
        </div>

        {/* Google Sheets Tab Navigation */}
        <div className="flex items-center justify-between px-3 pt-2 bg-zinc-100/70 border-b border-zinc-200 overflow-x-auto no-scrollbar">
          <div className="flex items-end gap-1">
            <button
              onClick={() => setActiveSheet('user_monitoring')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-t-md border-t-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSheet === 'user_monitoring'
                  ? 'bg-white text-zinc-900 border-t-emerald-600 border-x border-zinc-200 shadow-2xs font-semibold'
                  : 'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 border-t-transparent'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeSheet === 'user_monitoring' ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span>Sheet 1: Pemantauan Harian Anak Magang / User</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium tabular-nums ${
                activeSheet === 'user_monitoring' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
              }`}>
                {analytics?.user_monitoring?.length || 0} user
              </span>
            </button>

            <button
              onClick={() => setActiveSheet('unit_tracking')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-t-md border-t-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSheet === 'unit_tracking'
                  ? 'bg-white text-zinc-900 border-t-emerald-600 border-x border-zinc-200 shadow-2xs font-semibold'
                  : 'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 border-t-transparent'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeSheet === 'unit_tracking' ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span>Sheet 2: Tracking Unit Usaha x Media Sosial</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                activeSheet === 'unit_tracking' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
              }`}>
                5 Unit &middot; 4 Sosmed
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DAILY PERFORMANCE SUMMARY STRIP (IDENTIFIKASI TIDAK MENGERJAKAN VS TOP) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Paling Banyak Mengerjakan (Top Performer) */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              Paling Banyak Mengerjakan
            </span>
            {userPerformanceMap.topUsers.length > 0 ? (
              <div className="mt-0.5">
                <span className="text-sm font-black text-emerald-950 truncate block">
                  {userPerformanceMap.topUsers.map((u) => u.name).join(', ')}
                </span>
                <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                  {userPerformanceMap.maxTasks} task selesai diinput &middot; {userPerformanceMap.topUsers[0]?.total_leads || 0} leads
                </span>
              </div>
            ) : (
              <span className="text-xs text-zinc-500">Belum ada aktivitas di periode ini</span>
            )}
          </div>
        </div>

        {/* Card 2: Perlu Diingatkan (Sama Sekali Tidak Mengerjakan) */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
                Sama Sekali Tidak Mengerjakan
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                {userPerformanceMap.inactiveUsers.length} Orang
              </span>
            </div>
            {userPerformanceMap.inactiveUsers.length > 0 ? (
              <div className="mt-0.5">
                <span className="text-xs font-semibold text-rose-950 truncate block">
                  {userPerformanceMap.inactiveUsers.map((u) => u.name).join(', ')}
                </span>
                <span className="text-[11px] text-rose-600 font-medium">
                  0 task diinput (perlu diingatkan / follow-up)
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium text-emerald-700 mt-1 block">
                Hebat! Seluruh user sudah aktif input task di periode ini.
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Total Task & Leads Terkumpul */}
        <div className="bg-white border border-zinc-200 rounded-lg p-3 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
              Ringkasan Kinerja Harian
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-zinc-900 tabular-nums">
                {userMonitoringSums.total_tasks}
              </span>
              <span className="text-xs font-medium text-zinc-500">task diinput</span>
              <span className="text-zinc-300">&middot;</span>
              <span className="text-xl font-bold text-emerald-600 tabular-nums">
                {userMonitoringSums.total_leads}
              </span>
              <span className="text-xs font-medium text-emerald-600">leads masuk</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-zinc-400 block">Tingkat Keaktifan</span>
            <span className="text-xs font-bold text-blue-700 tabular-nums">
              {((analytics?.user_monitoring?.length || 0) - userPerformanceMap.inactiveUsers.length)} / {analytics?.user_monitoring?.length || 0} aktif
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SHEET 1: PEMANTAUAN HARIAN USER DENGAN FITUR DRILL-DOWN MEDSOS         */}
      {/* ========================================================================= */}
      {activeSheet === 'user_monitoring' && (
        <div className="space-y-4">
          
          {/* USER SELECTION & SOCIAL MEDIA DRILL-DOWN PANEL */}
          <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pilih Anak Magang / User:</span>
                </span>
                
                {/* User Dropdown Selector */}
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setSelectedUserId(val);
                    setSelectedPlatformSlug('all');
                  }}
                  className="text-xs border border-zinc-300 rounded-md px-2.5 py-1 bg-white font-medium text-zinc-900 focus:outline-hidden focus:border-emerald-600 cursor-pointer shadow-2xs"
                >
                  <option value="all">Semua Pengguna (Tampilkan Seluruh Tim)</option>
                  {(analytics?.user_monitoring || []).map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.name} ({u.total_tasks} task) {u.total_tasks === 0 ? '— 🔴 Belum Mengerjakan' : ''}
                    </option>
                  ))}
                </select>

                {selectedUserId !== 'all' && (
                  <button
                    onClick={() => {
                      setSelectedUserId('all');
                      setSelectedPlatformSlug('all');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 underline cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset Pilihan</span>
                  </button>
                )}
              </div>

              {/* Search User Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Cari nama atau email..."
                  className="w-full sm:w-52 pl-7 pr-2.5 py-1 text-xs border border-zinc-300 rounded-md focus:outline-hidden focus:border-emerald-600 bg-white text-zinc-900 placeholder:text-zinc-400"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
              </div>
            </div>

            {/* DETAIL INSPECTION: IF AN INTERN IS CHOSEN, ALLOW CHOOSING SOCIAL MEDIA */}
            {activeSelectedUser && (
              <div className="mt-3.5 pt-3 border-t border-zinc-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50 p-2.5 rounded-md border border-zinc-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="text-xs font-bold text-zinc-900">{activeSelectedUser.name}</span>
                    <span className="text-[11px] text-zinc-500">({activeSelectedUser.email})</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      activeSelectedUser.total_tasks === 0 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {activeSelectedUser.total_tasks === 0 ? 'Belum Mengerjakan' : `${activeSelectedUser.total_tasks} Task Selesai`}
                    </span>
                  </div>

                  {/* Social Media Selector for this intern */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[11px] font-semibold text-zinc-500 shrink-0">Pilih Medsos:</span>
                    
                    <button
                      onClick={() => setSelectedPlatformSlug('all')}
                      className={`px-2.5 py-1 text-xs rounded transition-all cursor-pointer whitespace-nowrap font-medium ${
                        selectedPlatformSlug === 'all'
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      Semua ({activeSelectedUser.total_tasks})
                    </button>

                    <button
                      onClick={() => setSelectedPlatformSlug('instagram')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all cursor-pointer whitespace-nowrap font-medium ${
                        selectedPlatformSlug === 'instagram'
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      <InstagramIcon className="w-3 h-3 text-[#E1306C]" />
                      <span>Instagram ({activeSelectedUser.platform_tasks?.instagram || 0})</span>
                    </button>

                    <button
                      onClick={() => setSelectedPlatformSlug('facebook')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all cursor-pointer whitespace-nowrap font-medium ${
                        selectedPlatformSlug === 'facebook'
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      <FacebookIcon className="w-3 h-3 text-[#1877F2]" />
                      <span>Facebook ({activeSelectedUser.platform_tasks?.facebook || 0})</span>
                    </button>

                    <button
                      onClick={() => setSelectedPlatformSlug('threads')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all cursor-pointer whitespace-nowrap font-medium ${
                        selectedPlatformSlug === 'threads'
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      <ThreadsIcon className="w-3 h-3 text-zinc-900" />
                      <span>Threads ({activeSelectedUser.platform_tasks?.threads || 0})</span>
                    </button>

                    <button
                      onClick={() => setSelectedPlatformSlug('whatsapp')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all cursor-pointer whitespace-nowrap font-medium ${
                        selectedPlatformSlug === 'whatsapp'
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                      <span>WhatsApp ({activeSelectedUser.platform_tasks?.whatsapp || 0})</span>
                    </button>
                  </div>
                </div>

                {/* Task List Table for this user */}
                <div className="border border-zinc-200 rounded-md overflow-hidden">
                  <div className="px-3 py-1.5 bg-zinc-100/60 border-b border-zinc-200 flex items-center justify-between text-xs font-semibold text-zinc-800">
                    <span>
                      Daftar Konten yang Sudah Dikerjakan oleh {activeSelectedUser.name} {selectedPlatformSlug !== 'all' ? `— ${selectedPlatformSlug.toUpperCase()}` : ''}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-normal">
                      {selectedUserTasks.length} entri ditemukan
                    </span>
                  </div>

                  {selectedUserTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500 bg-white">
                      {activeSelectedUser.total_tasks === 0 ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-rose-700">🔴 Anak magang ini sama sekali belum menginput task pada periode ini.</p>
                          <p className="text-[11px] text-zinc-400">Silakan hubungi atau ingatkan yang bersangkutan untuk menginput aktivitas media sosial hariannya.</p>
                        </div>
                      ) : (
                        <p>Tidak ada catatan untuk filter media sosial ini ({selectedPlatformSlug}).</p>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 text-zinc-600 font-semibold text-[11px] border-b border-zinc-200">
                            <th className="py-2 px-3">Tanggal</th>
                            <th className="py-2 px-3">Unit Usaha</th>
                            <th className="py-2 px-3">Saluran</th>
                            <th className="py-2 px-3">Judul Konten</th>
                            <th className="py-2 px-3">Follow Up</th>
                            <th className="py-2 px-3 text-center">Bukti SS</th>
                            <th className="py-2 px-3 text-right">Leads</th>
                            <th className="py-2 px-3 text-center">Tautan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {selectedUserTasks.map((t) => {
                            const bStyle = BRAND_COLORS[t.brand?.slug || ''] || { bg: 'bg-zinc-50', text: 'text-zinc-700', border: 'border-zinc-200' };
                            return (
                              <tr key={t.id} className="hover:bg-zinc-50/70">
                                <td className="py-2 px-3 whitespace-nowrap font-medium text-zinc-900 tabular-nums">
                                  {t.task_date}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}>
                                    {t.brand?.name}
                                  </span>
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    {getPlatformIcon(t.platform?.slug || '')}
                                    <span className="text-zinc-800 font-medium">{t.platform?.name}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 max-w-xs">
                                  <p className="font-semibold text-zinc-900 truncate">{t.title}</p>
                                </td>
                                <td className="py-2 px-3 max-w-xs">
                                  {t.follow_up || t.notes ? (
                                    <span className="text-zinc-700 text-xs truncate block">{t.follow_up || t.notes}</span>
                                  ) : (
                                    <span className="text-zinc-300">&mdash;</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                  {t.screenshot_url ? (
                                    <button
                                      onClick={() => {
                                        setViewScreenshotUrl(t.screenshot_url || null);
                                        setViewScreenshotTitle(`${t.brand?.name} - ${t.platform?.name}: ${t.title}`);
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-1.5 py-0.2 rounded cursor-pointer"
                                    >
                                      <Maximize2 className="w-2.5 h-2.5" />
                                      <span>Lihat SS</span>
                                    </button>
                                  ) : (
                                    <span className="text-zinc-300">&mdash;</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right font-black text-emerald-600 tabular-nums whitespace-nowrap">
                                  {t.leads_count}
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                  {t.link_url ? (
                                    <a
                                      href={t.link_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 inline-block p-1"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <span className="text-zinc-300">&mdash;</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* MAIN SPREADSHEET TABLE: PEMANTAUAN USER (GRID WITH STATUS IDENTIFIKASI) */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="px-4 py-2 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
              <span className="text-xs font-semibold text-zinc-900">
                Matriks Pemantauan Harian Seluruh Tim & Anak Magang
              </span>
              <span className="text-[11px] text-zinc-400">
                Klik tombol "Periksa Medsos" pada baris user untuk melihat detail tugasnya
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-zinc-200 min-w-[1100px]">
                <thead>
                  {/* Row 1: Section Headers */}
                  <tr className="bg-zinc-100 text-zinc-700 font-semibold text-[11px] border-b border-zinc-200 uppercase tracking-wider">
                    <th colSpan={3} className="py-2 px-3 border-r border-zinc-200 bg-zinc-100 text-zinc-800">
                      IDENTITAS USER / PIC
                    </th>
                    <th className="py-2 px-3 border-r border-zinc-200 text-center bg-amber-50 text-amber-900">
                      STATUS KINERJA HARIAN
                    </th>
                    <th colSpan={5} className="py-2 px-3 border-r border-zinc-200 text-center bg-blue-50/70 text-blue-900">
                      TASK PER UNIT USAHA
                    </th>
                    <th colSpan={4} className="py-2 px-3 border-r border-zinc-200 text-center bg-purple-50/70 text-purple-900">
                      TASK PER MEDIA SOSIAL
                    </th>
                    <th colSpan={2} className="py-2 px-3 text-center bg-emerald-50/70 text-emerald-900">
                      TOTAL
                    </th>
                    <th className="py-2 px-3 text-center bg-zinc-100 text-zinc-800">
                      AKSI
                    </th>
                  </tr>

                  {/* Row 2: Sub-headers */}
                  <tr className="bg-zinc-50/90 text-zinc-600 font-medium text-[11px] border-b border-zinc-200">
                    <th className="py-1.5 px-2 border-r border-zinc-200 text-center w-8 text-zinc-400 font-mono">#</th>
                    <th className="py-1.5 px-3 border-r border-zinc-200 min-w-[140px]">Nama User</th>
                    <th className="py-1.5 px-2 border-r border-zinc-200 text-center w-16">Role</th>

                    {/* STATUS IDENTIFIKASI UTAMA */}
                    <th className="py-1.5 px-3 border-r border-zinc-200 text-center min-w-[180px] bg-amber-50/40 font-bold">
                      Identifikasi Pengerjaan
                    </th>

                    {/* Brands */}
                    <th className="py-1.5 px-2 border-r border-zinc-200 text-right w-20">Medispro</th>
                    <th className="py-1.5 px-2 border-r border-zinc-200 text-right w-20">Pikago</th>
                    <th className="py-1.5 px-2 border-r border-zinc-200 text-right w-20">Eleventrent</th>
                    <th className="py-1.5 px-2 border-r border-zinc-200 text-right w-20">Kuuva</th>
                    <th className="py-1.5 px-2 border-r border-zinc-200 text-right w-20">Kumtura</th>

                    {/* Platforms */}
                    <th className="py-1.5 px-2 border-r border-zinc-200 text-right w-22 text-[#E1306C]">Instagram</th>
                    <th className="py-1.5 px-2 border-r border-zinc-200 text-right w-20 text-[#1877F2]">Facebook</th>
                    <th className="py-1.5 px-2 border-r border-zinc-200 text-right w-20 text-zinc-900">Threads</th>
                    <th className="py-1.5 px-2 border-r border-zinc-200 text-right w-20 text-[#25D366]">WhatsApp</th>

                    {/* Totals */}
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-right w-20 font-bold text-zinc-900">Tasks</th>
                    <th className="py-1.5 px-2.5 border-r border-zinc-200 text-right w-20 font-bold text-emerald-700">Leads</th>

                    <th className="py-1.5 px-2.5 text-center w-28">Pemeriksaan</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-200 bg-white">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-8 text-center text-zinc-400">
                        Tidak ada pengguna yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => {
                      const isZero = u.total_tasks === 0;
                      const isTop = u.total_tasks === userPerformanceMap.maxTasks && userPerformanceMap.maxTasks > 0;
                      const isSelected = selectedUserId === u.user_id;

                      return (
                        <tr 
                          key={u.user_id} 
                          className={`transition-colors ${
                            isSelected 
                              ? 'bg-blue-50/60 ring-1 ring-blue-300' 
                              : isZero 
                                ? 'bg-rose-50/20 hover:bg-rose-50/40' 
                                : isTop 
                                  ? 'bg-emerald-50/20 hover:bg-emerald-50/40' 
                                  : 'hover:bg-zinc-50'
                          }`}
                        >
                          <td className="py-2.5 px-2 border-r border-zinc-200 text-center font-mono text-[11px] text-zinc-400">
                            {idx + 1}
                          </td>

                          <td className="py-2.5 px-3 border-r border-zinc-200 whitespace-nowrap">
                            <span className="font-semibold text-zinc-900 block">{u.name}</span>
                            <span className="text-[11px] text-zinc-400 block">{u.email}</span>
                          </td>

                          <td className="py-2.5 px-2 border-r border-zinc-200 text-center whitespace-nowrap">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                              u.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {u.role}
                            </span>
                          </td>

                          {/* KOLOM STATUS KINERJA IDENTIFIKASI */}
                          <td className="py-2.5 px-3 border-r border-zinc-200 whitespace-nowrap">
                            {isZero ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Sama Sekali Tidak Mengerjakan</span>
                              </span>
                            ) : isTop ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <Trophy className="w-3 h-3 text-amber-600" />
                                <span>Paling Banyak Mengerjakan</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Aktif Mengerjakan</span>
                              </span>
                            )}
                          </td>

                          {/* Brand Task counts */}
                          <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums font-medium">
                            {u.brand_tasks?.medispro || <span className="text-zinc-300">0</span>}
                          </td>
                          <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums font-medium">
                            {u.brand_tasks?.pikago || <span className="text-zinc-300">0</span>}
                          </td>
                          <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums font-medium">
                            {u.brand_tasks?.eleventrent || <span className="text-zinc-300">0</span>}
                          </td>
                          <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums font-medium">
                            {u.brand_tasks?.kuuva || <span className="text-zinc-300">0</span>}
                          </td>
                          <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums font-medium">
                            {u.brand_tasks?.kumtura || <span className="text-zinc-300">0</span>}
                          </td>

                          {/* Platform Task counts */}
                          <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums font-semibold text-[#E1306C]">
                            {u.platform_tasks?.instagram || <span className="text-zinc-300 font-normal">0</span>}
                          </td>
                          <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums font-semibold text-[#1877F2]">
                            {u.platform_tasks?.facebook || <span className="text-zinc-300 font-normal">0</span>}
                          </td>
                          <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums font-semibold text-zinc-900">
                            {u.platform_tasks?.threads || <span className="text-zinc-300 font-normal">0</span>}
                          </td>
                          <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums font-semibold text-[#25D366]">
                            {u.platform_tasks?.whatsapp || <span className="text-zinc-300 font-normal">0</span>}
                          </td>

                          {/* Productivity Totals */}
                          <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right font-black text-zinc-900 tabular-nums">
                            {u.total_tasks}
                          </td>
                          <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right font-black text-emerald-600 tabular-nums">
                            {u.total_leads}
                          </td>

                          {/* Action Button: Periksa Detail & Medsos */}
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedUserId(u.user_id);
                                setSelectedPlatformSlug('all');
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              <span>Periksa Medsos</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Google Sheet Formula Total Summary Row: =SUM(...) */}
                <tfoot>
                  <tr className="bg-zinc-100 font-bold text-zinc-900 border-t-2 border-zinc-300">
                    <td className="py-2.5 px-2 border-r border-zinc-200 text-center font-mono text-[10px] text-emerald-800 bg-emerald-100">
                      Σ
                    </td>
                    <td className="py-2.5 px-3 border-r border-zinc-200 font-mono text-[11px] text-zinc-700">
                      =SUM(Total Seluruh Tim)
                    </td>
                    <td className="py-2.5 px-2 border-r border-zinc-200 text-center text-zinc-400">&mdash;</td>
                    <td className="py-2.5 px-3 border-r border-zinc-200 text-center text-[11px] text-zinc-500">
                      {((analytics?.user_monitoring?.length || 0) - userPerformanceMap.inactiveUsers.length)} Aktif &middot; {userPerformanceMap.inactiveUsers.length} Tidak Aktif
                    </td>

                    {/* Brands Sum */}
                    <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums">{userMonitoringSums.medispro}</td>
                    <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums">{userMonitoringSums.pikago}</td>
                    <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums">{userMonitoringSums.eleventrent}</td>
                    <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums">{userMonitoringSums.kuuva}</td>
                    <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums">{userMonitoringSums.kumtura}</td>

                    {/* Platforms Sum */}
                    <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums text-[#E1306C]">{userMonitoringSums.instagram}</td>
                    <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums text-[#1877F2]">{userMonitoringSums.facebook}</td>
                    <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums text-zinc-900">{userMonitoringSums.threads}</td>
                    <td className="py-2.5 px-2 border-r border-zinc-200 text-right tabular-nums text-[#25D366]">{userMonitoringSums.whatsapp}</td>

                    {/* Grand Totals */}
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right font-black text-blue-700 tabular-nums bg-blue-50/50">
                      {userMonitoringSums.total_tasks}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-zinc-200 text-right font-black text-emerald-700 tabular-nums bg-emerald-100/60">
                      {userMonitoringSums.total_leads}
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-zinc-400">&mdash;</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SHEET 2: TRACKING PER MASING-MASING MEDIA SOSIAL DI MASING-MASING UNIT */}
      {/* ========================================================================= */}
      {activeSheet === 'unit_tracking' && (
        <div className="space-y-4">
          
          {/* SPREADSHEET TABLE: 5 UNIT USAHA X 4 MEDIA SOSIAL */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50/70">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                  Tabel Tracking Media Sosial per Unit Usaha
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Perolehan leads dan jumlah konten yang dikerjakan pada tiap platform
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-zinc-200 min-w-[850px]">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 font-semibold text-[11px] border-b border-zinc-200">
                    <th className="py-2.5 px-3 border-r border-zinc-200">Unit Usaha</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 text-right">
                      <span className="flex items-center justify-end gap-1 text-[#E1306C]">
                        <InstagramIcon className="w-3 h-3" />
                        <span>Instagram (Leads &middot; Task)</span>
                      </span>
                    </th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 text-right">
                      <span className="flex items-center justify-end gap-1 text-[#1877F2]">
                        <FacebookIcon className="w-3 h-3" />
                        <span>Facebook (Leads &middot; Task)</span>
                      </span>
                    </th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 text-right">
                      <span className="flex items-center justify-end gap-1 text-zinc-900">
                        <ThreadsIcon className="w-3 h-3" />
                        <span>Threads (Leads &middot; Task)</span>
                      </span>
                    </th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 text-right">
                      <span className="flex items-center justify-end gap-1 text-[#25D366]">
                        <WhatsAppIcon className="w-3 h-3" />
                        <span>WhatsApp (Leads &middot; Task)</span>
                      </span>
                    </th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 text-right font-bold text-zinc-900 bg-zinc-50">
                      Total Leads
                    </th>
                    <th className="py-2.5 px-3 text-left font-semibold text-zinc-800">
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
                          <span className="font-bold text-zinc-900">{ig}</span> leads &middot; <span className="text-zinc-500 font-normal">{b.instagram_tasks || 0} task</span>
                        </td>

                        {/* Facebook Cell */}
                        <td className={`py-2.5 px-3 border-r border-zinc-200 text-right tabular-nums ${
                          fb === maxVal && fb > 0 ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-zinc-700'
                        }`}>
                          <span className="font-bold text-zinc-900">{fb}</span> leads &middot; <span className="text-zinc-500 font-normal">{b.facebook_tasks || 0} task</span>
                        </td>

                        {/* Threads Cell */}
                        <td className={`py-2.5 px-3 border-r border-zinc-200 text-right tabular-nums ${
                          th === maxVal && th > 0 ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-zinc-700'
                        }`}>
                          <span className="font-bold text-zinc-900">{th}</span> leads &middot; <span className="text-zinc-500 font-normal">{b.threads_tasks || 0} task</span>
                        </td>

                        {/* WhatsApp Cell */}
                        <td className={`py-2.5 px-3 border-r border-zinc-200 text-right tabular-nums ${
                          wa === maxVal && wa > 0 ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-zinc-700'
                        }`}>
                          <span className="font-bold text-zinc-900">{wa}</span> leads &middot; <span className="text-zinc-500 font-normal">{b.whatsapp_tasks || 0} task</span>
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

          {/* DIAGRAM KOMPARASI SALURAN PER UNIT USAHA (GROUPED BAR CHART) */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Diagram Komparasi Saluran per Unit Usaha</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Visualisasi perolehan media sosial di Medispro, Pikago, Eleventrent, Kuuva, dan Kumtura
                </p>
              </div>

              <div className="inline-flex rounded-md border border-zinc-200 p-0.5 bg-zinc-50 text-xs">
                <button
                  onClick={() => setChartMetric('leads')}
                  className={`px-3 py-1 font-medium rounded transition-all cursor-pointer ${
                    chartMetric === 'leads'
                      ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Berdasarkan Leads
                </button>
                <button
                  onClick={() => setChartMetric('tasks')}
                  className={`px-3 py-1 font-medium rounded transition-all cursor-pointer ${
                    chartMetric === 'tasks'
                      ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Berdasarkan Jumlah Task
                </button>
              </div>
            </div>

            <div className="h-72 w-full pt-1">
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
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      fontSize: '12px' 
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} ${chartMetric === 'leads' ? 'Leads' : 'Konten/Task'}`,
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Instagram" name="Instagram" fill="#E1306C" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Facebook" name="Facebook" fill="#1877F2" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Threads" name="Threads" fill="#111827" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="WhatsApp" name="WhatsApp" fill="#25D366" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

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
