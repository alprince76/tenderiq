import type { Tender } from '@/domain/types'
import { HALAMAN_GAGAL_OCR } from '@/data/checklist'
import type { AiResult } from './registry'

export const EKSTRAK_DURASI_MS = 3000

/** BID-03: metadata hasil ekstraksi. Isi checklist ada di data/checklist.ts */
export function metaEkstraksi(total: number, rendah: number): AiResult<{ total: number; rendah: number; halamanGagal: string }> {
  return {
    hasil: { total, rendah, halamanGagal: HALAMAN_GAGAL_OCR },
    keyakinan: 0.89,
    sumber: ['Dokumen pemilihan (312 halaman)', 'KAK (64 halaman)'],
  }
}

/** BID-05: setiap paragraf menyertakan rujukan sumber (RAG). */
export function draftMetode(t: Tender): AiResult<{ judul: string; isi: { teks: string; sumber: string }[] }> {
  return {
    hasil: {
      judul: `Draf metode pelaksanaan: ${t.nama}`,
      isi: [
        { teks: `Pekerjaan dimulai dengan mobilisasi alat utama dan survei kondisi awal di ${t.lokasi}, dilanjutkan penyusunan gambar kerja bersama pengawas.`, sumber: 'Penawaran menang: Preservasi Jalan Lintas Barat Seksi 2, hal. 18' },
        { teks: 'Pekerjaan utama dibagi per segmen agar lalu lintas tetap berjalan, dengan pengaturan buka tutup dan rambu sementara pada setiap segmen.', sumber: 'Template metode pelaksanaan v3, bagian 4' },
        { teks: 'Pengendalian mutu dilakukan melalui uji material sebelum pemakaian dan uji hasil pekerjaan pada setiap tahap, dicatat dalam laporan harian.', sumber: 'Penawaran menang: Pelebaran Jalan Nasional Ruas S–T, hal. 24' },
        { teks: `Risiko utama "${t.risiko.teks.toLowerCase()}" ditangani dengan penugasan personel berpengalaman dan rencana cadangan yang disepakati di awal.`, sumber: t.risiko.sumber },
      ],
    },
    keyakinan: 0.77,
    sumber: ['Knowledge base penawaran internal', 'Template metode pelaksanaan v3'],
  }
}

export interface CalonKso { nama: string; pelengkap: string; riwayat: string; skor: number }

/** BID-08: calon mitra untuk menutup celah kapabilitas. */
export function ksoFinder(t: Tender): AiResult<CalonKso[]> {
  return {
    hasil: [
      { nama: 'PT Graha Persada', pelengkap: `Memiliki ${t.sbu}`, riwayat: 'Pemenang 2 tender sejenis (data publik)', skor: 0.84 },
      { nama: 'PT Bumi Konstruksi', pelengkap: `Memiliki ${t.sbu} dan pengalaman di ${t.lokasi}`, riwayat: 'KSO bersama kita pada 2024', skor: 0.79 },
      { nama: 'PT Cipta Mandiri', pelengkap: `Memiliki ${t.sbu}`, riwayat: 'Peringkat 2 pada 3 tender terakhir (data publik)', skor: 0.63 },
    ],
    keyakinan: 0.74,
    sumber: ['Riwayat KSO internal', 'Data publik pemenang tender sejenis'],
  }
}
