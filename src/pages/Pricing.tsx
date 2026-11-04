import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ITEM_HARGA, cekAnomali, rekomendasiHarga } from '@/ai/pricing'
import { HISTORI_HARGA } from '@/data/history'
import { DataTable } from '@/components/DataTable'
import { AiGate, AiLabel, PageHeader } from '@/components/shared'
import { Badge, Banner, Card, Field, Input, Select } from '@/components/ui'
import { fmtAngka, fmtPersen, fmtRp } from '@/domain/format'
import { useDemo } from '@/store/DemoProvider'

export default function Pricing() {
  const { tendersTerlihat } = useDemo()
  const [params, setParams] = useSearchParams()
  const pilihan = tendersTerlihat.filter((t) => ['Qualifying', 'Preparing', 'ReadyToSubmit', 'Negotiation', 'Discovered'].includes(t.status)).sort((a, b) => b.relevance - a.relevance)
  const t = pilihan.find((x) => x.id === params.get('tender')) ?? pilihan[0]
  const [usulan, setUsulan] = useState('')
  const rek = t ? rekomendasiHarga(t) : null
  const anomali = cekAnomali(ITEM_HARGA)
  const u = Number(usulan)
  const diBawah = rek && usulan && u < rek.hasil.batasBawahHistoris

  return (
    <div className="space-y-4">
      <PageHeader crumbs={['Penawaran', 'Pricing Intelligence']} title="Pricing Intelligence" sub="AI memberi rentang dan kurva. Keputusan harga tetap di Estimator dan approver." />
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tender"><Select value={t?.id} onChange={(e) => { setParams({ tender: e.target.value }); setUsulan('') }}>{pilihan.map((x) => <option key={x.id} value={x.id}>{x.nama} ({fmtRp(x.hps)})</option>)}</Select></Field>
          <Field label="Harga yang dipertimbangkan (% HPS)"><Input type="number" step="0.1" value={usulan} placeholder={rek ? String(rek.hasil.titik) : ''} onChange={(e) => setUsulan(e.target.value)} /></Field>
        </div>
        {diBawah && <div className="mt-3"><Banner tone="red">Harga {fmtPersen(u)} di bawah batas bawah historis segmen ({fmtPersen(rek.hasil.batasBawahHistoris)}). Ada potensi masalah kewajaran harga. Keputusan akhir tetap di Estimator dan approver.</Banner></div>}
      </Card>
      {t && rek && (
        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <Card title="Peluang Menang terhadap Harga">
            <AiGate id="PRC-02" manual="Gunakan tabel histori harga di bawah.">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rek.hasil.kurva} margin={{ left: -12, right: 12, top: 8, bottom: 16 }}>
                    <ReferenceArea x1={rek.hasil.bawah} x2={rek.hasil.atas} fill="#E8F0FA" />
                    <XAxis dataKey="persenHps" type="number" domain={[88, 100]} tickCount={7} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} tick={{ fontSize: 11, fill: '#6B7280' }} label={{ value: 'Harga (% HPS)', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#6B7280' }} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E5E7EB' }} labelFormatter={(v) => `Harga ${v}% HPS`} formatter={(v, _n, item) => [`${v}% peluang · margin rencana ${fmtAngka((item.payload as { margin: number }).margin, 1)}%`, '']} separator="" />
                    <Line dataKey="peluang" stroke="#1560B8" strokeWidth={2} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm">Rentang rekomendasi: <strong>{fmtPersen(rek.hasil.bawah)} sampai {fmtPersen(rek.hasil.atas)} dari HPS</strong> ({fmtRp(t.hps * rek.hasil.bawah / 100)} sampai {fmtRp(t.hps * rek.hasil.atas / 100)}), ditandai area biru.</p>
              <AiLabel id="PRC-02" keyakinan={rek.keyakinan} sumber={rek.sumber} />
            </AiGate>
          </Card>
          <Card title="Tender Pembanding">
            <DataTable columns={[
              { key: 'n', header: 'Tender', render: (h) => <>{h.nama}<div className="text-xs text-ink-2">{h.wilayah}, {h.tahun}</div></> },
              { key: 'p', header: 'Pemenang (% HPS)', align: 'right', render: (h) => fmtPersen(h.pemenang) },
              { key: 'h', header: 'Hasil', render: (h) => <Badge tone={h.menang ? 'green' : 'red'}>{h.menang ? 'Menang' : 'Kalah'}</Badge> },
            ]} rows={rek.hasil.pembanding} rowKey={(h) => h.nama} />
          </Card>
        </div>
      )}
      <Card title="Cek Kewajaran Harga Satuan" sub="BoQ_v3.xlsx">
        <AiGate id="PRC-03" manual="Tinjau harga satuan secara manual.">
          <DataTable columns={[
            { key: 'k', header: 'Kode', render: (i) => i.kode }, { key: 'u', header: 'Uraian', render: (i) => i.uraian }, { key: 's', header: 'Satuan', render: (i) => i.satuan },
            { key: 'h', header: 'Harga Satuan (Rp)', align: 'right', render: (i) => fmtAngka(i.hargaSatuan) }, { key: 'r', header: 'Rata-rata Historis (Rp)', align: 'right', render: (i) => fmtAngka(i.rataHistoris) },
            { key: 'c', header: 'Hasil', render: (i) => <Badge tone={i.anomali ? 'orange' : 'green'}>{i.catatan}</Badge> },
          ]} rows={anomali.hasil} rowKey={(i) => i.kode} />
          <AiLabel id="PRC-03" keyakinan={anomali.keyakinan} sumber={anomali.sumber} />
        </AiGate>
      </Card>
      <Card title="Price History">
        <DataTable columns={[
          { key: 'n', header: 'Tender', render: (h) => h.nama }, { key: 'j', header: 'Jenis', render: (h) => h.jenis }, { key: 'w', header: 'Wilayah', render: (h) => h.wilayah }, { key: 't', header: 'Tahun', render: (h) => h.tahun },
          { key: 'hps', header: 'HPS', align: 'right', render: (h) => fmtRp(h.hps) }, { key: 'p', header: 'Penawaran (% HPS)', align: 'right', render: (h) => fmtPersen(h.penawaran) }, { key: 'm', header: 'Pemenang (% HPS)', align: 'right', render: (h) => fmtPersen(h.pemenang) }, { key: 'mg', header: 'Margin', align: 'right', render: (h) => fmtPersen(h.margin) },
        ]} rows={HISTORI_HARGA} rowKey={(h) => h.nama} pageSize={8} noun="tender" />
      </Card>
    </div>
  )
}
