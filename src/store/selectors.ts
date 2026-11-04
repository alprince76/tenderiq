import { ALASAN_KALAH, HASIL_DIVISI, OBJECTIVE_DIVISI } from '@/data/history'
import { RIWAYAT_AKUN } from '@/data/accounts'
import type { Divisi, Segmen, Tender, Workspace } from '@/domain/types'
import { DIVISI, SEGMEN } from '@/domain/types'
import { FUNNEL, STATUS_AKTIF } from '@/domain/transitions'
import { HARI_INI, selisihHari } from '@/domain/format'
import { itemKurangAktif } from '@/domain/transitions'

export type FilterDivisi = Divisi | 'Semua'
export const cocokDivisi = (f: FilterDivisi) => (d: Divisi) => f === 'Semua' || d === f
export const divisiTerpilih = (f: FilterDivisi, izin: Divisi[]) => DIVISI.filter((d) => izin.includes(d) && cocokDivisi(f)(d))

export function hasilPerDivisi(d: Divisi, tenders: Tender[]) {
  const seg = HASIL_DIVISI[d].segmen
  let ikut = 0, menang = 0
  for (const s of SEGMEN) { ikut += seg[s][0]; menang += seg[s][1] }
  let nkb = HASIL_DIVISI[d].nkb
  for (const t of tenders) if (t.sesi && t.divisi === d && t.hasil) {
    ikut += 1
    if (t.hasil.hasil === 'Won') { menang += 1; nkb += t.hasil.nilaiKontrak ?? t.hps }
  }
  return { ikut, menang, win: ikut ? (menang / ikut) * 100 : 0, nkb }
}

export function winPerSegmen(divs: Divisi[], tenders: Tender[]) {
  return SEGMEN.map((s: Segmen) => {
    let ikut = 0, menang = 0
    for (const d of divs) { ikut += HASIL_DIVISI[d].segmen[s][0]; menang += HASIL_DIVISI[d].segmen[s][1] }
    for (const t of tenders) if (t.sesi && t.segmen === s && divs.includes(t.divisi) && t.hasil) { ikut += 1; if (t.hasil.hasil === 'Won') menang += 1 }
    return { segmen: s, ikut, menang, win: ikut ? (menang / ikut) * 100 : 0 }
  })
}

export const jumlahHistorisSegmen = (s: Segmen) => DIVISI.reduce((n, d) => n + HASIL_DIVISI[d].segmen[s][0], 0)

export function alasanKalah(divs: Divisi[], tenders: Tender[]) {
  const rows = ALASAN_KALAH.map((a) => ({ alasan: a.alasan, kategori: a.kategori, jumlah: divs.reduce((n, d) => n + a.jumlah[d], 0) }))
  for (const t of tenders) if (t.sesi && t.hasil?.hasil === 'Lost' && divs.includes(t.divisi)) {
    const r = rows.find((x) => x.alasan === t.hasil?.alasan)
    if (r) r.jumlah += 1
    else rows.push({ alasan: t.hasil.alasan ?? 'Lainnya', kategori: t.hasil.kategori ?? 'Kalah', jumlah: 1 })
  }
  rows.sort((a, b) => b.jumlah - a.jumlah)
  const total = divs.reduce((n, d) => { const h = hasilPerDivisi(d, tenders); return n + h.ikut - h.menang }, 0)
  return { rows, total }
}

export const tenderAktif = (ts: Tender[]) => ts.filter((t) => STATUS_AKTIF.includes(t.status))

export function funnel(ts: Tender[]) {
  return FUNNEL.map((status) => {
    const list = ts.filter((t) => t.status === status)
    return { status, jumlah: list.length, nilai: list.reduce((n, t) => n + t.hps, 0) }
  })
}

export const tenggat7Hari = (ts: Tender[]) =>
  ts.filter((t) => t.milestone && selisihHari(t.milestone.tanggal, HARI_INI) >= 0 && selisihHari(t.milestone.tanggal, HARI_INI) <= 7)
    .sort((a, b) => a.milestone!.tanggal.localeCompare(b.milestone!.tanggal))

export function persyaratanKurang(ts: Tender[], ws: Record<string, Workspace>) {
  const per = ts.map((t) => ({ t, n: ws[t.id]?.checklist.filter(itemKurangAktif).length ?? 0 })).filter((x) => x.n > 0)
  return { total: per.reduce((n, x) => n + x.n, 0), per }
}

export function riwayatAkun(accountId: string, tenders: Tender[]) {
  const lama = (RIWAYAT_AKUN[accountId] ?? []).map((r) => ({ ...r, tenderId: undefined as string | undefined }))
  const baru = tenders.filter((t) => t.accountId === accountId && ['Won', 'Handover', 'Executing', 'Closed', 'Lost'].includes(t.status)).map((t) => ({
    nama: t.nama, tahun: Number((t.hasil?.tanggal ?? t.batasPemasukan).slice(0, 4)), nilai: t.hps,
    hasil: (t.hasil?.hasil === 'Won' ? 'Menang' : t.hasil?.kategori === 'Gugur' ? 'Gugur' : 'Kalah') as 'Menang' | 'Kalah' | 'Gugur', tenderId: t.id as string | undefined,
  }))
  const rows = [...baru, ...lama].sort((a, b) => b.tahun - a.tahun)
  const menang = rows.filter((r) => r.hasil === 'Menang').length
  return { rows, ikut: rows.length, menang, win: rows.length ? (menang / rows.length) * 100 : 0 }
}

export type StatusObjective = 'Tercapai' | 'Sesuai jalur' | 'Perlu perhatian'
export interface BarisObjective {
  id: string
  nama: string
  baseline: number
  target: number
  aktual: number
  teksAktual: string
  teksTarget: string
  progres: number // 0-100, posisi dari baseline menuju target
  status: StatusObjective
}

function baris(id: string, nama: string, baseline: number, target: number, aktual: number, teksAktual: string, teksTarget: string): BarisObjective {
  const progres = Math.max(0, Math.min(100, ((aktual - baseline) / (target - baseline)) * 100))
  return { id, nama, baseline, target, aktual, teksAktual, teksTarget, progres, status: progres >= 100 ? 'Tercapai' : progres >= 60 ? 'Sesuai jalur' : 'Perlu perhatian' }
}

/** Progres North Star dan KR PRD §4 untuk divisi terpilih. */
export function progresObjective(divs: Divisi[], tenders: Tender[]): BarisObjective[] {
  if (divs.length === 0) return []
  const rata = (k: 'tertangkap' | 'waktuHari' | 'coverage') => divs.reduce((n, d) => n + OBJECTIVE_DIVISI[d][k], 0) / divs.length
  const hasil = divs.map((d) => hasilPerDivisi(d, tenders))
  const ikut = hasil.reduce((n, h) => n + h.ikut, 0)
  const menang = hasil.reduce((n, h) => n + h.menang, 0)
  const nkb = hasil.reduce((n, h) => n + h.nkb, 0)
  const base = divs.reduce((n, d) => n + OBJECTIVE_DIVISI[d].nkbTahunLalu, 0)
  const gugur = alasanKalah(divs, tenders).rows.filter((r) => r.kategori === 'Gugur').reduce((n, r) => n + r.jumlah, 0)
  const pct = (n: number, d = 1) => `${n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })}%`
  const naikNkb = ((nkb - base) / base) * 100
  const persenGugur = ikut ? (gugur / ikut) * 100 : 0
  const win = ikut ? (menang / ikut) * 100 : 0
  return [
    baris('NSM', 'Nilai Kontrak Baru', 0, 15, naikNkb, `+${pct(naikNkb)}`, '+15%'),
    baris('KR1', 'Tender relevan tertangkap', 70, 95, rata('tertangkap'), pct(rata('tertangkap'), 0), '≥ 95%'),
    baris('KR2', 'Gugur adm./kualifikasi', 15, 7, persenGugur, pct(persenGugur), '≤ 7%'),
    baris('KR3', 'Waktu susun penawaran', 14, 10, rata('waktuHari'), `${rata('waktuHari').toLocaleString('id-ID', { maximumFractionDigits: 1 })} hari`, '≤ 10 hari'),
    baris('KR4', 'Win rate', 20, 26, win, pct(win), '26%'),
    baris('KR5', 'Coverage tender', 0, 90, rata('coverage'), pct(rata('coverage'), 0), '≥ 90%'),
  ]
}
