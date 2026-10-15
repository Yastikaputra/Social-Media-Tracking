'use client';

import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Link2, Sparkles } from 'lucide-react';

interface UtmHelperModalProps {
  onClose: () => void;
}

export default function UtmHelperModal({ onClose }: UtmHelperModalProps) {
  const [tab, setTab] = useState<'whatsapp' | 'utm'>('whatsapp');

  // WhatsApp generator state
  const [phone, setPhone] = useState('628');
  const [brandName, setBrandName] = useState('Medispro');
  const [message, setMessage] = useState('Halo Admin, saya tertarik dengan informasi promo dari Instagram.');
  const [copiedWa, setCopiedWa] = useState(false);

  // UTM generator state
  const [targetUrl, setTargetUrl] = useState('https://kumtura.com/promo');
  const [utmSource, setUtmSource] = useState('instagram');
  const [utmMedium, setUtmMedium] = useState('bio_link');
  const [utmCampaign, setUtmCampaign] = useState('promo_oktober_2026');
  const [copiedUtm, setCopiedUtm] = useState(false);

  // Generate WA link
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const generatedWaLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}` : '';

  // Generate UTM link
  const generateUtmLink = () => {
    try {
      const url = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
      if (utmSource) url.searchParams.set('utm_source', utmSource);
      if (utmMedium) url.searchParams.set('utm_medium', utmMedium);
      if (utmCampaign) url.searchParams.set('utm_campaign', utmCampaign);
      return url.toString();
    } catch {
      return `${targetUrl}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    }
  };

  const copyToClipboard = (text: string, type: 'wa' | 'utm') => {
    navigator.clipboard.writeText(text);
    if (type === 'wa') {
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    } else {
      setCopiedUtm(true);
      setTimeout(() => setCopiedUtm(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Tracking & Link Helper</h3>
              <p className="text-xs text-gray-500">Generator tautan pelacakan leads akurat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-100 px-6 pt-3 space-x-4 bg-gray-50/40">
          <button
            onClick={() => setTab('whatsapp')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              tab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Direct Link</span>
          </button>
          <button
            onClick={() => setTab('utm')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              tab === 'utm'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Link2 className="w-4 h-4 text-blue-600" />
            <span>UTM Campaign Link</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          {tab === 'whatsapp' ? (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">Nomor WhatsApp CS (awali 62)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 628123456789"
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">Pesan Otomatis (Untuk Melacak Asal Leads)</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis pesan otomatis..."
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  💡 Tips: Cantumkan nama sosmed di pesan otomatis (misal: "tahu dari Story IG Medispro") agar leads mudah dihitung.
                </p>
              </div>

              {/* Result Preview */}
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl">
                <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1.5">Link WhatsApp Jadi:</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-emerald-950 font-mono bg-white p-2.5 rounded-xl border border-emerald-300 w-full select-all break-all">
                    {generatedWaLink}
                  </p>
                  <button
                    onClick={() => copyToClipboard(generatedWaLink, 'wa')}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedWa ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedWa ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">URL Landing Page / Web Target</label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">Source (Platform)</label>
                  <select
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="threads">Threads</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">Medium</label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="bio_link / story / feed / ads"
                    className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">Campaign Name</label>
                <input
                  type="text"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="promo_weekend_medispro"
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
                />
              </div>

              {/* Result Preview */}
              <div className="mt-4 p-3.5 bg-blue-50 border border-blue-300 rounded-2xl">
                <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1.5">Link UTM Jadi:</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-blue-950 font-mono bg-white p-2.5 rounded-xl border border-blue-300 w-full select-all break-all">
                    {generateUtmLink()}
                  </p>
                  <button
                    onClick={() => copyToClipboard(generateUtmLink(), 'utm')}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedUtm ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedUtm ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
