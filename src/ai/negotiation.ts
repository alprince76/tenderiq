import type { Negotiation } from '@/domain/types'
import { fmtAngka, fmtRp } from '@/domain/format'
import type { AiResult } from './registry'

export const hitungMargin = (harga: number, biaya: number) => Math.round(((harga - biaya) / harga) * 1000) / 10

/** NEG-02: dampak konsesi terhadap margin dan poin argumen. Bukan keputusan; hanya bahan pertimbangan. */
export function negotiationCopilot(n: Negotiation, usulanHarga: number): AiResult<{ margin: number; sisa: number; poin: string[] }> {
  const margin = hitungMargin(usulanHarga, n.biaya)
  return {
    hasil: {
      margin,
      sisa: Math.round((margin - n.batasMargin) * 10) / 10,
      poin: [
        `Harga ${fmtRp(usulanHarga)} memberi margin ${fmtAngka(margin, 1)}% terhadap batas ${fmtAngka(n.batasMargin, 1)}%.`,
        'Pada Tahap I harga disepakati di 92,9% HPS; rujukan ini dapat dipakai sebagai pembanding.',
        'Tawarkan percepatan jadwal 2 minggu sebelum menurunkan harga lebih lanjut.',
      ],
    },
    keyakinan: 0.7,
    sumber: ['Log negosiasi Dermaga Tahap I', 'Price History'],
  }
}
