import type { Alat, Assignment, Pengalaman, Person, Sbu } from '@/domain/types'

export const buatSbu = (): Sbu[] => [
  { id: 's1', kode: 'SI001', nama: 'Jalan', kualifikasi: 'Besar (B2)', berlaku: '2028-06-18', file: 'SBU_SI001_2028.pdf' },
  { id: 's2', kode: 'SI002', nama: 'Jembatan', kualifikasi: 'Besar (B2)', berlaku: '2028-03-02', file: 'SBU_SI002_2028.pdf' },
  { id: 's3', kode: 'SI003', nama: 'Sumber Daya Air', kualifikasi: 'Besar (B1)', berlaku: '2027-01-14', file: 'SBU_SI003_2027.pdf' },
  { id: 's4', kode: 'SI005', nama: 'Pelabuhan', kualifikasi: 'Besar (B1)', berlaku: '2026-12-20', file: 'SBU_SI005_2026.pdf' },
  { id: 's5', kode: 'BG004', nama: 'Gedung Kesehatan', kualifikasi: 'Besar (B1)', berlaku: '2027-09-30', file: 'SBU_BG004_2027.pdf' },
]

export const buatPersonel = (): Person[] => [
  { id: 'p1', nama: 'Bambang Sutrisno', peran: ['Manajer Pelaksanaan'], skk: 'Ahli Madya Manajemen Pelaksanaan', berlaku: '2026-11-15', pengalamanTahun: 12, proyekSejenis: 5, file: 'SKK_Bambang.pdf' },
  { id: 'p2', nama: 'Yusuf Ramadhan', peran: ['Ahli K3'], skk: 'Ahli Madya K3 Konstruksi', berlaku: '2027-09-12', pengalamanTahun: 9, proyekSejenis: 4, file: 'SKK_Yusuf.pdf' },
  { id: 'p3', nama: 'Wahyu Nugroho', peran: ['Manajer Teknik'], skk: 'Ahli Madya Teknik Jalan', berlaku: '2028-02-20', pengalamanTahun: 11, proyekSejenis: 6, file: 'SKK_Wahyu.pdf' },
  { id: 'p4', nama: 'Agus Wibowo', peran: ['Ahli K3'], skk: 'Ahli Madya K3 Konstruksi', berlaku: '2028-03-12', pengalamanTahun: 10, proyekSejenis: 5, file: 'SKK_Agus.pdf' },
  { id: 'p5', nama: 'Rudi Hartono', peran: ['Ahli K3'], skk: 'Ahli Madya K3 Konstruksi', berlaku: '2027-08-05', pengalamanTahun: 8, proyekSejenis: 3, file: 'SKK_Rudi.pdf' },
  { id: 'p6', nama: 'Siti Aminah', peran: ['Ahli K3'], skk: 'Ahli Muda K3 Konstruksi', berlaku: '2027-01-20', pengalamanTahun: 6, proyekSejenis: 2, file: 'SKK_Siti.pdf' },
  { id: 'p7', nama: 'Irwan Setiawan', peran: ['Manajer Pelaksanaan', 'Manajer Teknik'], skk: 'Ahli Madya Manajemen Pelaksanaan', berlaku: '2028-10-08', pengalamanTahun: 14, proyekSejenis: 7, file: 'SKK_Irwan.pdf' },
  { id: 'p8', nama: 'Dimas Prakoso', peran: ['Manajer Pelaksanaan'], skk: 'Ahli Madya Manajemen Pelaksanaan', berlaku: '2027-06-14', pengalamanTahun: 13, proyekSejenis: 6, file: 'SKK_Dimas.pdf' },
  { id: 'p9', nama: 'Lestari Putri', peran: ['Manajer Pelaksanaan', 'Manajer Teknik'], skk: 'Ahli Utama Manajemen Konstruksi', berlaku: '2028-03-30', pengalamanTahun: 16, proyekSejenis: 4, file: 'SKK_Lestari.pdf' },
  { id: 'p10', nama: 'Fajar Hidayat', peran: ['Manajer Teknik'], skk: 'Ahli Muda Teknik Jalan', berlaku: '2026-11-24', pengalamanTahun: 7, proyekSejenis: 3, file: 'SKK_Fajar.pdf' },
]

export const buatAssignments = (): Assignment[] => [
  { personId: 'p2', tenderId: 't02', proyek: 'Tender Jembatan Sungai Z', sampai: '2026-11-25', status: 'diajukan' },
  { personId: 'p6', proyek: 'Proyek Jembatan Sungai Q', sampai: '2026-11-30', status: 'aktif' },
  { personId: 'p8', tenderId: 't05', proyek: 'Tender Flyover Simpang D', sampai: '2026-12-04', status: 'diajukan' },
]

export const buatAlat = (): Alat[] => [
  { id: 'e1', nama: 'Asphalt Mixing Plant 60 TPH', kepemilikan: 'Milik', jumlah: 2, lokasi: 'Medan', berlaku: '2027-11-30', dokumen: 'Sertifikat laik operasi' },
  { id: 'e2', nama: 'Asphalt Finisher', kepemilikan: 'Milik', jumlah: 4, lokasi: 'Medan', berlaku: '2027-04-18', dokumen: 'Sertifikat laik operasi' },
  { id: 'e3', nama: 'Crane 100 ton', kepemilikan: 'Sewa', jumlah: 1, lokasi: 'Balikpapan', berlaku: '2026-12-22', dokumen: 'Surat perjanjian sewa' },
  { id: 'e4', nama: 'Excavator PC200', kepemilikan: 'Milik', jumlah: 8, lokasi: 'Bandar Lampung', berlaku: '2027-07-01', dokumen: 'Sertifikat laik operasi' },
  { id: 'e5', nama: 'Tandem Roller', kepemilikan: 'Milik', jumlah: 6, lokasi: 'Medan', berlaku: '2026-10-31', dokumen: 'Sertifikat laik operasi' },
  { id: 'e6', nama: 'Pile Driver Hydraulic', kepemilikan: 'Sewa', jumlah: 2, lokasi: 'Surabaya', berlaku: '2027-02-15', dokumen: 'Surat perjanjian sewa' },
]

export const buatPengalaman = (): Pengalaman[] => [
  { id: 'x1', nama: 'Preservasi Jalan Lintas Barat Seksi 2', pemilik: 'BBPJN X', jenis: 'Jalan', nilai: 168, bast: '2024-08-20', file: 'Kontrak_PJN_2023.pdf' },
  { id: 'x2', nama: 'Pelebaran Jalan Nasional Ruas S–T', pemilik: 'BBPJN X', jenis: 'Jalan', nilai: 124, bast: '2025-11-14', file: 'Kontrak_PJN_2024.pdf' },
  { id: 'x3', nama: 'Jembatan Sungai L (bentang 72 m)', pemilik: 'Dinas PUPR Provinsi Z', jenis: 'Jembatan', nilai: 82, bast: '2025-12-02', file: 'Kontrak_JBT_2024.pdf' },
  { id: 'x4', nama: 'Dermaga Pelabuhan Y Tahap I', pemilik: 'BUMN Pelabuhan', jenis: 'Pelabuhan', nilai: 158, bast: '2026-03-30', file: 'Kontrak_DMG_2024.pdf' },
  { id: 'x5', nama: 'Gedung RSUD Tipe C', pemilik: 'Pemerintah Provinsi B', jenis: 'Gedung', nilai: 132, bast: '2026-01-25', file: 'Kontrak_RSU_2024.pdf' },
  { id: 'x6', nama: 'Saluran Primer Way M', pemilik: 'BBWS Mesuji', jenis: 'Sumber Daya Air', nilai: 39, bast: '2025-06-10', file: 'Kontrak_SDA_2024.pdf' },
]
