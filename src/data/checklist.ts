import type { Clarification, AddendumChange, ChecklistItem, ItemRule, Kategori } from '@/domain/types'

type Def = [Kategori, string, string, string, boolean, string, string | undefined, number, ItemRule]

const dok = (catatan: string, berlaku?: string): ItemRule => ({ tipe: 'dokumen', catatan, berlaku })
const nar = (catatan: string): ItemRule => ({ tipe: 'naratif', catatan })
const DP = 'Dok. pemilihan'

/** 42 persyaratan hasil ekstraksi: 33 Terpenuhi, 2 Kurang, 7 Perlu dicek manual sebelum perbaikan. */
const DEFS: Def[] = [
  // Kualifikasi
  ['Kualifikasi', 'SBU sub-klasifikasi jalan', `${DP} hal. 12`, 'Peserta wajib memiliki SBU sub-klasifikasi jalan yang masih berlaku.', true, 'Budi S.', 'SBU_SI001_2028.pdf', 0.97, { tipe: 'sbu', sbuId: 's1' }],
  ['Kualifikasi', 'SKK Manajer Pelaksanaan (Ahli Madya)', `${DP} hal. 14`, 'Manajer Pelaksanaan dengan SKK Ahli Madya, pengalaman minimal 5 tahun.', true, 'Dewi A.', undefined, 0.95, { tipe: 'personel', slot: 'Manajer Pelaksanaan' }],
  ['Kualifikasi', 'SKK Manajer Teknik', `${DP} hal. 14`, 'Manajer Teknik dengan SKK Ahli Muda atau lebih tinggi.', true, 'Dewi A.', undefined, 0.94, { tipe: 'personel', slot: 'Manajer Teknik' }],
  ['Kualifikasi', 'Personel K3 Konstruksi', `${DP} hal. 14`, 'Ahli K3 Konstruksi yang tidak sedang terikat pekerjaan lain.', true, 'Dewi A.', undefined, 0.93, { tipe: 'personel', slot: 'Ahli K3' }],
  ['Kualifikasi', 'Pengalaman sejenis 4 tahun terakhir', `${DP} hal. 15`, 'Pengalaman pekerjaan jalan dengan nilai minimal Rp50 miliar dalam 4 tahun terakhir.', true, 'Budi S.', undefined, 0.96, { tipe: 'pengalaman', minNilai: 50, jenis: 'Jalan' }],
  ['Kualifikasi', 'Pengalaman jembatan bentang ≥ 60 m', `${DP} hal. 34`, 'Pengalaman jembatan dengan bentang minimal 60 meter.', true, 'Budi S.', undefined, 0.91, { tipe: 'pengalaman', minNilai: 50, jenis: 'Jembatan' }],
  ['Kualifikasi', 'Sisa Kemampuan Nyata (SKN) mencukupi', `${DP} hal. 16`, 'SKN minimal setara nilai total HPS.', true, 'Sari P.', 'Laporan_Keuangan_2025.pdf', 0.9, dok('SKN Rp1,1 T, di atas nilai HPS')],
  ['Kualifikasi', 'Sisa Kemampuan Paket', `${DP} hal. 16`, 'Jumlah paket yang sedang dikerjakan tidak melebihi batas.', true, 'Budi S.', 'Daftar_Paket_Berjalan.xlsx', 0.92, dok('4 paket berjalan, batas 5 paket')],
  ['Kualifikasi', 'NIB aktif', `${DP} hal. 11`, 'Nomor Induk Berusaha aktif.', true, 'Sari P.', 'NIB_Perusahaan.pdf', 0.98, dok('NIB aktif')],
  ['Kualifikasi', 'NPWP dan status wajib pajak', `${DP} hal. 11`, 'NPWP dan konfirmasi status wajib pajak valid.', true, 'Sari P.', 'KSWP_2026.pdf', 0.97, dok('KSWP valid')],
  ['Kualifikasi', 'Laporan keuangan diaudit', `${DP} hal. 17`, 'Laporan keuangan tahun terakhir diaudit akuntan publik.', true, 'Sari P.', 'Laporan_Keuangan_2025.pdf', 0.95, dok('Opini wajar tanpa pengecualian')],
  ['Kualifikasi', 'Sertifikat ISO 9001', `${DP} hal. 18`, 'Sistem manajemen mutu berlaku.', false, 'Andi R.', 'ISO9001.pdf', 0.89, dok('Berlaku sampai 3 Agu 2028', '2028-08-03')],
  ['Kualifikasi', 'Sertifikat SMK3', `${DP} hal. 18`, 'SMK3 atau ISO 45001 berlaku.', true, 'Andi R.', 'SMK3.pdf', 0.91, dok('Berlaku sampai 19 Mei 2028', '2028-05-19')],
  ['Kualifikasi', 'Daftar peralatan utama', `${DP} hal. 19`, 'Asphalt Mixing Plant, Finisher, Tandem Roller, Excavator.', true, 'Andi R.', 'Daftar_Alat_PJN.xlsx', 0.9, dok('4 alat utama tersedia di Capability Library')],
  ['Kualifikasi', 'Bukti kepemilikan atau sewa alat', `${DP} hal. 19`, 'Bukti kepemilikan atau perjanjian sewa alat utama.', true, 'Andi R.', 'Bukti_Alat.pdf', 0.88, dok('Bukti lengkap untuk alat utama')],
  ['Kualifikasi', 'Lokasi AMP sesuai radius', `${DP} hal. 20`, 'Jarak AMP ke lokasi pekerjaan sesuai batas waktu tempuh.', true, 'Andi R.', 'Peta_AMP.pdf', 0.66, nar('Jarak AMP perlu diverifikasi di lapangan')],
  // Administrasi
  ['Administrasi', 'Surat penawaran bermeterai', `${DP} hal. 8`, 'Surat penawaran ditandatangani pihak berwenang.', true, 'Sari P.', 'Surat_Penawaran.pdf', 0.98, dok('Format dan penanda tangan sesuai')],
  ['Administrasi', 'Jaminan penawaran', `${DP} hal. 9`, 'Jaminan penawaran dari bank dengan nilai sesuai LDP.', true, 'Sari P.', 'Jaminan_Bank_A.pdf', 0.96, dok('Nilai dan masa berlaku sesuai', '2027-01-25')],
  ['Administrasi', 'Pakta integritas', `${DP} hal. 8`, 'Pakta integritas ditandatangani.', true, 'Budi S.', 'Pakta_Integritas.pdf', 0.99, dok('Lengkap')],
  ['Administrasi', 'Akta pendirian dan perubahan', `${DP} hal. 10`, 'Akta pendirian dan perubahan terakhir.', true, 'Sari P.', 'Akta_Perusahaan.pdf', 0.97, dok('Lengkap')],
  ['Administrasi', 'Surat kuasa penandatanganan', `${DP} hal. 10`, 'Surat kuasa jika ditandatangani bukan direksi.', false, 'Sari P.', 'Surat_Kuasa.pdf', 0.87, dok('Sesuai')],
  ['Administrasi', 'Formulir isian kualifikasi', `${DP} hal. 13`, 'Formulir isian kualifikasi lengkap.', true, 'Budi S.', 'Isian_Kualifikasi.pdf', 0.96, dok('Lengkap')],
  ['Administrasi', 'Pernyataan tidak dalam pengawasan pengadilan', `${DP} hal. 13`, 'Pernyataan kebenaran usaha.', true, 'Sari P.', 'Pernyataan_Usaha.pdf', 0.95, dok('Lengkap')],
  ['Administrasi', 'Daftar riwayat hidup personel', `${DP} hal. 14`, 'CV personel inti ditandatangani.', true, 'Dewi A.', 'CV_Personel.pdf', 0.93, dok('CV terbaru tersedia')],
  ['Administrasi', 'Surat pernyataan kesediaan personel', `${DP} hal. 14`, 'Surat kesediaan ditugaskan dari personel inti.', true, 'Dewi A.', 'Kesediaan_Personel.pdf', 0.92, dok('Tersedia')],
  // Teknis
  ['Teknis', 'Metode pelaksanaan pekerjaan jembatan', 'KAK hal. 41', 'Metode pelaksanaan menjelaskan tahapan pekerjaan jembatan.', true, 'Andi R.', 'Metode_v2.docx', 0.68, nar('Persyaratan naratif, perlu ditinjau tim teknis')],
  ['Teknis', 'Metode pelaksanaan pekerjaan jalan', 'KAK hal. 39', 'Metode pelaksanaan menjelaskan tahapan pekerjaan jalan.', true, 'Andi R.', 'Metode_v2.docx', 0.74, nar('Persyaratan naratif, perlu ditinjau tim teknis')],
  ['Teknis', 'Rencana Keselamatan Konstruksi (RKK)', `${DP} hal. 22`, 'RKK sesuai format pada dokumen pemilihan.', true, 'Andi R.', 'RKK_PJN_XY.pdf', 0.92, dok('Sesuai format')],
  ['Teknis', 'Jadwal pelaksanaan', `${DP} hal. 23`, 'Jadwal tidak melebihi 24 bulan.', true, 'Budi S.', 'Jadwal_PJN_XY.xlsx', 0.94, dok('Jadwal 22 bulan')],
  ['Teknis', 'Kurva S rencana', `${DP} hal. 23`, 'Kurva S per bulan.', false, 'Budi S.', 'Kurva_S.xlsx', 0.88, dok('Lengkap')],
  ['Teknis', 'Bagian pekerjaan yang disubkontrakkan', `${DP} hal. 24`, 'Daftar bagian pekerjaan yang disubkontrakkan.', false, 'Andi R.', 'Subkontrak.pdf', 0.86, dok('Sesuai batas')],
  ['Teknis', 'Rencana pengendalian mutu', 'KAK hal. 43', 'Rencana mutu pekerjaan.', true, 'Andi R.', 'RMK_PJN.pdf', 0.73, nar('Isi perlu dicocokkan dengan KAK')],
  ['Teknis', 'Rencana manajemen lalu lintas', 'KAK hal. 44', 'Pengaturan lalu lintas selama pekerjaan.', true, 'Andi R.', 'RMLL.pdf', 0.72, nar('Isi perlu dicocokkan dengan kondisi ruas')],
  ['Teknis', 'Rencana pengelolaan lingkungan', 'KAK hal. 46', 'Pengelolaan dampak lingkungan.', false, 'Andi R.', 'RKL.pdf', 0.64, nar('Rujukan AMDAL belum jelas, perlu dicek')],
  ['Teknis', 'TKDN minimal 40%', `${DP} hal. 25`, 'Pemenuhan Tingkat Komponen Dalam Negeri.', true, 'Sari P.', 'TKDN.xlsx', 0.93, dok('TKDN 46,2%')],
  ['Teknis', 'Spesifikasi material utama', 'KAK hal. 47', 'Material sesuai spesifikasi umum Bina Marga.', true, 'Andi R.', 'Spek_Material.pdf', 0.61, nar('Perlu cocokkan dengan brosur pemasok')],
  // Harga
  ['Harga', 'Daftar kuantitas dan harga', `${DP} hal. 30`, 'Daftar kuantitas dan harga terisi lengkap.', true, 'Sari P.', 'BoQ_v3.xlsx', 0.97, dok('Total 93,4% dari HPS')],
  ['Harga', 'Analisis harga satuan', `${DP} hal. 31`, 'AHS untuk mata pembayaran utama.', true, 'Sari P.', 'AHS_v2.xlsx', 0.94, dok('Lengkap')],
  ['Harga', 'Rekapitulasi penawaran', `${DP} hal. 31`, 'Rekapitulasi termasuk PPN.', true, 'Sari P.', 'Rekap_Harga.pdf', 0.96, dok('Sesuai BoQ')],
  ['Harga', 'Biaya penerapan SMKK', `${DP} hal. 32`, 'Biaya SMKK dicantumkan terpisah.', true, 'Sari P.', 'Biaya_SMKK.xlsx', 0.9, dok('Dicantumkan')],
  ['Harga', 'Masa berlaku penawaran', `${DP} hal. 32`, 'Masa berlaku minimal 60 hari.', true, 'Sari P.', 'Surat_Penawaran.pdf', 0.95, dok('90 hari')],
  ['Harga', 'Rincian pajak', `${DP} hal. 33`, 'Rincian pajak sesuai ketentuan.', false, 'Sari P.', 'Rekap_Harga.pdf', 0.89, dok('Sesuai')],
]

export function buatChecklist(): ChecklistItem[] {
  return DEFS.map(([kategori, teks, sumber, kutipan, wajib, pic, dokumen, keyakinan, rule], i) => ({
    id: `req-${i + 1}`, kategori, teks, sumber, kutipan, wajib, pic, dokumen, keyakinan, rule,
    status: 'Belum dicek', keterangan: keyakinan < 0.7 ? 'Keyakinan ekstraksi rendah, perlu ditinjau' : '',
    ditinjau: keyakinan >= 0.7, perluReview: false,
  }))
}

export const HALAMAN_GAGAL_OCR = 'hal. 58–60'

export const buatKlarifikasi = (): Clarification[] => [
  { id: 'q1', pertanyaan: 'Apakah pengalaman jembatan bentang ≥ 60 m boleh dipenuhi lewat anggota KSO?', jawaban: 'Boleh, sepanjang tercantum dalam perjanjian KSO.', sumber: 'Aanwijzing', pic: 'Budi S.', tenggat: '2026-11-12', status: 'Dijawab', lampiran: 'BA_Aanwijzing.pdf' },
  { id: 'q2', pertanyaan: 'Apakah AMP sewa dapat dipakai untuk memenuhi persyaratan radius?', jawaban: '', sumber: 'Aanwijzing', pic: 'Andi R.', tenggat: '2026-11-13', status: 'Terbuka' },
  { id: 'q3', pertanyaan: 'Format RKK mengikuti lampiran versi berapa?', jawaban: '', sumber: 'Klarifikasi Pokja', pic: 'Andi R.', tenggat: '2026-11-14', status: 'Terbuka' },
]

/** Isi Adendum 1 dummy; batas pemasukan mundur 7 hari dari batas saat ini. */
export const perubahanAdendum = (batasLama: string, batasBaru: string): AddendumChange[] => [
  { kategori: 'Jadwal', lama: `Batas pemasukan penawaran ${batasLama}, 14.00 WIB`, baru: `Batas pemasukan penawaran ${batasBaru}, 14.00 WIB`, rujukan: 'Adendum 1, hal. 2', itemTerdampak: ['Jaminan penawaran', 'Jadwal pelaksanaan'] },
  { kategori: 'Teknis', lama: 'RKK mengikuti format lampiran III', baru: 'RKK mengikuti format lampiran III-A dengan tambahan analisis risiko', rujukan: 'Adendum 1, hal. 4', itemTerdampak: ['Rencana Keselamatan Konstruksi (RKK)'] },
  { kategori: 'Harga', lama: 'Mata pembayaran 8.1 lapis pondasi 12.400 m³', baru: 'Mata pembayaran 8.1 lapis pondasi 13.150 m³', rujukan: 'Adendum 1, hal. 6', itemTerdampak: ['Daftar kuantitas dan harga'] },
  { kategori: 'Administrasi', lama: 'Tidak ada pernyataan kepatuhan TKDN terpisah', baru: 'Pernyataan kepatuhan TKDN dilampirkan terpisah', rujukan: 'Adendum 1, hal. 7', itemTerdampak: ['TKDN minimal 40%'] },
]
