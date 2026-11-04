import type { Account, Contact, Interaction } from '@/domain/types'

export const buatAkun = (): Account[] => [
  { id: 'a1', nama: 'BBPJN X', alias: 'Balai Besar Pelaksanaan Jalan Nasional X', tipe: 'K/L', wilayah: 'Sumatera Utara', pic: 'Rina K.', tier: 'Tier 1' },
  { id: 'a2', nama: 'Dinas PUPR Provinsi Z', tipe: 'Pemda', wilayah: 'Kalimantan Timur', pic: 'Rina K.', tier: 'Tier 1' },
  { id: 'a3', nama: 'BUMN Pelabuhan', tipe: 'BUMN', wilayah: 'Jawa Timur', pic: 'Andi R.', tier: 'Tier 1' },
  { id: 'a4', nama: 'BUJT A–B', tipe: 'Swasta', wilayah: 'Jawa Barat', pic: 'Andi R.', tier: 'Tier 2' },
  { id: 'a5', nama: 'BBWS Mesuji', tipe: 'K/L', wilayah: 'Lampung', pic: 'Sari P.', tier: 'Tier 2' },
  { id: 'a6', nama: 'Dinas Bina Marga Kota D', tipe: 'Pemda', wilayah: 'Jawa Tengah', pic: 'Sari P.', tier: 'Tier 2' },
  { id: 'a7', nama: 'Pemerintah Provinsi B', tipe: 'Pemda', wilayah: 'Sulawesi Selatan', pic: 'Rina K.', tier: 'Tier 2' },
  { id: 'a8', nama: 'Pemkab E', tipe: 'Pemda', wilayah: 'Jawa Barat', pic: 'Rina K.', tier: 'Tier 3' },
]

/** Riwayat tender 3 tahun per akun, di luar tender aktif di sesi demo. */
export const RIWAYAT_AKUN: Record<string, { nama: string; tahun: number; nilai: number; hasil: 'Menang' | 'Kalah' | 'Gugur' }[]> = {
  a1: [
    { nama: 'Preservasi Jalan Lintas Barat Seksi 2', tahun: 2023, nilai: 168, hasil: 'Menang' },
    { nama: 'Pelebaran Jalan Nasional Ruas S–T', tahun: 2024, nilai: 124, hasil: 'Menang' },
    { nama: 'Rekonstruksi Jalan Lintas Barat Seksi 5', tahun: 2024, nilai: 97, hasil: 'Kalah' },
    { nama: 'Preservasi Jembatan Ruas U–V', tahun: 2025, nilai: 73, hasil: 'Menang' },
    { nama: 'Pemeliharaan Jalan Nasional Ruas J–K', tahun: 2025, nilai: 61, hasil: 'Kalah' },
  ],
  a2: [
    { nama: 'Jembatan Sungai L', tahun: 2024, nilai: 82, hasil: 'Menang' },
    { nama: 'Jalan Provinsi Ruas F–G', tahun: 2025, nilai: 54, hasil: 'Kalah' },
    { nama: 'Jembatan Sungai H', tahun: 2025, nilai: 66, hasil: 'Gugur' },
  ],
  a3: [
    { nama: 'Dermaga Pelabuhan Y Tahap I', tahun: 2024, nilai: 158, hasil: 'Menang' },
    { nama: 'Pengerukan Kolam Pelabuhan', tahun: 2025, nilai: 49, hasil: 'Kalah' },
    { nama: 'Lapangan Penumpukan Pelabuhan Y', tahun: 2025, nilai: 88, hasil: 'Menang' },
  ],
  a4: [
    { nama: 'Akses Interchange A', tahun: 2024, nilai: 72, hasil: 'Menang' },
    { nama: 'Pelebaran Tol Seksi 1', tahun: 2025, nilai: 184, hasil: 'Kalah' },
  ],
  a5: [{ nama: 'Saluran Primer Way M', tahun: 2024, nilai: 39, hasil: 'Menang' }, { nama: 'Embung Way N', tahun: 2025, nilai: 28, hasil: 'Kalah' }],
  a6: [{ nama: 'Underpass Simpang C', tahun: 2024, nilai: 112, hasil: 'Kalah' }, { nama: 'Pelebaran Jalan Kota Ruas 5', tahun: 2025, nilai: 34, hasil: 'Menang' }],
  a7: [{ nama: 'Gedung RSUD Tipe C', tahun: 2024, nilai: 132, hasil: 'Menang' }, { nama: 'Gedung Dinas Kesehatan', tahun: 2025, nilai: 58, hasil: 'Gugur' }],
  a8: [{ nama: 'Pasar Rakyat Kabupaten E', tahun: 2025, nilai: 18, hasil: 'Kalah' }],
}

export const buatKontak = (): Contact[] => [
  { id: 'c1', accountId: 'a1', nama: 'Ir. Tono Hartanto', jabatan: 'Kepala Satker Wilayah I', unit: 'Satker', kanal: 'Kunjungan', relasi: 'Kuat', pengaruh: 'Tinggi', consent: true },
  { id: 'c2', accountId: 'a1', nama: 'Mira Sandika, S.T.', jabatan: 'PPK Ruas X–Y', unit: 'PPK', kanal: 'Email', relasi: 'Sedang', pengaruh: 'Tinggi', consent: true },
  { id: 'c3', accountId: 'a1', nama: 'Rudi Santika', jabatan: 'Staf Perencanaan', unit: 'Satker', kanal: 'Telepon', relasi: 'Sedang', pengaruh: 'Sedang', consent: true },
  { id: 'c4', accountId: 'a1', nama: 'Yanti Lubis', jabatan: 'Pengelola Pengadaan', unit: 'UKPBJ', kanal: 'Email', relasi: 'Lemah', pengaruh: 'Sedang', consent: false },
  { id: 'c5', accountId: 'a2', nama: 'H. Syamsul Bahri', jabatan: 'Kabid Bina Marga', unit: 'Dinas', kanal: 'Kunjungan', relasi: 'Kuat', pengaruh: 'Tinggi', consent: true },
  { id: 'c6', accountId: 'a2', nama: 'Nadia Putri', jabatan: 'PPK Jembatan', unit: 'PPK', kanal: 'Email', relasi: 'Sedang', pengaruh: 'Sedang', consent: true },
  { id: 'c7', accountId: 'a3', nama: 'Bagus Prasetyo', jabatan: 'VP Pengadaan', unit: 'Divisi Pengadaan', kanal: 'Rapat', relasi: 'Kuat', pengaruh: 'Tinggi', consent: true },
  { id: 'c8', accountId: 'a3', nama: 'Citra Ayu', jabatan: 'Manajer Teknik', unit: 'Divisi Teknik', kanal: 'Email', relasi: 'Sedang', pengaruh: 'Sedang', consent: true },
  { id: 'c9', accountId: 'a4', nama: 'Reza Maulana', jabatan: 'Head of Construction', unit: 'Konstruksi', kanal: 'Rapat', relasi: 'Sedang', pengaruh: 'Tinggi', consent: true },
  { id: 'c10', accountId: 'a5', nama: 'Agung Firmansyah', jabatan: 'PPK Irigasi', unit: 'PPK', kanal: 'Email', relasi: 'Sedang', pengaruh: 'Tinggi', consent: true },
  { id: 'c11', accountId: 'a6', nama: 'Erna Wulandari', jabatan: 'Kabid Jalan', unit: 'Dinas', kanal: 'Kunjungan', relasi: 'Lemah', pengaruh: 'Tinggi', consent: true },
  { id: 'c12', accountId: 'a7', nama: 'dr. Halim Basri', jabatan: 'Kepala UKPBJ', unit: 'UKPBJ', kanal: 'Rapat', relasi: 'Sedang', pengaruh: 'Tinggi', consent: true },
]

export const buatInteraksi = (): Interaction[] => [
  { id: 'i1', accountId: 'a1', tanggal: '2026-10-28', jenis: 'Kunjungan', ringkasan: 'Diskusi rencana preservasi ruas X–Y dan kebutuhan jembatan bentang panjang.', kontak: 'Mira Sandika, S.T.', oleh: 'Rina K.', tindakLanjut: { teks: 'Kirim profil pengalaman jembatan', tanggal: '2026-11-11', selesai: false } },
  { id: 'i2', accountId: 'a1', tanggal: '2026-09-15', jenis: 'Rapat', ringkasan: 'Paparan kinerja proyek Lintas Barat Seksi 2 kepada Kepala Satker.', kontak: 'Ir. Tono Hartanto', oleh: 'Rina K.', tindakLanjut: { teks: 'Bagikan laporan BAST', tanggal: '2026-09-22', selesai: true } },
  { id: 'i3', accountId: 'a1', tanggal: '2026-08-02', jenis: 'Email', ringkasan: 'Konfirmasi jadwal publikasi paket 2026 di RUP.', kontak: 'Rudi Santika', oleh: 'Andi R.' },
  { id: 'i4', accountId: 'a2', tanggal: '2026-10-21', jenis: 'Kunjungan', ringkasan: 'Tinjau lokasi Jembatan Sungai Z bersama Kabid.', kontak: 'H. Syamsul Bahri', oleh: 'Rina K.', tindakLanjut: { teks: 'Susun catatan survei lokasi', tanggal: '2026-11-05', selesai: false } },
  { id: 'i5', accountId: 'a3', tanggal: '2026-10-30', jenis: 'Rapat', ringkasan: 'Pembahasan awal negosiasi Dermaga Tahap II.', kontak: 'Bagus Prasetyo', oleh: 'Andi R.', tindakLanjut: { teks: 'Siapkan skenario konsesi', tanggal: '2026-11-06', selesai: false } },
  { id: 'i6', accountId: 'a4', tanggal: '2026-10-14', jenis: 'Rapat', ringkasan: 'Pembahasan peluang akses kawasan industri.', kontak: 'Reza Maulana', oleh: 'Andi R.' },
  { id: 'i7', accountId: 'a5', tanggal: '2026-10-02', jenis: 'Email', ringkasan: 'Permintaan data status lahan Bendungan Way K.', kontak: 'Agung Firmansyah', oleh: 'Sari P.' },
  { id: 'i8', accountId: 'a6', tanggal: '2026-09-25', jenis: 'Kunjungan', ringkasan: 'Perkenalan tim dan pemetaan rencana flyover.', kontak: 'Erna Wulandari', oleh: 'Sari P.' },
  { id: 'i9', accountId: 'a7', tanggal: '2026-09-19', jenis: 'Rapat', ringkasan: 'Koordinasi aanwijzing RS Daerah Tipe B.', kontak: 'dr. Halim Basri', oleh: 'Rina K.' },
]
