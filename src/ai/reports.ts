import type { Divisi, GoNoGo, Person, Tender, Workspace } from '@/domain/types'
import { fmtAngka, fmtPersen, fmtRp, fmtTanggal, selisihHari } from '@/domain/format'
import { STATUS_LABEL, approvalBerikutnya, itemKurangAktif } from '@/domain/transitions'
import { ringkasStatus } from '@/domain/compliance'
import { alasanKalah, hasilPerDivisi, persyaratanKurang, progresObjective, tenggat7Hari, winPerSegmen } from '@/store/selectors'
import type { BarisObjective } from '@/store/selectors'
import { weeklyBrief } from './brief'

export type ReportId = 'objective' | 'mingguan' | 'risiko' | 'kepatuhan' | 'winloss'

export const DAFTAR_LAPORAN: { id: ReportId; label: string; bantuan: string }[] = [
  { id: 'objective', label: 'Progres Objective', bantuan: 'North Star dan KR terhadap target' },
  { id: 'mingguan', label: 'Laporan Mingguan', bantuan: 'Peluang, tenggat, dan fokus minggu ini' },
  { id: 'risiko', label: 'Risiko Tenggat', bantuan: 'Tenggat 7 hari dan hambatannya' },
  { id: 'kepatuhan', label: 'Kepatuhan Penawaran', bantuan: 'Persyaratan Kurang per tender' },
  { id: 'winloss', label: 'Analisis Win/Loss', bantuan: 'Hasil per divisi, segmen, dan alasan' },
]

export interface LaporanCtx {
  tenders: Tender[] // sudah dibatasi hak akses dan filter divisi
  divs: Divisi[]
  semuaDivisi: boolean
  workspaces: Record<string, Workspace>
  gonogo: Record<string, GoNoGo>
  people: Person[]
}

export interface Tindakan { label: string; ke: string; perm: string }
export interface BagianLaporan { judul: string; butir?: string[]; tabel?: { kolom: string[]; baris: string[][] } }
export interface Laporan {
  id: ReportId
  judul: string
  cakupan: string
  ringkasan: string
  bagian: BagianLaporan[]
  tindakan: Tindakan[]
  keyakinan: number
  sumber: string[]
}

const cakupan = (c: LaporanCtx) => (c.semuaDivisi ? 'Semua divisi' : c.divs.map((d) => `Divisi ${d}`).join(', '))

function rekomendasi(c: LaporanCtx): { teks: string; tindakan: Tindakan }[] {
  const out: { teks: string; tindakan: Tindakan }[] = []
  const kurang = persyaratanKurang(c.tenders, c.workspaces)
  if (kurang.per[0]) {
    const { t, n } = kurang.per[0]
    out.push({ teks: `Selesaikan ${n} persyaratan Kurang di ${t.nama}.`, tindakan: { label: 'Buka checklist', ke: `/penawaran/workspace/${t.id}?tab=checklist`, perm: 'workspace' } })
  }
  const baru = c.tenders.filter((t) => t.status === 'Discovered' && t.relevance >= 70 && !t.tidakRelevan).sort((a, b) => b.relevance - a.relevance)[0]
  if (baru) out.push({ teks: `Kualifikasi ${baru.nama} (skor ${baru.relevance}, ${fmtRp(baru.hps)}).`, tindakan: { label: 'Buka ringkasan', ke: `/peluang/radar?tender=${baru.id}`, perm: 'radar' } })
  const top = alasanKalah(c.divs, c.tenders).rows[0]
  if (top) out.push({ teks: `Tinjau pendekatan harga: "${top.alasan}" adalah alasan tidak menang terbanyak (${top.jumlah} tender).`, tindakan: { label: 'Buka Laporan', ke: '/laporan', perm: 'laporan' } })
  return out
}

/** Ringkasan objective untuk panel utama Dashboard. Dihitung dari data, bukan teks tetap. */
export function ringkasObjective(c: LaporanCtx) {
  const rows = progresObjective(c.divs, c.tenders)
  const nsm = rows[0]
  const krBaik = rows.filter((r) => r.status !== 'Perlu perhatian')
  const lemah = rows.filter((r) => r.status === 'Perlu perhatian').sort((a, b) => a.progres - b.progres)
  const kuat = [...rows].sort((a, b) => b.progres - a.progres)[0]
  const headline = `${krBaik.length} dari ${rows.length} sasaran sesuai jalur. Nilai Kontrak Baru ${nsm.teksAktual} dari target ${nsm.teksTarget}.`
  const narasi = [
    `Terkuat: ${kuat.nama} (${kuat.teksAktual}, target ${kuat.teksTarget}).`,
    lemah.length ? `Perlu perhatian: ${lemah.map((r) => `${r.nama} (${r.teksAktual}, target ${r.teksTarget})`).join('; ')}.` : 'Tidak ada sasaran yang perlu perhatian khusus.',
  ]
  return { rows, headline, narasi, rekomendasi: rekomendasi(c), keyakinan: 0.84, sumber: ['Hasil tender 12 bulan', 'Dashboard Pipeline', 'Target PRD §4'] }
}

const tabelObjective = (rows: BarisObjective[]) => ({
  kolom: ['Sasaran', 'Aktual', 'Target', 'Progres', 'Status'],
  baris: rows.map((r) => [`${r.id} ${r.nama}`, r.teksAktual, r.teksTarget, `${fmtAngka(r.progres)}%`, r.status]),
})

function skkAkanBerakhir(people: Person[]) {
  return people.filter((p) => { const h = selisihHari(p.berlaku); return h >= 0 && h <= 30 })
}

export function buatLaporan(id: ReportId, c: LaporanCtx): Laporan {
  const dasar = { id, cakupan: cakupan(c) }
  const rek = rekomendasi(c)
  const tenggat = tenggat7Hari(c.tenders)
  const kurang = persyaratanKurang(c.tenders, c.workspaces)
  const skk = skkAkanBerakhir(c.people)
  const tabelTenggat = {
    kolom: ['Tender', 'Tahap', 'Tenggat', 'PIC', 'Kesiapan'],
    baris: tenggat.map((t) => [t.nama, t.milestone!.tahap, fmtTanggal(t.milestone!.tanggal), t.pic, t.milestone!.kesiapan]),
  }
  const tindakanRek = rek.map((r) => r.tindakan)

  switch (id) {
    case 'objective': {
      const o = ringkasObjective(c)
      return { ...dasar, judul: 'Laporan Progres Objective', ringkasan: o.headline, bagian: [
        { judul: 'Progres terhadap target', tabel: tabelObjective(o.rows) },
        { judul: 'Analisis', butir: o.narasi },
        { judul: 'Rekomendasi', butir: o.rekomendasi.map((r) => r.teks) },
      ], tindakan: tindakanRek, keyakinan: o.keyakinan, sumber: o.sumber }
    }
    case 'mingguan': {
      const b = weeklyBrief(c.tenders, tenggat, kurang.total)
      const baru = c.tenders.filter((t) => t.status === 'Discovered' && !t.tidakRelevan && t.relevance >= 60).sort((x, y) => y.relevance - x.relevance).slice(0, 5)
      const menunggu = c.tenders.filter((t) => { const g = c.gonogo[t.id]; return g && !g.keputusan && g.diajukanOleh && approvalBerikutnya(g.approvals) })
      return { ...dasar, judul: 'Laporan Mingguan', ringkasan: b.hasil[0], bagian: [
        { judul: 'Sorotan', butir: b.hasil },
        { judul: 'Peluang baru teratas', tabel: { kolom: ['Tender', 'Skor', 'HPS', 'Batas Pemasukan'], baris: baru.map((t) => [t.nama, String(t.relevance), fmtRp(t.hps), fmtTanggal(t.batasPemasukan)]) } },
        { judul: 'Tenggat 7 hari ke depan', tabel: tabelTenggat },
        { judul: 'Menunggu persetujuan Go/No-Go', tabel: { kolom: ['Tender', 'HPS', 'Approver berikutnya'], baris: menunggu.map((t) => [t.nama, fmtRp(t.hps), approvalBerikutnya(c.gonogo[t.id].approvals)?.peran ?? '-']) } },
      ], tindakan: tindakanRek, keyakinan: b.keyakinan, sumber: b.sumber }
    }
    case 'risiko': {
      const belumSiap = tenggat.filter((t) => t.milestone!.kesiapan === 'Belum lengkap' || t.milestone!.kesiapan === 'Perlu dicek')
      return { ...dasar, judul: 'Laporan Risiko Tenggat', ringkasan: `${tenggat.length} tenggat dalam 7 hari, ${belumSiap.length} di antaranya belum siap.`, bagian: [
        { judul: 'Tenggat 7 hari ke depan', tabel: tabelTenggat },
        { judul: 'Tender dengan persyaratan Kurang', butir: kurang.per.length ? kurang.per.map((x) => `${x.t.nama}: ${x.n} item (batas pemasukan ${fmtTanggal(x.t.batasPemasukan)})`) : ['Tidak ada.'] },
        { judul: 'SKK berakhir dalam 30 hari', butir: skk.length ? skk.map((p) => `${p.nama}: ${p.skk}, berakhir ${fmtTanggal(p.berlaku)}`) : ['Tidak ada.'] },
      ], tindakan: tindakanRek.filter((x) => x.perm !== 'laporan'), keyakinan: 0.9, sumber: ['Jadwal tender', 'Checklist kepatuhan', 'Capability Library'] }
    }
    case 'kepatuhan': {
      const ws = c.tenders.filter((t) => c.workspaces[t.id]?.checklist.length)
      const rinci = ws.flatMap((t) => c.workspaces[t.id].checklist.filter(itemKurangAktif).map((i) => `${t.nama}: ${i.teks}. ${i.keterangan}`))
      return { ...dasar, judul: 'Laporan Kepatuhan Penawaran', ringkasan: `${kurang.total} persyaratan wajib berstatus Kurang di ${kurang.per.length} tender.`, bagian: [
        { judul: 'Status per tender', tabel: { kolom: ['Tender', 'Status Tender', 'Terpenuhi', 'Kurang', 'Dicek manual', 'Review'], baris: ws.map((t) => { const r = ringkasStatus(c.workspaces[t.id].checklist); return [t.nama, STATUS_LABEL[t.status], String(r.terpenuhi), String(r.kurang), String(r.manual), String(r.review)] }) } },
        { judul: 'Rincian item Kurang', butir: rinci.length ? rinci : ['Tidak ada item wajib berstatus Kurang.'] },
        { judul: 'SKK berakhir dalam 30 hari', butir: skk.length ? skk.map((p) => `${p.nama}: berakhir ${fmtTanggal(p.berlaku)}`) : ['Tidak ada.'] },
      ], tindakan: tindakanRek.filter((x) => x.perm === 'workspace'), keyakinan: 0.88, sumber: ['Checklist kepatuhan', 'Capability Library'] }
    }
    case 'winloss': {
      const hasil = c.divs.map((d) => ({ d, ...hasilPerDivisi(d, c.tenders) }))
      const seg = winPerSegmen(c.divs, c.tenders)
      const al = alasanKalah(c.divs, c.tenders)
      const ikut = hasil.reduce((n, h) => n + h.ikut, 0), menang = hasil.reduce((n, h) => n + h.menang, 0)
      const urut = [...seg].filter((s) => s.ikut > 0).sort((a, b) => b.win - a.win)
      return { ...dasar, judul: 'Analisis Win/Loss', ringkasan: `Win rate ${fmtPersen(ikut ? (menang / ikut) * 100 : 0)} (${menang} dari ${ikut} tender). Segmen terkuat ${urut[0]?.segmen ?? '-'}.`, bagian: [
        { judul: 'Per divisi', tabel: { kolom: ['Divisi', 'Diikuti', 'Menang', 'Win Rate', 'NKB (Rp miliar)'], baris: hasil.map((h) => [h.d, String(h.ikut), String(h.menang), fmtPersen(h.win), fmtAngka(h.nkb)]) } },
        { judul: 'Per segmen', tabel: { kolom: ['Segmen', 'Diikuti', 'Menang', 'Win Rate'], baris: seg.map((s) => [s.segmen, String(s.ikut), String(s.menang), fmtPersen(s.win)]) } },
        { judul: 'Alasan tidak menang', tabel: { kolom: ['Alasan', 'Kategori', 'Jumlah', 'Porsi'], baris: al.rows.map((r) => [r.alasan, r.kategori, String(r.jumlah), fmtPersen(al.total ? (r.jumlah / al.total) * 100 : 0)]) } },
      ], tindakan: tindakanRek.filter((x) => x.perm === 'laporan'), keyakinan: 0.86, sumber: ['Hasil tender 12 bulan', 'Pencatatan alasan kalah'] }
    }
  }
}

/** Insight pendek untuk kartu-kartu Dashboard. */
export function insightDashboard(c: LaporanCtx) {
  const belum = c.tenders.filter((t) => t.status === 'Discovered' && !t.tidakRelevan)
  const nilai = belum.reduce((n, t) => n + t.hps, 0)
  const seg = winPerSegmen(c.divs, c.tenders).filter((s) => s.ikut > 0).sort((a, b) => b.win - a.win)
  const al = alasanKalah(c.divs, c.tenders)
  const gugur = al.rows.filter((r) => r.kategori === 'Gugur').reduce((n, r) => n + r.jumlah, 0)
  const top = al.rows[0]
  return {
    funnel: `${belum.length} tender senilai ${fmtRp(nilai)} belum dikualifikasi. Tender berskor tinggi perlu diputuskan lebih dulu agar waktu persiapan tidak habis.`,
    segmen: seg.length >= 2 ? `${seg[0].segmen} paling kuat (${fmtPersen(seg[0].win, 0)}), ${seg[seg.length - 1].segmen} paling lemah (${fmtPersen(seg[seg.length - 1].win, 0)}). Pertimbangkan seleksi lebih ketat di segmen yang lemah.` : 'Data segmen belum cukup.',
    alasan: top ? `"${top.alasan}" mencakup ${fmtPersen(al.total ? (top.jumlah / al.total) * 100 : 0, 0)} tender tidak menang. ${gugur} tender gugur karena hal yang bisa dicegah lewat Compliance Checker.` : 'Belum ada data alasan.',
  }
}

/** Teks polos untuk disalin atau diunduh. */
export function laporanKeTeks(l: Laporan): string {
  const baris: string[] = [l.judul, `Cakupan: ${l.cakupan}`, 'Per 4 Nov 2026', '', l.ringkasan, '']
  for (const b of l.bagian) {
    baris.push(b.judul.toUpperCase())
    for (const x of b.butir ?? []) baris.push(`- ${x}`)
    if (b.tabel) {
      baris.push(b.tabel.kolom.join(' | '))
      for (const r of b.tabel.baris) baris.push(r.join(' | '))
    }
    baris.push('')
  }
  baris.push(`Dihasilkan AI, tingkat keyakinan ${fmtAngka(l.keyakinan, 2)}. Sumber: ${l.sumber.join('; ')}.`, 'Draf ini perlu ditinjau sebelum dibagikan.')
  return baris.join('\n')
}
