import type { Tender } from '@/domain/types'
import type { AiResult } from './registry'

/** RAD-03: hard filter SBU membatasi skor maksimal 30 (US-02). */
export function relevanceScore(skorModel: number, sbuDimiliki: boolean): number {
  return sbuDimiliki ? skorModel : Math.min(skorModel, 30)
}

export const sbuDimilikiEntitas = (t: Pick<Tender, 'sbu'>, kodeDimiliki: string[]) =>
  kodeDimiliki.includes(t.sbu.split(' ')[0])

/** RAD-04: ringkasan satu layar. */
export function ringkasanTender(t: Tender): AiResult<{ lingkup: string; kunci: string[]; alasan: string[]; risiko: string; rujukan: string }> {
  return {
    hasil: { lingkup: t.lingkup, kunci: t.persyaratanKunci, alasan: t.alasan, risiko: t.risiko.teks, rujukan: t.risiko.sumber },
    keyakinan: t.id === 't01' ? 0.86 : 0.8,
    sumber: [t.risiko.sumber, 'Dokumen pemilihan, hal. 12–15'],
  }
}
