import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { KRITERIA, MIN_HASIL_HISTORIS, competitorForecast, fmtPeluang, winProbability } from '@/ai/qualification'
import { DataTable } from '@/components/DataTable'
import { AiGate, AiLabel, PageHeader, StatusBadge } from '@/components/shared'
import { Badge, Banner, Button, Card, DefList, Field, Modal, Select, Textarea } from '@/components/ui'
import { fmtAngka, fmtRp, fmtTanggal } from '@/domain/format'
import { cariKonflik, pesanKonflik } from '@/domain/conflicts'
import { approvalBerikutnya, BATAS_GM_MILIAR } from '@/domain/transitions'
import type { Tender } from '@/domain/types'
import { useDemo } from '@/store/DemoProvider'
import { jumlahHistorisSegmen } from '@/store/selectors'

export function GoNoGoList() {
  const { tendersTerlihat, gonogo } = useDemo()
  const navigate = useNavigate()
  const rows = tendersTerlihat.filter((t) => gonogo[t.id] || t.status === 'Qualifying')
  return (
    <div>
      <PageHeader crumbs={['Kualifikasi Go/No-Go']} title="Kualifikasi Go/No-Go" sub="Keputusan terstruktur sebelum sumber daya tim dialokasikan." />
      <Card>
        <DataTable<Tender>
          columns={[
            { key: 'n', header: 'Tender', className: 'min-w-[240px]', render: (t) => <Link to={`/gonogo/${t.id}`} className="font-semibold text-primary hover:underline">{t.nama}</Link> },
            { key: 'p', header: 'Pemilik Proyek', render: (t) => t.pemilik },
            { key: 'h', header: 'HPS', align: 'right', render: (t) => fmtRp(t.hps) },
            { key: 'b', header: 'Batas Pemasukan', className: 'whitespace-nowrap', render: (t) => fmtTanggal(t.batasPemasukan) },
            { key: 's', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
            { key: 'g', header: 'Tahap Approval', render: (t) => { const g = gonogo[t.id]; if (g?.keputusan) return <Badge tone={g.keputusan === 'Go' ? 'green' : 'gray'}>{g.keputusan}</Badge>; if (!g?.diajukanOleh) return <Badge>Belum diajukan</Badge>; return <Badge tone="blue">Menunggu {approvalBerikutnya(g.approvals)?.peran}</Badge> } },
          ]}
          rows={rows} rowKey={(t) => t.id} pageSize={10} noun="tender" onRowClick={(t) => navigate(`/gonogo/${t.id}`)} empty="Belum ada tender di tahap kualifikasi. Pilih Qualify dari Tender Radar."
        />
      </Card>
    </div>
  )
}

const ALASAN_NOGO = ['Di luar fokus strategis', 'Kapabilitas tidak memenuhi', 'Kapasitas personel/alat tidak tersedia', 'Risiko terlalu tinggi', 'Margin indikatif terlalu rendah', 'Waktu persiapan tidak cukup']

export function GoNoGoForm() {
  const { id = '' } = useParams()
  const { tenders, gonogo, workspaces, assignments, people, actions, aiAktif } = useDemo()
  const navigate = useNavigate()
  const t = tenders.find((x) => x.id === id)
  const g = gonogo[id]
  const [noGoBuka, setNoGoBuka] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [catatan, setCatatan] = useState('')
  const historis = t ? jumlahHistorisSegmen(t.segmen) : 0
  const prob = useMemo(() => (t && g ? winProbability(t, g.skor, historis) : null), [t, g, historis])

  if (!t || !g) return <Banner>Tender belum masuk tahap kualifikasi. <Link className="font-semibold text-primary" to="/peluang/radar">Buka Tender Radar</Link></Banner>

  const selesai = !!g.keputusan
  const next = approvalBerikutnya(g.approvals)
  const pesaing = competitorForecast(t)
  const kandidatKapasitas = people.filter((p) => cariKonflik(p.id, t.id, assignments))

  const setujui = () => {
    if (!next) return
    actions.setujuiGo(id)
    if (g.approvals.filter((a) => a.status === 'Menunggu').length === 1) {
      toast.success('Keputusan Go tersimpan. Bid Workspace dibuat.')
      navigate(`/penawaran/workspace/${id}`)
    } else toast.success(`Disetujui ${next.peran}. Diteruskan ke approver berikutnya.`)
  }

  return (
    <div>
      <PageHeader crumbs={['Kualifikasi Go/No-Go', t.nama]} title="Form Go/No-Go" sub={<span className="flex flex-wrap items-center gap-2">{t.nama} <StatusBadge status={t.status} /></span>} />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card title="Ringkasan Tender">
            <DefList rows={[['Pemilik proyek', t.pemilik], ['Nilai HPS', fmtRp(t.hps)], ['Metode', t.metode], ['Lokasi', t.lokasi], ['Batas pemasukan', fmtTanggal(t.batasPemasukan)], ['Catatan risiko', `${t.risiko.teks} (${t.risiko.sumber})`]]} />
          </Card>
          <Card title="Penilaian Kriteria" sub="skor 1–5">
            <div className="space-y-4">
              {KRITERIA.map((k) => (
                <fieldset key={k.id} disabled={selesai || !!g.diajukanOleh}>
                  <legend className="text-sm font-semibold">{k.label}</legend>
                  <p className="mb-1.5 text-xs text-ink-2">{k.bantuan}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const on = g.skor[k.id] === n
                      return <button key={n} type="button" aria-pressed={on} aria-label={`${k.label} ${n}`} onClick={() => actions.setSkor(id, k.id, n)} className={`flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-semibold sm:max-w-16 ${on ? 'border-primary bg-primary text-white' : 'border-line bg-white'} disabled:opacity-60`}>{n}</button>
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </Card>
          <Card title="Prakiraan Pesaing" sub="hanya dari data hasil tender publik dan internal">
            <AiGate id="GNG-04" manual="Tinjau hasil tender sebelumnya di Hasil Tender.">
              <DataTable
                columns={[
                  { key: 'n', header: 'Perusahaan', render: (p) => <><div className="font-semibold">{p.nama}</div><div className="text-xs text-ink-2">{p.catatan}</div></> },
                  { key: 'i', header: 'Peluang Ikut', align: 'right', render: (p) => fmtPeluang(p.peluangIkut) },
                  { key: 'h', header: 'Pola Harga (% HPS)', align: 'right', render: (p) => `${fmtAngka(p.polaHarga, 1)}%` },
                ]}
                rows={pesaing.hasil} rowKey={(p) => p.nama}
              />
              <AiLabel id="GNG-04" keyakinan={pesaing.keyakinan} sumber={pesaing.sumber} />
            </AiGate>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Estimasi Peluang Menang">
            <AiGate id="GNG-02" manual="Gunakan penilaian kriteria di samping.">
              {prob && (
                <div className="text-sm">
                  {prob.hasil.mode === 'model' ? (
                    <div className="flex items-baseline gap-3"><span className="text-4xl font-bold tabular-nums">{prob.hasil.persen}%</span><Badge tone={prob.hasil.kategori === 'Tinggi' ? 'green' : prob.hasil.kategori === 'Sedang' ? 'orange' : 'red'}>{prob.hasil.kategori}</Badge></div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-3"><span className="text-4xl font-bold tabular-nums">{prob.hasil.skorAturan}</span><span className="text-ink-2">/ 100</span><Badge tone="gray">{prob.hasil.kategori}</Badge></div>
                      <p className="mt-1 text-xs font-semibold">Estimasi berbasis aturan: segmen {t.segmen} baru memiliki {historis} hasil historis (minimal {MIN_HASIL_HISTORIS}), sehingga persentase tidak ditampilkan.</p>
                    </>
                  )}
                  <h3 className="mt-3 font-semibold">Faktor pendorong</h3>
                  <ul className="list-disc pl-5">{prob.hasil.pendorong.map((f) => <li key={f}>{f}</li>)}</ul>
                  <h3 className="mt-3 font-semibold">Faktor penghambat</h3>
                  <ul className="list-disc pl-5">{prob.hasil.penghambat.map((f) => <li key={f}>{f}</li>)}</ul>
                  <AiLabel id="GNG-02" keyakinan={prob.keyakinan} sumber={prob.sumber} />
                </div>
              )}
            </AiGate>
          </Card>
          <Card title="Cek Kapasitas" sub="GNG-03">
            <p className="mb-2 text-sm">{people.length - kandidatKapasitas.length} dari {people.length} personel inti tersedia.</p>
            <ul className="space-y-1 text-xs text-ink-2">{kandidatKapasitas.map((p) => <li key={p.id}>{pesanKonflik(p.nama, cariKonflik(p.id, t.id, assignments)!, fmtTanggal)}</li>)}</ul>
          </Card>
          <Card title="Alur Persetujuan">
            <p className="mb-3 text-xs text-ink-2">{t.hps <= BATAS_GM_MILIAR ? `Nilai ${fmtRp(t.hps)} ≤ Rp100 M: cukup GM Divisi.` : `Nilai ${fmtRp(t.hps)} > Rp100 M: GM Divisi, lalu Direktur.`}</p>
            <ol className="space-y-2">
              {g.approvals.map((a, i) => (
                <li key={a.peran} className="flex items-center justify-between gap-2 rounded-lg border border-line p-3 text-sm">
                  <span><span className="font-semibold">{i + 1}. {a.peran}</span><span className="block text-xs text-ink-2">{a.nama}{a.waktu && ` · ${a.waktu}`}</span></span>
                  <Badge tone={a.status === 'Disetujui' ? 'green' : a.status === 'Ditolak' ? 'red' : 'gray'}>{a.status}</Badge>
                </li>
              ))}
            </ol>
            {selesai ? (
              <div className="mt-4 text-sm">
                <Badge tone={g.keputusan === 'Go' ? 'green' : 'gray'}>Keputusan: {g.keputusan}</Badge>
                {g.keputusan === 'No-Go' && <p className="mt-2">Alasan: {g.alasan}{g.catatan && `. ${g.catatan}`}</p>}
                {g.keputusan === 'Go' && workspaces[id] && <Button className="mt-3 w-full" onClick={() => navigate(`/penawaran/workspace/${id}`)}>Buka Bid Workspace</Button>}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {!g.diajukanOleh ? (
                  <Button className="w-full" onClick={() => { actions.ajukanGo(id); toast.success('Go diajukan ke approver.') }}>Go</Button>
                ) : (
                  <>
                    <Button className="w-full whitespace-normal py-2" onClick={setujui}>Setujui Go sebagai {next?.peran}</Button>
                    <p className="text-xs text-ink-2">Simulasi: persetujuan dilakukan tanpa berganti akun. Status tetap Kualifikasi sampai persetujuan terakhir.</p>
                  </>
                )}
                <Button variant="danger" className="w-full" onClick={() => setNoGoBuka(true)}>No-Go</Button>
              </div>
            )}
            {!aiAktif('GNG-02') && <p className="mt-2 text-xs text-ink-2">Estimasi AI dimatikan; keputusan tetap dapat diproses.</p>}
          </Card>
        </div>
      </div>

      <Modal open={noGoBuka} onOpenChange={setNoGoBuka} title="Keputusan No-Go" footer={<>
        <Button variant="neutral" onClick={() => setNoGoBuka(false)}>Batal</Button>
        <Button variant="danger" disabled={!alasan} onClick={() => { actions.noGo(id, alasan, catatan); setNoGoBuka(false); toast.success('Keputusan No-Go tersimpan di audit log.') }}>Simpan No-Go</Button>
      </>}>
        <div className="space-y-3">
          <Field label="Alasan (wajib)"><Select value={alasan} onChange={(e) => setAlasan(e.target.value)}><option value="">Pilih alasan</option>{ALASAN_NOGO.map((a) => <option key={a}>{a}</option>)}</Select></Field>
          <Field label="Catatan (opsional)"><Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} /></Field>
        </div>
      </Modal>
    </div>
  )
}
