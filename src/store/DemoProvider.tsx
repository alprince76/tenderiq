import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { buatRup, buatTenders } from '@/data/tenders'
import type { RupPaket } from '@/data/tenders'
import { buatAkun, buatInteraksi, buatKontak } from '@/data/accounts'
import { buatAlat, buatAssignments, buatPengalaman, buatPersonel, buatSbu } from '@/data/capability'
import { buatChecklist, buatKlarifikasi, perubahanAdendum } from '@/data/checklist'
import { PERSONAS, buatPerm } from '@/data/org'
import type {
  Account, Alat, Assignment, ChecklistItem, Clarification, Contact, GoNoGo, Hak, HandoverState, Interaction, Kriteria,
  Negotiation, Pengalaman, PermMatrix, Person, Persona, AuditEntry, Sbu, Slot, Tender, TenderResult, Workspace,
} from '@/domain/types'
import { approvalBerikutnya, approvalSelesai, alasanBlokirReady, bisaTransisi, rantaiApproval } from '@/domain/transitions'
import { cekKepatuhan } from '@/domain/compliance'
import { fmtTanggal, tambahHari, HARI_INI } from '@/domain/format'
import { hitungMargin } from '@/ai/negotiation'
import { AI_IDS } from '@/ai/registry'
import type { AiId } from '@/ai/registry'
import type { ChatPesan } from '@/ai/copilot'
import { jenisDariSbu } from '@/ai/pricing'
import type { FilterDivisi } from './selectors'

interface State {
  tenders: Tender[]
  rup: RupPaket[]
  accounts: Account[]
  contacts: Contact[]
  interactions: Interaction[]
  sbu: Sbu[]
  people: Person[]
  assignments: Assignment[]
  alat: Alat[]
  pengalaman: Pengalaman[]
  workspaces: Record<string, Workspace>
  gonogo: Record<string, GoNoGo>
  negotiations: Record<string, Negotiation>
  handover: Record<string, HandoverState>
  perm: PermMatrix
  ai: Record<AiId, boolean>
  audit: AuditEntry[]
  personaId: string
  filterDivisi: FilterDivisi
  menit: number
  chat: ChatPesan[]
}

const SLOT_AWAL: Record<string, Record<Slot, string | null>> = {
  t01: { 'Manajer Pelaksanaan': 'p1', 'Manajer Teknik': 'p3', 'Ahli K3': 'p2' },
  t02: { 'Manajer Pelaksanaan': 'p9', 'Manajer Teknik': 'p3', 'Ahli K3': 'p2' },
  t03: { 'Manajer Pelaksanaan': 'p1', 'Manajer Teknik': 'p10', 'Ahli K3': 'p2' },
}
const SLOT_AMAN: Record<Slot, string | null> = { 'Manajer Pelaksanaan': 'p7', 'Manajer Teknik': 'p3', 'Ahli K3': 'p4' }

/** Template checklist disesuaikan dengan jenis pekerjaan tender. */
function checklistUntuk(t: Tender, sbu: Sbu[]): ChecklistItem[] {
  const jenis = jenisDariSbu(t.sbu)
  const kode = t.sbu.split(' ')[0]
  const milik = sbu.find((s) => s.kode === kode)
  if (t.id === 't01') return buatChecklist()
  return buatChecklist().map((i) => ({
    ...i,
    teks: i.teks.replace('sub-klasifikasi jalan', `sub-klasifikasi ${jenis.toLowerCase()}`),
    kutipan: i.kutipan.replace('sub-klasifikasi jalan', `sub-klasifikasi ${jenis.toLowerCase()}`).replace('pekerjaan jalan', `pekerjaan ${jenis.toLowerCase()}`),
    rule: i.rule.tipe === 'sbu' ? { ...i.rule, sbuId: milik?.id ?? 'tidak-ada' } : i.rule.tipe === 'pengalaman' && i.rule.jenis === 'Jalan' ? { ...i.rule, jenis } : i.rule,
    dokumen: i.rule.tipe === 'sbu' ? milik?.file : i.dokumen,
  }))
}

function buatWorkspace(t: Tender): Workspace {
  return {
    tenderId: t.id,
    tahapChecklist: 'kosong',
    checklist: [],
    slots: SLOT_AWAL[t.id] ?? { ...SLOT_AMAN },
    alasanKonflik: {},
    hargaDisetujui: true,
    penawaran: { total: Math.round(t.hps * 934) / 1000, biaya: Math.round(t.hps * 934 * 0.91) / 1000, approver: 'Hendra Wijaya, GM Divisi' },
    klarifikasi: t.id === 't01' ? buatKlarifikasi() : [],
    adendum: null,
    linimasa: [...t.jadwal.map((j) => ({ tanggal: j.tanggal, judul: j.tahap })), { tanggal: HARI_INI, judul: 'Bid Workspace dibuat', oleh: 'Sistem' }],
    bond: [
      { jenis: 'Jaminan penawaran', penerbit: 'Bank A', nilai: Math.round(t.hps * 0.02 * 100) / 100, berlaku: '2027-01-25', status: 'Terbit' },
      { jenis: 'Jaminan pelaksanaan', penerbit: '-', nilai: Math.round(t.hps * 0.05 * 100) / 100, berlaku: '', status: 'Belum diminta' },
    ],
    dokumen: [
      { nama: 'Dokumen_Pemilihan.pdf', jenis: 'Dokumen pemilihan', versi: 'v1', oleh: 'Budi S.' },
      { nama: 'KAK.pdf', jenis: 'Kerangka Acuan Kerja', versi: 'v1', oleh: 'Budi S.' },
      { nama: 'Metode_v2.docx', jenis: 'Teknis', versi: 'v2', oleh: 'Andi R.' },
      { nama: 'RKK_PJN_XY.pdf', jenis: 'Teknis', versi: 'v1', oleh: 'Andi R.' },
      { nama: 'BoQ_v3.xlsx', jenis: 'Harga', versi: 'v3', oleh: 'Sari P.', rahasia: true },
      { nama: 'AHS_v2.xlsx', jenis: 'Harga', versi: 'v2', oleh: 'Sari P.', rahasia: true },
    ],
    draf: null,
  }
}

function stateAwal(): State {
  const tenders = buatTenders()
  const sbu = buatSbu(), people = buatPersonel(), assignments = buatAssignments(), pengalaman = buatPengalaman()
  const workspaces: Record<string, Workspace> = {}
  // Tender yang sudah melewati Go memiliki workspace dan hasil cek kepatuhan nyata.
  for (const t of tenders) {
    if (['Preparing', 'ReadyToSubmit', 'Submitted', 'UnderEvaluation', 'Negotiation'].includes(t.status)) {
      const w = buatWorkspace(t)
      if (t.id !== 't18') {
        w.tahapChecklist = 'dikonfirmasi'
        w.dicekPada = '3 Nov 2026, 16.40 WIB'
        w.checklist = cekKepatuhan(checklistUntuk(t, sbu).map((i) => ({ ...i, ditinjau: true })), {
          tenderId: t.id, batas: t.batasPemasukan, slots: w.slots, alasanKonflik: w.alasanKonflik, people, assignments, sbu, pengalaman,
        })
      }
      workspaces[t.id] = w
    }
  }
  const skorSeed = (a: number, b: number, c: number, d: number, e: number): Record<Kriteria, number> => ({ strategic: a, kapabilitas: b, kapasitas: c, risiko: d, margin: e })
  const pending = (id: string, oleh: string, skor: Record<Kriteria, number>): GoNoGo => ({
    tenderId: id, skor, diajukanOleh: oleh, approvals: rantaiApproval(tenders.find((t) => t.id === id)!.hps),
  })
  return {
    tenders, rup: buatRup(), accounts: buatAkun(), contacts: buatKontak(), interactions: buatInteraksi(),
    sbu, people, assignments, alat: buatAlat(), pengalaman, workspaces,
    gonogo: {
      t05: pending('t05', 'Sari P.', skorSeed(4, 4, 2, 3, 3)),
      t06: pending('t06', 'Rina K.', skorSeed(5, 4, 3, 2, 4)),
      t07: pending('t07', 'Andi R.', skorSeed(3, 3, 4, 3, 3)),
    },
    negotiations: {
      t04: {
        tenderId: 't04', batasMargin: 8, biaya: 150, disetujuiOleh: 'Hendra Wijaya, GM Divisi',
        rounds: [
          { no: 1, harga: 165, konsesi: 'Penawaran awal setelah klarifikasi harga', margin: hitungMargin(165, 150), status: 'Tercatat' },
          { no: 2, harga: 160.4, konsesi: 'Pemilik proyek meminta penurunan harga 2,8%', margin: hitungMargin(160.4, 150), status: 'Butuh approval' },
        ],
      },
    },
    handover: {},
    perm: buatPerm(),
    ai: Object.fromEntries(AI_IDS.map((id) => [id, true])) as Record<AiId, boolean>,
    audit: [
      { waktu: '3 Nov 2026, 16.40 WIB', aktor: 'Budi Santoso', aksi: 'Menjalankan cek kepatuhan', objek: 'Gedung Rumah Sakit Daerah Tipe B' },
      { waktu: '3 Nov 2026, 11.05 WIB', aktor: 'Hendra Wijaya', aksi: 'Menetapkan batas margin 8%', objek: 'Dermaga Pelabuhan Y Tahap II' },
    ],
    personaId: 'rina',
    filterDivisi: 'Semua',
    menit: 0,
    chat: [],
  }
}

const waktuDemo = (menit: number) => {
  const total = 10 * 60 + menit
  const p = (n: number) => String(n).padStart(2, '0')
  return `4 Nov 2026, ${p(Math.floor(total / 60))}.${p(total % 60)} WIB`
}

function useDemoInternal() {
  const [s, setS] = useState<State>(stateAwal)
  const persona = PERSONAS.find((p) => p.id === s.personaId) as Persona

  const audit = useCallback((st: State, aksi: string, objek: string, detail?: string): State => {
    const menit = st.menit + 1
    const p = PERSONAS.find((x) => x.id === st.personaId) as Persona
    return { ...st, menit, audit: [{ waktu: waktuDemo(menit), aktor: p.nama, aksi, objek, detail }, ...st.audit] }
  }, [])

  const namaT = (st: State, id: string) => st.tenders.find((t) => t.id === id)?.nama ?? id
  const patchT = (st: State, id: string, patch: Partial<Tender>): State => ({ ...st, tenders: st.tenders.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
  const patchW = (st: State, id: string, fn: (w: Workspace) => Workspace): State => ({ ...st, workspaces: { ...st.workspaces, [id]: fn(st.workspaces[id]) } })
  const ubahStatus = (st: State, id: string, ke: Tender['status'], patch: Partial<Tender> = {}): State => {
    const t = st.tenders.find((x) => x.id === id) as Tender
    if (!bisaTransisi(t.status, ke)) throw new Error(`Transisi ${t.status} -> ${ke} tidak valid`)
    return patchT(st, id, { ...patch, status: ke })
  }

  const recheck = (st: State, id: string): State => {
    const t = st.tenders.find((x) => x.id === id) as Tender
    return patchW(st, id, (w) => ({
      ...w,
      dicekPada: waktuDemo(st.menit),
      checklist: cekKepatuhan(w.checklist, {
        tenderId: id, batas: t.batasPemasukan, slots: w.slots, alasanKonflik: w.alasanKonflik,
        people: st.people, assignments: st.assignments, sbu: st.sbu, pengalaman: st.pengalaman,
      }),
    }))
  }

  const actions = useMemo(() => ({
    setPersona: (personaId: string) => setS((st) => {
      const p = PERSONAS.find((x) => x.id === personaId) as Persona
      const f = st.filterDivisi !== 'Semua' && !p.divisi.includes(st.filterDivisi) ? 'Semua' : st.filterDivisi
      // Riwayat chat dikosongkan agar jawaban satu peran tidak terlihat oleh peran lain.
      return { ...st, personaId, filterDivisi: f, chat: [] }
    }),
    setFilterDivisi: (filterDivisi: FilterDivisi) => setS((st) => ({ ...st, filterDivisi })),
    reset: () => { setS(stateAwal()); toast.success('Data demo dikembalikan ke kondisi awal.') },

    tambahChat: (m: ChatPesan) => setS((st) => ({ ...st, chat: [...st.chat, m] })),

    // Radar
    qualify: (id: string) => setS((st) => {
      let n = ubahStatus(st, id, 'Qualifying')
      const t = st.tenders.find((x) => x.id === id) as Tender
      n = { ...n, gonogo: { ...n.gonogo, [id]: { tenderId: id, skor: { strategic: 3, kapabilitas: 3, kapasitas: 3, risiko: 3, margin: 3 }, approvals: rantaiApproval(t.hps) } } }
      return audit(n, 'Mengualifikasi tender', t.nama)
    }),
    tidakRelevan: (id: string, alasan: string) => setS((st) => audit(patchT(st, id, { tidakRelevan: alasan }), 'Menandai tidak relevan', namaT(st, id), alasan)),
    tambahTender: (t: Tender) => setS((st) => audit({ ...st, tenders: [t, ...st.tenders] }, 'Menambah tender manual', t.nama)),
    pantauRup: (id: string) => setS((st) => ({ ...st, rup: st.rup.map((r) => (r.id === id ? { ...r, dipantau: !r.dipantau } : r)) })),

    // Go/No-Go
    setSkor: (id: string, k: Kriteria, n: number) => setS((st) => ({ ...st, gonogo: { ...st.gonogo, [id]: { ...st.gonogo[id], skor: { ...st.gonogo[id].skor, [k]: n } } } })),
    ajukanGo: (id: string) => setS((st) => {
      const p = PERSONAS.find((x) => x.id === st.personaId) as Persona
      return audit({ ...st, gonogo: { ...st.gonogo, [id]: { ...st.gonogo[id], diajukanOleh: p.pendek } } }, 'Mengajukan Go', namaT(st, id))
    }),
    setujuiGo: (id: string) => setS((st) => {
      const g = st.gonogo[id]
      const next = approvalBerikutnya(g.approvals)
      if (!next) return st
      const approvals = g.approvals.map((a) => (a === next ? { ...a, status: 'Disetujui' as const, waktu: waktuDemo(st.menit + 1) } : a))
      let n: State = { ...st, gonogo: { ...st.gonogo, [id]: { ...g, approvals } } }
      n = audit(n, `Menyetujui Go sebagai ${next.peran}`, namaT(st, id))
      if (approvalSelesai(approvals)) {
        const t = st.tenders.find((x) => x.id === id) as Tender
        n = ubahStatus(n, id, 'Preparing', { milestone: t.id === 't01' ? { tahap: 'Aanwijzing', tanggal: '2026-11-10', kesiapan: 'Terjadwal' } : t.milestone })
        n = { ...n, gonogo: { ...n.gonogo, [id]: { ...n.gonogo[id], keputusan: 'Go' } } }
        n = { ...n, workspaces: { ...n.workspaces, [id]: buatWorkspace(t) } }
      }
      return n
    }),
    noGo: (id: string, alasan: string, catatan: string) => setS((st) => {
      let n = ubahStatus(st, id, 'NoGo', { alasanNoGo: alasan, milestone: undefined })
      n = { ...n, gonogo: { ...n.gonogo, [id]: { ...n.gonogo[id], keputusan: 'No-Go', alasan, catatan } } }
      return audit(n, 'Memutuskan No-Go', namaT(st, id), alasan)
    }),

    // Workspace: checklist
    isiChecklist: (id: string) => setS((st) => {
      const t = st.tenders.find((x) => x.id === id) as Tender
      const n = patchW(st, id, (w) => ({ ...w, checklist: checklistUntuk(t, st.sbu), tahapChecklist: 'draf', dicekPada: undefined }))
      return audit(n, 'Membuat checklist dari dokumen pemilihan', t.nama, '42 item')
    }),
    tinjauItem: (id: string, itemId: string) => setS((st) => patchW(st, id, (w) => ({ ...w, checklist: w.checklist.map((i) => (i.id === itemId ? { ...i, ditinjau: true, keterangan: 'Ditinjau, sesuai dokumen sumber' } : i)) }))),
    tambahItem: (id: string, item: { kategori: ChecklistItem['kategori']; teks: string; sumber: string; wajib: boolean; pic: string }) => setS((st) => patchW(st, id, (w) => ({
      ...w,
      checklist: [...w.checklist, { ...item, id: `req-m${w.checklist.length + 1}`, kutipan: 'Ditambahkan manual', keyakinan: 1, rule: { tipe: 'naratif', catatan: 'Item manual, perlu dicek' }, status: 'Belum dicek', keterangan: 'Ditambahkan manual', ditinjau: true, perluReview: false, manual: true }],
    }))),
    konfirmasiChecklist: (id: string) => setS((st) => audit(patchW(st, id, (w) => ({ ...w, tahapChecklist: 'dikonfirmasi' })), 'Mengonfirmasi checklist', namaT(st, id))),
    cekKepatuhan: (id: string) => setS((st) => {
      const n = audit(st, 'Menjalankan cek kepatuhan', namaT(st, id))
      return recheck(n, id)
    }),
    selesaiReview: (id: string, itemId: string) => setS((st) => {
      let n = patchW(st, id, (w) => ({ ...w, checklist: w.checklist.map((i) => (i.id === itemId ? { ...i, perluReview: false, dampakAdendum: undefined } : i)) }))
      n = recheck(n, id)
      return audit(n, 'Meninjau item terdampak adendum', namaT(st, id), itemId)
    }),

    // Workspace: personel
    pilihPersonel: (id: string, slot: Slot, personId: string, alasan?: string) => setS((st) => {
      const person = st.people.find((p) => p.id === personId) as Person
      const n = patchW(st, id, (w) => {
        const alasanKonflik = { ...w.alasanKonflik }
        if (alasan) alasanKonflik[slot] = alasan
        else delete alasanKonflik[slot]
        return { ...w, slots: { ...w.slots, [slot]: personId }, alasanKonflik }
      })
      return audit(n, `Memilih ${person.nama} untuk ${slot}`, namaT(st, id), alasan ? `Konflik diterima: ${alasan}` : undefined)
    }),

    // Override
    ajukanOverride: (id: string, itemId: string, alasan: string) => setS((st) => audit(patchW(st, id, (w) => ({ ...w, overrideDiminta: { itemId, alasan } })), 'Mengajukan override kepatuhan', namaT(st, id), alasan)),
    setujuiOverride: (id: string) => setS((st) => {
      const w = st.workspaces[id]
      const req = w.overrideDiminta
      if (!req) return st
      const n = patchW(st, id, (x) => ({ ...x, overrideDiminta: undefined, checklist: x.checklist.map((i) => (i.id === req.itemId ? { ...i, override: req.alasan } : i)) }))
      return audit(n, 'Menyetujui override kepatuhan', namaT(st, id), req.alasan)
    }),

    // Status penawaran
    readyToSubmit: (id: string) => setS((st) => {
      if (alasanBlokirReady(st.workspaces[id]).length) return st
      return audit(ubahStatus(st, id, 'ReadyToSubmit'), 'Menandai Ready to Submit', namaT(st, id), 'Ringkasan penawaran dikunci')
    }),
    submitted: (id: string, bukti: string) => setS((st) => {
      const w = st.workspaces[id]
      const t = st.tenders.find((x) => x.id === id) as Tender
      const assignments: Assignment[] = [
        ...st.assignments.filter((a) => a.tenderId !== id),
        ...Object.values(w.slots).filter((p): p is string => !!p).map((personId) => ({ personId, tenderId: id, proyek: `Tender ${t.nama}`, sampai: tambahHari(t.batasPemasukan, 30), status: 'diajukan' as const })),
      ]
      let n: State = { ...ubahStatus(st, id, 'Submitted'), assignments }
      n = patchW(n, id, (x) => ({ ...x, buktiUnggah: bukti, linimasa: [...x.linimasa, { tanggal: HARI_INI, judul: 'Penawaran diunggah manual di SPSE', oleh: 'Budi S.' }] }))
      return audit(n, 'Mengonfirmasi unggah manual', t.nama, bukti)
    }),
    mulaiEvaluasi: (id: string) => setS((st) => audit(ubahStatus(st, id, 'UnderEvaluation'), 'Mencatat tahap evaluasi', namaT(st, id))),
    undangNegosiasi: (id: string) => setS((st) => {
      const w = st.workspaces[id]
      let n = ubahStatus(st, id, 'Negotiation')
      n = { ...n, negotiations: { ...n.negotiations, [id]: { tenderId: id, batasMargin: 8, biaya: w?.penawaran.biaya ?? 0, disetujuiOleh: 'Hendra Wijaya, GM Divisi', rounds: [] } } }
      return audit(n, 'Membuka Negotiation Room', namaT(st, id))
    }),

    // Klarifikasi dan adendum
    tambahKlarifikasi: (id: string, c: Clarification) => setS((st) => audit(patchW(st, id, (w) => ({ ...w, klarifikasi: [c, ...w.klarifikasi] })), 'Mencatat klarifikasi', namaT(st, id), c.pertanyaan)),
    jawabKlarifikasi: (id: string, cid: string, jawaban: string) => setS((st) => audit(patchW(st, id, (w) => ({ ...w, klarifikasi: w.klarifikasi.map((c) => (c.id === cid ? { ...c, jawaban, status: 'Dijawab' as const } : c)) })), 'Menjawab klarifikasi', namaT(st, id))),
    terapkanAdendum: (id: string) => setS((st) => {
      const t = st.tenders.find((x) => x.id === id) as Tender
      const batasBaru = tambahHari(t.batasPemasukan, 7)
      const perubahan = perubahanAdendum(fmtTanggal(t.batasPemasukan), fmtTanggal(batasBaru))
      const terdampak = new Map<string, string>()
      for (const c of perubahan) for (const nama of c.itemTerdampak) terdampak.set(nama, `Terdampak Adendum 1: ${c.baru}`)
      let n = patchT(st, id, {
        status: t.status === 'ReadyToSubmit' ? 'Preparing' : t.status,
        batasPemasukan: batasBaru,
        jadwal: t.jadwal.map((j) => (j.tahap === 'Batas pemasukan penawaran' ? { ...j, tanggal: batasBaru } : j)),
      })
      n = patchW(n, id, (w) => ({
        ...w,
        adendum: { versi: 1, perubahan },
        checklist: w.checklist.map((i) => (terdampak.has(i.teks) ? { ...i, perluReview: true, dampakAdendum: terdampak.get(i.teks) } : i)),
        linimasa: [...w.linimasa.map((e) => (e.judul === 'Batas pemasukan penawaran' ? { ...e, tanggal: batasBaru } : e)), { tanggal: HARI_INI, judul: `Adendum 1: batas pemasukan menjadi ${fmtTanggal(batasBaru)}`, oleh: 'Sistem' }],
      }))
      n = recheck(n, id) // masa berlaku dicek ulang terhadap tanggal baru (US-10)
      return audit(n, 'Mengunggah Adendum 1', t.nama, `Batas pemasukan menjadi ${fmtTanggal(batasBaru)}`)
    }),

    setDraf: (id: string, draf: Workspace['draf']) => setS((st) => patchW(st, id, (w) => ({ ...w, draf }))),
    setujuiHarga: (id: string, nilai: boolean) => setS((st) => audit(patchW(st, id, (w) => ({ ...w, hargaDisetujui: nilai })), nilai ? 'Menyetujui harga penawaran' : 'Membuka kembali harga penawaran', namaT(st, id))),

    // Negosiasi
    catatPutaran: (id: string, harga: number, konsesi: string) => setS((st) => {
      const neg = st.negotiations[id]
      const margin = hitungMargin(harga, neg.biaya)
      const status = margin < neg.batasMargin ? 'Butuh approval' as const : 'Tercatat' as const
      const n = { ...st, negotiations: { ...st.negotiations, [id]: { ...neg, rounds: [...neg.rounds, { no: neg.rounds.length + 1, harga, konsesi, margin, status }] } } }
      return audit(n, `Mencatat putaran ${neg.rounds.length + 1}`, namaT(st, id), `Margin ${margin}%`)
    }),
    setujuiKonsesi: (id: string, no: number) => setS((st) => {
      const neg = st.negotiations[id]
      const n = { ...st, negotiations: { ...st.negotiations, [id]: { ...neg, rounds: neg.rounds.map((r) => (r.no === no ? { ...r, status: 'Disetujui' as const } : r)) } } }
      return audit(n, `Menyetujui konsesi putaran ${no}`, namaT(st, id))
    }),
    finalkanPutaran: (id: string, no: number) => setS((st) => {
      const neg = st.negotiations[id]
      const n = { ...st, negotiations: { ...st.negotiations, [id]: { ...neg, rounds: neg.rounds.map((r) => (r.no === no ? { ...r, status: 'Final' as const } : r)) } } }
      return audit(n, `Menandai final putaran ${no}`, namaT(st, id))
    }),

    // Hasil
    catatHasil: (id: string, hasil: TenderResult) => setS((st) => {
      let n = ubahStatus(st, id, hasil.hasil, { hasil, sesi: true, milestone: undefined })
      if (hasil.hasil !== 'Won') n = { ...n, assignments: n.assignments.map((a) => (a.tenderId === id ? { ...a, status: 'dilepas' as const } : a)) }
      return audit(n, `Mencatat hasil: ${hasil.hasil === 'Won' ? 'Menang' : hasil.hasil === 'Lost' ? 'Kalah' : 'Dibatalkan'}`, namaT(st, id), hasil.alasan)
    }),
    ubahSanggah: (id: string, sanggah: NonNullable<TenderResult['sanggah']>) => setS((st) => {
      const t = st.tenders.find((x) => x.id === id) as Tender
      return audit(patchT(st, id, { hasil: { ...(t.hasil as TenderResult), sanggah } }), 'Memperbarui status sanggah', t.nama, sanggah.catatan)
    }),
    tandaTanganKontrak: (id: string) => setS((st) => {
      const t = st.tenders.find((x) => x.id === id) as Tender
      const w = st.workspaces[id]
      const merah = w ? Object.entries(w.slots).flatMap(([slot, pid]) => {
        const lain = st.assignments.find((a) => a.personId === pid && a.tenderId !== id && a.status === 'aktif')
        const orang = st.people.find((p) => p.id === pid)
        return lain && orang ? [`${slot}: ${orang.nama} sudah ditugaskan di ${lain.proyek}`] : []
      }) : []
      let n = ubahStatus(st, id, 'Handover', { kontrakTtd: true })
      n = { ...n, handover: { ...n.handover, [id]: buatHandover(t, merah) } }
      return audit(n, 'Mencatat kontrak ditandatangani', t.nama, 'Handover Pack dibuat')
    }),
    pastikanHandover: (id: string) => setS((st) => {
      if (st.handover[id]) return st
      const t = st.tenders.find((x) => x.id === id) as Tender
      return { ...st, handover: { ...st.handover, [id]: buatHandover(t, []) } }
    }),
    centangHandover: (id: string, idx: number) => setS((st) => {
      const h = st.handover[id]
      return { ...st, handover: { ...st.handover, [id]: { ...h, ceklis: h.ceklis.map((c, i) => (i === idx ? { ...c, selesai: !c.selesai } : c)) } } }
    }),
    syncErp: (id: string) => setS((st) => audit({ ...st, handover: { ...st.handover, [id]: { ...st.handover[id], sync: 'Terkirim' } } }, 'Mengirim project code ke ERP/PMIS', namaT(st, id), 'Simulasi, tidak ada data terkirim')),
    mulaiPelaksanaan: (id: string) => setS((st) => audit(ubahStatus(st, id, 'Executing'), 'Serah terima selesai', namaT(st, id))),
    catatBast: (id: string) => setS((st) => {
      const t = st.tenders.find((x) => x.id === id) as Tender
      let n = ubahStatus(st, id, 'Closed', { bastDicatat: true })
      n = { ...n, pengalaman: [{ id: `x-${id}`, nama: t.nama, pemilik: t.pemilik, jenis: jenisDariSbu(t.sbu), nilai: t.hasil?.nilaiKontrak ?? t.hps, bast: HARI_INI, file: `BAST_${t.kode}.pdf`, dariTender: true }, ...n.pengalaman] }
      return audit(n, 'Mencatat BAST', t.nama, 'Pengalaman kerja masuk Capability Library')
    }),

    // CRM
    tambahAkun: (a: Account, catatan: string) => setS((st) => audit({ ...st, accounts: [a, ...st.accounts] }, 'Menambah akun', a.nama, catatan)),
    tambahKontak: (c: Contact) => setS((st) => audit({ ...st, contacts: [c, ...st.contacts] }, 'Menambah kontak', c.nama)),
    tambahInteraksi: (i: Interaction) => setS((st) => audit({ ...st, interactions: [i, ...st.interactions] }, `Mencatat ${i.jenis.toLowerCase()}`, st.accounts.find((a) => a.id === i.accountId)?.nama ?? '')),
    selesaikanTindakLanjut: (id: string) => setS((st) => ({ ...st, interactions: st.interactions.map((i) => (i.id === id && i.tindakLanjut ? { ...i, tindakLanjut: { ...i.tindakLanjut, selesai: true } } : i)) })),

    // Admin
    simpanPerm: (perm: PermMatrix) => setS((st) => audit({ ...st, perm }, 'Mengubah akses menu', 'Matriks akses')),
    toggleAi: (id: AiId) => setS((st) => audit({ ...st, ai: { ...st.ai, [id]: !st.ai[id] } }, st.ai[id] ? 'Mematikan fitur AI' : 'Menyalakan fitur AI', id)),
    catatAudit: (aksi: string, objek: string, detail?: string) => setS((st) => audit(st, aksi, objek, detail)),
  }), [audit])

  const boleh = useCallback((menuId: string, hak: Hak = 'lihat') => (s.perm[persona.peran][menuId] ?? []).includes(hak), [s.perm, persona.peran])
  const divisiIzin = persona.divisi
  const tendersTerlihat = useMemo(
    () => s.tenders.filter((t) => divisiIzin.includes(t.divisi) && (s.filterDivisi === 'Semua' || t.divisi === s.filterDivisi)),
    [s.tenders, s.filterDivisi, divisiIzin],
  )
  return { ...s, persona, boleh, tendersTerlihat, actions, aiAktif: (id: AiId) => s.ai[id] }
}

function buatHandover(t: Tender, merah: string[]): HandoverState {
  return {
    tenderId: t.id, pm: 'Dewi Anggraini', merah, sync: 'Belum',
    ceklis: ['Review lingkup dan komitmen teknis', 'Konfirmasi personel inti', 'Review jadwal dan risiko', 'Kickoff dengan pemilik proyek'].map((teks) => ({ teks, selesai: false })),
  }
}

type Demo = ReturnType<typeof useDemoInternal>
const Ctx = createContext<Demo | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const value = useDemoInternal()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemo() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDemo harus di dalam DemoProvider')
  return v
}
