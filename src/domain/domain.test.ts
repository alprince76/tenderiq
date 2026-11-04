import { describe, expect, it } from 'vitest'
import { buatChecklist } from '@/data/checklist'
import { buatAssignments, buatPengalaman, buatPersonel, buatSbu } from '@/data/capability'
import { relevanceScore } from '@/ai/radar'
import { winProbability } from '@/ai/qualification'
import { cariDuplikat } from '@/ai/post'
import { buatAkun } from '@/data/accounts'
import { buatTenders } from '@/data/tenders'
import { PERSONAS } from '@/data/org'
import { jawabCopilot } from '@/ai/copilot'
import { DAFTAR_LAPORAN, buatLaporan, laporanKeTeks, ringkasObjective } from '@/ai/reports'
import { progresObjective } from '@/store/selectors'
import { cekKepatuhan, ringkasStatus } from './compliance'
import type { ComplianceCtx } from './compliance'
import { cariKonflik, rekomendasiPersonel } from './conflicts'
import { fmtRp, fmtRpPenuh, fmtTanggal, statusBerlaku } from './format'
import { alasanBlokirReady, approvalSelesai, bisaTransisi, rantaiApproval } from './transitions'
import { DIVISI } from './types'
import type { Divisi, Slot, Workspace } from './types'

const people = buatPersonel()
const assignments = buatAssignments()
const slotAwal: Record<Slot, string | null> = { 'Manajer Pelaksanaan': 'p1', 'Manajer Teknik': 'p3', 'Ahli K3': 'p2' }
const ctx = (slots = slotAwal, batas = '2026-11-21'): ComplianceCtx => ({ tenderId: 't01', batas, slots, alasanKonflik: {}, people, assignments, sbu: buatSbu(), pengalaman: buatPengalaman() })

describe('format', () => {
  it('rupiah sesuai format Indonesia', () => {
    expect(fmtRp(142)).toBe('Rp142 M')
    expect(fmtRp(1200)).toBe('Rp1,2 T')
    expect(fmtRp(2000)).toBe('Rp2 T')
    expect(fmtRpPenuh(142)).toBe('Rp142.000.000.000')
  })
  it('tanggal sesuai format Indonesia', () => {
    expect(fmtTanggal('2026-11-21')).toBe('21 Nov 2026')
    expect(fmtTanggal('2027-08-05')).toBe('5 Agu 2027')
  })
  it('status masa berlaku', () => {
    expect(statusBerlaku('2026-10-31')).toBe('Kedaluwarsa')
    expect(statusBerlaku('2026-11-15')).toBe('Akan berakhir')
    expect(statusBerlaku('2028-06-18')).toBe('Berlaku')
  })
})

describe('compliance', () => {
  it('checklist Preservasi menghasilkan 42 item: 33/2/7', () => {
    const r = ringkasStatus(cekKepatuhan(buatChecklist(), ctx()))
    expect(r).toMatchObject({ total: 42, terpenuhi: 33, kurang: 2, manual: 7 })
  })
  it('SKK yang berakhir sebelum batas pemasukan berstatus Kurang dengan tanggalnya', () => {
    const hasil = cekKepatuhan(buatChecklist(), ctx())
    const item = hasil.find((i) => i.teks.startsWith('SKK Manajer Pelaksanaan'))!
    expect(item.status).toBe('Kurang')
    expect(item.keterangan).toContain('15 Nov 2026')
  })
  it('mengganti personel menghapus status Kurang', () => {
    const r = ringkasStatus(cekKepatuhan(buatChecklist(), ctx({ 'Manajer Pelaksanaan': 'p7', 'Manajer Teknik': 'p3', 'Ahli K3': 'p4' })))
    expect(r.kurang).toBe(0)
    expect(r.terpenuhi).toBe(35)
  })
  it('batas pemasukan baru memicu kedaluwarsa pada personel yang tadinya sah', () => {
    const slots: Record<Slot, string | null> = { 'Manajer Pelaksanaan': 'p7', 'Manajer Teknik': 'p10', 'Ahli K3': 'p4' }
    expect(ringkasStatus(cekKepatuhan(buatChecklist(), ctx(slots, '2026-11-21'))).kurang).toBe(0)
    expect(ringkasStatus(cekKepatuhan(buatChecklist(), ctx(slots, '2026-11-28'))).kurang).toBe(1)
  })
  it('konflik dengan alasan tercatat tidak memblokir tetapi perlu dicek', () => {
    const c = { ...ctx({ 'Manajer Pelaksanaan': 'p7', 'Manajer Teknik': 'p3', 'Ahli K3': 'p2' }), alasanKonflik: { 'Ahli K3': 'Tender Z selesai sebelum mobilisasi' } }
    const r = ringkasStatus(cekKepatuhan(buatChecklist(), c))
    expect(r.kurang).toBe(0)
    expect(r.manual).toBe(8)
  })
})

describe('personel', () => {
  it('mendeteksi konflik lintas tender, bukan tender sendiri', () => {
    expect(cariKonflik('p2', 't01', assignments)?.tenderId).toBe('t02')
    expect(cariKonflik('p2', 't02', assignments)).toBeUndefined()
  })
  it('rekomendasi hanya SKK yang berlaku sampai batas pemasukan, yang berkonflik turun peringkat', () => {
    const k = rekomendasiPersonel('Ahli K3', 't01', '2026-11-21', people, assignments)
    expect(k).toHaveLength(3)
    expect(k[0].konflik).toBeUndefined()
    const mp = rekomendasiPersonel('Manajer Pelaksanaan', 't01', '2026-11-21', people, assignments)
    expect(mp.map((x) => x.person.id)).not.toContain('p1')
  })
})

describe('transisi dan approval', () => {
  it('ambang Rp100 M menentukan rantai approval', () => {
    expect(rantaiApproval(100).map((a) => a.peran)).toEqual(['GM Divisi'])
    expect(rantaiApproval(142).map((a) => a.peran)).toEqual(['GM Divisi', 'Direktur Operasi'])
    expect(approvalSelesai(rantaiApproval(142))).toBe(false)
  })
  it('hanya transisi state machine yang valid', () => {
    expect(bisaTransisi('Qualifying', 'Preparing')).toBe(true)
    expect(bisaTransisi('Discovered', 'Submitted')).toBe(false)
    expect(bisaTransisi('Lost', 'Won')).toBe(false)
  })
  const wsDasar = (patch: Partial<Workspace>): Workspace => ({
    tenderId: 't01', tahapChecklist: 'dikonfirmasi', dicekPada: 'x', checklist: [], slots: slotAwal, alasanKonflik: {}, hargaDisetujui: true,
    penawaran: { total: 1, biaya: 1, approver: '' }, klarifikasi: [], adendum: null, linimasa: [], bond: [], dokumen: [], draf: null, ...patch,
  })
  it('Ready to Submit terkunci selama ada Kurang wajib, adendum belum ditinjau, atau harga belum disetujui', () => {
    const hasil = cekKepatuhan(buatChecklist(), ctx())
    expect(alasanBlokirReady(wsDasar({ checklist: hasil })).join()).toContain('2 persyaratan wajib berstatus Kurang')
    const aman = cekKepatuhan(buatChecklist(), ctx({ 'Manajer Pelaksanaan': 'p7', 'Manajer Teknik': 'p3', 'Ahli K3': 'p4' }))
    expect(alasanBlokirReady(wsDasar({ checklist: aman }))).toEqual([])
    expect(alasanBlokirReady(wsDasar({ checklist: aman, hargaDisetujui: false })).length).toBe(1)
    const review = aman.map((i) => (i.teks.startsWith('Jaminan') ? { ...i, perluReview: true } : i))
    expect(alasanBlokirReady(wsDasar({ checklist: review })).join()).toContain('adendum')
  })
  it('override menyelesaikan blokir Kurang', () => {
    const hasil = cekKepatuhan(buatChecklist(), ctx()).map((i) => (i.status === 'Kurang' ? { ...i, override: 'alasan' } : i))
    expect(alasanBlokirReady(wsDasar({ checklist: hasil }))).toEqual([])
  })
})

describe('AI', () => {
  it('hard filter SBU membatasi skor maksimal 30', () => {
    expect(relevanceScore(85, false)).toBe(30)
    expect(relevanceScore(85, true)).toBe(85)
  })
  it('Win Probability berbasis aturan saat data historis < 50', () => {
    const t = buatTenders()[0]
    const skor = { strategic: 4, kapabilitas: 4, kapasitas: 3, risiko: 3, margin: 3 }
    expect(winProbability(t, skor, 74).hasil.mode).toBe('model')
    expect(winProbability(t, skor, 24).hasil.mode).toBe('aturan')
  })
  it('dedup mengenali nama panjang', () => {
    expect(cariDuplikat('Balai Besar Pelaksanaan Jalan Nasional X', buatAkun())?.nama).toBe('BBPJN X')
    expect(cariDuplikat('Dinas Pariwisata', buatAkun())).toBeUndefined()
  })
})

describe('AI Dashboard', () => {
  const tenders = buatTenders()
  const ctxLaporan = (divs: Divisi[] = DIVISI, semuaDivisi = true) => ({ tenders: tenders.filter((t) => divs.includes(t.divisi)), divs, semuaDivisi, workspaces: {}, gonogo: {}, people })
  const copilot = (q: string, bolehHarga = true) => jawabCopilot(q, { persona: PERSONAS[0], bolehHarga, tenders, workspaces: {}, people, divisi: DIVISI, gonogo: {}, semuaDivisi: true })

  it('progres objective dihitung dari data dan arah turun tetap benar', () => {
    const rows = progresObjective(DIVISI, tenders)
    expect(rows.map((r) => r.id)).toEqual(['NSM', 'KR1', 'KR2', 'KR3', 'KR4', 'KR5'])
    const kr2 = rows.find((r) => r.id === 'KR2')!
    expect(kr2.aktual).toBeCloseTo((14 / 125) * 100, 5)
    expect(kr2.progres).toBeCloseTo(((15 - kr2.aktual) / 8) * 100, 5)
    expect(rows.find((r) => r.id === 'KR4')!.status).toBe('Perlu perhatian')
  })
  it('filter divisi mengubah objective dan laporan', () => {
    const semua = ringkasObjective(ctxLaporan())
    const gedung = ringkasObjective(ctxLaporan(['Gedung'], false))
    expect(semua.rows[0].aktual).not.toBe(gedung.rows[0].aktual)
    const l = buatLaporan('winloss', ctxLaporan(['Gedung'], false))
    expect(l.cakupan).toBe('Divisi Gedung')
    expect(laporanKeTeks(l)).not.toContain('Infrastruktur 1')
  })
  it('setiap laporan punya ringkasan, sumber, dan catatan tinjauan', () => {
    for (const d of DAFTAR_LAPORAN) {
      const l = buatLaporan(d.id, ctxLaporan())
      expect(l.ringkasan.length).toBeGreaterThan(0)
      expect(l.sumber.length).toBeGreaterThan(0)
      expect(laporanKeTeks(l)).toContain('perlu ditinjau')
    }
  })
  it('Copilot mengenali permintaan laporan', () => {
    expect(copilot('Bagaimana progres objective kita?').laporan).toBe('objective')
    expect(copilot('Buatkan laporan mingguan').laporan).toBe('mingguan')
    expect(copilot('tolong buat laporan risiko tenggat').laporan).toBe('risiko')
    expect(copilot('buat laporan kepatuhan').laporan).toBe('kepatuhan')
    expect(copilot('berapa win rate kita?').laporan).toBe('winloss')
    expect(copilot('Apa saja tenggat minggu ini?').laporan).toBeUndefined()
  })
  it('permintaan harga tetap dibatasi hak akses, termasuk lewat kata laporan', () => {
    expect(copilot('buat laporan harga penawaran dermaga', false).teks).toBe('Saya tidak menemukan data untuk pertanyaan ini.')
    expect(copilot('cuaca hari ini').teks).toBe('Saya tidak menemukan data untuk pertanyaan ini.')
  })
})
