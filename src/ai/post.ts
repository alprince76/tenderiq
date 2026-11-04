import type { Account, Tender } from '@/domain/types'
import { fmtRp } from '@/domain/format'
import type { AiResult } from './registry'

/** AWD-03: draf untuk review Legal; pengajuan tetap dilakukan manusia. */
export function sanggahAssistant(t: Tender): AiResult<{ dasar: string[]; draf: string }> {
  const r = t.hasil
  return {
    hasil: {
      dasar: [
        `Alasan hasil: "${r?.alasan ?? 'belum tercatat'}", dibandingkan dengan kriteria evaluasi di dokumen pemilihan hal. 28.`,
        'Metode evaluasi harga yang diumumkan perlu dicocokkan dengan LDP hal. 29.',
      ],
      draf: `Bersama ini kami menyampaikan sanggah atas hasil pemilihan paket ${t.nama}. Berdasarkan dokumen pemilihan hal. 28–29, kami meminta penjelasan penerapan kriteria evaluasi terhadap penawaran kami.`,
    },
    keyakinan: 0.69,
    sumber: ['Dokumen pemilihan, hal. 28–29', 'Pengumuman hasil tender'],
  }
}

/** AWD-04 */
export function winLossAnalysis(t: Tender): AiResult<{ faktor: string[]; pelajaran: string }> {
  const menang = t.hasil?.hasil === 'Won'
  const lawan = t.hasil?.peserta.find((p) => p.peringkat === 1 && p.nama !== 'Entitas kami')
  const kita = t.hasil?.peserta.find((p) => p.nama === 'Entitas kami')
  const selisih = lawan && kita ? ` Harga kita ${fmtRp(kita.harga)}, pemenang ${fmtRp(lawan.harga)}.` : ''
  return {
    hasil: {
      faktor: menang
        ? [t.alasan[0], t.alasan[1], 'Harga berada dalam rentang rekomendasi']
        : [t.hasil?.alasan ?? 'Alasan belum tercatat', t.risiko.teks, `Persaingan ketat di segmen ${t.segmen}.${selisih}`],
      pelajaran: menang ? 'Pertahankan personel dan pendekatan harga yang sama untuk paket berikutnya di akun ini.' : 'Cek masa berlaku dan harga pembanding lebih awal pada tender sejenis.',
    },
    keyakinan: 0.75,
    sumber: ['Pencatatan hasil tender', 'Competitor DB'],
  }
}

/** CRM-04: ringkasan kesehatan akun */
export function accountInsight(akun: Account, win: number, jumlah: number, interaksiTerakhir?: string): AiResult<{ status: 'Sehat' | 'Perlu perhatian' | 'Berisiko'; ringkasan: string }> {
  const status = win >= 30 && interaksiTerakhir ? 'Sehat' : win >= 15 ? 'Perlu perhatian' : 'Berisiko'
  return {
    hasil: { status, ringkasan: `${akun.nama}: ${jumlah} tender tercatat dengan win rate ${Math.round(win)}%. ${interaksiTerakhir ? `Interaksi terakhir ${interaksiTerakhir}.` : 'Belum ada interaksi tercatat.'} ${status === 'Sehat' ? 'Jaga ritme kunjungan bulanan.' : 'Jadwalkan kunjungan dengan pengambil keputusan.'}` },
    keyakinan: 0.73,
    sumber: ['Riwayat tender akun', 'Log interaksi'],
  }
}

const normal = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
const singkatan = (s: string) => s.split(/\s+/).map((w) => (/^[A-Z]/.test(w) ? w[0] : '')).join('').toLowerCase()

/** CRM-04: deteksi akun duplikat, termasuk nama panjang dan singkatan. */
export function cariDuplikat(nama: string, akun: Account[]): Account | undefined {
  const n = normal(nama)
  if (!n) return undefined
  return akun.find((a) => normal(a.nama) === n || (a.alias && normal(a.alias) === n) || singkatan(nama) === normal(a.nama).replace(/\s+/g, ''))
}
