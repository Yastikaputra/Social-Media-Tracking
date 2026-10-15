'use client';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
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
  Search,
  Upload,
  X,
  FileText,
  Check,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  User as UserIcon,
  Send,
  HelpCircle
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, ThreadsIcon, WhatsAppIcon } from '@/components/SocialIcons';
import ScreenshotModal from '@/components/ScreenshotModal';
import Link from 'next/link';

// Daftar Brand Utama sesuai spesifikasi
const BRAND_TABS = [
  { name: 'Medispro', slug: 'medispro', color: '#0284c7', badge: 'Alat Kesehatan' },
  { name: 'Pikago', slug: 'pikago', color: '#d97706', badge: 'Logistik & Ekspedisi' },
  { name: 'Eleventrent', slug: 'eleventrent', color: '#7c3aed', badge: 'Rental Transportasi' },
  { name: 'Kuuva', slug: 'kuuva', color: '#059669', badge: 'Fashion & Lifestyle' },
  { name: 'Kumtura', slug: 'kumtura', color: '#dc2626', badge: 'Holding Marketing' },
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
  // Default langsung ke 'instagram' sesuai alur form yang diminta
  const [activePlatformSlug, setActivePlatformSlug] = useState<string>('instagram');
  const [searchQuery, setSearchQuery] = useState('');

  // === State Inline Form Panjang (Tanpa Popup) ===
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

  // Load Brand Data
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (slug) {
        loadBrandData();
        // Set default PIC name from login user
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

  // Helper Icon Platform
  const getPlatformIcon = (platformSlug: string) => {
    switch (platformSlug) {
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

  // Resolusi platform aktif untuk form
  const currentPlatform = useMemo(() => {
    if (activePlatformSlug === 'all') {
      return platforms.find((p) => p.slug === 'instagram') || platforms[0];
    }
    return platforms.find((p) => p.slug === activePlatformSlug) || platforms[0];
  }, [platforms, activePlatformSlug]);

  // Handle upload bukti screenshot
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Harap upload berkas gambar (PNG, JPG, JPEG).');
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

  // Reset Form
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

  // Submit Form Panjang (Inline)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand) {
      setFormError('Data brand tidak ditemukan.');
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
        setFormSuccess('Catatan tracking berhasil diperbarui!');
      } else {
        await api.createTask(formData);
        setFormSuccess(`Catatan tracking ${currentPlatform?.name || ''} berhasil disimpan!`);
      }

      // Refresh data di tabel & card statistik
      await loadBrandData();

      // Reset form
      resetForm();

      // Hilangkan pesan sukses setelah 4 detik
      setTimeout(() => {
        setFormSuccess(null);
      }, 4000);
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

  // Edit Task Inline
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

    // Switch ke platform tugas tersebut
    if (task.platform?.slug) {
      setActivePlatformSlug(task.platform.slug);
    }

    // Scroll mulus ke form panjang di atas
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Hapus Task
  const handleDeleteTask = async (id: number) => {
    if (confirm('Yakin ingin menghapus catatan tracking ini?')) {
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

  // Instant filtering tasks
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`${isFullWidth ? 'w-full max-w-[2000px]' : 'max-w-7xl'} mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 transition-all duration-300`}>
      
      {/* ========================================================================= */}
      {/* 1. LEVEL 1: TAB BRAND (Medispro, Pikago, Eleventrent, Kuuva, Kumtura)     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between pb-2 px-2 border-b border-gray-100 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Pilih Unit Bisnis:
            </span>
            <span className="text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
              {brand?.name}
            </span>
          </div>
          {isAdmin && (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Dashboard Diagram</span>
            </Link>
          )}
        </div>

        {/* Tab Buttons Brand */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-gray-900 text-white shadow-sm ring-2 ring-gray-900 ring-offset-1'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: b.color }} 
                />
                <span>{b.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {b.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LEVEL 2: TAB MEDIA SOSIAL (Instagram, Facebook, Threads, WhatsApp)     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between pb-2 px-2 border-b border-gray-100 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Pilih Saluran Media Sosial:
          </span>
          <span className="text-xs font-bold text-gray-700">
            Aktif: <strong className="text-blue-600">{currentPlatform?.name || 'Instagram'}</strong>
          </span>
        </div>

        <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
          {/* 4 Social Media Platforms Utama */}
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
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600 ring-offset-1'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {getPlatformIcon(p.slug)}
                <span>{p.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {stat?.total_leads || 0} Leads
                </span>
              </button>
            );
          })}

          {/* Tab Semua Media Sosial (untuk melihat semua data di tabel) */}
          <button
            onClick={() => setActivePlatformSlug('all')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activePlatformSlug === 'all'
                ? 'bg-gray-800 text-white shadow-sm ring-2 ring-gray-800 ring-offset-1'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Semua Media Sosial</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activePlatformSlug === 'all' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {allTasks.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LEVEL 3: FORM PANJANG INLINE (TANPA POPUP!)                            */}
      {/* ========================================================================= */}
      <div 
        ref={formRef}
        className={`bg-white rounded-3xl border transition-all duration-300 shadow-md ${
          editingTaskId ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-gray-200'
        } overflow-hidden`}
      >
        {/* Header Form */}
        <div className={`p-4 sm:p-5 border-b ${
          editingTaskId ? 'bg-amber-50/80 border-amber-200' : 'bg-gradient-to-r from-blue-50/60 via-slate-50 to-white border-gray-100'
        } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              editingTaskId ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
            }`}>
              {editingTaskId ? <Edit3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-gray-950">
                  {editingTaskId ? 'Edit Catatan Tracking' : `Form Input Tracking ${currentPlatform?.name || 'Media Sosial'}`}
                </h3>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  editingTaskId 
                    ? 'bg-amber-100 text-amber-800 border-amber-300' 
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                }`}>
                  {editingTaskId ? `ID #${editingTaskId}` : brand?.name}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {editingTaskId 
                  ? 'Perbarui data tracking dan catatan follow up di bawah ini' 
                  : `Form panjang langsung isi pada tab ${currentPlatform?.name || ''} tanpa jendela popup.`}
              </p>
            </div>
          </div>

          {editingTaskId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Batal Edit (Mode Tambah Baru)</span>
            </button>
          )}
        </div>

        {/* Notifikasi Sukses / Error */}
        {formSuccess && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        {formError && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Isi Form Panjang */}
        <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 space-y-4">
          {/* Baris 1: Nama PIC & Judul Konten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Nama PIC / Pengisi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="Contoh: Marketing Staff / Nama Anda"
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Judul Konten / Aktivitas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Promo Paket Treatment Weekend / Edukasi Alkes"
                className="w-full px-3 py-2.5 text-xs font-medium border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white text-gray-900"
              />
            </div>
          </div>

          {/* Baris 2: Kolom Bukti Screenshot */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Bukti Screenshot Postingan / Chat Leads
            </label>
            
            <div className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-4 transition-colors bg-gray-50/50">
              {screenshotPreview ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshotPreview}
                    alt="Preview Bukti"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-gray-200 shadow-xs"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs font-bold text-gray-900">
                      {screenshotFile ? screenshotFile.name : 'Bukti Screenshot Tersimpan'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {screenshotFile ? `${(screenshotFile.size / 1024).toFixed(1)} KB` : 'Foto bukti dari data tracking ini'}
                    </p>
                    <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer"
                      >
                        Ganti Foto
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 cursor-pointer"
                      >
                        Hapus Bukti
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center py-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-blue-600 mb-2 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    Klik untuk pilih berkas gambar bukti screenshot
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Mendukung format PNG, JPG, JPEG (Maksimal 10MB)
                  </p>
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

          {/* Baris 3: Kolom Follow Up */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
              <span>Kolom Follow Up (Respon Chat / Progres Leads)</span>
              <span className="text-[11px] text-gray-500 font-normal">Wajib dicatat untuk evaluasi tim</span>
            </label>
            <textarea
              rows={3}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Tuliskan catatan tindak lanjut follow up di sini, misal: '3 calon customer menanyakan pricelist paket, sudah dihubungi via WA dan dijadwalkan demo besok pagi...'"
              className="w-full px-3 py-2.5 text-xs font-medium border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white text-gray-900"
            />
          </div>

          {/* Baris 4: Field Pelengkap (Tanggal, Leads Masuk, Tipe Konten, Link Postingan) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Leads Masuk</label>
              <input
                type="number"
                min="0"
                value={leadsCount}
                onChange={(e) => setLeadsCount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 bg-white text-gray-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Format Konten</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
              >
                <option value="Post/Content">Post / Feed</option>
                <option value="Reels">Reels / Video</option>
                <option value="Story">Story</option>
                <option value="Broadcast">Broadcast / WA</option>
                <option value="Ads">Ads / Iklan Berbayar</option>
                <option value="Direct Message">Direct Message (DM)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Link Konten (Opsional)</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
              />
            </div>
          </div>

          {/* Baris 5: Tombol Simpan & Reset */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Kosongkan Form
            </button>

            <button
              type="submit"
              disabled={formLoading}
              className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer ${
                editingTaskId 
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              } disabled:opacity-50`}
            >
              {formLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {editingTaskId ? 'Perbarui Catatan Tracking' : `Simpan Catatan Tracking ${currentPlatform?.name || ''}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 4. LEVEL 4: TABEL DAFTAR CATATAN TRACKING DENGAN KOLOM FOLLOW UP          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Header Filter & Search */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-gray-950 flex items-center gap-2">
              <span>Daftar Catatan Tracking: {brand?.name}</span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {activePlatformSlug === 'all' ? 'Semua Media Sosial' : currentPlatform?.name}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Menampilkan {filteredTasks.length} data pemantauan
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari konten, PIC, atau follow up..."
              className="w-full sm:w-64 pl-8 pr-3 py-2 text-xs font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Tabel Data */}
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-800">Belum ada data tracking untuk tab ini</p>
            <p className="text-xs text-gray-500 mt-1">
              Gunakan form panjang di atas untuk langsung menambah catatan tracking
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full min-w-[900px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold bg-gray-50/70">
                  <th className="py-3 px-4">Tanggal & PIC</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Judul Konten</th>
                  <th className="py-3 px-4 text-center">Bukti SS</th>
                  <th className="py-3 px-4 min-w-[200px]">Kolom Follow Up</th>
                  <th className="py-3 px-4 text-right">Leads</th>
                  <th className="py-3 px-4 text-center">Link</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Tanggal & PIC */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900 block">{task.task_date}</span>
                      <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 inline-block mt-0.5">
                        PIC: {task.pic_name || task.user?.name || 'Staff'}
                      </span>
                    </td>

                    {/* Platform */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getPlatformIcon(task.platform?.slug || '')}
                        <span className="font-bold text-gray-800">{task.platform?.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                        {task.content_type}
                      </span>
                    </td>

                    {/* Judul Konten */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-gray-950 leading-snug">{task.title}</p>
                    </td>

                    {/* Bukti SS */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {task.screenshot_url ? (
                        <button
                          type="button"
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
                        <span className="text-gray-400 text-[11px] font-medium">-</span>
                      )}
                    </td>

                    {/* Kolom Follow Up */}
                    <td className="py-3.5 px-4 max-w-sm">
                      {task.follow_up || task.notes ? (
                        <div className="bg-emerald-50/80 border border-emerald-200/70 text-emerald-950 rounded-xl p-2 text-[11px] leading-relaxed">
                          <span className="font-bold text-emerald-800 block text-[10px] uppercase mb-0.5">
                            Follow Up:
                          </span>
                          {task.follow_up || task.notes}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px] italic">Belum ada follow up</span>
                      )}
                    </td>

                    {/* Leads Masuk */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-black text-emerald-600 text-sm">
                        {task.leads_count}
                      </span>
                    </td>

                    {/* Link */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
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

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleEditTask(task)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Catatan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <BrandDetailContent />
    </Suspense>
  );
}
