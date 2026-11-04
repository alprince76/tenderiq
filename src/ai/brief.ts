import type { Tender } from '@/domain/types'
import { fmtRp, fmtTanggal } from '@/domain/format'
import type { AiResult } from './registry'

/** INS-03: ringkasan mingguan untuk manajemen, dihitung dari data saat ini. */
export function weeklyBrief(ts: Tender[], tenggat: Tender[], kurang: number): AiResult<string[]> {
  const baru = ts.filter((t) => t.status === 'Discovered' && t.relevance >= 70)
  const top = [...baru].sort((a, b) => b.relevance - a.relevance)[0]
  const dekat = tenggat[0]
  return {
    hasil: [
      `Peluang baru: ${baru.length} tender relevan${top ? `, tertinggi ${top.nama} (skor ${top.relevance}, ${fmtRp(top.hps)})` : ''}.`,
      dekat ? `Risiko tenggat: ${tenggat.length} tenggat dalam 7 hari, terdekat ${dekat.nama} pada ${fmtTanggal(dekat.milestone!.tanggal)}.` : 'Risiko tenggat: tidak ada tenggat dalam 7 hari.',
      `Kepatuhan: ${kurang} persyaratan wajib berstatus Kurang perlu ditangani sebelum penawaran diunggah.`,
      top ? `Rekomendasi fokus: percepat keputusan Go/No-Go ${top.nama}.` : 'Rekomendasi fokus: selesaikan persyaratan yang masih Kurang.',
    ],
    keyakinan: 0.81,
    sumber: ['Dashboard Pipeline', 'Checklist kepatuhan'],
  }
}
