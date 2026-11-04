import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ksoFinder } from '@/ai/bid'
import { relevanceScore, ringkasanTender, sbuDimilikiEntitas } from '@/ai/radar'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { AiGate, AiLabel, PageHeader } from '@/components/shared'
import { Badge, Banner, Button, Card, DefList, Drawer, Field, Input, Modal, Select } from '@/components/ui'
import { fmtRp, fmtRpPenuh, fmtTanggal, HARI_INI, tambahHari } from '@/domain/format'
import type { Tender } from '@/domain/types'
import { DIVISI } from '@/domain/types'
import type { Divisi } from '@/domain/types'
import { useDemo } from '@/store/DemoProvider'
import { unduhCsv } from './helpers'

const FILTER_AWAL = { q: '', sbu: '', pemilik: '', metode: '', nilai: '', lokasi: '' }
type Filter = typeof FILTER_AWAL
const RENTANG: Record<string, (h: number) => boolean> = {
  '< Rp50 M': (h) => h < 50, 'Rp50–100 M': (h) => h >= 50 && h <= 100, 'Rp100–200 M': (h) => h > 100 && h <= 200, '> Rp200 M': (h) => h > 200,
}
const ALASAN_TOLAK = ['Di luar wilayah strategis', 'Nilai terlalu kecil', 'Kapasitas tidak tersedia', 'SBU tidak sesuai', 'Margin tidak menarik']

export default function Radar() {
  const { tendersTerlihat, sbu, actions, accounts, aiAktif } = useDemo()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [draf, setDraf] = useState<Filter>(FILTER_AWAL)
  const [aktif, setAktif] = useState<Filter>(FILTER_AWAL)
  const [tersimpan, setTersimpan] = useState<{ nama: string; f: Filter }[]>([{ nama: 'Jalan ≥ Rp100 M', f: { ...FILTER_AWAL, sbu: 'SI001 Jalan', nilai: 'Rp100–200 M' } }])
  const [tolak, setTolak] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [ksoUntuk, setKsoUntuk] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const [form, setForm] = useState({ nama: '', pemilik: accounts[0].nama, hps: '', batas: tambahHari(HARI_INI, 21), divisi: 'Infrastruktur 1' as Divisi })

  const kode = sbu.map((s) => s.kode)
  const skor = (t: Tender) => relevanceScore(t.relevance, sbuDimilikiEntitas(t, kode))
  const baru = useMemo(() => tendersTerlihat.filter((t) => t.status === 'Discovered' && !t.tidakRelevan), [tendersTerlihat])
  const opsi = (k: (t: Tender) => string) => [...new Set(baru.map(k))].sort()

  const rows = useMemo(() => baru
    .filter((t) => (!aktif.q || `${t.nama} ${t.kode}`.toLowerCase().includes(aktif.q.toLowerCase()))
      && (!aktif.sbu || t.sbu === aktif.sbu) && (!aktif.pemilik || t.pemilik === aktif.pemilik) && (!aktif.metode || t.metode === aktif.metode)
      && (!aktif.lokasi || t.lokasi === aktif.lokasi) && (!aktif.nilai || RENTANG[aktif.nilai](t.hps)))
    .sort((a, b) => b.relevance - a.relevance), [baru, aktif])

  const idDibuka = params.get('tender')
  const dibuka = tendersTerlihat.find((t) => t.id === idDibuka) ?? null
  const tutup = () => setParams({})
  const buka = (t: Tender) => setParams({ tender: t.id })
  const milikSbu = dibuka ? sbuDimilikiEntitas(dibuka, kode) : true
  const ring = dibuka ? ringkasanTender(dibuka) : null

  const kolom: Column<Tender>[] = [
    { key: 'no', header: 'No', render: (_, i) => i + 1 },
    { key: 'skor', header: 'Skor', render: (t) => aiAktif('RAD-03') ? <Badge tone={skor(t) >= 70 ? 'solid' : 'blue'} className="px-2.5 py-1 text-sm">{skor(t)}</Badge> : <span className="text-ink-2">-</span> },
    { key: 'nama', header: 'Nama Paket', className: 'min-w-[260px]', render: (t) => <><div className="font-semibold">{t.nama}</div><div className="text-xs text-ink-2">{t.alasan[0]}</div></> },
    { key: 'pem', header: 'Pemilik Proyek', render: (t) => t.pemilik },
    { key: 'hps', header: 'HPS', align: 'right', className: 'whitespace-nowrap', render: (t) => fmtRp(t.hps) },
    { key: 'met', header: 'Metode', render: (t) => t.metode },
    { key: 'lok', header: 'Lokasi', render: (t) => t.lokasi },
    { key: 'bat', header: 'Batas Pemasukan', className: 'whitespace-nowrap', render: (t) => fmtTanggal(t.batasPemasukan) },
    { key: 'sum', header: 'Sumber', render: (t) => <div className="flex flex-col items-start gap-1">{t.sumber.map((s) => <Badge key={s}>{s}</Badge>)}</div> },
  ]

  const set = (k: keyof Filter) => (e: { target: { value: string } }) => setDraf({ ...draf, [k]: e.target.value })
  const unduh = () => { unduhCsv('tender-radar.csv', [['Skor', 'Nama', 'Pemilik', 'HPS (Rp miliar)', 'Metode', 'Lokasi', 'Batas', 'Sumber'], ...rows.map((t) => [skor(t), t.nama, t.pemilik, t.hps, t.metode, t.lokasi, t.batasPemasukan, t.sumber.join(' + ')])]); toast.success('Daftar tender diunduh.') }

  const tambahManual = () => {
    const akun = accounts.find((a) => a.nama === form.pemilik) ?? accounts[0]
    actions.tambahTender({
      id: `m${Date.now()}`, kode: `TND-2026-M${Date.now() % 1000}`, nama: form.nama, divisi: form.divisi, accountId: akun.id, pemilik: akun.nama, segmen: akun.tipe === 'BUMN' ? 'BUMN' : akun.tipe === 'Swasta' ? 'Swasta' : 'Pemerintah',
      hps: Number(form.hps), metode: 'Pascakualifikasi', lokasi: akun.wilayah, sbu: 'SI001 Jalan', sumber: ['Input manual'], batasPemasukan: form.batas, relevance: 60,
      alasan: ['SBU jalan berlaku', 'Ditambahkan manual oleh tim', 'Skor awal menunggu dokumen pemilihan'], risiko: { teks: 'Belum ada dokumen pemilihan untuk dianalisis', sumber: 'Input manual' },
      lingkup: 'Lingkup akan diperbarui setelah dokumen pemilihan diunggah.', jadwal: [{ tahap: 'Batas pemasukan penawaran', tanggal: form.batas }], persyaratanKunci: ['Menunggu dokumen pemilihan'], status: 'Discovered', pic: 'Rina K.',
    })
    setManual(false)
    setForm({ ...form, nama: '', hps: '' })
    toast.success('Tender ditambahkan ke Radar.')
  }

  return (
    <div>
      <PageHeader crumbs={['Peluang', 'Tender Radar']} title="Tender Radar" actions={<>
        <Button variant="outline" onClick={() => setManual(true)}><PlusCircle size={16} /> Tambah Tender Manual</Button>
        <Button variant="outline" onClick={() => toast.info('Simulasi: tidak ada email baru untuk diimpor.')}><PlusCircle size={16} /> Impor dari Email</Button>
      </>} />
      <div className="mb-4"><Banner><strong>Portal e-proc BUMN Energi belum tersinkron.</strong> Data dari portal ini terakhir diperbarui 3 Nov 2026, 22.00 WIB. Tender dari sumber lain tetap diperbarui.</Banner></div>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-2">Data terakhir diperbarui 4 Nov 2026, 10.00 WIB · 5 sumber terhubung</p>
          <Button variant="outline" onClick={unduh}><Download size={16} /> Unduh Daftar Tender</Button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setAktif(draf) }}>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Nama/Kode Paket"><Input placeholder="Cari nama atau kode paket" value={draf.q} onChange={set('q')} /></Field>
            <Field label="Sub-klasifikasi SBU"><Select value={draf.sbu} onChange={set('sbu')}><option value="">Pilih sub-klasifikasi</option>{opsi((t) => t.sbu).map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="Pemilik Proyek"><Select value={draf.pemilik} onChange={set('pemilik')}><option value="">Pilih pemilik proyek</option>{opsi((t) => t.pemilik).map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="Metode Pemilihan"><Select value={draf.metode} onChange={set('metode')}><option value="">Pilih metode</option>{opsi((t) => t.metode).map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="Nilai HPS"><Select value={draf.nilai} onChange={set('nilai')}><option value="">Pilih rentang nilai</option>{Object.keys(RENTANG).map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="Lokasi"><Select value={draf.lokasi} onChange={set('lokasi')}><option value="">Pilih provinsi</option>{opsi((t) => t.lokasi).map((x) => <option key={x}>{x}</option>)}</Select></Field>
          </div>
          <div className="my-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-ink-2">Pencarian tersimpan:</span>
              {tersimpan.map((s) => <button type="button" key={s.nama} onClick={() => { setDraf(s.f); setAktif(s.f) }} className="rounded-full border border-line px-2.5 py-1 hover:border-primary hover:text-primary">{s.nama}</button>)}
              <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { setTersimpan([...tersimpan, { nama: `Pencarian ${tersimpan.length + 1}`, f: draf }]); toast.success('Pencarian disimpan. Notifikasi aktif untuk tender baru yang cocok.') }}>Simpan pencarian</button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setDraf(FILTER_AWAL); setAktif(FILTER_AWAL) }}>Reset Filter</Button>
              <Button type="submit" className="px-8">Cari</Button>
            </div>
          </div>
        </form>
        <DataTable columns={kolom} rows={rows} rowKey={(t) => t.id} pageSize={8} noun="tender" onRowClick={buka} empty="Tidak ada tender yang cocok dengan filter." />
        <p className="mt-3 text-xs text-ink-2">Skor relevansi dihasilkan AI dari kecocokan SBU, nilai, lokasi, dan riwayat menang divisi. Skor ≥ 70 ditandai biru tua. Tender dengan SBU yang tidak dimiliki entitas dibatasi maksimal 30.</p>
      </Card>

      <Drawer open={!!dibuka} onOpenChange={(o) => !o && tutup()} title={dibuka ? `Ringkasan Tender: ${dibuka.nama}` : ''}
        footer={dibuka && dibuka.status === 'Discovered' ? <>
          <Button variant="neutral" onClick={() => { setAlasan(''); setTolak(true) }}>Tandai tidak relevan</Button>
          <Button onClick={() => { actions.qualify(dibuka.id); toast.success('Tender masuk tahap kualifikasi.'); navigate(`/gonogo/${dibuka.id}`) }}>Qualify</Button>
        </> : undefined}>
        {dibuka && ring && (
          <div className="space-y-5 text-sm">
            <DefList rows={[
              ['Pemilik proyek', dibuka.pemilik],
              ['Nilai HPS', `${fmtRp(dibuka.hps)} (${fmtRpPenuh(dibuka.hps)})`],
              ['Metode', dibuka.metode],
              ['Lokasi', dibuka.lokasi],
              ['Sub-klasifikasi', dibuka.sbu],
              ['Batas pemasukan', fmtTanggal(dibuka.batasPemasukan)],
              ['Sumber', <span key="s" className="flex flex-wrap gap-1">{dibuka.sumber.map((s) => <Badge key={s}>{s}</Badge>)}</span>],
              ['Relevance Score', <strong key="r">{skor(dibuka)} / 100</strong>],
            ]} />
            <AiGate id="RAD-04" manual="Baca dokumen pemilihan untuk meninjau lingkup dan risiko.">
              <div className="space-y-4">
                <section><h3 className="mb-1 font-semibold">Lingkup</h3><p>{ring.hasil.lingkup}</p></section>
                <section><h3 className="mb-1 font-semibold">Jadwal penting</h3><ul className="space-y-0.5">{dibuka.jadwal.map((j) => <li key={j.tahap} className="flex justify-between gap-3"><span>{j.tahap}</span><span className="tabular-nums text-ink-2">{fmtTanggal(j.tanggal)}</span></li>)}</ul></section>
                <section><h3 className="mb-1 font-semibold">Persyaratan kunci</h3><ul className="list-disc pl-5">{ring.hasil.kunci.map((k) => <li key={k}>{k}</li>)}</ul></section>
                <section><h3 className="mb-1 font-semibold">3 alasan relevansi</h3><ol className="list-decimal pl-5">{ring.hasil.alasan.map((k) => <li key={k}>{k}</li>)}</ol></section>
                <section className="rounded-lg bg-warn-soft p-3"><h3 className="mb-1 font-semibold">Catatan risiko</h3><p>{ring.hasil.risiko} ({ring.hasil.rujukan})</p></section>
                <AiLabel id="RAD-04" keyakinan={ring.keyakinan} sumber={ring.sumber} />
              </div>
            </AiGate>
            {!milikSbu && (
              <section className="rounded-lg border border-line p-3">
                <h3 className="mb-1 font-semibold">SBU {dibuka.sbu.split(' ')[0]} tidak dimiliki</h3>
                <Button variant="outline" size="sm" disabled={!aiAktif('BID-08')} onClick={() => setKsoUntuk(dibuka.id)}>Cari mitra KSO</Button>
                {ksoUntuk === dibuka.id && (() => { const k = ksoFinder(dibuka); return <><ul className="mt-2 space-y-1.5">{k.hasil.map((m) => <li key={m.nama}><strong>{m.nama}</strong>: {m.pelengkap}. <span className="text-ink-2">{m.riwayat}</span></li>)}</ul><AiLabel id="BID-08" keyakinan={k.keyakinan} sumber={k.sumber} /></> })()}
              </section>
            )}
          </div>
        )}
      </Drawer>

      <Modal open={tolak} onOpenChange={setTolak} title="Tandai tidak relevan" footer={<>
        <Button variant="neutral" onClick={() => setTolak(false)}>Batal</Button>
        <Button disabled={!alasan} onClick={() => { if (dibuka) actions.tidakRelevan(dibuka.id, alasan); setTolak(false); tutup(); toast.success('Masukan tersimpan untuk pelatihan ulang model.') }}>Simpan</Button>
      </>}>
        <Field label="Alasan"><Select value={alasan} onChange={(e) => setAlasan(e.target.value)}><option value="">Pilih alasan</option>{ALASAN_TOLAK.map((a) => <option key={a}>{a}</option>)}</Select></Field>
        <p className="mt-2 text-xs text-ink-2">Tender tidak akan muncul lagi di daftar prioritas Anda.</p>
      </Modal>

      <Modal open={manual} onOpenChange={setManual} title="Tambah Tender Manual" footer={<>
        <Button variant="neutral" onClick={() => setManual(false)}>Batal</Button>
        <Button disabled={!form.nama || !(Number(form.hps) > 0)} onClick={tambahManual}>Simpan</Button>
      </>}>
        <div className="space-y-3">
          <Field label="Nama paket"><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></Field>
          <Field label="Pemilik proyek"><Select value={form.pemilik} onChange={(e) => setForm({ ...form, pemilik: e.target.value })}>{accounts.map((a) => <option key={a.id}>{a.nama}</option>)}</Select></Field>
          <Field label="Divisi"><Select value={form.divisi} onChange={(e) => setForm({ ...form, divisi: e.target.value as Divisi })}>{DIVISI.map((d) => <option key={d}>{d}</option>)}</Select></Field>
          <Field label="HPS (Rp miliar)"><Input type="number" min={1} value={form.hps} onChange={(e) => setForm({ ...form, hps: e.target.value })} /></Field>
          <Field label="Batas pemasukan"><Input type="date" value={form.batas} onChange={(e) => setForm({ ...form, batas: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  )
}
