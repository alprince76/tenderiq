import type { Divisi, GoNoGo, Persona, Tender, Workspace, Person } from '@/domain/types'
import { fmtRp, fmtTanggal, selisihHari } from '@/domain/format'
import { STATUS_AKTIF, STATUS_LABEL, itemKurangAktif } from '@/domain/transitions'
import { buatLaporan } from './reports'
import type { ReportId } from './reports'

export interface CopilotJawaban { teks: string; tautan: { label: string; ke: string }[]; keyakinan?: number; sumber: string[]; laporan?: ReportId }
export interface ChatPesan { id: string; tanya: string; jawab: CopilotJawaban }
export interface CopilotCtx { persona: Persona; bolehHarga: boolean; tenders: Tender[]; workspaces: Record<string, Workspace>; people: Person[]; divisi: Divisi[]; gonogo: Record<string, GoNoGo>; semuaDivisi: boolean }

export const CONTOH_PERTANYAAN = [
  'Bagaimana progres objective kita?',
  'Buatkan laporan mingguan',
  'Tender mana yang SKK-nya belum lengkap?',
  'Apa saja tenggat minggu ini?',
  'SKK apa yang akan berakhir dalam 30 hari?',
  'Berapa nilai pipeline aktif?',
  'Berapa harga penawaran Dermaga Tahap II?',
]

const KOSONG: CopilotJawaban = { teks: 'Saya tidak menemukan data untuk pertanyaan ini.', tautan: [], sumber: [] }

/** INS-02: menjawab dari data di aplikasi sesuai hak akses; tidak mengarang saat data tidak ada. */
export function jawabCopilot(tanya: string, ctx: CopilotCtx): CopilotJawaban {
  const q = tanya.toLowerCase()
  const ts = ctx.tenders.filter((t) => ctx.divisi.includes(t.divisi))

  if (/harga|margin|boq/.test(q)) {
    if (!ctx.bolehHarga) return KOSONG
    const t = ts.find((x) => q.includes(x.nama.toLowerCase().split(' ')[0]) && ctx.workspaces[x.id])
    if (!t) return KOSONG
    const w = ctx.workspaces[t.id]
    return { teks: `Harga penawaran ${t.nama}: ${fmtRp(w.penawaran.total)} (${Math.round((w.penawaran.total / t.hps) * 1000) / 10}% dari HPS).`, tautan: [{ label: t.nama, ke: `/penawaran/workspace/${t.id}?tab=harga` }], keyakinan: 0.93, sumber: ['Dokumen harga (akses terbatas)'] }
  }
  const laporanId: ReportId | null = /objective|okr|\bkr\d?\b|north star|nkb|nilai kontrak|sasaran/.test(q) ? 'objective'
    : !/laporan|report|buat|ringkas/.test(q) ? (/fokus|prioritas|rekomendasi/.test(q) ? 'mingguan' : /win rate|win\/loss|kalah|gugur/.test(q) ? 'winloss' : null)
    : /mingguan|minggu ini|weekly/.test(q) ? 'mingguan' : /risiko|tenggat/.test(q) ? 'risiko' : /kepatuhan|compliance/.test(q) ? 'kepatuhan' : /win|kalah|menang|gugur/.test(q) ? 'winloss' : /laporan|report|ringkas/.test(q) ? 'mingguan' : null
  if (laporanId) {
    const l = buatLaporan(laporanId, { tenders: ts, divs: ctx.divisi, semuaDivisi: ctx.semuaDivisi, workspaces: ctx.workspaces, gonogo: ctx.gonogo, people: ctx.people })
    const butir = l.bagian.find((b) => b.butir)?.butir?.slice(0, 2) ?? []
    return { teks: [l.ringkasan, ...butir].join('\n'), tautan: [], keyakinan: l.keyakinan, sumber: l.sumber, laporan: laporanId }
  }
  if (/skk|kurang|belum lengkap|persyaratan/.test(q) && !/berakhir|kedaluwarsa|expired/.test(q)) {
    const list = ts.filter((t) => ctx.workspaces[t.id]?.checklist.some(itemKurangAktif))
    if (!list.length) return KOSONG
    return {
      teks: `Ada ${list.length} tender dengan persyaratan wajib berstatus Kurang:`,
      tautan: list.map((t) => ({ label: `${t.nama} (${ctx.workspaces[t.id].checklist.filter(itemKurangAktif).length} item)`, ke: `/penawaran/workspace/${t.id}?tab=checklist` })),
      keyakinan: 0.92, sumber: ['Checklist kepatuhan'],
    }
  }
  if (/berakhir|kedaluwarsa|expired/.test(q)) {
    const list = ctx.people.filter((p) => { const h = selisihHari(p.berlaku); return h >= 0 && h <= 30 })
    if (!list.length) return KOSONG
    return { teks: list.map((p) => `${p.nama}: ${p.skk}, berakhir ${fmtTanggal(p.berlaku)}`).join('\n'), tautan: [{ label: 'Buka Capability Library', ke: '/penawaran/capability' }], keyakinan: 0.97, sumber: ['Capability Library'] }
  }
  if (/tenggat|deadline|minggu ini/.test(q)) {
    const list = ts.filter((t) => t.milestone && selisihHari(t.milestone.tanggal) >= 0 && selisihHari(t.milestone.tanggal) <= 7)
    if (!list.length) return KOSONG
    return { teks: `Ada ${list.length} tenggat dalam 7 hari ke depan:`, tautan: list.map((t) => ({ label: `${t.nama}: ${t.milestone!.tahap}, ${fmtTanggal(t.milestone!.tanggal)}`, ke: `/penawaran/workspace/${t.id}` })), keyakinan: 0.95, sumber: ['Jadwal tender'] }
  }
  if (/pipeline|nilai aktif|tender aktif/.test(q)) {
    const aktif = ts.filter((t) => STATUS_AKTIF.includes(t.status))
    return { teks: `Nilai pipeline aktif ${fmtRp(aktif.reduce((n, t) => n + t.hps, 0))} dari ${aktif.length} tender.`, tautan: [{ label: 'Buka Dashboard', ke: '/' }], keyakinan: 0.97, sumber: ['Dashboard Pipeline'] }
  }
  const cocok = ts.find((t) => t.nama.toLowerCase().split(/\s+/).filter((w) => w.length > 4).some((w) => q.includes(w)))
  if (cocok) {
    return { teks: `${cocok.nama}: status ${STATUS_LABEL[cocok.status]}, HPS ${fmtRp(cocok.hps)}, batas pemasukan ${fmtTanggal(cocok.batasPemasukan)}, PIC ${cocok.pic}.`, tautan: [{ label: 'Lihat di Radar', ke: `/peluang/radar?tender=${cocok.id}` }], keyakinan: 0.88, sumber: ['Data tender'] }
  }
  return KOSONG
}
