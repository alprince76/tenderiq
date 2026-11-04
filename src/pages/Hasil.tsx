import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { sanggahAssistant, winLossAnalysis } from '@/ai/post'
import { DataTable } from '@/components/DataTable'
import { AiGate, AiLabel, PageHeader, StatusBadge } from '@/components/shared'
import { Badge, Banner, Button, Card, DefList, Drawer, Field, Input, Modal, Select } from '@/components/ui'
import { fmtAngka, fmtRp, fmtTanggal, HARI_INI, selisihHari, tambahHari } from '@/domain/format'
import { ALASAN_KALAH } from '@/data/history'
import type { Tender, TenderResult } from '@/domain/types'
import { useDemo } from '@/store/DemoProvider'

/** Durasi dari template tahapan tender konstruksi (konfigurasi, PRD §9.8). */
const DURASI_SANGGAH = 5
const DURASI_BANDING = 5

function CatatHasil({ t, onClose }: { t: Tender | null; onClose: () => void }) {
  const { actions } = useDemo()
  const [hasil, setHasil] = useState<TenderResult['hasil']>('Won')
  const [peringkat, setPeringkat] = useState('2')
  const [alasan, setAlasan] = useState('')
  const [nilai, setNilai] = useState(t ? String(Math.round(t.hps * 0.934)) : '')
  const [lawan, setLawan] = useState('PT Karya Nusantara')
  const [hargaLawan, setHargaLawan] = useState('')
  const [sanggahSelesai, setSanggahSelesai] = useState(false)
  const bisa = hasil === 'Won' ? sanggahSelesai && Number(nilai) > 0 : hasil === 'Lost' ? !!alasan && Number(hargaLawan) > 0 : true
  const simpan = () => {
    if (!t) return
    const kategori = ALASAN_KALAH.find((a) => a.alasan === alasan)?.kategori ?? 'Kalah'
    const data: TenderResult = hasil === 'Won'
      ? { tanggal: HARI_INI, hasil, peringkat: 1, nilaiKontrak: Number(nilai), peserta: [{ nama: 'Entitas kami', harga: Number(nilai), peringkat: 1, status: 'Lulus' }] }
      : hasil === 'Lost'
        ? { tanggal: HARI_INI, hasil, peringkat: Number(peringkat), alasan, kategori, peserta: [{ nama: lawan, harga: Number(hargaLawan), peringkat: 1, status: 'Lulus' }, { nama: 'Entitas kami', harga: Math.round(t.hps * 0.934), peringkat: Number(peringkat), status: kategori === 'Gugur' ? 'Gugur' : 'Lulus' }], sanggah: { tahap: 'masa-sanggah', batas: tambahHari(HARI_INI, DURASI_SANGGAH) } }
        : { tanggal: HARI_INI, hasil, alasan: 'Tender dibatalkan pemilik proyek', peserta: [] }
    actions.catatHasil(t.id, data)
    onClose()
    toast.success(hasil === 'Lost' ? 'Hasil tercatat. Hitung mundur masa sanggah berjalan.' : 'Hasil tender tercatat.')
  }
  return (
    <Modal open={!!t} onOpenChange={(o) => !o && onClose()} title={`Catat hasil: ${t?.nama ?? ''}`} footer={<>
      <Button variant="neutral" onClick={onClose}>Batal</Button>
      <Button disabled={!bisa} onClick={simpan}>Simpan</Button>
    </>}>
      <div className="space-y-3">
        <Field label="Hasil"><Select value={hasil} onChange={(e) => setHasil(e.target.value as TenderResult['hasil'])}><option value="Won">Menang</option><option value="Lost">Kalah</option><option value="Cancelled">Dibatalkan</option></Select></Field>
        {hasil === 'Won' && <>
          <Field label="Nilai kontrak (Rp miliar)"><Input type="number" value={nilai} onChange={(e) => setNilai(e.target.value)} /></Field>
          <label className="flex items-start gap-2 text-sm"><input className="mt-0.5" type="checkbox" checked={sanggahSelesai} onChange={(e) => setSanggahSelesai(e.target.checked)} /> Masa sanggah dan sanggah banding sudah selesai</label>
        </>}
        {hasil === 'Lost' && <>
          <Field label="Alasan kalah/gugur (wajib)"><Select value={alasan} onChange={(e) => setAlasan(e.target.value)}><option value="">Pilih alasan</option>{ALASAN_KALAH.map((a) => <option key={a.alasan}>{a.alasan}</option>)}</Select></Field>
          <Field label="Peringkat kita"><Input type="number" min={2} value={peringkat} onChange={(e) => setPeringkat(e.target.value)} /></Field>
          <Field label="Pemenang (dari pengumuman)"><Input value={lawan} onChange={(e) => setLawan(e.target.value)} /></Field>
          <Field label="Harga pemenang (Rp miliar)"><Input type="number" value={hargaLawan} onChange={(e) => setHargaLawan(e.target.value)} /></Field>
        </>}
      </div>
    </Modal>
  )
}

export function HasilPage() {
  const { tendersTerlihat, tenders, actions, aiAktif } = useDemo()
  const [params, setParams] = useSearchParams()
  const menunggu = tendersTerlihat.filter((t) => ['Submitted', 'UnderEvaluation', 'Negotiation'].includes(t.status))
  const tercatat = tendersTerlihat.filter((t) => t.hasil)
  const detail = tenders.find((t) => t.id === params.get('tender') && t.hasil) ?? null
  const catat = tenders.find((t) => t.id === params.get('catat') && ['Submitted', 'UnderEvaluation', 'Negotiation'].includes(t.status)) ?? null
  const [sanggahBuka, setSanggahBuka] = useState(false)
  const kompetitor = useMemo(() => {
    const m = new Map<string, { ikut: number; menang: number; harga: number[] }>()
    for (const t of tendersTerlihat) for (const p of t.hasil?.peserta ?? []) {
      if (p.nama === 'Entitas kami') continue
      const e = m.get(p.nama) ?? { ikut: 0, menang: 0, harga: [] }
      e.ikut += 1
      if (p.peringkat === 1) e.menang += 1
      e.harga.push((p.harga / t.hps) * 100)
      m.set(p.nama, e)
    }
    return [...m.entries()].map(([nama, e]) => ({ nama, ikut: e.ikut, menang: e.menang, rata: e.harga.reduce((a, b) => a + b, 0) / e.harga.length })).sort((a, b) => b.ikut - a.ikut)
  }, [tendersTerlihat])
  const wl = detail ? winLossAnalysis(detail) : null
  const sg = detail ? sanggahAssistant(detail) : null
  const san = detail?.hasil?.sanggah
  const teksSisa = (batas: string) => { const h = selisihHari(batas); return h >= 0 ? `${h} hari lagi (sampai ${fmtTanggal(batas)})` : `Berakhir ${fmtTanggal(batas)}` }

  return (
    <div className="space-y-4">
      <PageHeader crumbs={['Hasil & Proyek', 'Hasil Tender']} title="Hasil Tender" />
      <Card title="Menunggu Hasil">
        <DataTable<Tender>
          columns={[
            { key: 'n', header: 'Tender', className: 'font-semibold', render: (t) => t.nama }, { key: 'p', header: 'Pemilik Proyek', render: (t) => t.pemilik }, { key: 'h', header: 'HPS', align: 'right', render: (t) => fmtRp(t.hps) },
            { key: 's', header: 'Status', render: (t) => <StatusBadge status={t.status} /> }, { key: 'a', header: 'Aksi', render: (t) => <Button size="sm" variant="outline" onClick={() => setParams({ catat: t.id })}>Catat hasil</Button> },
          ]}
          rows={menunggu} rowKey={(t) => t.id} empty="Tidak ada tender yang menunggu hasil."
        />
      </Card>
      <Card title="Hasil Tercatat">
        <DataTable<Tender>
          columns={[
            { key: 'n', header: 'Tender', className: 'font-semibold text-primary', render: (t) => t.nama }, { key: 't', header: 'Tanggal', className: 'whitespace-nowrap', render: (t) => fmtTanggal(t.hasil?.tanggal) },
            { key: 'hs', header: 'Hasil', render: (t) => <Badge tone={t.hasil?.hasil === 'Won' ? 'green' : t.hasil?.hasil === 'Lost' ? 'red' : 'gray'}>{t.hasil?.hasil === 'Won' ? 'Menang' : t.hasil?.hasil === 'Lost' ? (t.hasil.kategori ?? 'Kalah') : 'Dibatalkan'}</Badge> },
            { key: 'a', header: 'Alasan', render: (t) => t.hasil?.alasan ?? '-' }, { key: 'v', header: 'Nilai Kontrak', align: 'right', render: (t) => t.hasil?.nilaiKontrak ? fmtRp(t.hasil.nilaiKontrak) : '-' },
            { key: 'st', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
          ]}
          rows={tercatat} rowKey={(t) => t.id} pageSize={8} noun="hasil" onRowClick={(t) => setParams({ tender: t.id })}
        />
      </Card>
      <Card title="Competitor DB" sub="hanya dari pengumuman hasil tender publik">
        <DataTable columns={[
          { key: 'n', header: 'Perusahaan', className: 'font-semibold', render: (k) => k.nama }, { key: 'i', header: 'Tender Tercatat', align: 'right', render: (k) => k.ikut }, { key: 'm', header: 'Menang', align: 'right', render: (k) => k.menang },
          { key: 'r', header: 'Rata-rata Harga (% HPS)', align: 'right', render: (k) => `${fmtAngka(k.rata, 1)}%` },
        ]} rows={kompetitor} rowKey={(k) => k.nama} />
      </Card>

      <CatatHasil key={catat?.id ?? 'tutup'} t={catat} onClose={() => setParams({})} />

      <Drawer open={!!detail} onOpenChange={(o) => !o && setParams({})} title={detail?.nama} footer={detail?.status === 'Won' ? (
        <Button onClick={() => { actions.tandaTanganKontrak(detail.id); toast.success('Kontrak tercatat. Handover Pack dibuat.'); setParams({}) }}>Kontrak ditandatangani</Button>
      ) : undefined}>
        {detail?.hasil && (
          <div className="space-y-5 text-sm">
            <DefList rows={[['Status', <StatusBadge key="s" status={detail.status} />], ['Tanggal hasil', fmtTanggal(detail.hasil.tanggal)], ['Peringkat', detail.hasil.peringkat ?? '-'], ['Alasan', detail.hasil.alasan ?? '-']]} />
            {detail.status === 'Won' && <Banner tone="blue">Tracker: SPPBJ terbit · Jaminan pelaksanaan diproses · Kontrak menunggu tanda tangan.</Banner>}
            {detail.status !== 'Won' && ['Handover', 'Executing', 'Closed'].includes(detail.status) && <Link className="font-semibold text-primary hover:underline" to={`/hasil/handover?tender=${detail.id}`}>Buka Handover Pack</Link>}
            <section>
              <h3 className="mb-2 font-semibold">Peserta (data pengumuman)</h3>
              <DataTable columns={[{ key: 'p', header: 'Rk', render: (p) => p.peringkat }, { key: 'n', header: 'Peserta', render: (p) => p.nama }, { key: 'h', header: 'Harga', align: 'right', render: (p) => fmtRp(p.harga) }, { key: 's', header: 'Status', render: (p) => p.status }]} rows={detail.hasil.peserta} rowKey={(p) => p.nama} />
            </section>
            {san && (
              <section className="rounded-lg border border-line p-3">
                <h3 className="mb-1 font-semibold">Tracker Sanggah</h3>
                {san.tahap === 'masa-sanggah' && <>
                  <p>Masa sanggah: <strong>{teksSisa(san.batas)}</strong></p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => actions.ubahSanggah(detail.id, { ...san, tahap: 'diajukan', catatan: 'Sanggah diajukan manual di SPSE' })}>Catat sanggah diajukan</Button>
                    <Button size="sm" variant="neutral" onClick={() => actions.ubahSanggah(detail.id, { ...san, tahap: 'selesai', catatan: 'Tidak diajukan' })}>Tidak mengajukan</Button>
                  </div>
                </>}
                {san.tahap === 'diajukan' && <>
                  <p>Sanggah diajukan manual, menunggu jawaban Pokja.</p>
                  <Button className="mt-2" size="sm" variant="outline" onClick={() => { actions.ubahSanggah(detail.id, { tahap: 'masa-banding', batas: tambahHari(HARI_INI, DURASI_BANDING), catatan: 'Sanggah tidak diterima. Legal menerima tugas review.' }); toast.success('Masa sanggah banding dibuka. Legal menerima tugas review.') }}>Sanggah tidak diterima</Button>
                </>}
                {san.tahap === 'masa-banding' && <><p>Masa sanggah banding (khusus pekerjaan konstruksi): <strong>{teksSisa(san.batas)}</strong></p><p className="text-xs text-ink-2">{san.catatan}</p></>}
                {san.tahap === 'selesai' && <p>Selesai. {san.catatan}</p>}
                {san.tahap !== 'selesai' && aiAktif('AWD-03') && <Button className="mt-2" size="sm" variant="ghost" onClick={() => setSanggahBuka(!sanggahBuka)}>Analisis dasar sanggah</Button>}
                {sanggahBuka && sg && san.tahap !== 'selesai' && aiAktif('AWD-03') && (
                  <div className="mt-2 rounded-lg bg-canvas p-3">
                    <ul className="list-disc pl-5">{sg.hasil.dasar.map((d) => <li key={d}>{d}</li>)}</ul>
                    <p className="mt-2"><strong>Draf untuk review Legal:</strong> {sg.hasil.draf}</p>
                    <AiLabel id="AWD-03" keyakinan={sg.keyakinan} sumber={sg.sumber} />
                    <p className="mt-1 text-xs font-semibold">Pengajuan sanggah tetap dilakukan manual oleh pihak berwenang.</p>
                  </div>
                )}
              </section>
            )}
            <section>
              <h3 className="mb-1 font-semibold">Analisis Menang/Kalah</h3>
              <AiGate id="AWD-04" manual="Isi catatan menang/kalah secara manual.">
                {wl && <>
                  <ul className="list-disc pl-5">{wl.hasil.faktor.map((f) => <li key={f}>{f}</li>)}</ul>
                  <p className="mt-1">Pelajaran: {wl.hasil.pelajaran}</p>
                  <AiLabel id="AWD-04" keyakinan={wl.keyakinan} sumber={wl.sumber} />
                </>}
              </AiGate>
            </section>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export function HandoverPage() {
  const { tendersTerlihat, workspaces, people, handover, contacts, actions } = useDemo()
  const [params, setParams] = useSearchParams()
  const rows = tendersTerlihat.filter((t) => ['Won', 'Handover', 'Executing', 'Closed'].includes(t.status))
  const t = rows.find((x) => x.id === params.get('tender')) ?? null
  const pack = t ? handover[t.id] : undefined
  useEffect(() => { if (t && t.status !== 'Won' && !pack) actions.pastikanHandover(t.id) }, [t, pack, actions])
  const w = t ? workspaces[t.id] : undefined
  return (
    <div className="space-y-4">
      <PageHeader crumbs={['Hasil & Proyek', 'Handover Pack']} title="Handover Pack" sub="Serah terima otomatis saat kontrak ditandatangani." />
      <Card>
        <DataTable<Tender>
          columns={[
            { key: 'n', header: 'Tender', className: 'font-semibold text-primary', render: (x) => x.nama }, { key: 'p', header: 'Pemilik Proyek', render: (x) => x.pemilik }, { key: 'v', header: 'Nilai Kontrak', align: 'right', render: (x) => fmtRp(x.hasil?.nilaiKontrak ?? x.hps) },
            { key: 's', header: 'Status', render: (x) => <StatusBadge status={x.status} /> },
            { key: 'a', header: 'Aksi', render: (x) => x.status === 'Won' ? <Button size="sm" onClick={(e) => { e.stopPropagation(); actions.tandaTanganKontrak(x.id); setParams({ tender: x.id }); toast.success('Kontrak tercatat. Handover Pack dibuat.') }}>Kontrak ditandatangani</Button> : <Button size="sm" variant="outline">Buka</Button> },
          ]}
          rows={rows} rowKey={(x) => x.id} onRowClick={(x) => x.status !== 'Won' && setParams({ tender: x.id })} empty="Belum ada tender yang dimenangkan."
        />
      </Card>
      {t && pack && (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card title={`Paket Serah Terima: ${t.nama}`}>
            <DefList rows={[
              ['Project Manager', pack.pm],
              ['Lingkup', t.lingkup],
              ['Komitmen teknis', w?.dokumen.filter((d) => d.jenis === 'Teknis').map((d) => d.nama).join(', ') || 'Metode pelaksanaan dan RKK sesuai penawaran'],
              ['Personel inti', w ? Object.entries(w.slots).map(([s, p]) => `${s}: ${people.find((x) => x.id === p)?.nama ?? '-'}`).join('; ') : 'Sesuai penawaran'],
              ['Jadwal', t.jadwal.map((j) => `${j.tahap} ${fmtTanggal(j.tanggal)}`).slice(-2).join('; ')],
              ['Risiko', `${t.risiko.teks} (${t.risiko.sumber})`],
              ['Kontak pemilik', contacts.filter((c) => c.accountId === t.accountId).map((c) => `${c.nama} (${c.jabatan})`).join('; ') || '-'],
            ]} />
            {pack.merah.map((m) => <div key={m} className="mt-3"><Banner tone="red">{m}. PM dan HC menerima tugas penggantian sesuai ketentuan kontrak.</Banner></div>)}
          </Card>
          <Card title="Ceklis Serah Terima">
            <ul className="space-y-2 text-sm">
              {pack.ceklis.map((c, i) => <li key={c.teks}><label className="flex items-center gap-2"><input type="checkbox" checked={c.selesai} disabled={t.status !== 'Handover'} onChange={() => actions.centangHandover(t.id, i)} />{c.teks}</label></li>)}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" disabled={pack.sync === 'Terkirim'} onClick={() => { actions.syncErp(t.id); toast.success('Simulasi sinkronisasi ERP/PMIS selesai. Tidak ada data dikirim keluar.') }}>{pack.sync === 'Terkirim' ? 'ERP/PMIS tersinkron' : 'Sinkronkan ke ERP/PMIS'}</Button>
              {t.status === 'Handover' && <Button disabled={pack.ceklis.some((c) => !c.selesai)} onClick={() => { actions.mulaiPelaksanaan(t.id); toast.success('Serah terima selesai. Proyek berjalan.') }}>Selesaikan serah terima</Button>}
              {t.status === 'Executing' && <Button onClick={() => { actions.catatBast(t.id); toast.success('BAST tercatat. Pengalaman kerja masuk Capability Library.') }}>Catat BAST</Button>}
            </div>
            {t.status === 'Closed' && <p className="mt-3 text-sm"><Badge tone="green">Selesai</Badge> Pengalaman kerja sudah tercatat di <Link className="font-semibold text-primary hover:underline" to="/penawaran/capability">Capability Library</Link>.</p>}
          </Card>
        </div>
      )}
    </div>
  )
}
