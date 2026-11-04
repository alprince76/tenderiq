import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DAFTAR_LAPORAN, insightDashboard, ringkasObjective } from '@/ai/reports'
import type { ReportId } from '@/ai/reports'
import { CopilotChat } from '@/components/CopilotChat'
import { LaporanDrawer } from '@/components/LaporanDrawer'
import { AiGate, AiLabel, PageHeader } from '@/components/shared'
import { Badge, Button, Card } from '@/components/ui'
import type { Tone } from '@/components/ui'
import { useDemo } from '@/store/DemoProvider'
import { divisiTerpilih } from '@/store/selectors'
import type { StatusObjective } from '@/store/selectors'

const TONE: Record<StatusObjective, Tone> = { Tercapai: 'green', 'Sesuai jalur': 'blue', 'Perlu perhatian': 'orange' }

/** Halaman khusus AI: chat, ringkasan objective, rekomendasi, insight, dan laporan sekali klik. */
export default function AiPage() {
  const { tendersTerlihat, persona, filterDivisi, workspaces, gonogo, people, boleh, aiAktif } = useDemo()
  const animId = (useLocation().state as { animId?: string } | null)?.animId
  const [laporan, setLaporan] = useState<ReportId | null>(null)
  const ctx = { tenders: tendersTerlihat, divs: divisiTerpilih(filterDivisi, persona.divisi), semuaDivisi: filterDivisi === 'Semua', workspaces, gonogo, people }
  const o = ringkasObjective(ctx)
  const insight = insightDashboard(ctx)

  return (
    <div>
      <PageHeader crumbs={['TenderIQ AI']} title="TenderIQ AI" sub={`Cakupan: ${filterDivisi === 'Semua' ? 'semua divisi' : `Divisi ${filterDivisi}`}. Keluaran AI adalah draf untuk ditinjau; tidak ada yang dikirim otomatis.`} />
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_1.15fr]">
        <Card title="Tanya AI" className="xl:sticky xl:top-0">
          <AiGate id="INS-02" manual="Gunakan filter Tender Radar dan tabel Dashboard.">
            <CopilotChat className="h-[620px]" animAwal={animId} />
          </AiGate>
        </Card>

        <div className="space-y-4">
          {aiAktif('INS-03') && (
            <Card title="Laporan AI sekali klik">
              <div className="grid gap-2 sm:grid-cols-2">
                {DAFTAR_LAPORAN.map((d) => (
                  <Button key={d.id} variant="outline" className="h-auto flex-col items-start gap-0.5 whitespace-normal px-3 py-2 text-left" onClick={() => setLaporan(d.id)}>
                    <span>{d.label}</span>
                    <span className="text-xs font-normal text-ink-2">{d.bantuan}</span>
                  </Button>
                ))}
              </div>
            </Card>
          )}

          <Card title="Ringkasan Objective">
            <AiGate id="INS-03" manual="Gunakan tabel Kinerja Tender di Dashboard untuk memantau objective.">
              <p className="font-semibold">{o.headline}</p>
              <ul className="mt-2 space-y-0.5 text-sm">{o.narasi.map((n) => <li key={n}>{n}</li>)}</ul>
              <ul className="mt-4 space-y-2.5" aria-label="Progres sasaran">
                {o.rows.map((r) => (
                  <li key={r.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(0,205px)_1fr_132px_112px]">
                    <span><span className="font-semibold">{r.id}</span> {r.nama}</span>
                    <span role="progressbar" aria-label={r.nama} aria-valuenow={Math.round(r.progres)} aria-valuemin={0} aria-valuemax={100} className="order-last col-span-2 block h-2 overflow-hidden rounded-full bg-primary-soft sm:order-none sm:col-span-1">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${r.progres}%` }} />
                    </span>
                    <span className="whitespace-nowrap text-right tabular-nums"><strong>{r.teksAktual}</strong> <span className="text-xs text-ink-2">/ {r.teksTarget}</span></span>
                    <span className="hidden text-right sm:block"><Badge tone={TONE[r.status]}>{r.status}</Badge></span>
                  </li>
                ))}
              </ul>
              <AiLabel id="INS-03" keyakinan={o.keyakinan} sumber={o.sumber} />
              <p className="mt-1 text-xs text-ink-2">Ilustrasi dengan data dummy: pilot belum berjalan, dan baseline serta target memakai asumsi PRD §4.</p>
            </AiGate>
          </Card>

          {aiAktif('INS-03') && (
            <Card title="Rekomendasi Minggu Ini">
              <ul className="divide-y divide-line">
                {o.rekomendasi.map((r) => (
                  <li key={r.teks} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="min-w-0 flex-1">{r.teks}</span>
                    {boleh(r.tindakan.perm) && <Link to={r.tindakan.ke} className="shrink-0 rounded-lg border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary-soft">{r.tindakan.label}</Link>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {aiAktif('INS-03') && (
            <Card title="Insight Pipeline">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>{insight.funnel}</li>
                <li>{insight.segmen}</li>
                <li>{insight.alasan}</li>
              </ul>
              <AiLabel id="INS-03" keyakinan={0.82} sumber={['Dashboard Pipeline', 'Hasil tender 12 bulan', 'Pencatatan alasan kalah']} />
            </Card>
          )}
        </div>
      </div>
      {laporan && <LaporanDrawer key={laporan} id={laporan} onClose={() => setLaporan(null)} />}
    </div>
  )
}
