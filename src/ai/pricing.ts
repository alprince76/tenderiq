import { HISTORI_HARGA } from '@/data/history'
import type { Tender } from '@/domain/types'
import { fmtAngka } from '@/domain/format'
import type { AiResult } from './registry'

export const jenisDariSbu = (sbu: string) => {
  const nama = sbu.replace(/^\S+\s/, '')
  return nama.startsWith('Gedung') ? 'Gedung' : nama
}

export interface TitikKurva { persenHps: number; peluang: number; margin: number }
export interface RekomendasiHarga { bawah: number; atas: number; titik: number; kurva: TitikKurva[]; pembanding: typeof HISTORI_HARGA; batasBawahHistoris: number }

/** PRC-02: rentang harga (% HPS) dan kurva peluang menang terhadap margin. */
export function rekomendasiHarga(t: Tender): AiResult<RekomendasiHarga> {
  const jenis = jenisDariSbu(t.sbu)
  const sejenis = HISTORI_HARGA.filter((h) => h.jenis === jenis)
  const pool = sejenis.length >= 2 ? sejenis : HISTORI_HARGA
  const pemenang = pool.map((p) => p.pemenang)
  const rata = pemenang.reduce((a, b) => a + b, 0) / pemenang.length
  const kurva: TitikKurva[] = []
  for (let p = 88; p <= 100; p += 1) {
    const peluang = Math.round(100 / (1 + Math.exp((p - rata) * 0.75)))
    kurva.push({ persenHps: p, peluang, margin: Math.round((p - 84) * 10) / 10 })
  }
  return {
    hasil: {
      bawah: Math.round((rata - 1) * 10) / 10,
      atas: Math.round((rata + 1) * 10) / 10,
      titik: Math.round(rata * 10) / 10,
      kurva,
      pembanding: pool.slice(0, 5),
      batasBawahHistoris: Math.min(...pemenang) - 3,
    },
    keyakinan: sejenis.length >= 2 ? 0.76 : 0.58,
    sumber: [`${pool.length} tender pembanding di Price History`, 'Pengumuman hasil tender publik'],
  }
}

export interface ItemHarga { kode: string; uraian: string; satuan: string; hargaSatuan: number; rataHistoris: number }
export const ITEM_HARGA: ItemHarga[] = [
  { kode: '6.3(5a)', uraian: 'Laston lapis aus AC-WC', satuan: 'ton', hargaSatuan: 1_480_000, rataHistoris: 1_465_000 },
  { kode: '6.3(6a)', uraian: 'Laston lapis antara AC-BC', satuan: 'ton', hargaSatuan: 1_390_000, rataHistoris: 1_402_000 },
  { kode: '5.1(1)', uraian: 'Lapis pondasi agregat kelas A', satuan: 'm³', hargaSatuan: 612_000, rataHistoris: 488_000 },
  { kode: '3.1(1a)', uraian: 'Galian biasa', satuan: 'm³', hargaSatuan: 96_000, rataHistoris: 101_000 },
  { kode: '7.1(5)', uraian: 'Beton mutu fc 30 MPa', satuan: 'm³', hargaSatuan: 1_560_000, rataHistoris: 1_518_000 },
  { kode: '7.3(1)', uraian: 'Baja tulangan BjTS 420', satuan: 'kg', hargaSatuan: 11_200, rataHistoris: 16_400 },
]

export const AMBANG_ANOMALI = 0.15

/** PRC-03: menandai harga satuan yang menyimpang lebih dari 15% dari rata-rata historis. */
export function cekAnomali(items: ItemHarga[]): AiResult<(ItemHarga & { selisih: number; anomali: boolean; catatan: string })[]> {
  return {
    hasil: items.map((i) => {
      const selisih = (i.hargaSatuan - i.rataHistoris) / i.rataHistoris
      const anomali = Math.abs(selisih) > AMBANG_ANOMALI
      const catatan = anomali ? (selisih > 0 ? 'Di atas kewajaran historis' : 'Di bawah kewajaran historis') : 'Wajar'
      return { ...i, selisih, anomali, catatan: `${catatan} (${selisih > 0 ? '+' : ''}${fmtAngka(selisih * 100, 1)}%)` }
    }),
    keyakinan: 0.82,
    sumber: ['Price History', 'BoQ_v3.xlsx'],
  }
}
