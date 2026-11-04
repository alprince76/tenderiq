import type { Divisi, Segmen, Status, Tender, Milestone } from '@/domain/types'
import { tambahHari } from '@/domain/format'

interface Seed {
  id: string; nama: string; divisi: Divisi; accountId: string; pemilik: string; segmen: Segmen; hps: number
  metode: string; lokasi: string; sbu: string; sumber: string[]; batas: string; rel: number; alasan: [string, string, string]
  risiko: [string, string]; status: Status; pic: string; milestone?: Milestone; lingkup?: string; kunci?: string[]
}

const seeds: Seed[] = [
  { id: 't01', nama: 'Preservasi Jalan Nasional Ruas X–Y', divisi: 'Infrastruktur 1', accountId: 'a1', pemilik: 'BBPJN X', segmen: 'Pemerintah', hps: 142, metode: 'Pascakualifikasi', lokasi: 'Sumatera Utara', sbu: 'SI001 Jalan', sumber: ['SPSE INAPROC', 'Portal BUMN'], batas: '2026-11-21', rel: 86,
    alasan: ['SBU sub-klasifikasi jalan dimiliki dan masih berlaku', '3 proyek sejenis di pemilik proyek ini, 2 di antaranya menang', 'Nilai paket sesuai preferensi strategis divisi'],
    risiko: ['Pengalaman sejenis mensyaratkan jembatan bentang ≥ 60 m', 'Dokumen pemilihan, hal. 34'], status: 'Discovered', pic: 'Budi S.',
    milestone: { tahap: 'Keputusan Go/No-Go', tanggal: '2026-11-07', kesiapan: 'Belum lengkap' },
    lingkup: 'Preservasi rutin dan rekonstruksi 48 km jalan nasional, termasuk pemeliharaan 3 jembatan, drainase, dan perlengkapan jalan selama 24 bulan.',
    kunci: ['SBU sub-klasifikasi jalan', 'SKK Manajer Pelaksanaan Ahli Madya, pengalaman 5 tahun', 'Personel K3 Konstruksi', 'Pengalaman sejenis 4 tahun terakhir minimal Rp50 M', 'Jaminan penawaran'] },
  { id: 't02', nama: 'Pembangunan Jembatan Sungai Z', divisi: 'Infrastruktur 1', accountId: 'a2', pemilik: 'Dinas PUPR Provinsi Z', segmen: 'Pemerintah', hps: 88, metode: 'Pascakualifikasi', lokasi: 'Kalimantan Timur', sbu: 'SI002 Jembatan', sumber: ['SPSE INAPROC'], batas: '2026-11-25', rel: 84,
    alasan: ['Pengalaman jembatan bentang ≥ 60 m tersedia', 'Personel inti jembatan tersedia', 'Lokasi dekat proyek berjalan'], risiko: ['Jadwal pelaksanaan 14 bulan tergolong ketat', 'KAK, hal. 8'], status: 'Submitted', pic: 'Dewi A.',
    milestone: { tahap: 'Klarifikasi', tanggal: '2026-11-06', kesiapan: 'Perlu dicek' } },
  { id: 't03', nama: 'Gedung Rumah Sakit Daerah Tipe B', divisi: 'Gedung', accountId: 'a7', pemilik: 'Pemerintah Provinsi B', segmen: 'Pemerintah', hps: 210, metode: 'Pascakualifikasi', lokasi: 'Sulawesi Selatan', sbu: 'BG004 Gedung Kesehatan', sumber: ['SPSE INAPROC'], batas: '2026-12-09', rel: 72,
    alasan: ['SBU gedung kesehatan berlaku', '1 proyek RS di wilayah yang sama', 'Nilai sesuai target divisi Gedung'], risiko: ['Spesifikasi alat medis terintegrasi perlu mitra', 'KAK, hal. 52'], status: 'Preparing', pic: 'Budi S.',
    milestone: { tahap: 'Aanwijzing', tanggal: '2026-11-08', kesiapan: 'Terjadwal' } },
  { id: 't04', nama: 'Dermaga Pelabuhan Y Tahap II', divisi: 'Infrastruktur 2', accountId: 'a3', pemilik: 'BUMN Pelabuhan', segmen: 'BUMN', hps: 175, metode: 'Tender BUMN', lokasi: 'Jawa Timur', sbu: 'SI005 Pelabuhan', sumber: ['Portal BUMN'], batas: '2026-10-20', rel: 81,
    alasan: ['Repeat order, menang Tahap I tahun 2024', 'SBU pelabuhan berlaku', 'Relasi kuat dengan unit pengadaan'], risiko: ['Pekerjaan laut bergantung cuaca', 'Dokumen pemilihan, hal. 27'], status: 'Negotiation', pic: 'Sari P.',
    milestone: { tahap: 'Negosiasi putaran 2', tanggal: '2026-11-10', kesiapan: 'Perlu dicek' } },
  { id: 't05', nama: 'Flyover Simpang D', divisi: 'Infrastruktur 2', accountId: 'a6', pemilik: 'Dinas Bina Marga Kota D', segmen: 'Pemerintah', hps: 188, metode: 'Pascakualifikasi', lokasi: 'Jawa Tengah', sbu: 'SI002 Jembatan', sumber: ['SPSE INAPROC'], batas: '2026-12-04', rel: 66,
    alasan: ['SBU jembatan berlaku', 'Pengalaman flyover 1 proyek', 'Kapasitas personel terbatas di Desember'], risiko: ['Kapasitas personel inti terbatas di Desember', 'Capability Library'], status: 'Qualifying', pic: 'Sari P.' },
  { id: 't06', nama: 'Bendungan Irigasi Way K', divisi: 'Infrastruktur 2', accountId: 'a5', pemilik: 'BBWS Mesuji', segmen: 'Pemerintah', hps: 312, metode: 'Prakualifikasi', lokasi: 'Lampung', sbu: 'SI003 Sumber Daya Air', sumber: ['SPSE INAPROC'], batas: '2026-12-18', rel: 73,
    alasan: ['SBU sumber daya air berlaku', 'Nilai strategis bagi divisi', '2 proyek irigasi selesai di wilayah ini'], risiko: ['Pengadaan lahan belum tuntas', 'KAK, hal. 12'], status: 'Qualifying', pic: 'Rina K.' },
  { id: 't07', nama: 'Gedung Kantor Pemda C', divisi: 'Gedung', accountId: 'a7', pemilik: 'Pemerintah Provinsi B', segmen: 'Pemerintah', hps: 96, metode: 'Pascakualifikasi', lokasi: 'Sulawesi Selatan', sbu: 'BG004 Gedung Kesehatan', sumber: ['SPSE INAPROC'], batas: '2026-12-11', rel: 62,
    alasan: ['Pemilik proyek sudah menjadi akun aktif', 'Nilai di bawah batas GM Divisi', 'Lokasi dekat proyek RS'], risiko: ['Persyaratan green building belum pernah dipenuhi', 'KAK, hal. 19'], status: 'Qualifying', pic: 'Andi R.' },
  { id: 't08', nama: 'Rehabilitasi Saluran Irigasi Way K', divisi: 'Infrastruktur 2', accountId: 'a5', pemilik: 'BBWS Mesuji', segmen: 'Pemerintah', hps: 24, metode: 'Pascakualifikasi', lokasi: 'Lampung', sbu: 'SI003 Sumber Daya Air', sumber: ['SPSE INAPROC', 'SiRUP'], batas: '2026-12-12', rel: 41,
    alasan: ['SBU sumber daya air berlaku', 'Nilai di bawah ambang strategis divisi', 'Pemilik proyek sudah dikenal'], risiko: ['Margin indikatif rendah untuk paket kecil', 'Dokumen pemilihan, hal. 6'], status: 'Discovered', pic: 'Rina K.' },
  { id: 't09', nama: 'Pengadaan Gedung Kantor Kecamatan', divisi: 'Gedung', accountId: 'a8', pemilik: 'Pemkab E', segmen: 'Pemerintah', hps: 12, metode: 'Pascakualifikasi', lokasi: 'Jawa Barat', sbu: 'BG001 Gedung Perkantoran', sumber: ['Input manual'], batas: '2026-12-15', rel: 28,
    alasan: ['SBU BG001 Gedung Perkantoran tidak dimiliki', 'Nilai jauh di bawah preferensi divisi', 'Belum ada relasi dengan pemilik proyek'], risiko: ['Butuh mitra KSO untuk memenuhi SBU', 'Dokumen pemilihan, hal. 11'], status: 'Discovered', pic: 'Rina K.' },
  { id: 't10', nama: 'Rekonstruksi Jalan Lintas Timur Seksi 3', divisi: 'Infrastruktur 1', accountId: 'a1', pemilik: 'BBPJN X', segmen: 'Pemerintah', hps: 96, metode: 'Pascakualifikasi', lokasi: 'Sumatera Utara', sbu: 'SI001 Jalan', sumber: ['SPSE INAPROC'], batas: '2026-11-30', rel: 78,
    alasan: ['SBU jalan berlaku', 'Pemilik proyek dengan win rate tertinggi di divisi', 'Bisa memakai alat dari proyek X–Y'], risiko: ['Masa pelaksanaan beririsan dengan musim hujan', 'KAK, hal. 15'], status: 'Discovered', pic: 'Rina K.' },
  { id: 't11', nama: 'Jalan Akses Pelabuhan Y', divisi: 'Infrastruktur 1', accountId: 'a3', pemilik: 'BUMN Pelabuhan', segmen: 'BUMN', hps: 58, metode: 'Tender BUMN', lokasi: 'Jawa Timur', sbu: 'SI001 Jalan', sumber: ['Portal BUMN'], batas: '2026-12-02', rel: 69,
    alasan: ['Relasi kuat dengan BUMN Pelabuhan', 'SBU jalan berlaku', 'Sinergi dengan Dermaga Tahap II'], risiko: ['Jadwal mengikuti operasional pelabuhan', 'Dokumen pemilihan, hal. 9'], status: 'Discovered', pic: 'Andi R.' },
  { id: 't12', nama: 'Laboratorium Kesehatan Daerah', divisi: 'Gedung', accountId: 'a7', pemilik: 'Pemerintah Provinsi B', segmen: 'Pemerintah', hps: 64, metode: 'Pascakualifikasi', lokasi: 'Sulawesi Selatan', sbu: 'BG004 Gedung Kesehatan', sumber: ['SPSE INAPROC'], batas: '2026-12-07', rel: 63,
    alasan: ['SBU gedung kesehatan berlaku', 'Satu pemilik proyek dengan RSD Tipe B', 'Personel gedung tersedia'], risiko: ['Standar biosafety perlu konsultan spesialis', 'KAK, hal. 31'], status: 'Discovered', pic: 'Rina K.' },
  { id: 't13', nama: 'Normalisasi Sungai K', divisi: 'Infrastruktur 2', accountId: 'a5', pemilik: 'BBWS Mesuji', segmen: 'Pemerintah', hps: 77, metode: 'Pascakualifikasi', lokasi: 'Lampung', sbu: 'SI003 Sumber Daya Air', sumber: ['SPSE INAPROC'], batas: '2026-12-10', rel: 54,
    alasan: ['SBU sumber daya air berlaku', 'Alat berat tersedia terbatas', 'Margin historis segmen rendah'], risiko: ['Pembebasan bantaran belum selesai', 'KAK, hal. 21'], status: 'Discovered', pic: 'Sari P.' },
  { id: 't14', nama: 'Jembatan Penghubung Kawasan Timur', divisi: 'Infrastruktur 1', accountId: 'a2', pemilik: 'Dinas PUPR Provinsi Z', segmen: 'Pemerintah', hps: 134, metode: 'Pascakualifikasi', lokasi: 'Kalimantan Timur', sbu: 'SI002 Jembatan', sumber: ['SPSE INAPROC'], batas: '2026-12-14', rel: 71,
    alasan: ['SBU jembatan berlaku', 'Pengalaman bentang panjang relevan', 'Sinergi lokasi dengan Jembatan Sungai Z'], risiko: ['Fondasi dalam di tanah lunak', 'KAK, hal. 26'], status: 'Discovered', pic: 'Rina K.' },
  { id: 't15', nama: 'Rumah Susun ASN Kota Baru', divisi: 'Gedung', accountId: 'a6', pemilik: 'Dinas Bina Marga Kota D', segmen: 'Pemerintah', hps: 120, metode: 'Pascakualifikasi', lokasi: 'Jawa Tengah', sbu: 'BG004 Gedung Kesehatan', sumber: ['SPSE INAPROC'], batas: '2026-10-15', rel: 67,
    alasan: ['Pengalaman gedung bertingkat', 'Nilai sesuai target', 'Tim gedung tersedia'], risiko: ['Pengalaman rumah susun terbatas', 'KAK, hal. 17'], status: 'UnderEvaluation', pic: 'Andi R.',
    milestone: { tahap: 'Pembuktian kualifikasi', tanggal: '2026-11-09', kesiapan: 'Siap' } },
  { id: 't16', nama: 'Jalan Akses Kawasan Industri', divisi: 'Infrastruktur 2', accountId: 'a4', pemilik: 'BUJT A–B', segmen: 'Swasta', hps: 88, metode: 'Tender swasta', lokasi: 'Jawa Barat', sbu: 'SI001 Jalan', sumber: ['Input manual'], batas: '2026-11-10', rel: 75,
    alasan: ['Relasi berjalan dari proyek tol', 'SBU jalan berlaku', 'Margin swasta lebih baik'], risiko: ['Pembayaran termin panjang', 'RFP, hal. 7'], status: 'ReadyToSubmit', pic: 'Sari P.',
    milestone: { tahap: 'Pemasukan penawaran', tanggal: '2026-11-10', kesiapan: 'Siap' } },
  { id: 't17', nama: 'Jalan Tol Ruas A–B Seksi 2', divisi: 'Infrastruktur 1', accountId: 'a4', pemilik: 'BUJT A–B', segmen: 'KPBU', hps: 640, metode: 'Prakualifikasi', lokasi: 'Jawa Barat', sbu: 'SI001 Jalan', sumber: ['Portal BUMN'], batas: '2026-10-28', rel: 74,
    alasan: ['Nilai sesuai preferensi strategis divisi', 'Pengalaman jalan tol tersedia', 'Berpotensi KSO'], risiko: ['Nilai besar butuh jaminan tinggi', 'Dokumen pemilihan, hal. 40'], status: 'UnderEvaluation', pic: 'Andi R.',
    milestone: { tahap: 'Pembuktian kualifikasi', tanggal: '2026-11-11', kesiapan: 'Perlu dicek' } },
  { id: 't18', nama: 'Revitalisasi Terminal Penumpang Pelabuhan Y', divisi: 'Gedung', accountId: 'a3', pemilik: 'BUMN Pelabuhan', segmen: 'BUMN', hps: 150, metode: 'Tender BUMN', lokasi: 'Jawa Timur', sbu: 'BG004 Gedung Kesehatan', sumber: ['Portal BUMN'], batas: '2026-12-20', rel: 68,
    alasan: ['Akun aktif dengan win rate tinggi', 'Personel gedung tersedia', 'Sinergi dengan paket dermaga'], risiko: ['Pekerjaan dilakukan saat terminal beroperasi', 'KAK, hal. 14'], status: 'Preparing', pic: 'Andi R.' },
  { id: 't19', nama: 'Peningkatan Jalan Provinsi Ruas M–N', divisi: 'Infrastruktur 1', accountId: 'a2', pemilik: 'Dinas PUPR Provinsi Z', segmen: 'Pemerintah', hps: 72, metode: 'Pascakualifikasi', lokasi: 'Kalimantan Timur', sbu: 'SI001 Jalan', sumber: ['SPSE INAPROC'], batas: '2026-09-10', rel: 77,
    alasan: ['SBU jalan berlaku', 'Pengalaman di pemilik proyek', 'Nilai sesuai'], risiko: ['Akses material terbatas', 'KAK, hal. 10'], status: 'Won', pic: 'Budi S.' },
  { id: 't20', nama: 'Gedung Perkantoran BUMN Pelabuhan', divisi: 'Gedung', accountId: 'a3', pemilik: 'BUMN Pelabuhan', segmen: 'BUMN', hps: 110, metode: 'Tender BUMN', lokasi: 'Jawa Timur', sbu: 'BG004 Gedung Kesehatan', sumber: ['Portal BUMN'], batas: '2026-08-20', rel: 76,
    alasan: ['Akun aktif', 'Tim gedung tersedia', 'Nilai sesuai'], risiko: ['Perubahan desain saat pelaksanaan', 'KAK, hal. 22'], status: 'Handover', pic: 'Andi R.' },
  { id: 't21', nama: 'Jembatan Sungai Q', divisi: 'Infrastruktur 2', accountId: 'a2', pemilik: 'Dinas PUPR Provinsi Z', segmen: 'Pemerintah', hps: 95, metode: 'Pascakualifikasi', lokasi: 'Kalimantan Timur', sbu: 'SI002 Jembatan', sumber: ['SPSE INAPROC'], batas: '2025-06-12', rel: 80,
    alasan: ['Pengalaman jembatan relevan', 'Personel tersedia', 'Lokasi sesuai'], risiko: ['Banjir musiman', 'KAK, hal. 12'], status: 'Executing', pic: 'Dewi A.' },
  { id: 't22', nama: 'Pembangunan Tol Feeder Kota Baru', divisi: 'Infrastruktur 1', accountId: 'a4', pemilik: 'BUJT A–B', segmen: 'KPBU', hps: 230, metode: 'Prakualifikasi', lokasi: 'Jawa Barat', sbu: 'SI001 Jalan', sumber: ['Portal BUMN'], batas: '2026-10-01', rel: 70,
    alasan: ['Pengalaman tol relevan', 'Relasi dengan BUJT', 'Nilai strategis'], risiko: ['Persaingan harga ketat', 'Hasil tender sejenis'], status: 'Lost', pic: 'Andi R.' },
  { id: 't23', nama: 'Puskesmas Terpadu Kabupaten E', divisi: 'Gedung', accountId: 'a8', pemilik: 'Pemkab E', segmen: 'Pemerintah', hps: 45, metode: 'Pascakualifikasi', lokasi: 'Jawa Barat', sbu: 'BG004 Gedung Kesehatan', sumber: ['SPSE INAPROC'], batas: '2026-09-22', rel: 59,
    alasan: ['SBU gedung kesehatan berlaku', 'Nilai kecil', 'Lokasi baru'], risiko: ['SKK personel inti hampir berakhir', 'Capability Library'], status: 'Lost', pic: 'Budi S.' },
  { id: 't24', nama: 'Drainase Perkotaan Kota D', divisi: 'Infrastruktur 2', accountId: 'a6', pemilik: 'Dinas Bina Marga Kota D', segmen: 'Pemerintah', hps: 38, metode: 'Pascakualifikasi', lokasi: 'Jawa Tengah', sbu: 'SI003 Sumber Daya Air', sumber: ['SPSE INAPROC'], batas: '2026-12-22', rel: 47,
    alasan: ['SBU sumber daya air berlaku', 'Nilai di bawah preferensi divisi', 'Akun aktif'], risiko: ['Pekerjaan malam hari di area padat', 'KAK, hal. 5'], status: 'Discovered', pic: 'Sari P.' },
]

const jadwalDari = (batas: string): { tahap: string; tanggal: string }[] => [
  { tahap: 'Pengumuman tender', tanggal: tambahHari(batas, -20) },
  { tahap: 'Aanwijzing', tanggal: tambahHari(batas, -11) },
  { tahap: 'Batas pemasukan penawaran', tanggal: batas },
  { tahap: 'Evaluasi & pembuktian kualifikasi', tanggal: tambahHari(batas, 10) },
  { tahap: 'Pengumuman pemenang', tanggal: tambahHari(batas, 20) },
]

export function buatTenders(): Tender[] {
  return seeds.map((s, i) => ({
    id: s.id,
    kode: `TND-2026-${String(i + 101)}`,
    nama: s.nama, divisi: s.divisi, accountId: s.accountId, pemilik: s.pemilik, segmen: s.segmen, hps: s.hps,
    metode: s.metode, lokasi: s.lokasi, sbu: s.sbu, sumber: s.sumber, batasPemasukan: s.batas,
    relevance: s.rel, alasan: s.alasan, risiko: { teks: s.risiko[0], sumber: s.risiko[1] },
    lingkup: s.lingkup ?? `Pelaksanaan pekerjaan ${s.nama.toLowerCase()} di ${s.lokasi}, sesuai KAK dan gambar kerja dari ${s.pemilik}.`,
    jadwal: jadwalDari(s.batas),
    persyaratanKunci: s.kunci ?? [`SBU ${s.sbu}`, 'SKK personel manajerial', 'Pengalaman sejenis', 'Jaminan penawaran'],
    status: s.status, pic: s.pic, milestone: s.milestone,
    hasil: hasilAwal[s.id],
    kontrakTtd: s.id === 't20' || s.id === 't21' ? true : undefined,
  }))
}

const hasilAwal: Record<string, Tender['hasil']> = {
  t19: { tanggal: '2026-10-12', hasil: 'Won', peringkat: 1, nilaiKontrak: 67, peserta: [
    { nama: 'Entitas kami', harga: 67, peringkat: 1, status: 'Lulus' },
    { nama: 'PT Karya Nusantara', harga: 68.4, peringkat: 2, status: 'Lulus' },
    { nama: 'PT Bangun Lintas', harga: 70.1, peringkat: 3, status: 'Lulus' } ] },
  t20: { tanggal: '2026-09-28', hasil: 'Won', peringkat: 1, nilaiKontrak: 104, peserta: [
    { nama: 'Entitas kami', harga: 104, peringkat: 1, status: 'Lulus' },
    { nama: 'PT Graha Persada', harga: 106.2, peringkat: 2, status: 'Lulus' } ] },
  t21: { tanggal: '2025-07-20', hasil: 'Won', peringkat: 1, nilaiKontrak: 91, peserta: [
    { nama: 'Entitas kami', harga: 91, peringkat: 1, status: 'Lulus' },
    { nama: 'PT Karya Nusantara', harga: 92.8, peringkat: 2, status: 'Lulus' } ] },
  t22: { tanggal: '2026-11-02', hasil: 'Lost', peringkat: 2, kategori: 'Kalah', alasan: 'Harga di atas pemenang lebih dari 5%', peserta: [
    { nama: 'PT Tol Mandala', harga: 201, peringkat: 1, status: 'Lulus' },
    { nama: 'Entitas kami', harga: 214, peringkat: 2, status: 'Lulus' },
    { nama: 'PT Bangun Lintas', harga: 219, peringkat: 3, status: 'Lulus' } ],
    sanggah: { tahap: 'masa-sanggah', batas: '2026-11-09' } },
  t23: { tanggal: '2026-10-14', hasil: 'Lost', peringkat: 3, kategori: 'Gugur', alasan: 'SKK personel inti kedaluwarsa', peserta: [
    { nama: 'PT Graha Persada', harga: 41, peringkat: 1, status: 'Lulus' },
    { nama: 'PT Karya Nusantara', harga: 42.5, peringkat: 2, status: 'Lulus' },
    { nama: 'Entitas kami', harga: 40.2, peringkat: 3, status: 'Gugur kualifikasi' } ],
    sanggah: { tahap: 'selesai', batas: '2026-10-21', catatan: 'Tidak diajukan' } },
}

/** Paket RUP pre-tender untuk Sinyal Awal RUP (RAD-05) */
export interface RupPaket { id: string; nama: string; pemilik: string; accountId: string; pagu: number; rencana: string; divisi: Divisi; sbu: string; keyakinan: number; sinyal: string; sumber: string; dipantau: boolean; lokasi: string }
export const buatRup = (): RupPaket[] => [
  { id: 'r1', nama: 'Preservasi Jalan Nasional Ruas P–Q 2027', pemilik: 'BBPJN X', accountId: 'a1', pagu: 165, rencana: 'Januari 2027', divisi: 'Infrastruktur 1', sbu: 'SI001 Jalan', keyakinan: 0.88, sinyal: 'Paket serupa ditender setiap tahun pada kuartal I; SBU cocok', sumber: 'SiRUP, kode RUP 41822019', dipantau: true, lokasi: 'Sumatera Utara' },
  { id: 'r2', nama: 'Duplikasi Jembatan Sungai R', pemilik: 'Dinas PUPR Provinsi Z', accountId: 'a2', pagu: 118, rencana: 'Februari 2027', divisi: 'Infrastruktur 1', sbu: 'SI002 Jembatan', keyakinan: 0.81, sinyal: 'Metode tender terbuka; pengalaman bentang panjang tersedia', sumber: 'SiRUP, kode RUP 41830377', dipantau: false, lokasi: 'Kalimantan Timur' },
  { id: 'r3', nama: 'Pembangunan RS Pratama Wilayah Selatan', pemilik: 'Pemerintah Provinsi B', accountId: 'a7', pagu: 96, rencana: 'Maret 2027', divisi: 'Gedung', sbu: 'BG004 Gedung Kesehatan', keyakinan: 0.74, sinyal: 'Pemilik proyek aktif membangun fasilitas kesehatan', sumber: 'SiRUP, kode RUP 41844561', dipantau: false, lokasi: 'Sulawesi Selatan' },
  { id: 'r4', nama: 'Rehabilitasi Bendung Way R', pemilik: 'BBWS Mesuji', accountId: 'a5', pagu: 52, rencana: 'April 2027', divisi: 'Infrastruktur 2', sbu: 'SI003 Sumber Daya Air', keyakinan: 0.63, sinyal: 'Sumber dana belum final; perlu dicek manual', sumber: 'SiRUP, kode RUP 41851204', dipantau: false, lokasi: 'Lampung' },
]
