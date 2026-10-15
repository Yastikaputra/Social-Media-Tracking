'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useZoom } from '@/context/ZoomContext';
import { api } from '@/lib/api';
import { Brand, Platform, TrackingTask, PlatformStat } from '@/types';
import { 
  Plus, 
  ExternalLink, 
  Maximize2, 
  Calendar, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
  Search
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, ThreadsIcon, WhatsAppIcon } from '@/components/SocialIcons';
import TaskModal from '@/components/TaskModal';
import ScreenshotModal from '@/components/ScreenshotModal';
import Link from 'next/link';

function BrandDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isFullWidth } = useZoom();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [allTasks, setAllTasks] = useState<TrackingTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Active channel sub-tab: 'all' | 'instagram' | 'facebook' | 'threads' | 'whatsapp'
  const [activePlatformSlug, setActivePlatformSlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TrackingTask | null>(null);
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);
  const [viewScreenshotTitle, setViewScreenshotTitle] = useState<string>('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (slug) {
        loadBrandData();
      }
    }
  }, [user, authLoading, slug, router]);

  const loadBrandData = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [brandRes, allBrandsRes, allPlatformsRes, tasksRes] = await Promise.all([
        api.getBrand(slug),
        api.getBrands(),
        api.getPlatforms(),
        api.getTasks({
          brand_slug: slug,
        }),
      ]);

      setBrand(brandRes.brand);
      setPlatformStats(brandRes.platform_stats || []);
      setBrands(allBrandsRes.brands || []);
      setPlatforms(allPlatformsRes.platforms || []);
      setAllTasks(tasksRes.data || []);
    } catch (err: any) {
      if (err?.status === 401 || err?.message === 'Unauthenticated.' || err?.isAuthError) {
        router.push('/login');
        return;
      }
      console.error('Error fetching brand data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Instant 0ms filtering when switching platforms or searching
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const matchPlatform = activePlatformSlug === 'all' || task.platform?.slug === activePlatformSlug;
      const matchSearch = !searchQuery.trim() || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.notes && task.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchPlatform && matchSearch;
    });
  }, [allTasks, activePlatformSlug, searchQuery]);

  const handleDeleteTask = async (id: number) => {
    if (confirm('Yakin ingin menghapus catatan tracking ini?')) {
      try {
        await api.deleteTask(id);
        loadBrandData();
      } catch (err) {
        console.error('Failed to delete task:', err);
        alert('Gagal menghapus tracking.');
      }
    }
  };

  const getPlatformIcon = (platformSlug: string) => {
    switch (platformSlug) {
      case 'instagram':
        return <InstagramIcon className="w-4 h-4 text-[#E1306C]" />;
      case 'facebook':
        return <FacebookIcon className="w-4 h-4 text-[#1877F2]" />;
      case 'threads':
        return <ThreadsIcon className="w-4 h-4 text-black" />;
      case 'whatsapp':
        return <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading && !brand) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedPlatformObj = platforms.find((p) => p.slug === activePlatformSlug);

  return (
    <div className={`${isFullWidth ? 'w-full max-w-[2000px]' : 'max-w-7xl'} mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 transition-all duration-300`}>
      {/* Brand Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-gray-200 shadow-xs relative overflow-hidden">
        {/* Brand Accent Bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: brand?.color || '#3b82f6' }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 mb-3 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard Utama</span>
            </Link>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-4xl font-black text-gray-950 tracking-tight">{brand?.name}</h1>
              <span 
                className="text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border"
                style={{ 
                  backgroundColor: `${brand?.color || '#3b82f6'}15`, 
                  color: brand?.color || '#1e3a8a',
                  borderColor: `${brand?.color || '#3b82f6'}40` 
                }}
              >
                Unit Bisnis
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1 max-w-xl">
              {brand?.description || 'Pemantauan saluran media sosial resmi'}
            </p>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Catat Tracking</span>
            </button>
          </div>
        </div>

        {/* Brand Target Bar */}
        <div className="mt-6 pt-5 sm:pt-6 border-t border-gray-100 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gray-50/80 p-3 sm:p-3.5 rounded-2xl border border-gray-200/60">
            <span className="text-[11px] font-bold text-gray-500 block uppercase">Target Leads</span>
            <span className="text-lg sm:text-xl font-black text-gray-950 mt-0.5 block">{brand?.monthly_lead_target || 100} Leads</span>
          </div>
          <div className="bg-emerald-50/80 p-3 sm:p-3.5 rounded-2xl border border-emerald-200/60">
            <span className="text-[11px] font-bold text-emerald-700 block uppercase">Leads Tercapai</span>
            <span className="text-lg sm:text-xl font-black text-emerald-800 mt-0.5 block">{brand?.total_leads || 0} Leads</span>
          </div>
          <div className="bg-blue-50/80 p-3 sm:p-3.5 rounded-2xl border border-blue-200/60">
            <span className="text-[11px] font-bold text-blue-700 block uppercase">Pencapaian</span>
            <span className="text-lg sm:text-xl font-black text-blue-900 mt-0.5 block">
              {Math.round(((brand?.total_leads || 0) / (brand?.monthly_lead_target || 100)) * 100)}%
            </span>
          </div>
          <div className="bg-gray-50/80 p-3 sm:p-3.5 rounded-2xl border border-gray-200/60">
            <span className="text-[11px] font-bold text-gray-500 block uppercase">Total Reach</span>
            <span className="text-lg sm:text-xl font-black text-gray-950 mt-0.5 block">{brand?.total_reach?.toLocaleString('id-ID') || 0}</span>
          </div>
        </div>
      </div>

      {/* PLATFORM SUB-TABS (Instagram, Facebook, Threads, WhatsApp) - Instant Switch */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
          {/* All Channels Tab */}
          <button
            onClick={() => setActivePlatformSlug('all')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activePlatformSlug === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-700 hover:text-gray-950 hover:bg-gray-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Semua Media Sosial</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activePlatformSlug === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
            }`}>
              {allTasks.length}
            </span>
          </button>

          {/* 4 Social Media Platforms */}
          {platforms.map((p) => {
            const stat = platformStats.find((s) => s.platform_id === p.id);
            const isActive = activePlatformSlug === p.slug;
            return (
              <button
                key={p.slug}
                onClick={() => setActivePlatformSlug(p.slug)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-950 hover:bg-gray-100'
                }`}
              >
                {getPlatformIcon(p.slug)}
                <span>{p.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                }`}>
                  {stat?.total_leads || 0} leads
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {platformStats.map((stat) => (
          <div
            key={stat.platform_id}
            onClick={() => setActivePlatformSlug(stat.slug)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activePlatformSlug === stat.slug
                ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500'
                : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {getPlatformIcon(stat.slug)}
                <span className="text-xs font-bold text-gray-800">{stat.name}</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-gray-950">{stat.total_leads}</span>
              <span className="text-xs font-bold text-gray-500 ml-1">Leads</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500 font-medium">
              <span>{stat.total_tasks} Konten</span>
              <span>{stat.total_reach.toLocaleString('id-ID')} Reach</span>
            </div>
          </div>
        ))}
      </div>

      {/* TRACKING TASKS LIST & FORM TRIGGER */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Filter / Search Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-gray-950 flex items-center gap-2">
              <span>Daftar Catatan Tracking: {brand?.name}</span>
              {activePlatformSlug !== 'all' && (
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {platforms.find((p) => p.slug === activePlatformSlug)?.name}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Menampilkan {filteredTasks.length} data pemantauan
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari konten atau catatan..."
                className="w-full sm:w-56 pl-8 pr-3 py-2 text-xs font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
              />
            </div>
            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Tracking</span>
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-gray-800">Belum ada data tracking untuk filter ini</p>
            <p className="text-xs text-gray-500 mt-1">
              Catat link, bukti screenshot, dan metrik leads sekarang
            </p>
            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Tracking</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full min-w-[800px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold bg-gray-50/70">
                  <th className="py-3 px-4">Tanggal & PIC</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Judul Konten / Aktivitas</th>
                  <th className="py-3 px-4 text-center">Bukti SS</th>
                  <th className="py-3 px-4 text-right">Leads Masuk</th>
                  <th className="py-3 px-4 text-right">Reach</th>
                  <th className="py-3 px-4 text-right">Interaksi</th>
                  <th className="py-3 px-4 text-center">Link</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 block">{task.task_date}</span>
                      <span className="text-[10px] text-blue-700 font-semibold">
                        PIC: {task.pic_name || task.user?.name || 'Staff'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {getPlatformIcon(task.platform?.slug || '')}
                        <span className="font-bold text-gray-800">{task.platform?.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">{task.content_type}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-bold text-gray-950">{task.title}</p>
                      {task.notes && (
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{task.notes}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {task.screenshot_url ? (
                        <button
                          onClick={() => {
                            setViewScreenshotUrl(task.screenshot_url || null);
                            setViewScreenshotTitle(`${task.brand?.name} - ${task.platform?.name}: ${task.title}`);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Lihat SS</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px] font-medium">Tidak ada SS</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm">
                      {task.leads_count}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-700 font-semibold">
                      {task.reach_count.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-700 font-semibold">
                      {task.engagement_count.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {task.link_url ? (
                        <a
                          href={task.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title={task.link_url}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setTaskToEdit(task);
                          setIsTaskModalOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Catatan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSuccess={loadBrandData}
        brands={brands}
        platforms={platforms}
        defaultBrandId={brand?.id}
        defaultPlatformId={selectedPlatformObj?.id}
        lockBrand={true}
        taskToEdit={taskToEdit}
      />

      <ScreenshotModal
        isOpen={!!viewScreenshotUrl}
        onClose={() => setViewScreenshotUrl(null)}
        imageUrl={viewScreenshotUrl}
        title={viewScreenshotTitle}
      />
    </div>
  );
}

export default function BrandDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <BrandDetailContent />
    </Suspense>
  );
}
