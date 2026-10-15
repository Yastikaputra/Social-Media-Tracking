# Social Media Tracking & Multi-Brand Leads Monitoring

Sistem Pemantauan Multi-Brand & Analisis Leads Media Sosial (WhatsApp, Instagram, Facebook, Threads) untuk unit bisnis Kumtura:
1. **Medispro** (Solusi Alat Kesehatan & Medis)
2. **Eleventrent** (Rental Kendaraan & Transportasi)
3. **Kuuva** (Fashion & Lifestyle)
4. **Pikago** (Logistik & Ekspedisi)
5. **Kumtura** (Holding & Digital Agency)

---

## 🛠️ Tech Stack
- **Backend**: Laravel 11, SQLite/MySQL, Laravel Sanctum (Authentication)
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Recharts

---

## 🚀 Panduan Menjalankan Sistem

### 1. Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --port=8000
```
Backend berjalan di: `http://127.0.0.1:8000`

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev -- --port 3000
```
Frontend berjalan di: `http://localhost:3000`

---

## 👥 Akun Login Default
- **Admin** (Akses Penuh: Dashboard Analitik, Manajemen Pengguna, Monitoring Semua Brand):
  - Email: `admin@kumtura.com`
  - Password: `password123`
- **Staff** (Akses Ruang Kerja Brand & Input Tracking):
  - Email: `staff@kumtura.com`
  - Password: `password123`
