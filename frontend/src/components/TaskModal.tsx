'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Link2, CheckCircle2, Image as ImageIcon, Sparkles, User as UserIcon, Lock } from 'lucide-react';
import { Brand, Platform, TrackingTask } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { InstagramIcon, FacebookIcon, ThreadsIcon, WhatsAppIcon } from '@/components/SocialIcons';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  brands: Brand[];
  platforms: Platform[];
  defaultBrandId?: number;
  defaultPlatformId?: number;
  lockBrand?: boolean;
  taskToEdit?: TrackingTask | null;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSuccess,
  brands,
  platforms,
  defaultBrandId,
  defaultPlatformId,
  lockBrand = false,
  taskToEdit,
}: TaskModalProps) {
  const { user } = useAuth();

  const [brandId, setBrandId] = useState<number>(defaultBrandId || brands[0]?.id || 1);
  const [platformId, setPlatformId] = useState<number>(defaultPlatformId || platforms[0]?.id || 1);
  const [picName, setPicName] = useState<string>('');
  const [taskDate, setTaskDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('Post/Content');
  const [linkUrl, setLinkUrl] = useState('');
  const [leadsCount, setLeadsCount] = useState<number>(0);
  const [reachCount, setReachCount] = useState<number>(0);
  const [engagementCount, setEngagementCount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'completed' | 'in_progress'>('completed');

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setBrandId(taskToEdit.brand_id);
      setPlatformId(taskToEdit.platform_id);
      setPicName(taskToEdit.pic_name || taskToEdit.user?.name || user?.name || '');
      setTaskDate(taskToEdit.task_date);
      setTitle(taskToEdit.title);
      setContentType(taskToEdit.content_type || 'Post/Content');
      setLinkUrl(taskToEdit.link_url || '');
      setLeadsCount(taskToEdit.leads_count || 0);
      setReachCount(taskToEdit.reach_count || 0);
      setEngagementCount(taskToEdit.engagement_count || 0);
      setNotes(taskToEdit.notes || '');
      setStatus((taskToEdit.status as any) || 'completed');
      setPreviewUrl(taskToEdit.screenshot_url || null);
    } else {
      if (defaultBrandId) setBrandId(defaultBrandId);
      if (defaultPlatformId) setPlatformId(defaultPlatformId);
      setPicName(user?.name || '');
      setTaskDate(new Date().toISOString().split('T')[0]);
      setTitle('');
      setContentType('Post/Content');
      setLinkUrl('');
      setLeadsCount(0);
      setReachCount(0);
      setEngagementCount(0);
      setNotes('');
      setStatus('completed');
      setScreenshotFile(null);
      setPreviewUrl(null);
    }
    setError(null);
  }, [taskToEdit, defaultBrandId, defaultPlatformId, isOpen, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const getPlatformIcon = (slug: string, isSelected: boolean) => {
    switch (slug) {
      case 'instagram':
        return <InstagramIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#E1306C]'}`} />;
      case 'facebook':
        return <FacebookIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#1877F2]'}`} />;
      case 'threads':
        return <ThreadsIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-900'}`} />;
      case 'whatsapp':
        return <WhatsAppIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#25D366]'}`} />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const currentBrand = brands.find((b) => b.id === brandId) || brands.find((b) => b.id === defaultBrandId);
  const isBrandLocked = lockBrand || (Boolean(defaultBrandId) && !taskToEdit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!picName.trim()) {
      setError('Nama PIC / Petugas pelaksana wajib diisi.');
      return;
    }

    if (!title.trim()) {
      setError('Nama konten / aktivitas wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('brand_id', String(brandId));
      formData.append('platform_id', String(platformId));
      formData.append('pic_name', picName.trim());
      formData.append('task_date', taskDate);
      formData.append('title', title.trim());
      formData.append('content_type', contentType);
      if (linkUrl.trim()) formData.append('link_url', linkUrl.trim());
      formData.append('leads_count', String(leadsCount));
      formData.append('reach_count', String(reachCount));
      formData.append('engagement_count', String(engagementCount));
      if (notes.trim()) formData.append('notes', notes.trim());
      formData.append('status', status);

      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }

      if (taskToEdit) {
        await api.updateTask(taskToEdit.id, formData);
      } else {
        await api.createTask(formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving task:', err);
      setError(err?.data?.message || err?.message || 'Gagal menyimpan catatan tracking.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-4 sm:my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div>
            <h3 className="font-black text-gray-950 text-base sm:text-lg">
              {taskToEdit ? 'Edit Catatan Tracking' : 'Catat Tracking Media Sosial'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isBrandLocked && currentBrand ? (
                <span>Mencatat aktivitas tracking untuk brand <strong className="text-gray-900">{currentBrand.name}</strong></span>
              ) : (
                <span>Catat link konten, metrik leads, dan bukti screenshot pemantauan</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Brand Indicator / Selection */}
          {isBrandLocked && currentBrand ? (
            /* When inside a brand tab: Show locked badge, DO NOT show selector pills */
            <div className="flex items-center justify-between p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full ring-2 ring-white shadow-xs shrink-0"
                  style={{ backgroundColor: currentBrand.color || '#3b82f6' }}
                />
                <div>
                  <span className="text-[10px] font-bold text-blue-900/70 uppercase tracking-wider block">
                    Unit Brand Terpilih
                  </span>
                  <span className="text-sm font-black text-blue-950">
                    {currentBrand.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-white text-blue-700 border border-blue-200 shadow-2xs">
                <Lock className="w-3 h-3 text-blue-600" />
                <span>Terkunci di Tab Brand Ini</span>
              </div>
            </div>
          ) : (
            /* When on general dashboard: Show brand selector pills */
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-2">
                Pilih Unit Brand <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {brands.map((b) => {
                  const isSelected = brandId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBrandId(b.id)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center truncate ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Social Media Platform Selection (Saluran Media Sosial Yang Dipilih) */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-2">
              Pilih Saluran Media Sosial <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {platforms.map((p) => {
                const isSelected = platformId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatformId(p.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                        : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200 shadow-2xs'
                    }`}
                  >
                    {getPlatformIcon(p.slug, isSelected)}
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nama PIC & Nama Konten/Aktivitas (Wajib Isi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nama PIC / Petugas <span className="text-red-500">*</span></span>
                </span>
                <span className="text-[10px] text-red-500 font-semibold">Wajib isi</span>
              </label>
              <input
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Nama penanggung jawab tracking..."
                className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                <span>Nama Konten / Aktivitas <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-red-500 font-semibold">Wajib isi</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Reels Promo Diskon 30% / Broadcast WA"
                className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900 placeholder-gray-400"
                required
              />
            </div>
          </div>

          {/* Date & Content Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Tanggal Eksekusi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Tipe Konten
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
              >
                <option value="Reels">Reels / Video Pendek</option>
                <option value="Feed">Feed / Foto & Carousel</option>
                <option value="Story">Story / Status</option>
                <option value="Broadcast">Broadcast / Pesan Massal</option>
                <option value="Direct Message">Direct Message / Follow-up</option>
                <option value="Ads">Meta Ads / Iklan Berbayar</option>
                <option value="Post/Content">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Link URL (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Link Tracking / URL Konten (Opsional)</span>
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://instagram.com/reel/... atau https://wa.me/..."
              className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Key Metrics: Leads (Paling Kena), Reach, Engagement */}
          <div className="p-4 sm:p-5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
            <p className="text-xs font-black text-blue-950 uppercase tracking-wide">
              📊 Metrik Pemantauan & Pencapaian
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1">
                  🎯 Leads Masuk (Chat/Form)
                </label>
                <input
                  type="number"
                  min="0"
                  value={leadsCount}
                  onChange={(e) => setLeadsCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 text-sm font-black text-emerald-700 bg-white border border-emerald-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] font-bold text-emerald-700">Paling dihitung</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  👁️ Reach / Views
                </label>
                <input
                  type="number"
                  min="0"
                  value={reachCount}
                  onChange={(e) => setReachCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 text-sm font-bold bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[10px] text-gray-500">Jangkauan akun</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  💬 Interaksi
                </label>
                <input
                  type="number"
                  min="0"
                  value={engagementCount}
                  onChange={(e) => setEngagementCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 text-sm font-bold bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[10px] text-gray-500">Respon audiens</span>
              </div>
            </div>
          </div>

          {/* Screenshot Upload (SS Pemantauan IG / WA / Insight) */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              <span>Upload Screenshot Bukti Pemantauan (SS Insight / Chat)</span>
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <label className="flex-1 flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-2xl cursor-pointer transition-colors bg-gray-50/50">
                <Upload className="w-6 h-6 text-gray-500 mb-1" />
                <span className="text-xs text-gray-800 font-bold">Klik untuk memilih file screenshot</span>
                <span className="text-[10px] text-gray-500">PNG, JPG, JPEG (Maks. 10MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {previewUrl && (
                <div className="relative w-full sm:w-24 h-28 sm:h-24 rounded-2xl border-2 border-blue-400 overflow-hidden bg-white shrink-0 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes / Evaluasi */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Catatan / Evaluasi Hasil Tracking
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: DM banyak masuk menanyakan ongkir, closing 5 transaksi..."
              className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{taskToEdit ? 'Simpan Perubahan' : 'Simpan Catatan Tracking'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
