const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** "Hari ini" dibekukan agar status kedaluwarsa dan hitung mundur stabil saat demo. */
export const HARI_INI = '2026-11-04'

export const parseTanggal = (iso: string) => new Date(`${iso}T00:00:00`)

export function fmtTanggal(iso?: string): string {
  if (!iso) return '-'
  const d = parseTanggal(iso)
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export const fmtAngka = (n: number, desimal = 0) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: desimal, maximumFractionDigits: desimal })

/** Nilai dalam miliar rupiah: 142 -> Rp142 M, 1200 -> Rp1,2 T */
export function fmtRp(miliar: number): string {
  if (miliar >= 1000) {
    const t = miliar / 1000
    return `Rp${fmtAngka(t, Number.isInteger(t) ? 0 : t * 10 % 1 === 0 ? 1 : 2)} T`
  }
  return `Rp${fmtAngka(miliar, Number.isInteger(miliar) ? 0 : 1)} M`
}

/** 142 -> Rp142.000.000.000 */
export const fmtRpPenuh = (miliar: number) => `Rp${Math.round(miliar * 1e9).toLocaleString('id-ID')}`

export const fmtPersen = (n: number, desimal = 1) => `${fmtAngka(n, desimal)}%`
export const fmtKeyakinan = (n: number) => fmtAngka(n, 2)

export function selisihHari(iso: string, dari = HARI_INI): number {
  return Math.round((parseTanggal(iso).getTime() - parseTanggal(dari).getTime()) / 86400000)
}

export function tambahHari(iso: string, hari: number): string {
  const d = parseTanggal(iso)
  d.setDate(d.getDate() + hari)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export type StatusBerlaku = 'Berlaku' | 'Akan berakhir' | 'Kedaluwarsa'
export function statusBerlaku(iso: string, dari = HARI_INI): StatusBerlaku {
  const h = selisihHari(iso, dari)
  if (h < 0) return 'Kedaluwarsa'
  return h <= 60 ? 'Akan berakhir' : 'Berlaku'
}
