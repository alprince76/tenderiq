import type { Assignment, ChecklistItem, ItemStatus, Pengalaman, Person, Sbu, Slot } from './types'
import { cariKonflik, pesanKonflik } from './conflicts'
import { fmtRp, fmtTanggal } from './format'

export interface ComplianceCtx {
  tenderId: string
  batas: string
  slots: Record<Slot, string | null>
  alasanKonflik: Partial<Record<Slot, string>>
  people: Person[]
  assignments: Assignment[]
  sbu: Sbu[]
  pengalaman: Pengalaman[]
}

export interface ComplianceResult { status: ItemStatus; keterangan: string; dokumen?: string }

/** Rule engine BID-04: dokumen berakhir sebelum batas pemasukan, konflik personel, nilai pengalaman. */
export function evaluasiItem(item: ChecklistItem, ctx: ComplianceCtx): ComplianceResult {
  const r = item.rule
  switch (r.tipe) {
    case 'naratif':
      return { status: 'Perlu dicek manual', keterangan: r.catatan }
    case 'dokumen':
      if (r.berlaku && r.berlaku < ctx.batas)
        return { status: 'Kurang', keterangan: `Berakhir ${fmtTanggal(r.berlaku)}, sebelum batas pemasukan` }
      return { status: 'Terpenuhi', keterangan: r.catatan }
    case 'sbu': {
      const s = ctx.sbu.find((x) => x.id === r.sbuId)
      if (!s) return { status: 'Kurang', keterangan: 'SBU tidak dimiliki entitas' }
      if (s.berlaku < ctx.batas)
        return { status: 'Kurang', keterangan: `Berakhir ${fmtTanggal(s.berlaku)}, sebelum batas pemasukan`, dokumen: s.file }
      return { status: 'Terpenuhi', keterangan: `Berlaku sampai ${fmtTanggal(s.berlaku)}`, dokumen: s.file }
    }
    case 'pengalaman': {
      const cocok = ctx.pengalaman
        .filter((p) => p.jenis === r.jenis && p.nilai >= r.minNilai)
        .sort((a, b) => b.bast.localeCompare(a.bast))[0]
      if (!cocok) return { status: 'Kurang', keterangan: `Tidak ada pengalaman ${r.jenis} minimal ${fmtRp(r.minNilai)}` }
      return { status: 'Terpenuhi', keterangan: `Nilai ${fmtRp(cocok.nilai)}, BAST ${fmtTanggal(cocok.bast)}`, dokumen: cocok.file }
    }
    case 'personel': {
      const id = ctx.slots[r.slot]
      const p = ctx.people.find((x) => x.id === id)
      if (!p) return { status: 'Kurang', keterangan: `Slot ${r.slot} belum diisi` }
      if (p.berlaku < ctx.batas)
        return { status: 'Kurang', keterangan: `SKK ${p.nama} berakhir ${fmtTanggal(p.berlaku)}, sebelum batas pemasukan`, dokumen: p.file }
      const konflik = cariKonflik(p.id, ctx.tenderId, ctx.assignments)
      if (konflik) {
        const alasan = ctx.alasanKonflik[r.slot]
        if (!alasan) return { status: 'Kurang', keterangan: pesanKonflik(p.nama, konflik, fmtTanggal), dokumen: p.file }
        return { status: 'Perlu dicek manual', keterangan: `Konflik penugasan dengan alasan tercatat: ${alasan}`, dokumen: p.file }
      }
      return { status: 'Terpenuhi', keterangan: `${p.nama}, SKK berlaku sampai ${fmtTanggal(p.berlaku)}`, dokumen: p.file }
    }
  }
}

export function cekKepatuhan(items: ChecklistItem[], ctx: ComplianceCtx): ChecklistItem[] {
  return items.map((item) => {
    const hasil = evaluasiItem(item, ctx)
    if (item.perluReview) return { ...item, status: 'Perlu review', keterangan: item.dampakAdendum ?? 'Terdampak adendum', dokumen: hasil.dokumen ?? item.dokumen }
    return { ...item, status: hasil.status, keterangan: hasil.keterangan, dokumen: hasil.dokumen ?? item.dokumen }
  })
}

export function ringkasStatus(items: ChecklistItem[]) {
  const n = (s: ItemStatus) => items.filter((i) => i.status === s).length
  return { total: items.length, terpenuhi: n('Terpenuhi'), kurang: n('Kurang'), manual: n('Perlu dicek manual'), review: n('Perlu review'), belum: n('Belum dicek') }
}
