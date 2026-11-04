import type { Approval, ChecklistItem, Status, Workspace } from './types'

export const STATUS_LABEL: Record<Status, string> = {
  Discovered: 'Baru ditemukan',
  Qualifying: 'Kualifikasi',
  NoGo: 'No-Go',
  Preparing: 'Penyusunan penawaran',
  ReadyToSubmit: 'Siap diunggah',
  Submitted: 'Sudah diunggah',
  UnderEvaluation: 'Evaluasi',
  Negotiation: 'Negosiasi',
  Won: 'Menang',
  Lost: 'Kalah',
  Cancelled: 'Dibatalkan',
  Handover: 'Serah terima',
  Executing: 'Pelaksanaan',
  Closed: 'Selesai (BAST)',
}

export const STATUS_AKTIF: Status[] = ['Qualifying', 'Preparing', 'ReadyToSubmit', 'Submitted', 'UnderEvaluation', 'Negotiation']
export const FUNNEL: Status[] = ['Discovered', 'Qualifying', 'Preparing', 'ReadyToSubmit', 'Submitted', 'UnderEvaluation', 'Negotiation', 'Won', 'Lost']

/** State machine PRD §9.4 */
const TRANSISI: Record<Status, Status[]> = {
  Discovered: ['Qualifying'],
  Qualifying: ['Preparing', 'NoGo'],
  NoGo: [],
  Preparing: ['ReadyToSubmit', 'Cancelled'],
  ReadyToSubmit: ['Submitted', 'Preparing', 'Cancelled'],
  Submitted: ['UnderEvaluation', 'Won', 'Lost', 'Cancelled'],
  UnderEvaluation: ['Negotiation', 'Won', 'Lost', 'Cancelled'],
  Negotiation: ['Won', 'Lost', 'Cancelled'],
  Won: ['Handover'],
  Lost: [],
  Cancelled: [],
  Handover: ['Executing'],
  Executing: ['Closed'],
  Closed: [],
}
export const bisaTransisi = (dari: Status, ke: Status) => TRANSISI[dari].includes(ke)

/** Ambang matriks kewenangan: <= Rp100 M cukup GM Divisi; di atasnya GM lalu Direktur. */
export const BATAS_GM_MILIAR = 100
export function rantaiApproval(hpsMiliar: number): Approval[] {
  const gm: Approval = { peran: 'GM Divisi', nama: 'Hendra Wijaya', status: 'Menunggu' }
  if (hpsMiliar <= BATAS_GM_MILIAR) return [gm]
  return [gm, { peran: 'Direktur Operasi', nama: 'Suryo Adiwijaya', status: 'Menunggu' }]
}
export const approvalSelesai = (a: Approval[]) => a.length > 0 && a.every((x) => x.status === 'Disetujui')
export const approvalBerikutnya = (a: Approval[]) => a.find((x) => x.status === 'Menunggu')

export const itemKurangAktif = (i: ChecklistItem) => i.wajib && i.status === 'Kurang' && !i.override
export const itemReviewAktif = (i: ChecklistItem) => i.wajib && i.perluReview

/** Guard Preparing -> Ready to Submit. Mengembalikan alasan pemblokir; kosong berarti boleh lanjut. */
export function alasanBlokirReady(ws: Workspace): string[] {
  const alasan: string[] = []
  if (ws.tahapChecklist !== 'dikonfirmasi') alasan.push('Checklist belum dibuat dan dikonfirmasi')
  else if (!ws.dicekPada) alasan.push('Cek Kepatuhan belum dijalankan')
  const kurang = ws.checklist.filter(itemKurangAktif).length
  if (kurang > 0) alasan.push(`Masih ada ${kurang} persyaratan wajib berstatus Kurang`)
  const review = ws.checklist.filter(itemReviewAktif).length
  if (review > 0) alasan.push(`${review} persyaratan wajib terdampak adendum belum ditinjau`)
  if (!ws.hargaDisetujui) alasan.push('Harga penawaran belum disetujui')
  return alasan
}
