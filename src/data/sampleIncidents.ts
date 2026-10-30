export interface SampleIncident {
  id: string;
  title: string;
  categoryHint: string;
  narrative: string;
}

export const SAMPLE_INCIDENTS: SampleIncident[] = [
  {
    id: 'pump-seal-failure',
    title: 'Kebocoran Mechanical Seal Pompa Transfer P-101A',
    categoryHint: 'Terminal Tank Farm - Maintenance',
    narrative: `Pada tanggal 24 Oktober 2026 pukul 03.15 WIB, terjadi kebocoran fluida hidrokarbon cair pada seal Pompa Transfer P-101A di area Manifold Barat. Sensor hydrocarbon detector mendeteksi gas pada konsentrasi 25% LEL. 

Kronologi:
- 03.00: Operator lapangan mencatat adanya kenaikan getaran (vibration) pada bearing housing dari 2.8 mm/s menjadi 7.2 mm/s.
- 03.10: Terdengar suara gesekan abnormal dari arah casing pompa dan tercium bau uap produk.
- 03.15: Terjadi rembesan fluida sekitar 50 liter ke dalam secondary containment bund wall.
- 03.18: Operator menekan tombol Emergency Stop (ESD) lokal dan mengisolasi suction/discharge valve.

Temuan Investigasi Awal:
1. Mechanical seal telah melampaui jam operasi rekomendasi vendor (9.200 jam dari batas 8.000 jam) karena keterlambatan pengadaan suku cadang seal kit.
2. Flush line pendingin seal tersumbat oleh partikel kotoran akibat strainer filter yang robek.
3. Teknisi shift malam belum menerima pelatihan sertifikasi alignment pompa menggunakan laser tool.
4. Alat ukur temperatur bearing berkala tidak terkalibrasi selama 8 bulan terakhir.
5. Suhu ambient malam itu sangat tinggi (34°C) dengan ventilasi sirkulasi pump shelter yang terbatas.`,
  },
  {
    id: 'tank-contamination',
    title: 'Kontaminasi Off-Spec Produk di Tangki Penyimpanan T-204',
    categoryHint: 'Quality Assurance - Terminal Operasional',
    narrative: `Pada tanggal 18 Oktober 2026, hasil uji lab independen menunjukkan produk FAME (Biodiesel) di dalam Tangki T-204 terkontaminasi air dan endapan sedimen melebihi batas spesifikasi teknis (kadar air 650 ppm, batas maks 500 ppm).

Faktor Kejadian:
- Jalur pipa inlet digunakan bersama (common line) antara penyaluran solar B30 dan FAME murni tanpa prosedur flushing line yang memadai.
- Prosedur checklist serah terima transfer (line clearing SOP) tidak ditandatangani oleh supervisor shift sebelum pompa dijalankan.
- Sampling produk hanya dilakukan di level top tangki, tidak dilakukan multi-level sampling (top, middle, bottom) sesuai standar ASTM D4057.
- Katup drain air otomatis (auto water draw-off valve) di dasar tangki dalam kondisi macet akibat korosi internal.
- Tim operasional mengalami rotasi personel baru sebanyak 40% tanpa masa pendampingan (mentoring) yang cukup.`,
  },
  {
    id: 'conveyor-trip',
    title: 'Trip Motor Belt Conveyor CV-03 Akibat Overload',
    categoryHint: 'Bulk Material Handling - Operasional Pabrik',
    narrative: `Motor penggerak conveyor CV-03 mengalami trip mendadak pada beban puncak pukul 11.20 WIB, menyebabkan penghentian lini produksi selama 4 jam.

Penyebab Teridentifikasi:
- Chute pengumpan tersumbat material basah akibat hujan deras malam sebelumnya dan atap gudang terbuka yang bocor.
- Sensor pendeteksi slip belt (zero speed switch) gagal mengirim sinyal interlock ke PLC karena kabel kontrol terkelupas akibat gigitan hewan pengerat.
- Tidak ada jadwal pembersihan rutin chute penampung pada shift pagi.
- Kapasitas pengumpanan material melebihi rating desain nominal sebesar 120 ton/jam (aktual tercatat 145 ton/jam) karena target kejar produksi akhir bulan.`,
  },
];
