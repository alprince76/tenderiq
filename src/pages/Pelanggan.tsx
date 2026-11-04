import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Download, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { accountInsight, cariDuplikat } from '@/ai/post'
import { DataTable } from '@/components/DataTable'
import { AiGate, AiLabel, PageHeader, StatusBadge } from '@/components/shared'
import { Badge, Banner, Button, Card, DefList, Field, Input, Modal, Select, Textarea } from '@/components/ui'
import type { Tone } from '@/components/ui'
import { fmtPersen, fmtRp, fmtTanggal, HARI_INI, tambahHari } from '@/domain/format'
import type { Account, Contact, Interaction } from '@/domain/types'
import { useDemo } from '@/store/DemoProvider'
import { riwayatAkun } from '@/store/selectors'
import { ruteTender, unduhCsv } from './helpers'

const TIPE: Account['tipe'][] = ['K/L', 'Pemda', 'BUMN', 'Swasta']
const interaksiTerakhir = (id: string, list: Interaction[]) => list.filter((i) => i.accountId === id).sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0]

export function AkunList() {
  const { accounts, contacts, interactions, tenders, actions } = useDemo()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [tipe, setTipe] = useState('')
  const [wilayah, setWilayah] = useState('')
  const [tambah, setTambah] = useState(false)
  const [form, setForm] = useState({ nama: '', tipe: 'K/L' as Account['tipe'], wilayah: '' })
  const dup = cariDuplikat(form.nama, accounts)
  const rows = useMemo(() => accounts.filter((a) => (!q || a.nama.toLowerCase().includes(q.toLowerCase())) && (!tipe || a.tipe === tipe) && (!wilayah || a.wilayah === wilayah)), [accounts, q, tipe, wilayah])
  const simpan = (catatan: string) => {
    actions.tambahAkun({ id: `a${Date.now()}`, nama: form.nama, tipe: form.tipe, wilayah: form.wilayah || '-', pic: 'Rina K.', tier: 'Tier 3' }, catatan)
    setTambah(false); setForm({ nama: '', tipe: 'K/L', wilayah: '' }); toast.success('Akun ditambahkan.')
  }
  const statistik = (a: Account) => {
    const r = riwayatAkun(a.id, tenders)
    return { ...r, kontak: contacts.filter((c) => c.accountId === a.id).length, terakhir: interaksiTerakhir(a.id, interactions)?.tanggal }
  }
  return (
    <div>
      <PageHeader crumbs={['Pelanggan', 'Akun Pemilik Proyek']} title="Akun Pemilik Proyek" actions={<Button variant="outline" onClick={() => setTambah(true)}><PlusCircle size={16} /> Tambah Akun</Button>} />
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-2">Data terakhir diperbarui 4 Nov 2026, 10.00 WIB</p>
          <Button variant="outline" onClick={() => { unduhCsv('akun-pemilik-proyek.csv', [['Nama', 'Tipe', 'Wilayah', 'PIC'], ...rows.map((a) => [a.nama, a.tipe, a.wilayah, a.pic])]); toast.success('Daftar akun diunduh.') }}><Download size={16} /> Unduh Daftar Akun</Button>
        </div>
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <Field label="Nama Akun"><Input placeholder="Cari nama pemilik proyek" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
          <Field label="Tipe"><Select value={tipe} onChange={(e) => setTipe(e.target.value)}><option value="">Pilih tipe</option>{TIPE.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Wilayah"><Select value={wilayah} onChange={(e) => setWilayah(e.target.value)}><option value="">Pilih wilayah</option>{[...new Set(accounts.map((a) => a.wilayah))].sort().map((w) => <option key={w}>{w}</option>)}</Select></Field>
        </div>
        <DataTable<Account>
          columns={[
            { key: 'no', header: 'No', render: (_, i) => i + 1 },
            { key: 'n', header: 'Nama Akun', className: 'font-semibold', render: (a) => <Link to={`/pelanggan/akun/${a.id}`} className="text-primary hover:underline">{a.nama}</Link> },
            { key: 't', header: 'Tipe', render: (a) => <Badge tone="blue">{a.tipe}</Badge> },
            { key: 'w', header: 'Wilayah', render: (a) => a.wilayah },
            { key: 'k', header: 'Kontak', align: 'right', render: (a) => statistik(a).kontak },
            { key: 'i', header: 'Tender Diikuti', align: 'right', render: (a) => statistik(a).ikut },
            { key: 'r', header: 'Win Rate', align: 'right', render: (a) => fmtPersen(statistik(a).win) },
            { key: 'l', header: 'Interaksi Terakhir', className: 'whitespace-nowrap', render: (a) => fmtTanggal(statistik(a).terakhir) },
            { key: 'p', header: 'PIC Internal', className: 'whitespace-nowrap', render: (a) => a.pic },
          ]}
          rows={rows} rowKey={(a) => a.id} pageSize={10} noun="akun" onRowClick={(a) => navigate(`/pelanggan/akun/${a.id}`)}
        />
      </Card>
      <Modal open={tambah} onOpenChange={setTambah} title="Tambah Akun" footer={dup ? <>
        <Button variant="neutral" onClick={() => { actions.catatAudit('Menggabungkan akun', dup.nama, `Input: ${form.nama}`); setTambah(false); navigate(`/pelanggan/akun/${dup.id}`); toast.success('Digabungkan ke akun yang sudah ada.') }}>Gabungkan</Button>
        <Button variant="outline" onClick={() => simpan(`Tetap dibuat walau mirip ${dup.nama}`)}>Tetap buat baru</Button>
      </> : <>
        <Button variant="neutral" onClick={() => setTambah(false)}>Batal</Button>
        <Button disabled={!form.nama.trim()} onClick={() => simpan('Akun baru')}>Simpan</Button>
      </>}>
        <div className="space-y-3">
          <Field label="Nama akun"><Input value={form.nama} placeholder="Coba: Balai Besar Pelaksanaan Jalan Nasional X" onChange={(e) => setForm({ ...form, nama: e.target.value })} /></Field>
          {dup && <div><Banner>Akun serupa sudah ada: <strong>{dup.nama}</strong>{dup.alias && ` (${dup.alias})`}. Keputusan tercatat di audit log.</Banner><AiLabel id="CRM-04" keyakinan={0.94} sumber={['Daftar akun']} /></div>}
          <Field label="Tipe"><Select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value as Account['tipe'] })}>{TIPE.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Wilayah"><Input value={form.wilayah} onChange={(e) => setForm({ ...form, wilayah: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  )
}

const RELASI_TONE: Record<Contact['relasi'], Tone> = { Kuat: 'green', Sedang: 'orange', Lemah: 'red' }

function FormInteraksi({ open, onOpenChange, accountId }: { open: boolean; onOpenChange: (o: boolean) => void; accountId?: string }) {
  const { accounts, contacts, actions, persona } = useDemo()
  const [f, setF] = useState({ akun: accountId ?? accounts[0].id, jenis: 'Kunjungan' as Interaction['jenis'], ringkasan: '', kontak: '', tl: '', tgl: tambahHari(HARI_INI, 14) })
  const akun = accountId ?? f.akun
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Catat Interaksi" footer={<>
      <Button variant="neutral" onClick={() => onOpenChange(false)}>Batal</Button>
      <Button disabled={!f.ringkasan.trim()} onClick={() => {
        actions.tambahInteraksi({ id: `i${Date.now()}`, accountId: akun, tanggal: HARI_INI, jenis: f.jenis, ringkasan: f.ringkasan, kontak: f.kontak || (contacts.find((c) => c.accountId === akun)?.nama ?? '-'), oleh: persona.pendek, tindakLanjut: f.tl.trim() ? { teks: f.tl, tanggal: f.tgl, selesai: false } : undefined })
        onOpenChange(false); setF({ ...f, ringkasan: '', tl: '' }); toast.success(f.tl.trim() ? `Interaksi tercatat. Pengingat ${fmtTanggal(f.tgl)} dibuat.` : 'Interaksi tercatat.')
      }}>Simpan</Button>
    </>}>
      <div className="space-y-3">
        {!accountId && <Field label="Akun"><Select value={f.akun} onChange={(e) => setF({ ...f, akun: e.target.value, kontak: '' })}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}</Select></Field>}
        <Field label="Jenis"><Select value={f.jenis} onChange={(e) => setF({ ...f, jenis: e.target.value as Interaction['jenis'] })}>{['Kunjungan', 'Rapat', 'Email'].map((j) => <option key={j}>{j}</option>)}</Select></Field>
        <Field label="Kontak"><Select value={f.kontak} onChange={(e) => setF({ ...f, kontak: e.target.value })}><option value="">Pilih kontak</option>{contacts.filter((c) => c.accountId === akun).map((c) => <option key={c.id}>{c.nama}</option>)}</Select></Field>
        <Field label="Ringkasan"><Textarea value={f.ringkasan} onChange={(e) => setF({ ...f, ringkasan: e.target.value })} /></Field>
        <Field label="Tindak lanjut (opsional)"><Input value={f.tl} onChange={(e) => setF({ ...f, tl: e.target.value })} /></Field>
        <Field label="Tanggal tindak lanjut"><Input type="date" value={f.tgl} onChange={(e) => setF({ ...f, tgl: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

export function AkunDetail() {
  const { id = '' } = useParams()
  const { accounts, contacts, interactions, tenders, actions } = useDemo()
  const [catat, setCatat] = useState(false)
  const a = accounts.find((x) => x.id === id)
  if (!a) return <Banner>Akun tidak ditemukan.</Banner>
  const kontak = contacts.filter((c) => c.accountId === id)
  const timeline = interactions.filter((i) => i.accountId === id).sort((x, y) => y.tanggal.localeCompare(x.tanggal))
  const riwayat = riwayatAkun(id, tenders)
  const insight = accountInsight(a, riwayat.win, riwayat.ikut, timeline[0] && fmtTanggal(timeline[0].tanggal))
  const aktif = tenders.filter((t) => t.accountId === id && !['Won', 'Lost', 'Closed', 'Cancelled', 'NoGo', 'Handover', 'Executing'].includes(t.status))
  return (
    <div>
      <PageHeader crumbs={['Pelanggan', 'Akun Pemilik Proyek', a.nama]} title={a.nama} sub={a.alias} actions={<Button variant="outline" onClick={() => setCatat(true)}><PlusCircle size={16} /> Catat Interaksi</Button>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <Card title="Info Akun">
            <DefList rows={[['Tipe', a.tipe], ['Wilayah', a.wilayah], ['Tier', a.tier], ['PIC internal', a.pic], ['Tender diikuti', riwayat.ikut], ['Win rate di akun', <strong key="w">{fmtPersen(riwayat.win)}</strong>]]} />
          </Card>
          <Card title="Kesehatan Akun">
            <AiGate id="CRM-04" manual="Tinjau riwayat tender dan interaksi di bawah.">
              <Badge tone={insight.hasil.status === 'Sehat' ? 'green' : insight.hasil.status === 'Perlu perhatian' ? 'orange' : 'red'}>{insight.hasil.status}</Badge>
              <p className="mt-2 text-sm">{insight.hasil.ringkasan}</p>
              <AiLabel id="CRM-04" keyakinan={insight.keyakinan} sumber={insight.sumber} />
            </AiGate>
          </Card>
          <Card title="Timeline Interaksi">
            <ol className="space-y-3 border-l-2 border-line pl-4">
              {timeline.map((i) => (
                <li key={i.id} className="text-sm">
                  <div className="flex items-center gap-2"><Badge tone="blue">{i.jenis}</Badge><span className="text-xs text-ink-2">{fmtTanggal(i.tanggal)} · {i.oleh}</span></div>
                  <p className="mt-1">{i.ringkasan}</p>
                  <p className="text-xs text-ink-2">Kontak: {i.kontak}</p>
                  {i.tindakLanjut && <p className="mt-1 flex flex-wrap items-center gap-2 text-xs"><span className={i.tindakLanjut.selesai ? 'text-good' : 'font-semibold'}>Tindak lanjut: {i.tindakLanjut.teks} ({fmtTanggal(i.tindakLanjut.tanggal)})</span>{!i.tindakLanjut.selesai && <button className="font-semibold text-primary hover:underline" onClick={() => actions.selesaikanTindakLanjut(i.id)}>Tandai selesai</button>}</p>}
                </li>
              ))}
              {timeline.length === 0 && <li className="text-sm text-ink-2">Belum ada interaksi.</li>}
            </ol>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Peta Kontak dan Relasi">
            <DataTable<Contact>
              columns={[
                { key: 'n', header: 'Nama', className: 'font-semibold', render: (c) => c.nama }, { key: 'j', header: 'Jabatan', render: (c) => c.jabatan }, { key: 'u', header: 'Unit', render: (c) => c.unit },
                { key: 'p', header: 'Pengaruh', render: (c) => c.pengaruh }, { key: 'r', header: 'Relasi', render: (c) => <Badge tone={RELASI_TONE[c.relasi]}>{c.relasi}</Badge> },
                { key: 'c', header: 'Consent', render: (c) => c.consent ? 'Ada' : <Badge tone="orange">Belum</Badge> },
              ]}
              rows={kontak} rowKey={(c) => c.id} empty="Belum ada kontak."
            />
          </Card>
          {aktif.length > 0 && <Card title="Tender Berjalan">
            <DataTable columns={[{ key: 'n', header: 'Tender', render: (t) => <Link to={ruteTender(t)} className="font-semibold text-primary hover:underline">{t.nama}</Link> }, { key: 'h', header: 'HPS', align: 'right', render: (t) => fmtRp(t.hps) }, { key: 's', header: 'Status', render: (t) => <StatusBadge status={t.status} /> }]} rows={aktif} rowKey={(t) => t.id} />
          </Card>}
          <Card title="Riwayat Tender" sub={`win rate ${fmtPersen(riwayat.win)}`}>
            <DataTable
              columns={[
                { key: 'n', header: 'Tender', render: (r) => r.nama }, { key: 't', header: 'Tahun', render: (r) => r.tahun }, { key: 'v', header: 'Nilai', align: 'right', render: (r) => fmtRp(r.nilai) },
                { key: 'h', header: 'Hasil', render: (r) => <Badge tone={r.hasil === 'Menang' ? 'green' : 'red'}>{r.hasil}</Badge> },
              ]}
              rows={riwayat.rows} rowKey={(r) => r.nama} empty="Belum ada riwayat."
            />
          </Card>
        </div>
      </div>
      <FormInteraksi open={catat} onOpenChange={setCatat} accountId={id} />
    </div>
  )
}

export function Kontak() {
  const { contacts, accounts, actions } = useDemo()
  const [q, setQ] = useState('')
  const [tambah, setTambah] = useState(false)
  const [f, setF] = useState({ nama: '', jabatan: '', unit: 'PPK', akun: accounts[0].id, consent: false })
  const rows = contacts.filter((c) => !q || `${c.nama} ${c.jabatan}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <PageHeader crumbs={['Pelanggan', 'Kontak']} title="Kontak" actions={<Button variant="outline" onClick={() => setTambah(true)}><PlusCircle size={16} /> Tambah Kontak</Button>} />
      <Card>
        <div className="mb-4 max-w-sm"><Field label="Nama/Jabatan"><Input placeholder="Cari kontak" value={q} onChange={(e) => setQ(e.target.value)} /></Field></div>
        <DataTable<Contact>
          columns={[
            { key: 'n', header: 'Nama', className: 'font-semibold', render: (c) => c.nama }, { key: 'j', header: 'Jabatan', render: (c) => c.jabatan }, { key: 'u', header: 'Unit', render: (c) => c.unit },
            { key: 'a', header: 'Akun', render: (c) => <Link className="text-primary hover:underline" to={`/pelanggan/akun/${c.accountId}`}>{accounts.find((a) => a.id === c.accountId)?.nama}</Link> },
            { key: 'k', header: 'Kanal', render: (c) => c.kanal }, { key: 'r', header: 'Relasi', render: (c) => <Badge tone={RELASI_TONE[c.relasi]}>{c.relasi}</Badge> },
            { key: 'c', header: 'Consent (UU PDP)', render: (c) => c.consent ? 'Ada' : <Badge tone="orange">Belum</Badge> },
          ]}
          rows={rows} rowKey={(c) => c.id} pageSize={10} noun="kontak"
        />
      </Card>
      <Modal open={tambah} onOpenChange={setTambah} title="Tambah Kontak" footer={<>
        <Button variant="neutral" onClick={() => setTambah(false)}>Batal</Button>
        <Button disabled={!f.nama.trim()} onClick={() => { actions.tambahKontak({ id: `c${Date.now()}`, accountId: f.akun, nama: f.nama, jabatan: f.jabatan, unit: f.unit, kanal: 'Email', relasi: 'Sedang', pengaruh: 'Sedang', consent: f.consent }); setTambah(false); setF({ ...f, nama: '', jabatan: '' }); toast.success('Kontak ditambahkan.') }}>Simpan</Button>
      </>}>
        <div className="space-y-3">
          <Field label="Nama"><Input value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} /></Field>
          <Field label="Jabatan"><Input value={f.jabatan} onChange={(e) => setF({ ...f, jabatan: e.target.value })} /></Field>
          <Field label="Unit"><Select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>{['Satker', 'PPK', 'UKPBJ', 'Dinas'].map((u) => <option key={u}>{u}</option>)}</Select></Field>
          <Field label="Akun"><Select value={f.akun} onChange={(e) => setF({ ...f, akun: e.target.value })}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}</Select></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} /> Kontak memberi persetujuan pemrosesan data</label>
        </div>
      </Modal>
    </div>
  )
}

export function LogInteraksi() {
  const { interactions, accounts, actions } = useDemo()
  const [catat, setCatat] = useState(false)
  const rows = [...interactions].sort((a, b) => b.tanggal.localeCompare(a.tanggal))
  return (
    <div>
      <PageHeader crumbs={['Pelanggan', 'Log Interaksi']} title="Log Interaksi" actions={<Button variant="outline" onClick={() => setCatat(true)}><PlusCircle size={16} /> Catat Interaksi</Button>} />
      <Card>
        <DataTable<Interaction>
          columns={[
            { key: 't', header: 'Tanggal', className: 'whitespace-nowrap', render: (i) => fmtTanggal(i.tanggal) }, { key: 'j', header: 'Jenis', render: (i) => <Badge tone="blue">{i.jenis}</Badge> },
            { key: 'a', header: 'Akun', render: (i) => <Link className="font-semibold text-primary hover:underline" to={`/pelanggan/akun/${i.accountId}`}>{accounts.find((a) => a.id === i.accountId)?.nama}</Link> },
            { key: 'r', header: 'Ringkasan', className: 'min-w-[240px]', render: (i) => <>{i.ringkasan}<div className="text-xs text-ink-2">Kontak: {i.kontak} · oleh {i.oleh}</div></> },
            { key: 'l', header: 'Tindak Lanjut', className: 'min-w-[200px]', render: (i) => i.tindakLanjut ? <>{i.tindakLanjut.teks}<div className="text-xs text-ink-2">{fmtTanggal(i.tindakLanjut.tanggal)}</div></> : '-' },
            { key: 's', header: 'Status', render: (i) => i.tindakLanjut ? (i.tindakLanjut.selesai ? <Badge tone="green">Selesai</Badge> : <Button size="sm" variant="outline" onClick={() => actions.selesaikanTindakLanjut(i.id)}>Tandai selesai</Button>) : null },
          ]}
          rows={rows} rowKey={(i) => i.id} pageSize={10} noun="interaksi"
        />
      </Card>
      <FormInteraksi open={catat} onOpenChange={setCatat} />
    </div>
  )
}
