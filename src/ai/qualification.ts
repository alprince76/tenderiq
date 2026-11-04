import type { Kriteria, Segmen, Tender } from '@/domain/types'
import { fmtAngka } from '@/domain/format'
import type { AiResult } from './registry'

export const KRITERIA: { id: Kriteria; label: string; bantuan: string; bobot: number }[] = [
  { id: 'strategic', label: 'Strategic fit', bantuan: 'Kesesuaian dengan fokus divisi dan RKAP', bobot: 0.2 },
  { id: 'kapabilitas', label: 'Kapabilitas', bantuan: 'SBU, pengalaman sejenis, dan personel kunci', bobot: 0.3 },
  { id: 'kapasitas', label: 'Kapasitas personel/alat', bantuan: 'Ketersediaan pada periode pelaksanaan', bobot: 0.2 },
  { id: 'risiko', label: 'Risiko', bantuan: '5 = risiko rendah, 1 = risiko tinggi', bobot: 0.15 },
  { id: 'margin', label: 'Margin indikatif', bantuan: '5 = margin di atas target divisi', bobot: 0.15 },
]

export const MIN_HASIL_HISTORIS = 50

export interface WinProb {
  mode: 'model' | 'aturan'
  persen?: number
  skorAturan: number
  kategori: 'Rendah' | 'Sedang' | 'Tinggi'
  pendorong: string[]
  penghambat: string[]
}

export function nilaiTertimbang(skor: Record<Kriteria, number>) {
  return KRITERIA.reduce((n, k) => n + skor[k.id] * k.bobot, 0)
}

/** GNG-02. Di bawah 50 hasil historis, tampil scorecard berbasis aturan tanpa persentase (US-16). */
export function winProbability(t: Tender, skor: Record<Kriteria, number>, jumlahHistoris: number): AiResult<WinProb> {
  const w = nilaiTertimbang(skor)
  const skorAturan = Math.round((w / 5) * 100)
  const persen = Math.round(8 + ((w - 1) / 4) * 52 + (t.relevance - 50) * 0.12)
  const kategori = (jumlahHistoris >= MIN_HASIL_HISTORIS ? persen : skorAturan * 0.6) >= 45 ? 'Tinggi' : (jumlahHistoris >= MIN_HASIL_HISTORIS ? persen : skorAturan * 0.6) >= 25 ? 'Sedang' : 'Rendah'
  const nama: Record<Kriteria, string> = { strategic: 'Kesesuaian strategis', kapabilitas: 'Kapabilitas', kapasitas: 'Kapasitas personel dan alat', risiko: 'Profil risiko', margin: 'Margin indikatif' }
  const urut = KRITERIA.map((k) => k.id).sort((a, b) => skor[b] - skor[a])
  const pendorong = [t.alasan[1], t.alasan[0], `${nama[urut[0]]} dinilai ${skor[urut[0]]}/5`]
  const penghambat = [t.risiko.teks, `${nama[urut[4]]} dinilai ${skor[urut[4]]}/5`, 'Rata-rata 5 peserta per tender di segmen ini']
  return {
    hasil: { mode: jumlahHistoris >= MIN_HASIL_HISTORIS ? 'model' : 'aturan', persen, skorAturan, kategori, pendorong, penghambat },
    keyakinan: jumlahHistoris >= MIN_HASIL_HISTORIS ? 0.78 : 0.55,
    sumber: [`${jumlahHistoris} hasil tender historis segmen ${t.segmen}`, 'Form Go/No-Go'],
  }
}

export interface PrediksiPesaing { nama: string; peluangIkut: number; polaHarga: number; catatan: string }

const PESAING: Record<Segmen, PrediksiPesaing[]> = {
  Pemerintah: [
    { nama: 'PT Karya Nusantara', peluangIkut: 0.82, polaHarga: 92.3, catatan: 'Ikut 6 dari 8 tender sejenis di wilayah ini' },
    { nama: 'PT Bangun Lintas', peluangIkut: 0.67, polaHarga: 94.1, catatan: 'Sering peringkat 2–3 di pemilik proyek ini' },
    { nama: 'PT Graha Persada', peluangIkut: 0.41, polaHarga: 95.2, catatan: 'Baru masuk segmen ini sejak 2025' },
  ],
  BUMN: [
    { nama: 'PT Marga Samudra', peluangIkut: 0.74, polaHarga: 91.8, catatan: 'Pernah menang 2 paket pelabuhan' },
    { nama: 'PT Karya Nusantara', peluangIkut: 0.52, polaHarga: 93.4, catatan: 'Ikut 3 dari 6 tender BUMN sejenis' },
  ],
  Swasta: [{ nama: 'PT Bangun Lintas', peluangIkut: 0.6, polaHarga: 90.5, catatan: 'Harga agresif untuk proyek swasta' }],
  KPBU: [{ nama: 'PT Tol Mandala', peluangIkut: 0.85, polaHarga: 88.9, catatan: 'Pemenang 2 paket tol terakhir' }],
}

/** GNG-04: hanya memakai data hasil tender publik (PRD §3.5, UU 5/1999). */
export function competitorForecast(t: Tender): AiResult<PrediksiPesaing[]> {
  return {
    hasil: PESAING[t.segmen],
    keyakinan: 0.71,
    sumber: [`Hasil tender publik: ${t.pemilik}, ${t.lokasi}`, 'Competitor DB internal'],
  }
}

export const fmtPeluang = (n: number) => `${fmtAngka(n * 100)}%`
