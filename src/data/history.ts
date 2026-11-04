import type { Divisi, Segmen } from '@/domain/types'

/** Agregat 12 bulan terakhir (Jan–Okt 2026). */
export const HASIL_DIVISI: Record<Divisi, { nkb: number; segmen: Record<Segmen, [number, number]> }> = {
  'Infrastruktur 1': { nkb: 1842, segmen: { Pemerintah: [28, 6], BUMN: [10, 3], Swasta: [6, 1], KPBU: [2, 1] } },
  'Infrastruktur 2': { nkb: 1356, segmen: { Pemerintah: [22, 5], BUMN: [8, 3], Swasta: [6, 1], KPBU: [2, 0] } },
  Gedung: { nkb: 964, segmen: { Pemerintah: [24, 5], BUMN: [6, 2], Swasta: [9, 1], KPBU: [2, 0] } },
}

/** Alasan gugur/kalah per divisi; jumlahnya sama dengan total tender tidak menang tiap divisi. */
export const ALASAN_KALAH: { alasan: string; kategori: 'Kalah' | 'Gugur'; jumlah: Record<Divisi, number> }[] = [
  { alasan: 'Harga di atas pemenang lebih dari 5%', kategori: 'Kalah', jumlah: { 'Infrastruktur 1': 16, 'Infrastruktur 2': 14, Gedung: 15 } },
  { alasan: 'Nilai teknis di bawah pesaing', kategori: 'Kalah', jumlah: { 'Infrastruktur 1': 13, 'Infrastruktur 2': 11, Gedung: 14 } },
  { alasan: 'SKK personel inti kedaluwarsa', kategori: 'Gugur', jumlah: { 'Infrastruktur 1': 3, 'Infrastruktur 2': 2, Gedung: 2 } },
  { alasan: 'Pengalaman sejenis tidak memenuhi', kategori: 'Gugur', jumlah: { 'Infrastruktur 1': 2, 'Infrastruktur 2': 1, Gedung: 1 } },
  { alasan: 'Metode pelaksanaan tidak sesuai KAK', kategori: 'Gugur', jumlah: { 'Infrastruktur 1': 1, 'Infrastruktur 2': 1, Gedung: 1 } },
]

/** Histori harga untuk Pricing Intelligence (PRC-01). % terhadap HPS. */
export const HISTORI_HARGA = [
  { nama: 'Preservasi Jalan Lintas Barat Seksi 2', jenis: 'Jalan', wilayah: 'Sumatera', tahun: 2023, hps: 178, penawaran: 94.4, pemenang: 94.4, menang: true, margin: 10.2 },
  { nama: 'Pelebaran Jalan Nasional Ruas S–T', jenis: 'Jalan', wilayah: 'Sumatera', tahun: 2024, hps: 133, penawaran: 93.2, pemenang: 93.2, menang: true, margin: 9.1 },
  { nama: 'Rekonstruksi Jalan Lintas Barat Seksi 5', jenis: 'Jalan', wilayah: 'Sumatera', tahun: 2024, hps: 104, penawaran: 96.1, pemenang: 91.8, menang: false, margin: 11.0 },
  { nama: 'Pemeliharaan Jalan Nasional Ruas J–K', jenis: 'Jalan', wilayah: 'Sumatera', tahun: 2025, hps: 66, penawaran: 95.0, pemenang: 92.3, menang: false, margin: 10.6 },
  { nama: 'Peningkatan Jalan Provinsi Ruas M–N', jenis: 'Jalan', wilayah: 'Kalimantan', tahun: 2026, hps: 72, penawaran: 93.1, pemenang: 93.1, menang: true, margin: 8.8 },
  { nama: 'Jembatan Sungai L', jenis: 'Jembatan', wilayah: 'Kalimantan', tahun: 2024, hps: 88, penawaran: 93.8, pemenang: 93.8, menang: true, margin: 9.5 },
  { nama: 'Dermaga Pelabuhan Y Tahap I', jenis: 'Pelabuhan', wilayah: 'Jawa', tahun: 2024, hps: 170, penawaran: 92.9, pemenang: 92.9, menang: true, margin: 9.8 },
  { nama: 'Gedung RSUD Tipe C', jenis: 'Gedung', wilayah: 'Sulawesi', tahun: 2024, hps: 141, penawaran: 93.6, pemenang: 93.6, menang: true, margin: 8.9 },
]

export const SUMBER_DATA = [
  { nama: 'SPSE INAPROC', jenis: 'Open data resmi', jadwal: 'Setiap 2 jam', terakhir: '4 Nov 2026, 10.00 WIB', status: 'Tersinkron' },
  { nama: 'SiRUP', jenis: 'Open data resmi', jadwal: 'Harian', terakhir: '4 Nov 2026, 06.00 WIB', status: 'Tersinkron' },
  { nama: 'Portal e-proc BUMN Pelabuhan', jenis: 'Impor email notifikasi', jadwal: 'Setiap 2 jam', terakhir: '4 Nov 2026, 09.40 WIB', status: 'Tersinkron' },
  { nama: 'Portal e-proc BUMN Energi', jenis: 'Impor email notifikasi', jadwal: 'Setiap 2 jam', terakhir: '3 Nov 2026, 22.00 WIB', status: 'Gagal 2 kali' },
  { nama: 'Input manual', jenis: 'Formulir', jadwal: '-', terakhir: '3 Nov 2026, 16.20 WIB', status: 'Tersinkron' },
]

/**
 * Ilustrasi progres objective PRD §4. NKB, win rate, dan tingkat gugur dihitung dari agregat hasil;
 * metrik di bawah ini tidak bisa diturunkan dari data tender dummy sehingga diisi per divisi.
 */
export const OBJECTIVE_DIVISI: Record<Divisi, { nkbTahunLalu: number; tertangkap: number; waktuHari: number; coverage: number }> = {
  'Infrastruktur 1': { nkbTahunLalu: 1650, tertangkap: 93, waktuHari: 11, coverage: 88 },
  'Infrastruktur 2': { nkbTahunLalu: 1210, tertangkap: 90, waktuHari: 11, coverage: 84 },
  Gedung: { nkbTahunLalu: 880, tertangkap: 88, waktuHari: 12, coverage: 76 },
}
