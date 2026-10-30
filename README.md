# Fishbone Diagram AI Pro (Ishikawa 6M Generator & Action Plan)

A production-grade Root Cause Analysis (RCA) and Fishbone (Ishikawa Diagram) generator with automated Corrective and Preventive Action Plan facilitation powered by Google Gemini AI.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-gray.svg)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Google_GenAI-Gemini_Flash-orange.svg)](https://ai.google.dev/)

---

## ✨ Fitur Utama

1. **AI-Powered 6M Fishbone Generation**:
   - Analisis mendalam berbasis kerangka kerja industri 6M: **Man**, **Machine**, **Method**, **Material**, **Measurement**, dan **Environment**.
   - Mengekstrak pernyataan masalah (*problem statement*), kesimpulan akar masalah (*root cause conclusion*), penyebab spesifik (*causes*), dan rincian teknis (*details*).
   - Menghasilkan rekomendasi rencana aksi (*action plan*) tertarget untuk setiap penyebab yang ditemukan.

2. **Interactive Scalable SVG Canvas**:
   - **Pan & Zoom Halus**: Navigasi kanvas tak terbatas dengan mouse drag atau scroll wheel zoom, dilengkapi tombol *Auto-Fit* dan *Zoom In/Out*.
   - **Drag & Drop Reposisi**: Geser kepala ikan (otomatis menyesuaikan ujung spine) atau cabang kategori untuk kustomisasi posisi yang fleksibel.
   - **Context Menu & Inline Edit**: Klik kanan atau double-click pada elemen manapun untuk mengedit teks, menambah *cause*, menambah *sub-cause detail*, mengatur skala font, atau menghapus elemen.

3. **Tabel Action Plan Lengkap**:
   - **Corrective Action Plan**: Tindakan perbaikan langsung untuk mengembalikan kondisi aman operasi.
   - **Preventive Action Plan**: Tindakan pencegahan sistemik jangka panjang agar insiden serupa tidak terulang kembali.
   - Dilengkapi kolom *Category*, *Cause*, *Sub Cause*, *Action Plan*, *PIC*, dan *Due Date*.
   - Fitur tambah baris manual, sisipkan baris di tengah tabel, hapus baris, dan **Export CSV** untuk spreadsheet (Excel / Google Sheets).

4. **Kompatibilitas & Manajemen File**:
   - **Simpan Proyek (`Fishbone_Project.json`)**: Menyimpan seluruh konfigurasi kanvas, koordinat, narasi insiden, diagram tulang ikan, dan tabel rencana aksi.
   - **Buka Proyek**: Mendukung muat ulang file proyek tersimpan.
   - **Import Laporan Insiden**: Mampu membaca langsung file JSON laporan insiden formal (struktur `executiveSummary`, `sequenceOfEvents`, `rootCauses`, `actionPlan`) dan melakukan analisis otomatis.
   - **Cetak PDF**: Dioptimalkan khusus untuk format kertas **A3 / A4 Landscape** dengan pemisahan halaman bersih antara diagram dan tabel action plan.

5. **Pengaturan Layout**:
   - Pilihan format cetak: A3 Landscape atau A4 Landscape.
   - Pengatur jarak antar tulang (*category spacing*) dari 600px hingga 1400px.
   - Pengatur skala font (80%, 100%, 120%, 140%).
   - Tema diagram: *Ocean Blue*, *Dark Slate*, dan *Industrial Green*.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite
- **Backend**: Express server (`server.ts`) dengan `@google/genai` SDK
- **Error Handling & Resilience**:
  - Exponential backoff retry logic otomatis untuk penanganan batas kuota (429) dan transient network errors (503).
  - Validasi skema respon terstruktur (Strict JSON Schema).
  - Sanitasi parsing JSON untuk keandalan eksekusi tanpa crash.
- **Unit Testing**: Pengujian decoupled logic (parsing, diagram layout math, text wrapping) menggunakan `node:test` bawaan Node.js.

---

## 🚀 Menjalankan Aplikasi Secara Lokal

### Prasyarat
- Node.js >= 20
- Gemini API Key dari [Google AI Studio](https://aistudio.google.com/)

### Langkah Instalasi

1. Clone repositori:
```bash
git clone https://github.com/cxydyn/tulangikanasin.git
cd tulangikanasin
```

2. Instal dependensi:
```bash
npm install
```

3. Konfigurasi Environment Variable:
Buat file `.env` di direktori utama:
```env
GEMINI_API_KEY="AIzaSy..."
PORT=3000
```

4. Jalankan aplikasi (Full-Stack Dev Server):
```bash
npm run dev
```
Buka browser pada `http://localhost:3000`.

5. Menjalankan Unit Tests:
```bash
npm test
```

6. Build untuk Produksi:
```bash
npm run build
npm start
```
