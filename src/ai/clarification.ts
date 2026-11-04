import type { Clarification, Tender } from '@/domain/types'
import type { AiResult } from './registry'

export const DIFF_DURASI_MS = 2200

/** CLR-02: keluaran diff disimpan di workspace saat adendum diterapkan. */
export const metaDiff = { keyakinan: 0.91, sumber: ['Adendum 1 (8 halaman)', 'Dokumen pemilihan versi awal'] }

/** CLR-03: draf jawaban wajib direview sebelum dikirim. */
export function drafKlarifikasi(q: Clarification, t: Tender): AiResult<string> {
  return {
    hasil: `Terkait "${q.pertanyaan}", kami menyampaikan bahwa penawaran untuk ${t.nama} tetap mengikuti dokumen pemilihan dan adendum yang berlaku. Dokumen pendukung kami lampirkan sebagai bukti.`,
    keyakinan: 0.72,
    sumber: ['Dokumen pemilihan, hal. 14', 'Penawaran versi terakhir'],
  }
}
