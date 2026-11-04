import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { hitungMargin, negotiationCopilot } from '@/ai/negotiation'
import { DataTable } from '@/components/DataTable'
import { AiGate, AiLabel, PageHeader, StatTile } from '@/components/shared'
import { Badge, Banner, Button, Card, Field, Input, Select } from '@/components/ui'
import { fmtAngka, fmtRp } from '@/domain/format'
import type { NegotiationRound } from '@/domain/types'
import { useDemo } from '@/store/DemoProvider'
import { ClarificationPanel } from './workspace/ClarificationPanel'

export function KlarifikasiPage() {
  const { tendersTerlihat, workspaces } = useDemo()
  const [params, setParams] = useSearchParams()
  const pilihan = tendersTerlihat.filter((t) => workspaces[t.id])
  const t = pilihan.find((x) => x.id === params.get('tender')) ?? pilihan[0]
  return (
    <div>
      <PageHeader crumbs={['Evaluasi & Negosiasi', 'Klarifikasi & Adendum']} title="Klarifikasi & Adendum" />
      {!t ? <Banner>Belum ada tender dengan Bid Workspace.</Banner> : (
        <>
          <Card className="mb-4"><div className="max-w-lg"><Field label="Tender"><Select value={t.id} onChange={(e) => setParams({ tender: e.target.value })}>{pilihan.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</Select></Field></div></Card>
          <ClarificationPanel tender={t} />
        </>
      )}
    </div>
  )
}

const TONE: Record<NegotiationRound['status'], 'gray' | 'orange' | 'green' | 'blue'> = { Tercatat: 'gray', 'Butuh approval': 'orange', Disetujui: 'green', Final: 'blue' }

export function NegosiasiPage() {
  const { tendersTerlihat, negotiations, actions, aiAktif } = useDemo()
  const [params, setParams] = useSearchParams()
  const pilihan = tendersTerlihat.filter((t) => negotiations[t.id] && t.status === 'Negotiation')
  const t = pilihan.find((x) => x.id === params.get('tender')) ?? pilihan[0]
  const [harga, setHarga] = useState('')
  const [konsesi, setKonsesi] = useState('')
  if (!t) return <div><PageHeader crumbs={['Evaluasi & Negosiasi', 'Negosiasi']} title="Negosiasi" /><Banner>Tidak ada tender di tahap negosiasi.</Banner></div>
  const n = negotiations[t.id]
  const terakhir = n.rounds[n.rounds.length - 1]
  const h = Number(harga)
  const valid = h > n.biaya
  const margin = valid ? hitungMargin(h, n.biaya) : null
  const sim = valid && aiAktif('NEG-02') ? negotiationCopilot(n, h) : null

  return (
    <div className="space-y-4">
      <PageHeader crumbs={['Evaluasi & Negosiasi', 'Negosiasi']} title="Negotiation Room" sub={t.pemilik} actions={<Link to={`/hasil/tender?catat=${t.id}`}><Button>Catat hasil</Button></Link>} />
      {pilihan.length > 1 && <Card><Field label="Tender"><Select value={t.id} onChange={(e) => setParams({ tender: e.target.value })}>{pilihan.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</Select></Field></Card>}
      <h2 className="text-base font-bold">{t.nama}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Batas Margin (walk-away)" value={`${fmtAngka(n.batasMargin, 1)}%`} />
        <StatTile label="Harga Terakhir" value={terakhir ? fmtRp(terakhir.harga) : '-'} />
        <StatTile label="Margin Terakhir" value={terakhir ? `${fmtAngka(terakhir.margin, 1)}%` : '-'} tone={terakhir && terakhir.margin < n.batasMargin ? 'bad' : 'good'} />
        <StatTile label="Sisa Ruang" value={terakhir ? `${fmtAngka(terakhir.margin - n.batasMargin, 1)} poin` : '-'} tone={terakhir && terakhir.margin < n.batasMargin ? 'bad' : undefined} />
      </div>
      <p className="text-xs text-ink-2">Batas margin disetujui {n.disetujuiOleh} sebelum negosiasi.</p>
      <Card title="Log Putaran">
        <DataTable<NegotiationRound>
          columns={[
            { key: 'n', header: 'Putaran', render: (r) => r.no }, { key: 'k', header: 'Konsesi', className: 'min-w-[220px]', render: (r) => r.konsesi }, { key: 'h', header: 'Harga', align: 'right', render: (r) => fmtRp(r.harga) },
            { key: 'm', header: 'Margin', align: 'right', render: (r) => `${fmtAngka(r.margin, 1)}%` }, { key: 's', header: 'Status', render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge> },
            { key: 'a', header: 'Aksi', render: (r) => r.status === 'Butuh approval'
              ? <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => { actions.setujuiKonsesi(t.id, r.no); toast.success('Konsesi disetujui GM Divisi.') }}>Setujui sebagai GM (ponsel)</Button><Button size="sm" variant="neutral" disabled title="Usulan tidak bisa final sebelum approval">Tandai final</Button></div>
              : r.status !== 'Final' ? <Button size="sm" variant="outline" onClick={() => { actions.finalkanPutaran(t.id, r.no); toast.success('Putaran ditandai final.') }}>Tandai final</Button> : null },
          ]}
          rows={n.rounds} rowKey={(r) => String(r.no)} empty="Belum ada putaran."
        />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Catat Putaran Baru">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); actions.catatPutaran(t.id, h, konsesi); toast.success(margin !== null && margin < n.batasMargin ? 'Margin menembus batas. Permintaan approval dikirim ke GM (simulasi).' : 'Putaran tercatat.'); setHarga(''); setKonsesi('') }}>
            <Field label="Harga usulan (Rp miliar)"><Input type="number" step="0.1" value={harga} onChange={(e) => setHarga(e.target.value)} /></Field>
            <Field label="Konsesi yang diberikan"><Input value={konsesi} onChange={(e) => setKonsesi(e.target.value)} /></Field>
            {margin !== null && <p className={`text-sm font-semibold ${margin < n.batasMargin ? 'text-bad' : 'text-good'}`}>Margin hasil konsesi {fmtAngka(margin, 1)}%{margin < n.batasMargin ? ', di bawah batas: butuh approval' : `, sisa ruang ${fmtAngka(margin - n.batasMargin, 1)} poin`}</p>}
            {harga !== '' && !valid && <p className="text-sm text-bad">Harga di bawah biaya rencana ({fmtRp(n.biaya)}).</p>}
            <Button type="submit" disabled={!valid || !konsesi.trim()}>Simpan putaran</Button>
          </form>
        </Card>
        <Card title="Negotiation Copilot">
          <AiGate id="NEG-02" manual="Gunakan log putaran untuk menilai konsesi.">
            {sim ? <>
              <ul className="list-disc space-y-1 pl-5 text-sm">{sim.hasil.poin.map((p) => <li key={p}>{p}</li>)}</ul>
              <AiLabel id="NEG-02" keyakinan={sim.keyakinan} sumber={sim.sumber} />
            </> : <p className="text-sm text-ink-2">Masukkan harga usulan untuk melihat dampak konsesi ke margin dan poin argumen.</p>}
          </AiGate>
        </Card>
      </div>
    </div>
  )
}
