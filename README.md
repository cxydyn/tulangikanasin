# Fishbone AI Pro (Ishikawa 6M & RCA Facilitator)

Aplikasi web modern untuk pembuatan **Diagram Tulang Ikan (Fishbone / Ishikawa 6M)** dan **Action Plan Korektif & Preventif** otomatis bertenaga Google Gemini AI.

---

## 🚀 Fitur Unggulan

1. **AI RCA Facilitator (Gemini 2.5 Flash)**
   - Menganalisis kronologi insiden/laporan kecelakaan kerja dan memetakan akar masalah ke dalam framework standar 6M: *Man, Machine, Method, Material, Measurement, Environment*.
   - Memberikan rekomendasi *Action Plan* spesifik untuk setiap penyebab.

2. **Interaktif & Anti-Collision Diagram Canvas**
   - **Garis Tulang Fleksibel**: Setiap tulang kategori memiliki titik kontrol (drag handle pin) di ujung garis untuk mengubah sudut kemiringan (35°–75°) dan panjang garis secara presisi.
   - **Editing Cause & Sub-cause**: Klik langsung pada kartu penyebab untuk mengedit judul penyebab, menambah/menghapus butir sub-penyebab (detail), dan menyelaraskan dengan tabel action plan.
   - **Toolbar Presisi**: Pengaturan cepat sudut kemiringan tulang (45°, 55°, 65°), jarak antar tulang, ukuran font, dan reset garis.

3. **Cetak Laporan PDF Eksekutif (A3 & A4 Landscape)**
   - Format cetak teroptimasi untuk landscape tanpa terpotong (*zero cut-off*).
   - Dilengkapi kop laporan eksekutif resmi, ringkasan kesimpulan akar masalah, visualisasi diagram Ishikawa 6M, dan tabel rencana aksi korektif & preventif.

4. **Ekspor & Impor Data Lengkap**
   - Simpan & buka proyek format JSON.
   - Dukungan format Incident Report JSON otomatis.
   - Ekspor tabel rencana aksi ke CSV/Excel.

---

## 🔑 Di Mana Gemini API Key Disimpan?

Pertanyaan penting mengenai keamanan dan konfigurasi API Key:

| Lokasi Penyimpanan | Keterangan & Keamanan |
| :--- | :--- |
| **Server Environment (`.env`)** | Disimpan di file `.env` server lokal atau Secrets penyedia hosting (Cloud Run, Render, Vercel). File `.env` masuk dalam `.gitignore` sehingga **tidak pernah terunggah ke repositori publik GitHub**. |
| **Menu Pengaturan Web (`localStorage`)** | Anda dapat memasukkan **Custom Gemini API Key** secara langsung melalui tombol **Layout / Pengaturan > Tab Kredensial API**. Kunci ini disimpan secara lokal di peramban Anda dan dikirim via header aman saat meminta analisis AI. |

---

## 🚢 Panduan Deploy dari GitHub

Repositori ini telah dikonfigurasi agar siap dideploy dengan berbagai metode:

### Cara 1: Deploy Otomatis ke GitHub Pages (Gratis)
Workflow GitHub Actions telah disediakan di `.github/workflows/deploy.yml`:
1. Buka repositori GitHub Anda di **Settings > Pages**.
2. Pada bagian **Build and deployment > Source**, pilih **GitHub Actions**.
3. Setiap kali ada commit/push ke branch `main`, GitHub akan otomatis membangun dan merilis website ke:
   ```
   https://cxydyn.github.io/tulangikanasin/
   ```
4. Di GitHub Pages, pengguna cukup memasukkan API Key mereka di menu **Pengaturan > Kredensial API**.

---

### Cara 2: Deploy ke Vercel (1-Click Fullstack)
1. Buka [Vercel](https://vercel.com) dan pilih **Import Project**.
2. Pilih repositori `cxydyn/tulangikanasin`.
3. Pada bagian **Environment Variables**, tambahkan:
   - `GEMINI_API_KEY`: *(API Key Google Gemini Anda)*
4. Klik **Deploy**. Vercel akan otomatis mendeteksi konfigurasi `vercel.json`.

---

### Cara 3: Deploy Menggunakan Docker (Render / Railway / VPS / Cloud Run)
Repositori ini menyertakan `Dockerfile` multi-stage production-ready:
```bash
# Build image docker
docker build -t fishbone-ai .

# Jalankan container
docker run -p 3000:3000 -e GEMINI_API_KEY="YOUR_API_KEY" fishbone-ai
```

---

### Cara 4: Menjalankan Secara Lokal (Development)

1. Clone repositori:
   ```bash
   git clone https://github.com/cxydyn/tulangikanasin.git
   cd tulangikanasin
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Buat file `.env` dari contoh `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Lalu masukkan `GEMINI_API_KEY="kunci_api_anda"`.

4. Jalankan server pengembang:
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:3000`.

5. Jalankan unit test:
   ```bash
   npm test
   ```

---

## 🛠️ Lisensi & Hak Cipta
Dibuat untuk analisis investigasi insiden industri dan perbaikan mutu berkelanjutan (Continuous Improvement / Root Cause Analysis).
