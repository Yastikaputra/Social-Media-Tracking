'use client';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useZoom } from '@/context/ZoomContext';
import { api } from '@/lib/api';
import { Brand, Platform, TrackingTask, PlatformStat } from '@/types';
import { 
  ExternalLink, 
  Maximize2, 
  Edit2, 
  Trash2, 
  Check, 
  ArrowLeft,
  Search,
  Upload,
  X,
  AlertCircle,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, ThreadsIcon, WhatsAppIcon } from '@/components/SocialIcons';
import ScreenshotModal from '@/components/ScreenshotModal';
import Link from 'next/link';

const BRAND_TABS = [
  { name: 'Medispro', slug: 'medispro', color: '#0284c7' },
  { name: 'Pikago', slug: 'pikago', color: '#d97706' },
  { name: 'Eleventrent', slug: 'eleventrent', color: '#7c3aed' },
  { name: 'Kuuva', slug: 'kuuva', color: '#059669' },
  { name: 'Kumtura', slug: 'kumtura', color: '#dc2626' },
];

function BrandDetailContent() {
  const params = useParams();
  const slug = (params?.slug as string) || 'medispro';
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { isFullWidth } = useZoom();
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [brand, setBrand] = useState<Brand | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [allTasks, setAllTasks] = useState<TrackingTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Active channel sub-tab: 'instagram' | 'facebook' | 'threads' | 'whatsapp' | 'all'
  const [activePlatformSlug, setActivePlatformSlug] = useState<string>('instagram');
  const [searchQuery, setSearchQuery] = useState('');

  // === State Form Catatan Tracking ===
  const [picName, setPicName] = useState('');
  const [title, setTitle] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [taskDate, setTaskDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leadsCount, setLeadsCount] = useState<number>(0);
  const [linkUrl, setLinkUrl] = useState('');
  const [contentType, setContentType] = useState('Post/Content');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Screenshot Preview
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);
  const [viewScreenshotTitle, setViewScreenshotTitle] = useState<string>('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (slug) {
        loadBrandData();
        if (!picName && user?.name) {
          setPicName(user.name);
        }
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
        api.getTasks({ brand_slug: slug }),
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

  const getPlatformIcon = (platformSlug: string, className = "w-3.5 h-3.5") => {
    switch (platformSlug) {
      case 'instagram':
        return <InstagramIcon className={`${className} text-[#E1306C]`} />;
      case 'facebook':
        return <FacebookIcon className={`${className} text-[#1877F2]`} />;
      case 'threads':
        return <ThreadsIcon className={`${className} text-[#111827]`} />;
      case 'whatsapp':
        return <WhatsAppIcon className={`${className} text-[#25D366]`} />;
      default:
        return <Sparkles className={`${className} text-blue-500`} />;
    }
  };

  const currentPlatform = useMemo(() => {
    if (activePlatformSlug === 'all') {
      return platforms.find((p) => p.slug === 'instagram') || platforms[0];
    }
    return platforms.find((p) => p.slug === activePlatformSlug) || platforms[0];
  }, [platforms, activePlatformSlug]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Harap unggah format gambar (PNG, JPG, JPEG).');
        return;
      }
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setFormError(null);
    }
  };

  const handleRemoveFile = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setTitle('');
    setFollowUp('');
    setTaskDate(new Date().toISOString().split('T')[0]);
    setLeadsCount(0);
    setLinkUrl('');
    setContentType('Post/Content');
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setEditingTaskId(null);
    setFormError(null);
    setFormSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand) {
      setFormError('Data unit bisnis tidak ditemukan.');
      return;
    }

    if (!title.trim()) {
      setFormError('Judul konten / aktivitas wajib diisi.');
      return;
    }

    if (!picName.trim()) {
      setFormError('Nama PIC pengisi wajib diisi.');
      return;
    }

    const targetPlatformId = currentPlatform?.id;
    if (!targetPlatformId) {
      setFormError('Platform sosial media belum terpilih.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const formData = new FormData();
      formData.append('brand_id', String(brand.id));
      formData.append('platform_id', String(targetPlatformId));
      formData.append('pic_name', picName.trim());
      formData.append('task_date', taskDate);
      formData.append('title', title.trim());
      formData.append('content_type', contentType);
      formData.append('leads_count', String(leadsCount || 0));
      if (linkUrl.trim()) formData.append('link_url', linkUrl.trim());
      if (followUp.trim()) {
        formData.append('follow_up', followUp.trim());
        formData.append('notes', followUp.trim());
      }
      formData.append('status', 'completed');

      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }

      if (editingTaskId) {
        await api.updateTask(editingTaskId, formData);
        setFormSuccess('Catatan berhasil diperbarui.');
      } else {
        await api.createTask(formData);
        setFormSuccess(`Catatan ${currentPlatform?.name || ''} tersimpan.`);
      }

      await loadBrandData();
      resetForm();

      setTimeout(() => {
        setFormSuccess(null);
      }, 3500);
    } catch (err: any) {
      if (err?.status === 401 || err?.message === 'Unauthenticated.' || err?.isAuthError) {
        router.push('/login');
        return;
      }
      console.error('Error saving tracking:', err);
      setFormError(err?.data?.message || err?.message || 'Gagal menyimpan catatan tracking.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTask = (task: TrackingTask) => {
    setEditingTaskId(task.id);
    setTitle(task.title || '');
    setPicName(task.pic_name || task.user?.name || user?.name || '');
    setFollowUp(task.follow_up || task.notes || '');
    setTaskDate(task.task_date);
    setLeadsCount(task.leads_count || 0);
    setLinkUrl(task.link_url || '');
    setContentType(task.content_type || 'Post/Content');
    setScreenshotPreview(task.screenshot_url || null);
    setScreenshotFile(null);
    setFormError(null);
    setFormSuccess(null);

    if (task.platform?.slug) {
      setActivePlatformSlug(task.platform.slug);
    }

    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('Hapus catatan tracking ini?')) {
      try {
        await api.deleteTask(id);
        if (editingTaskId === id) {
          resetForm();
        }
        await loadBrandData();
      } catch (err: any) {
        if (err?.status === 401 || err?.message === 'Unauthenticated.' || err?.isAuthError) {
          router.push('/login');
          return;
        }
        console.error('Failed to delete task:', err);
        alert('Gagal menghapus tracking.');
      }
    }
  };

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const matchPlatform = activePlatformSlug === 'all' || task.platform?.slug === activePlatformSlug;
      const matchSearch = !searchQuery.trim() || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.pic_name && task.pic_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.follow_up && task.follow_up.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.notes && task.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchPlatform && matchSearch;
    });
  }, [allTasks, activePlatformSlug, searchQuery]);

  if (loading && !brand) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const leadTarget = brand?.monthly_lead_target || 100;
  const leadTotal = brand?.total_leads || 0;
  const leadPct = Math.round((leadTotal / leadTarget) * 100);
  const reachTotal = brand?.total_reach || 0;

  return (
    <div className={`${isFullWidth ? 'w-full max-w-[2000px]' : 'max-w-6xl'} mx-auto px-4 sm:px-6 py-6 space-y-6 transition-all duration-300`}>
      
      {/* ========================================================================= */}
      {/* 1. HEADER: BRAND TITLE & TASTEFUL COLOR INLINE METRICS                    */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-zinc-200 pb-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <div className="flex items-center gap-2">
              <span 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: brand?.color || '#0284c7' }} 
              />
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                {brand?.name}
              </h1>
            </div>
            <p className="text-xs text-zinc-500 tabular-nums">
              Target {leadTarget} leads &middot; <span className="text-emerald-600 font-semibold">{leadTotal} tercapai ({leadPct}%)</span> &middot; <span className="text-blue-600 font-medium">{reachTotal.toLocaleString('id-ID')} jangkauan</span>
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ringkasan Dashboard</span>
            </Link>
          )}
        </div>

        {/* Brand Underline Tabs with subtle brand color accent */}
        <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Brand Tabs">
          {BRAND_TABS.map((b) => {
            const isSelected = slug === b.slug;
            return (
              <button
                key={b.slug}
                onClick={() => {
                  if (slug !== b.slug) {
                    resetForm();
                    router.push(`/brands/${b.slug}`);
                  }
                }}
                className={`text-xs whitespace-nowrap pb-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
                }`}
                style={{
                  borderBottomColor: isSelected ? b.color : undefined,
                  color: isSelected ? '#09090b' : undefined,
                }}
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: b.color }} 
                />
                <span>{b.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 2. PLATFORM SELECTOR (With authentic platform colors)                     */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {platforms.map((p) => {
          const isSelected = activePlatformSlug === p.slug;
          const stat = platformStats.find((s) => s.platform_id === p.id);
          
          return (
            <button
              key={p.slug}
              onClick={() => {
                setActivePlatformSlug(p.slug);
                setFormError(null);
                setFormSuccess(null);
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all whitespace-nowrap border cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 text-white font-medium border-zinc-900 shadow-2xs'
                  : 'bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 border-zinc-200'
              }`}
            >
              {getPlatformIcon(p.slug, "w-3.5 h-3.5")}
              <span>{p.name}</span>
              <span className={`text-[11px] tabular-nums font-medium ${
                isSelected ? 'text-zinc-300' : 'text-emerald-600 font-semibold'
              }`}>
                {stat?.total_leads || 0}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setActivePlatformSlug('all')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all whitespace-nowrap border cursor-pointer ${
            activePlatformSlug === 'all'
              ? 'bg-zinc-900 text-white font-medium border-zinc-900 shadow-2xs'
              : 'bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Semua Saluran</span>
          <span className={`text-[11px] tabular-nums font-medium ${
            activePlatformSlug === 'all' ? 'text-zinc-300' : 'text-zinc-500'
          }`}>
            {allTasks.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. INLINE FORM: PRACTICAL, WITH TASTEFUL COLOR ACCENTS                    */}
      {/* ========================================================================= */}
      <div 
        ref={formRef}
        className={`border rounded-lg bg-white transition-colors overflow-hidden ${
          editingTaskId ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-zinc-200'
        }`}
      >
        <div className="px-4 sm:px-5 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/40">
          <div className="flex items-center gap-2">
            {getPlatformIcon(currentPlatform?.slug || '', "w-4 h-4")}
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
              {editingTaskId ? `Edit Catatan #${editingTaskId}` : `Catat Aktivitas — ${currentPlatform?.name}`}
            </h2>
            <span className="text-[11px] font-medium text-blue-600">&middot; {brand?.name}</span>
          </div>

          {editingTaskId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-amber-700 hover:text-amber-900 font-medium underline cursor-pointer"
            >
              Batal Edit
            </button>
          )}
        </div>

        {formSuccess && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        {formError && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitForm} className="p-4 sm:p-5 space-y-3.5">
          {/* Row 1: PIC & Judul */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                Nama PIC / Pengisi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Nama staf pengisi"
                className="w-full border border-zinc-300 rounded-md px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                Judul Konten / Aktivitas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Topik postingan atau aktivitas promosi"
                className="w-full border border-zinc-300 rounded-md px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 bg-white"
              />
            </div>
          </div>

          {/* Row 2: Bukti Screenshot */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-700 mb-1">
              Bukti Screenshot
            </label>
            <div className="border border-zinc-200 rounded-md p-2.5 bg-zinc-50/50">
              {screenshotPreview ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshotPreview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded border border-zinc-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-900 truncate">
                      {screenshotFile ? screenshotFile.name : 'Bukti tersimpan'}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {screenshotFile ? `${(screenshotFile.size / 1024).toFixed(0)} KB` : 'Foto bukti terlampir'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
                    >
                      Ganti Foto
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-xs text-red-600 hover:text-red-800 font-medium underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-between py-1 px-1 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Upload className="w-3.5 h-3.5 text-blue-600 group-hover:text-blue-700" />
                    <span>Pilih gambar bukti screenshot (PNG, JPG maks 10MB)</span>
                  </div>
                  <span className="text-[11px] font-medium text-blue-700 border border-blue-200 rounded px-2 py-0.5 bg-blue-50/50 group-hover:bg-blue-100/60">
                    Pilih Berkas
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Row 3: Kolom Follow Up */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-700 mb-1 flex items-center justify-between">
              <span>Catatan Follow Up Leads</span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                Penting untuk Evaluasi
              </span>
            </label>
            <textarea
              rows={2}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Tuliskan catatan tindak lanjut, respon chat WA/DM, status prospek, atau kendala..."
              className="w-full border border-zinc-300 rounded-md px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 bg-white"
            />
          </div>

          {/* Row 4: Detail Tambahan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:outline-hidden focus:border-blue-600 bg-white tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">Leads Masuk</label>
              <input
                type="number"
                min="0"
                value={leadsCount}
                onChange={(e) => setLeadsCount(Number(e.target.value) || 0)}
                className="w-full border border-zinc-300 rounded-md px-2.5 py-1 text-xs text-emerald-700 font-semibold focus:outline-hidden focus:border-blue-600 bg-white tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">Format Konten</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-2 py-1 text-xs text-zinc-900 focus:outline-hidden focus:border-blue-600 bg-white"
              >
                <option value="Post/Content">Post / Feed</option>
                <option value="Reels">Reels / Video</option>
                <option value="Story">Story</option>
                <option value="Broadcast">Broadcast / WA</option>
                <option value="Ads">Ads / Iklan</option>
                <option value="Direct Message">Direct Message</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">Link URL (Opsional)</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-zinc-300 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:outline-hidden focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          {/* Row 5: Action Buttons */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-zinc-500 hover:text-zinc-800 cursor-pointer"
            >
              Reset Form
            </button>

            <button
              type="submit"
              disabled={formLoading}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
                editingTaskId 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {formLoading ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {editingTaskId ? 'Simpan Perubahan' : `Simpan Catatan ${currentPlatform?.name || ''}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABLE: HIGH DENSITY, CLEAR FOLLOW UP & COLORS                          */}
      {/* ========================================================================= */}
      <div className="border border-zinc-200 rounded-md bg-white overflow-hidden shadow-2xs">
        {/* Table Toolbar */}
        <div className="px-4 py-2.5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-900">
              Daftar Catatan Tracking
            </span>
            <span className="text-xs text-zinc-400 tabular-nums">
              &middot; {filteredTasks.length} entri
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari konten, PIC, follow up..."
              className="w-full sm:w-56 pl-7 pr-2.5 py-1 text-xs border border-zinc-300 rounded-md focus:outline-hidden focus:border-blue-600 bg-white text-zinc-900 placeholder:text-zinc-400"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Data Table */}
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Tidak ada catatan tracking untuk filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold bg-zinc-50/75">
                  <th className="py-2.5 px-3.5 w-32">Tanggal & PIC</th>
                  <th className="py-2.5 px-3.5 w-28">Saluran</th>
                  <th className="py-2.5 px-3.5 min-w-[180px]">Judul Konten</th>
                  <th className="py-2.5 px-3.5 w-24 text-center">Bukti SS</th>
                  <th className="py-2.5 px-3.5 min-w-[240px]">Follow Up</th>
                  <th className="py-2.5 px-3.5 w-16 text-right">Leads</th>
                  <th className="py-2.5 px-3.5 w-12 text-center">Tautan</th>
                  <th className="py-2.5 px-3.5 w-16 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-50/60 transition-colors">
                    {/* Tanggal & PIC */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="font-medium text-zinc-900 tabular-nums block">
                        {task.task_date}
                      </span>
                      <span className="text-[11px] text-blue-700 font-medium block">
                        {task.pic_name || task.user?.name || 'Staf'}
                      </span>
                    </td>

                    {/* Platform */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getPlatformIcon(task.platform?.slug || '')}
                        <span className="font-medium text-zinc-900">{task.platform?.name}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        {task.content_type}
                      </span>
                    </td>

                    {/* Judul Konten */}
                    <td className="py-2.5 px-3.5">
                      <p className="font-medium text-zinc-900 line-clamp-2 leading-snug">
                        {task.title}
                      </p>
                    </td>

                    {/* Bukti SS */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      {task.screenshot_url ? (
                        <button
                          type="button"
                          onClick={() => {
                            setViewScreenshotUrl(task.screenshot_url || null);
                            setViewScreenshotTitle(`${task.brand?.name} - ${task.platform?.name}: ${task.title}`);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50/80 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Lihat SS</span>
                        </button>
                      ) : (
                        <span className="text-zinc-300">&mdash;</span>
                      )}
                    </td>

                    {/* Follow Up */}
                    <td className="py-2.5 px-3.5">
                      {task.follow_up || task.notes ? (
                        <div className="border-l-2 border-emerald-500 pl-2 text-xs text-zinc-700 leading-relaxed line-clamp-2 hover:line-clamp-none">
                          {task.follow_up || task.notes}
                        </div>
                      ) : (
                        <span className="text-zinc-300 text-[11px]">&mdash;</span>
                      )}
                    </td>

                    {/* Leads */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <span className="font-bold text-emerald-600 tabular-nums">
                        {task.leads_count}
                      </span>
                    </td>

                    {/* Tautan */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
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

                    {/* Aksi */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditTask(task)}
                          className="p-1 text-zinc-400 hover:text-blue-600 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

export default function BrandDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BrandDetailContent />
    </Suspense>
  );
}
