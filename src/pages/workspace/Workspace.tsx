import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { RefreshCw, Upload } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import { toast } from 'sonner'
import { EKSTRAK_DURASI_MS, draftMetode, ksoFinder, metaEkstraksi } from '@/ai/bid'
import { HALAMAN_GAGAL_OCR } from '@/data/checklist'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { AiGate, AiLabel, BerlakuBadge, ItemBadge, PageHeader, StatTile, StatusBadge } from '@/components/shared'
import { Badge, Banner, Button, Card, DefList, Drawer, Field, Input, Modal, Progress, Select, Textarea } from '@/components/ui'
import { evaluasiItem, ringkasStatus } from '@/domain/compliance'
import { cariKonflik, pesanKonflik, rekomendasiPersonel } from '@/domain/conflicts'
import type { Kandidat } from '@/domain/conflicts'
import { fmtKeyakinan, fmtPersen, fmtRp, fmtRpPenuh, fmtTanggal, selisihHari } from '@/domain/format'
import { alasanBlokirReady, itemKurangAktif } from '@/domain/transitions'
import { SLOTS } from '@/domain/types'
import type { ChecklistItem, Kategori, Person, Slot, Tender } from '@/domain/types'
import { useDemo } from '@/store/DemoProvider'
import { ClarificationPanel } from './ClarificationPanel'

const TAB_CLS = 'border-b-2 border-transparent px-1 pb-2.5 text-sm font-semibold text-ink data-[state=active]:border-primary data-[state=active]:text-primary whitespace-nowrap'

export default function Workspace() {
  const { id = '' } = useParams()
  const { tenders, workspaces, boleh, actions } = useDemo()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = params.get('tab') ?? 'checklist'
  const t = tenders.find((x) => x.id === id)
  const w = workspaces[id]
  const [konfirmasiUnggah, setKonfirmasiUnggah] = useState(false)
  const [bukti, setBukti] = useState('')

  if (!t || !w) return <Banner>Bid Workspace belum tersedia untuk tender ini. Workspace dibuat setelah keputusan Go. <Link className="font-semibold text-primary" to="/gonogo">Buka Go/No-Go</Link></Banner>

  const sisa = selisihHari(t.batasPemasukan)
  const blokir = alasanBlokirReady(w)
  const isPreparing = t.status === 'Preparing'

  return (
    <div>
      <PageHeader crumbs={['Penawaran', 'Bid Workspace', t.nama]}
        title={<span className="flex flex-wrap items-center gap-3">{t.nama} <StatusBadge status={t.status} /></span>}
        sub={<>{t.pemilik} · HPS {fmtRpPenuh(t.hps)} · Tender {t.metode.toLowerCase()} · Batas pemasukan <strong className="text-ink">{fmtTanggal(t.batasPemasukan)}, 14.00 WIB</strong>{sisa >= 0 && ` (${sisa} hari lagi)`}</>}
        actions={<>
          {['Preparing', 'ReadyToSubmit'].includes(t.status) && <Button variant="outline" disabled={!!w.adendum} onClick={() => setParams({ tab: 'klarifikasi' })}><Upload size={16} /> Unggah adendum</Button>}
          {isPreparing && <Button disabled={blokir.length > 0} onClick={() => { actions.readyToSubmit(id); toast.success('Status Ready to Submit. Ringkasan penawaran dikunci.') }}>Ready to Submit</Button>}
          {t.status === 'ReadyToSubmit' && <Button onClick={() => setKonfirmasiUnggah(true)}>Konfirmasi sudah diunggah</Button>}
          {t.status === 'Submitted' && <Button variant="outline" onClick={() => { actions.mulaiEvaluasi(id); toast.success('Tender masuk tahap evaluasi.') }}>Catat masuk evaluasi</Button>}
          {t.status === 'UnderEvaluation' && <>
            <Button variant="outline" onClick={() => { actions.undangNegosiasi(id); toast.success('Negotiation Room dibuka.'); navigate(`/evaluasi/negosiasi?tender=${id}`) }}>Undangan negosiasi diterima</Button>
            <Button onClick={() => navigate(`/hasil/tender?catat=${id}`)}>Catat hasil</Button>
          </>}
        </>}
      />
      {isPreparing && blokir.length > 0 && <p className="-mt-2 mb-4 text-right text-xs text-ink-2">Ready to Submit nonaktif: {blokir.join('; ')}.</p>}
      {t.status === 'ReadyToSubmit' && <div className="mb-4"><Banner tone="green">Penawaran siap. <strong>Unggah dilakukan manual di SPSE</strong> oleh pengguna berwenang, lalu konfirmasi di sini.</Banner></div>}

      <Tabs.Root value={tab} onValueChange={(v) => setParams({ tab: v })}>
        <Tabs.List aria-label="Bagian Bid Workspace" className="mb-4 flex gap-7 overflow-x-auto border-b border-line">
          <Tabs.Trigger className={TAB_CLS} value="ringkasan">Ringkasan</Tabs.Trigger>
          <Tabs.Trigger className={TAB_CLS} value="checklist">Checklist & Kepatuhan</Tabs.Trigger>
          <Tabs.Trigger className={TAB_CLS} value="personel">Personel</Tabs.Trigger>
          <Tabs.Trigger className={TAB_CLS} value="dokumen">Dokumen</Tabs.Trigger>
          {boleh('harga') && <Tabs.Trigger className={TAB_CLS} value="harga">Harga</Tabs.Trigger>}
          <Tabs.Trigger className={TAB_CLS} value="klarifikasi">Klarifikasi</Tabs.Trigger>
          <Tabs.Trigger className={TAB_CLS} value="linimasa">Linimasa</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="ringkasan"><Ringkasan t={t} /></Tabs.Content>
        <Tabs.Content value="checklist"><Checklist t={t} /></Tabs.Content>
        <Tabs.Content value="personel"><Personel t={t} /></Tabs.Content>
        <Tabs.Content value="dokumen"><Dokumen t={t} /></Tabs.Content>
        {boleh('harga') && <Tabs.Content value="harga"><Harga t={t} /></Tabs.Content>}
        <Tabs.Content value="klarifikasi"><ClarificationPanel tender={t} /></Tabs.Content>
        <Tabs.Content value="linimasa"><Linimasa t={t} /></Tabs.Content>
      </Tabs.Root>

      <Modal open={konfirmasiUnggah} onOpenChange={setKonfirmasiUnggah} title="Konfirmasi unggah di portal" footer={<>
        <Button variant="neutral" onClick={() => setKonfirmasiUnggah(false)}>Batal</Button>
        <Button disabled={!bukti.trim()} onClick={() => { actions.submitted(id, bukti); setKonfirmasiUnggah(false); toast.success('Status Submitted. Personel inti ditandai sedang diajukan.') }}>Konfirmasi</Button>
      </>}>
        <p className="mb-3 text-sm">TenderIQ tidak mengunggah penawaran. Unggah dilakukan manual di SPSE, lalu lampirkan nomor bukti unggah.</p>
        <Field label="Nomor bukti unggah"><Input value={bukti} onChange={(e) => setBukti(e.target.value)} placeholder="Mis. SPSE-2026-118842" /></Field>
      </Modal>
    </div>
  )
}

function Ringkasan({ t }: { t: Tender }) {
  const { workspaces, people, gonogo } = useDemo()
  const w = workspaces[t.id]
  const r = ringkasStatus(w.checklist)
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Ringkasan Tender">
        <DefList rows={[['Lingkup', t.lingkup], ['Pemilik proyek', t.pemilik], ['Lokasi', t.lokasi], ['Sub-klasifikasi', t.sbu], ['PIC', t.pic], ['Catatan risiko', `${t.risiko.teks} (${t.risiko.sumber})`]]} />
      </Card>
      <Card title="Kondisi Penawaran">
        <DefList rows={[
          ['Checklist', w.checklist.length ? `${r.total} item · ${r.terpenuhi} Terpenuhi · ${r.kurang} Kurang · ${r.manual} Perlu dicek manual` : 'Belum dibuat'],
          ['Personel inti', SLOTS.map((s) => `${s}: ${people.find((p) => p.id === w.slots[s])?.nama ?? 'kosong'}`).join('; ')],
          ['Adendum', w.adendum ? `Adendum ${w.adendum.versi} diterapkan` : 'Belum ada'],
          ['Keputusan Go', gonogo[t.id]?.keputusan ?? 'Disetujui sebelum sesi demo'],
          ['Bukti unggah', w.buktiUnggah ?? 'Belum ada'],
        ]} />
      </Card>
    </div>
  )
}

function Checklist({ t }: { t: Tender }) {
  const { workspaces, actions, people, assignments, sbu, pengalaman, aiAktif } = useDemo()
  const w = workspaces[t.id]
  const [progres, setProgres] = useState<number | null>(null)
  const [mengecek, setMengecek] = useState(false)
  const timer = useRef<number | null>(null)
  const [f, setF] = useState({ q: '', kategori: '', status: '', pic: '' })
  const [detail, setDetail] = useState<ChecklistItem | null>(null)
  const [override, setOverride] = useState<ChecklistItem | null>(null)
  const [alasanOv, setAlasanOv] = useState('')
  const [manual, setManual] = useState(false)
  const [formManual, setFormManual] = useState({ teks: '', kategori: 'Administrasi' as Kategori, sumber: `Dok. pemilihan ${HALAMAN_GAGAL_OCR}`, pic: 'Budi S.', wajib: true })
  const [pilih, setPilih] = useState<{ slot: Slot; k: Kandidat } | null>(null)

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current) }, [])

  const ekstrak = () => {
    const mulai = Date.now()
    setProgres(0)
    timer.current = window.setInterval(() => {
      const p = Math.min(100, ((Date.now() - mulai) / EKSTRAK_DURASI_MS) * 100)
      setProgres(p)
      if (p >= 100) {
        if (timer.current) window.clearInterval(timer.current)
        setProgres(null)
        actions.isiChecklist(t.id)
        toast.success('Checklist berhasil dibuat dari dokumen pemilihan (42 item).')
      }
    }, 80)
  }
  const cek = () => {
    setMengecek(true)
    window.setTimeout(() => { actions.cekKepatuhan(t.id); setMengecek(false); toast.success('Cek kepatuhan selesai.') }, 1200)
  }

  const r = ringkasStatus(w.checklist)
  const belumTinjau = w.checklist.filter((i) => !i.ditinjau)
  const meta = metaEkstraksi(w.checklist.length, w.checklist.filter((i) => i.keyakinan < 0.7).length)
  const sudahCek = !!w.dicekPada
  const rows = w.checklist.filter((i) => (!f.q || i.teks.toLowerCase().includes(f.q.toLowerCase())) && (!f.kategori || i.kategori === f.kategori) && (!f.status || i.status === f.status) && (!f.pic || i.pic === f.pic))
  const ctx = { tenderId: t.id, batas: t.batasPemasukan, slots: w.slots, alasanKonflik: w.alasanKonflik, people, assignments, sbu, pengalaman }

  // Item Kurang dievaluasi ulang secara langsung agar panel rekomendasi mengikuti personel yang baru dipilih.
  const kurangPersonel = w.checklist.filter((i) => itemKurangAktif(i) && i.rule.tipe === 'personel')
  const masihKurang = kurangPersonel.filter((i) => evaluasiItem(i, ctx).status === 'Kurang')
  const slotGanti = masihKurang[0]?.rule.tipe === 'personel' ? masihKurang[0].rule.slot : null
  const rekom = slotGanti ? rekomendasiPersonel(slotGanti, t.id, t.batasPemasukan, people, assignments, w.slots[slotGanti]) : []
  const menungguCekUlang = kurangPersonel.length > masihKurang.length

  const pilihKandidat = (slot: Slot, k: Kandidat) => {
    if (k.konflik) { setPilih({ slot, k }); return }
    actions.pilihPersonel(t.id, slot, k.person.id)
    toast.success(`${k.person.nama} dipilih untuk ${slot}. Jalankan Cek Ulang Kepatuhan.`)
  }

  const kolom: Column<ChecklistItem>[] = [
    { key: 'no', header: 'No', render: (_, i) => i + 1 },
    { key: 'kat', header: 'Kategori', render: (i) => i.kategori },
    { key: 'teks', header: 'Persyaratan', className: 'min-w-[190px]', render: (i) => <><div className="font-semibold">{i.teks}</div><div className="text-xs text-ink-2">{i.sumber}</div></> },
    { key: 'w', header: 'Wajib', render: (i) => i.wajib ? 'Ya' : 'Tidak' },
    { key: 'dok', header: 'Dokumen Terlampir', className: 'max-w-[150px] break-words', render: (i) => i.dokumen ? <span className="text-primary">{i.dokumen.replace(/_/g, '_\u200b')}</span> : <span className="text-ink-2">-</span> },
    { key: 'pic', header: 'PIC', className: 'whitespace-nowrap', render: (i) => i.pic },
    { key: 'st', header: 'Status', render: (i) => !i.ditinjau ? <ItemBadge status="Perlu dicek manual" /> : <ItemBadge status={i.status} /> },
    { key: 'ket', header: 'Keterangan', className: 'min-w-[170px]', render: (i) => <>{i.keterangan}{i.override && <div className="text-xs font-semibold text-warn">Override disetujui: {i.override}</div>}</> },
    { key: 'aksi', header: 'Aksi', render: (i) => <Button size="sm" variant="outline" onClick={() => setDetail(i)}>Detail</Button> },
  ]

  return (
    <div className="space-y-4">
      {w.checklist.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Total Persyaratan" value={r.total} />
          <StatTile label="Terpenuhi" value={r.terpenuhi} tone="good" />
          <StatTile label="Kurang" value={r.kurang} tone="bad" />
          <StatTile label={r.review ? 'Perlu Dicek / Review' : 'Perlu Dicek Manual'} value={r.manual + r.review} tone="warn" />
        </div>
      )}

      <Card>
        {w.tahapChecklist === 'kosong' && (
          <div className="py-4">
            {progres === null ? (
              <AiGate id="BID-03" manual="Tambahkan persyaratan secara manual dengan tombol di bawah.">
                <p className="mb-3 text-sm text-ink-2">Belum ada checklist. Dokumen pemilihan (312 halaman) dan KAK (64 halaman) siap dianalisis.</p>
                <Button onClick={ekstrak}>Buat checklist dari dokumen pemilihan</Button>
              </AiGate>
            ) : (
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Mengekstrak persyaratan...</p><p className="text-xs text-ink-2">Membaca dokumen dan menandai sumber halaman setiap persyaratan.</p></div>
                <div className="w-1/2"><Progress value={progres} /></div>
                <span className="w-10 text-right text-sm font-semibold tabular-nums">{Math.round(progres)}%</span>
              </div>
            )}
            {!aiAktif('BID-03') && <Button className="mt-3" variant="outline" onClick={() => setManual(true)}>Tambah item manual</Button>}
          </div>
        )}

        {w.tahapChecklist !== 'kosong' && (
          <>
            {w.tahapChecklist === 'draf' && (
              <div className="mb-4 space-y-3">
                <Banner tone="orange"><strong>{HALAMAN_GAGAL_OCR} dokumen pemilihan gagal dibaca (scan buram).</strong> Unggah ulang atau tambahkan item secara manual. <button className="font-semibold text-primary underline" onClick={() => setManual(true)}>Tambah item manual</button></Banner>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3">
                  <div className="text-sm">
                    <p className="font-semibold">Tinjau {belumTinjau.length} item berkeyakinan di bawah 0,7 sebelum mengonfirmasi checklist.</p>
                    <ul className="mt-2 space-y-1.5">
                      {w.checklist.filter((i) => i.keyakinan < 0.7).map((i) => (
                        <li key={i.id} className="flex flex-wrap items-center gap-2">
                          <span>{i.teks} <span className="text-xs text-ink-2">({i.sumber}, keyakinan {fmtKeyakinan(i.keyakinan)})</span></span>
                          {i.ditinjau ? <Badge tone="green">Ditinjau</Badge> : <Button size="sm" variant="outline" onClick={() => actions.tinjauItem(t.id, i.id)}>Sesuai sumber</Button>}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button disabled={belumTinjau.length > 0} onClick={() => { actions.konfirmasiChecklist(t.id); toast.success('Checklist dikonfirmasi.') }}>Konfirmasi checklist</Button>
                </div>
                <AiLabel id="BID-03" keyakinan={meta.keyakinan} sumber={meta.sumber} />
              </div>
            )}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ink-2">{w.dicekPada ? `Cek kepatuhan terakhir ${w.dicekPada}` : 'Cek kepatuhan belum dijalankan'}</p>
              <div className="flex flex-wrap gap-2">
                {w.tahapChecklist === 'dikonfirmasi' && <Button variant="outline" onClick={() => setManual(true)}>Tambah item</Button>}
                {aiAktif('BID-04') ? (
                  <Button disabled={w.tahapChecklist !== 'dikonfirmasi' || mengecek} onClick={cek}><RefreshCw size={15} className={mengecek ? 'animate-spin' : ''} /> {mengecek ? 'Memeriksa...' : sudahCek ? 'Cek Ulang Kepatuhan' : 'Cek Kepatuhan'}</Button>
                ) : <Badge tone="orange">Compliance Checker dimatikan: semua item wajib ditinjau manusia</Badge>}
              </div>
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              <Field label="Persyaratan"><Input placeholder="Cari persyaratan" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></Field>
              <Field label="Kategori"><Select value={f.kategori} onChange={(e) => setF({ ...f, kategori: e.target.value })}><option value="">Semua kategori</option>{['Administrasi', 'Kualifikasi', 'Teknis', 'Harga'].map((k) => <option key={k}>{k}</option>)}</Select></Field>
              <Field label="Status"><Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">Semua status</option>{['Belum dicek', 'Terpenuhi', 'Kurang', 'Perlu dicek manual', 'Perlu review'].map((k) => <option key={k}>{k}</option>)}</Select></Field>
              <Field label="PIC"><Select value={f.pic} onChange={(e) => setF({ ...f, pic: e.target.value })}><option value="">Semua PIC</option>{[...new Set(w.checklist.map((i) => i.pic))].map((k) => <option key={k}>{k}</option>)}</Select></Field>
            </div>
            <DataTable columns={kolom} rows={rows} rowKey={(i) => i.id} pageSize={8} noun="persyaratan" />
            {sudahCek && <AiLabel id="BID-04" keyakinan={0.88} sumber={['Dokumen terlampir', 'Capability Library', 'Penugasan personel']} />}
          </>
        )}
      </Card>

      {sudahCek && (kurangPersonel.length > 0 || r.kurang > 0) && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <Card title="Penawaran belum bisa ditandai siap diunggah">
            <p className="text-sm">Masih ada {w.checklist.filter(itemKurangAktif).length} persyaratan wajib berstatus Kurang. Lengkapi dokumen atau ganti personel, lalu jalankan Cek Ulang Kepatuhan. Jika tetap ingin melanjutkan, ajukan override ke GM Divisi. Override tercatat di log audit.</p>
            {menungguCekUlang && <p className="mt-2 text-sm font-semibold text-primary">Personel sudah diganti. Jalankan Cek Ulang Kepatuhan.</p>}
            {w.overrideDiminta ? (
              <div className="mt-3 rounded-lg border border-line p-3 text-sm">
                <p>Override diajukan: {w.overrideDiminta.alasan}</p>
                <Button className="mt-2" size="sm" onClick={() => { actions.setujuiOverride(t.id); toast.success('Override disetujui dan tercatat di audit log.') }}>Setujui sebagai GM Divisi (simulasi)</Button>
              </div>
            ) : (
              <Button className="mt-3" variant="outline" disabled={r.kurang === 0} onClick={() => { setAlasanOv(''); setOverride(w.checklist.find(itemKurangAktif) ?? null) }}>Ajukan Override</Button>
            )}
          </Card>
          {slotGanti ? (
            <Card title={`Rekomendasi Pengganti: ${slotGanti}`}>
              <AiGate id="BID-07" manual="Pilih personel lewat tab Personel.">
                <DataTable
                  columns={[
                    { key: 'n', header: 'Nama', className: 'font-semibold', render: (k) => k.person.nama },
                    { key: 's', header: 'SKK', render: (k) => k.person.skk },
                    { key: 'b', header: 'Berlaku Sampai', className: 'whitespace-nowrap', render: (k) => fmtTanggal(k.person.berlaku) },
                    { key: 'p', header: 'Penugasan Saat Ini', render: (k) => k.konflik ? <Badge tone="orange">{k.konflik.status === 'aktif' ? 'Selesai proyek' : 'Diajukan sampai'} {fmtTanggal(k.konflik.sampai)}</Badge> : <Badge tone="green">Tersedia</Badge> },
                    { key: 'a', header: 'Aksi', render: (k) => <Button size="sm" variant={k.konflik ? 'outline' : 'primary'} onClick={() => pilihKandidat(slotGanti, k)}>Pilih</Button> },
                  ]}
                  rows={rekom} rowKey={(k) => k.person.id}
                />
                <AiLabel id="BID-07" keyakinan={0.91} sumber={['Dok. pemilihan hal. 14', 'Capability Library']} />
              </AiGate>
            </Card>
          ) : null}
        </div>
      )}

      <Drawer open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.teks}>
        {detail && (() => { const i = w.checklist.find((x) => x.id === detail.id) ?? detail; return (
          <div className="space-y-4 text-sm">
            <DefList rows={[['Kategori', i.kategori], ['Wajib', i.wajib ? 'Ya' : 'Tidak'], ['Sumber', i.sumber], ['Status', <ItemBadge key="s" status={i.status} />], ['Keterangan', i.keterangan || '-'], ['PIC', i.pic], ['Dokumen', i.dokumen ?? '-']]} />
            <blockquote className="rounded-lg bg-canvas p-3">"{i.kutipan}"</blockquote>
            {!i.manual && <AiLabel id="BID-03" keyakinan={i.keyakinan} sumber={[i.sumber]} />}
            {i.perluReview && <Button variant="outline" onClick={() => { actions.selesaiReview(t.id, i.id); setDetail(null); toast.success('Item selesai ditinjau.') }}>Selesai ditinjau</Button>}
          </div>
        ) })()}
      </Drawer>

      <Modal open={!!override} onOpenChange={(o) => !o && setOverride(null)} title="Ajukan override" footer={<>
        <Button variant="neutral" onClick={() => setOverride(null)}>Batal</Button>
        <Button disabled={!alasanOv.trim() || !override} onClick={() => { if (override) actions.ajukanOverride(t.id, override.id, alasanOv); setOverride(null); toast.success('Override diajukan ke GM Divisi.') }}>Ajukan</Button>
      </>}>
        <div className="space-y-3">
          <Field label="Persyaratan"><Select value={override?.id} onChange={(e) => setOverride(w.checklist.find((i) => i.id === e.target.value) ?? null)}>{w.checklist.filter(itemKurangAktif).map((i) => <option key={i.id} value={i.id}>{i.teks}</option>)}</Select></Field>
          <Field label="Alasan (tercatat di audit log)"><Textarea value={alasanOv} onChange={(e) => setAlasanOv(e.target.value)} /></Field>
        </div>
      </Modal>

      <Modal open={manual} onOpenChange={setManual} title="Tambah item manual" footer={<>
        <Button variant="neutral" onClick={() => setManual(false)}>Batal</Button>
        <Button disabled={!formManual.teks.trim()} onClick={() => { actions.tambahItem(t.id, formManual); if (w.tahapChecklist === 'kosong') actions.konfirmasiChecklist(t.id); setManual(false); setFormManual({ ...formManual, teks: '' }); toast.success('Item ditambahkan.') }}>Simpan</Button>
      </>}>
        <div className="space-y-3">
          <Field label="Persyaratan"><Input value={formManual.teks} onChange={(e) => setFormManual({ ...formManual, teks: e.target.value })} /></Field>
          <Field label="Kategori"><Select value={formManual.kategori} onChange={(e) => setFormManual({ ...formManual, kategori: e.target.value as Kategori })}>{['Administrasi', 'Kualifikasi', 'Teknis', 'Harga'].map((k) => <option key={k}>{k}</option>)}</Select></Field>
          <Field label="Sumber"><Input value={formManual.sumber} onChange={(e) => setFormManual({ ...formManual, sumber: e.target.value })} /></Field>
        </div>
      </Modal>

      <KonflikModal key={pilih?.k.person.id ?? 'tutup'} t={t} state={pilih} onClose={() => setPilih(null)} />
    </div>
  )
}

function KonflikModal({ t, state, onClose }: { t: Tender; state: { slot: Slot; k: Kandidat } | null; onClose: () => void }) {
  const { actions, people, assignments } = useDemo()
  const [alasan, setAlasan] = useState('')
  const alternatif = state ? rekomendasiPersonel(state.slot, t.id, t.batasPemasukan, people, assignments, state.k.person.id).filter((k) => !k.konflik) : []
  return (
    <Modal open={!!state} onOpenChange={(o) => !o && onClose()} title="Konflik penugasan personel" footer={<>
      <Button variant="neutral" onClick={onClose}>Batal</Button>
      <Button disabled={!alasan.trim()} onClick={() => { if (state) { actions.pilihPersonel(t.id, state.slot, state.k.person.id, alasan); toast.success('Personel dipilih dengan alasan tercatat.') } onClose() }}>Tetap pilih dengan alasan</Button>
    </>}>
      {state?.k.konflik && (
        <div className="space-y-3 text-sm">
          <Banner tone="orange">{pesanKonflik(state.k.person.nama, state.k.konflik, fmtTanggal)}.</Banner>
          {alternatif.length > 0 && <div>
            <p className="mb-1 font-semibold">Alternatif tanpa konflik</p>
            <ul className="space-y-1.5">{alternatif.map((a) => <li key={a.person.id} className="flex items-center justify-between gap-2"><span>{a.person.nama}<span className="block text-xs text-ink-2">{a.alasan}</span></span><Button size="sm" onClick={() => { actions.pilihPersonel(t.id, state.slot, a.person.id); toast.success(`${a.person.nama} dipilih untuk ${state.slot}.`); onClose() }}>Pilih</Button></li>)}</ul>
          </div>}
          <Field label="Alasan jika tetap memilih"><Textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} /></Field>
        </div>
      )}
    </Modal>
  )
}

function Personel({ t }: { t: Tender }) {
  const { workspaces, people, assignments, pengalaman, actions, aiAktif } = useDemo()
  const w = workspaces[t.id]
  const [buka, setBuka] = useState<Slot | null>(null)
  const [konflik, setKonflik] = useState<{ slot: Slot; k: Kandidat } | null>(null)
  const [kso, setKso] = useState(false)
  const pilih = (slot: Slot, person: Person) => {
    const c = cariKonflik(person.id, t.id, assignments)
    if (c) { setKonflik({ slot, k: { person, skor: 0, alasan: '', konflik: c } }); return }
    actions.pilihPersonel(t.id, slot, person.id)
    setBuka(null)
    toast.success(`${person.nama} dipilih untuk ${slot}.`)
  }
  const sejenis = pengalaman.filter((p) => p.nilai >= 50).sort((a, b) => b.nilai - a.nilai)
  const hasilKso = ksoFinder(t)
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {SLOTS.map((slot) => {
          const p = people.find((x) => x.id === w.slots[slot])
          const c = p && cariKonflik(p.id, t.id, assignments)
          return (
            <Card key={slot} title={slot} action={<Button size="sm" variant="outline" onClick={() => setBuka(buka === slot ? null : slot)}>{buka === slot ? 'Tutup' : 'Ganti'}</Button>}>
              {p ? <div className="text-sm">
                <p className="font-semibold">{p.nama}</p>
                <p className="text-xs text-ink-2">{p.skk}</p>
                <p className="mt-1.5 flex items-center gap-2 text-xs">Berlaku sampai {fmtTanggal(p.berlaku)} <BerlakuBadge iso={p.berlaku} /></p>
                {p.berlaku < t.batasPemasukan && <p className="mt-1 text-xs font-semibold text-bad">SKK berakhir sebelum batas pemasukan.</p>}
                {c && <p className="mt-1 text-xs font-semibold text-warn">{pesanKonflik(p.nama, c, fmtTanggal)}.</p>}
                {w.alasanKonflik[slot] && <p className="mt-1 text-xs">Alasan tercatat: {w.alasanKonflik[slot]}</p>}
              </div> : <p className="text-sm text-ink-2">Belum diisi.</p>}
            </Card>
          )
        })}
      </div>
      {buka && (
        <Card title={`Rekomendasi: ${buka}`}>
          <AiGate id="BID-07" manual="Pilih dari daftar personel di bawah.">
            <ul className="mb-3 space-y-2">
              {rekomendasiPersonel(buka, t.id, t.batasPemasukan, people, assignments, w.slots[buka]).map((k, i) => (
                <li key={k.person.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3 text-sm">
                  <span><span className="font-semibold">{i + 1}. {k.person.nama}</span><span className="block text-xs text-ink-2">{k.alasan}; berlaku sampai {fmtTanggal(k.person.berlaku)}</span>{k.konflik && <span className="block text-xs font-semibold text-warn">{pesanKonflik(k.person.nama, k.konflik, fmtTanggal)}</span>}</span>
                  <Button size="sm" variant={k.konflik ? 'outline' : 'primary'} onClick={() => pilih(buka, k.person)}>Pilih</Button>
                </li>
              ))}
            </ul>
            <AiLabel id="BID-07" keyakinan={0.91} sumber={['Dok. pemilihan hal. 14', 'Capability Library', 'Penugasan aktif']} />
          </AiGate>
          <div className="mt-3 max-w-sm">
            <Field label="Atau pilih personel lain">
              <Select value="" onChange={(e) => { const p = people.find((x) => x.id === e.target.value); if (p) pilih(buka, p) }}>
                <option value="">Pilih personel</option>
                {people.filter((p) => p.peran.includes(buka)).map((p) => <option key={p.id} value={p.id}>{p.nama} (berlaku sampai {fmtTanggal(p.berlaku)})</option>)}
              </Select>
            </Field>
          </div>
        </Card>
      )}
      <Card title="Pengalaman Sejenis yang Memenuhi" sub="minimal Rp50 M, diurutkan dari nilai tertinggi">
        <DataTable
          columns={[
            { key: 'n', header: 'Kontrak', render: (p) => p.nama }, { key: 'o', header: 'Pemilik', render: (p) => p.pemilik },
            { key: 'j', header: 'Jenis', render: (p) => p.jenis }, { key: 'v', header: 'Nilai', align: 'right', render: (p) => fmtRp(p.nilai) },
            { key: 'b', header: 'BAST', className: 'whitespace-nowrap', render: (p) => fmtTanggal(p.bast) }, { key: 'f', header: 'Dokumen', render: (p) => <span className="text-primary">{p.file}</span> },
          ]}
          rows={sejenis} rowKey={(p) => p.id}
        />
      </Card>
      <Card title="Mitra KSO" action={<Button variant="outline" size="sm" disabled={!aiAktif('BID-08')} onClick={() => setKso(!kso)}>Cari mitra KSO</Button>}>
        {kso ? <>
          <DataTable columns={[{ key: 'n', header: 'Perusahaan', className: 'font-semibold', render: (m) => m.nama }, { key: 'p', header: 'Kapabilitas Pelengkap', render: (m) => m.pelengkap }, { key: 'r', header: 'Riwayat', render: (m) => m.riwayat }, { key: 's', header: 'Kecocokan', align: 'right', render: (m) => fmtKeyakinan(m.skor) }]} rows={hasilKso.hasil} rowKey={(m) => m.nama} />
          <AiLabel id="BID-08" keyakinan={hasilKso.keyakinan} sumber={hasilKso.sumber} />
        </> : <p className="text-sm text-ink-2">Dipakai jika ada celah kapabilitas, misalnya sub-klasifikasi SBU atau pengalaman yang tidak dimiliki.</p>}
      </Card>
      <KonflikModal key={konflik?.k.person.id ?? 'tutup'} t={t} state={konflik} onClose={() => { setKonflik(null); setBuka(null) }} />
    </div>
  )
}

function Dokumen({ t }: { t: Tender }) {
  const { workspaces, boleh, actions, aiAktif } = useDemo()
  const w = workspaces[t.id]
  const dokumen = w.dokumen.filter((d) => !d.rahasia || boleh('harga'))
  const [memuat, setMemuat] = useState(false)
  const buatDraf = () => {
    setMemuat(true)
    window.setTimeout(() => { actions.setDraf(t.id, draftMetode(t).hasil); setMemuat(false); toast.success('Draf metode pelaksanaan dibuat.') }, 1200)
  }
  const meta = draftMetode(t)
  return (
    <div className="space-y-4">
      <Card title="Dokumen Tender">
        <DataTable columns={[
          { key: 'n', header: 'Dokumen', render: (d) => <span className="text-primary">{d.nama}</span> }, { key: 'j', header: 'Jenis', render: (d) => <>{d.jenis} {d.rahasia && <Badge tone="red">Rahasia</Badge>}</> },
          { key: 'v', header: 'Versi', render: (d) => d.versi }, { key: 'o', header: 'Diunggah Oleh', render: (d) => d.oleh },
        ]} rows={dokumen} rowKey={(d) => d.nama} />
      </Card>
      <Card title="Draft Assistant" action={aiAktif('BID-05') && <Button variant="outline" disabled={memuat} onClick={buatDraf}>{memuat ? 'Menyusun...' : 'Buat draf metode pelaksanaan'}</Button>}>
        <AiGate id="BID-05" manual="Susun metode pelaksanaan dari template.">
          {w.draf ? <>
            <h3 className="mb-2 text-sm font-semibold">{w.draf.judul}</h3>
            <div className="space-y-2 text-sm">{w.draf.isi.map((p) => <p key={p.teks}>{p.teks} <span className="text-xs text-ink-2">[{p.sumber}]</span></p>)}</div>
            <AiLabel id="BID-05" keyakinan={meta.keyakinan} sumber={meta.sumber} />
            <p className="mt-1 text-xs font-semibold">Draf wajib ditinjau tim teknis sebelum dipakai.</p>
          </> : <p className="text-sm text-ink-2">Membuat draf dari template dan penawaran menang yang mirip. Setiap paragraf menyertakan rujukan.</p>}
        </AiGate>
      </Card>
      <Card title="Pelacakan Jaminan">
        <DataTable columns={[
          { key: 'j', header: 'Jenis', render: (b) => b.jenis }, { key: 'p', header: 'Penerbit', render: (b) => b.penerbit }, { key: 'n', header: 'Nilai', align: 'right', render: (b) => fmtRp(b.nilai) },
          { key: 'b', header: 'Berlaku', className: 'whitespace-nowrap', render: (b) => b.berlaku ? fmtTanggal(b.berlaku) : '-' }, { key: 's', header: 'Status', render: (b) => <Badge tone={b.status === 'Terbit' ? 'green' : 'gray'}>{b.status}</Badge> },
        ]} rows={w.bond} rowKey={(b) => b.jenis} />
      </Card>
    </div>
  )
}

function Harga({ t }: { t: Tender }) {
  const { workspaces, actions, boleh } = useDemo()
  const w = workspaces[t.id]
  const margin = ((w.penawaran.total - w.penawaran.biaya) / w.penawaran.total) * 100
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Card title="Harga Penawaran" sub="rahasia, akses terbatas">
        <DefList rows={[
          ['Total penawaran', `${fmtRp(w.penawaran.total)} (${fmtPersen((w.penawaran.total / t.hps) * 100)} dari HPS)`],
          ['Margin rencana', fmtPersen(margin)],
          ['Status persetujuan', w.hargaDisetujui ? <Badge key="s" tone="green">Disetujui {w.penawaran.approver}</Badge> : <Badge key="s" tone="orange">Belum disetujui</Badge>],
        ]} />
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => actions.setujuiHarga(t.id, !w.hargaDisetujui)}>{w.hargaDisetujui ? 'Buka kembali persetujuan' : 'Setujui harga'}</Button>
        </div>
      </Card>
      <Card title="Pricing Intelligence">
        <p className="text-sm text-ink-2">Rentang harga, kurva peluang menang terhadap margin, dan cek kewajaran harga satuan.</p>
        {boleh('pricing') && <Link className="mt-2 inline-block text-sm font-semibold text-primary hover:underline" to={`/penawaran/pricing?tender=${t.id}`}>Buka Pricing Intelligence</Link>}
      </Card>
    </div>
  )
}

function Linimasa({ t }: { t: Tender }) {
  const { workspaces } = useDemo()
  const w = workspaces[t.id]
  const urut = [...w.linimasa].sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  return (
    <Card title="Linimasa Tahapan">
      <ol className="space-y-3 border-l-2 border-line pl-5">
        {urut.map((e) => (
          <li key={e.judul + e.tanggal} className="relative text-sm">
            <span className="absolute -left-[27px] top-1 size-3 rounded-full bg-primary" />
            <span className="font-semibold">{e.judul}</span>
            <span className="block text-xs text-ink-2">{fmtTanggal(e.tanggal)}{e.oleh && ` · ${e.oleh}`} · pengingat H-7, H-3, H-1</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

export function WorkspaceList() {
  const { tendersTerlihat, workspaces } = useDemo()
  const rows = tendersTerlihat.filter((t) => workspaces[t.id])
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader crumbs={['Penawaran', 'Bid Workspace']} title="Bid Workspace" sub="Ruang kerja tender yang sudah diputuskan Go." />
      <Card>
        <DataTable<Tender>
          columns={[
            { key: 'n', header: 'Tender', className: 'min-w-[240px]', render: (t) => <span className="font-semibold text-primary">{t.nama}</span> },
            { key: 'p', header: 'Pemilik Proyek', render: (t) => t.pemilik },
            { key: 'h', header: 'HPS', align: 'right', render: (t) => fmtRp(t.hps) },
            { key: 'b', header: 'Batas Pemasukan', className: 'whitespace-nowrap', render: (t) => fmtTanggal(t.batasPemasukan) },
            { key: 'st', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
            { key: 'k', header: 'Kepatuhan', render: (t) => { const r = ringkasStatus(workspaces[t.id].checklist); return r.total ? (r.kurang > 0 ? <Badge tone="red">{r.kurang} Kurang</Badge> : <Badge tone="green">Tidak ada Kurang</Badge>) : <Badge>Belum dibuat</Badge> } },
            { key: 'pic', header: 'PIC', className: 'whitespace-nowrap', render: (t) => t.pic },
          ]}
          rows={rows} rowKey={(t) => t.id} pageSize={10} noun="workspace" onRowClick={(t) => navigate(`/penawaran/workspace/${t.id}`)} empty="Belum ada workspace. Workspace dibuat setelah keputusan Go."
        />
      </Card>
    </div>
  )
}
