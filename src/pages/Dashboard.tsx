import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText, RefreshCw, Search, TrendingUp, Trophy, Clock, Layers } from 'lucide-react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { KpiCard, StatusBadge } from '@/components/shared'
import { Badge, Button, Card, Drawer } from '@/components/ui'
import type { Tone } from '@/components/ui'
import { fmtAngka, fmtPersen, fmtRp, fmtTanggal } from '@/domain/format'
import { STATUS_LABEL, approvalBerikutnya } from '@/domain/transitions'
import type { Milestone, Status, Tender } from '@/domain/types'
import { useDemo } from '@/store/DemoProvider'
import { alasanKalah, divisiTerpilih, funnel, hasilPerDivisi, persyaratanKurang, tenderAktif, tenggat7Hari, winPerSegmen } from '@/store/selectors'
import { ruteTender } from './helpers'

const KESIAPAN_TONE: Record<Milestone['kesiapan'], Tone> = { 'Belum lengkap': 'red', 'Perlu dicek': 'orange', Terjadwal: 'blue', Siap: 'green' }

interface Persetujuan { id: string; judul: string; sub: string; jenis: string; ke: string }

export default function Dashboard() {
  const { persona, tendersTerlihat: ts, tenders, workspaces, gonogo, negotiations, filterDivisi } = useDemo()
  const navigate = useNavigate()
  const [drill, setDrill] = useState<{ judul: string; list: Tender[] } | null>(null)

  const divs = divisiTerpilih(filterDivisi, persona.divisi)
  const aktif = tenderAktif(ts)
  const nilaiAktif = aktif.reduce((n, t) => n + t.hps, 0)
  const baruRelevan = ts.filter((t) => t.status === 'Discovered' && t.relevance >= 70 && !t.tidakRelevan)
  const tenggat = tenggat7Hari(ts)
  const kurang = persyaratanKurang(ts, workspaces)
  const hasil = divs.map((d) => ({ divisi: d, ...hasilPerDivisi(d, tenders) }))
  const totalHasil = hasil.reduce((a, h) => ({ ikut: a.ikut + h.ikut, menang: a.menang + h.menang, nkb: a.nkb + h.nkb }), { ikut: 0, menang: 0, nkb: 0 })
  const winRate = totalHasil.ikut ? (totalHasil.menang / totalHasil.ikut) * 100 : 0
  const segmen = winPerSegmen(divs, tenders)
  const alasan = alasanKalah(divs, tenders)
  const dataFunnel = funnel(ts).map((f) => ({ ...f, label: STATUS_LABEL[f.status], teks: `${f.jumlah} · ${fmtRp(f.nilai)}` }))

  const persetujuan: Persetujuan[] = useMemo(() => {
    const out: Persetujuan[] = []
    for (const t of ts) {
      const g = gonogo[t.id]
      if (g && !g.keputusan && g.diajukanOleh && approvalBerikutnya(g.approvals)) out.push({ id: `g-${t.id}`, judul: t.nama, sub: `${fmtRp(t.hps)} · diajukan ${g.diajukanOleh}`, jenis: 'Go/No-Go', ke: `/gonogo/${t.id}` })
      const w = workspaces[t.id]
      if (w?.overrideDiminta) out.push({ id: `o-${t.id}`, judul: t.nama, sub: w.overrideDiminta.alasan, jenis: 'Override kepatuhan', ke: `/penawaran/workspace/${t.id}?tab=checklist` })
      const r = negotiations[t.id]?.rounds.find((x) => x.status === 'Butuh approval')
      if (r) out.push({ id: `n-${t.id}`, judul: t.nama, sub: `Margin usulan ${fmtAngka(r.margin, 1)}% (batas ${fmtAngka(negotiations[t.id].batasMargin, 0)}%)`, jenis: 'Batas konsesi', ke: `/evaluasi/negosiasi?tender=${t.id}` })
    }
    return out
  }, [ts, gonogo, workspaces, negotiations])

  const kolomTenggat: Column<Tender>[] = [
    { key: 'no', header: 'No', render: (_, i) => i + 1 },
    { key: 'tender', header: 'Tender', render: (t) => <><Link to={ruteTender(t)} className="font-semibold text-primary hover:underline">{t.nama}</Link><div className="text-xs text-ink-2">{t.pemilik}</div></> },
    { key: 'tahap', header: 'Tahap', render: (t) => t.milestone?.tahap },
    { key: 'tgl', header: 'Tenggat', className: 'whitespace-nowrap', render: (t) => fmtTanggal(t.milestone?.tanggal) },
    { key: 'pic', header: 'PIC', className: 'whitespace-nowrap', render: (t) => t.pic },
    { key: 'kes', header: 'Kesiapan', render: (t) => <Badge tone={KESIAPAN_TONE[t.milestone!.kesiapan]}>{t.milestone!.kesiapan}</Badge> },
  ]

  const bukaStatus = (status: Status) => setDrill({ judul: `Tender: ${STATUS_LABEL[status]}`, list: ts.filter((t) => t.status === status) })

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary px-7 py-6 text-white">
        <h1 className="text-2xl font-bold">Halo, {persona.nama.split(' ')[0]}</h1>
        <p className="mt-2 max-w-2xl text-sm">Selamat datang di TenderIQ. Pantau peluang baru, tenggat, dan kesiapan penawaran {filterDivisi === 'Semua' ? 'seluruh divisi' : `Divisi ${filterDivisi}`} di satu tempat.</p>
      </div>
      <p className="flex items-center gap-2 text-xs text-ink-2">Data terakhir diperbarui 4 Nov 2026, 10.00 WIB <RefreshCw size={13} /></p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={TrendingUp} label="Nilai Pipeline Aktif" value={fmtRp(nilaiAktif)} sub={`dari ${aktif.length} tender aktif`} />
        <button className="text-left" onClick={() => setDrill({ judul: 'Tender aktif', list: aktif })}><KpiCard icon={Layers} label="Tender Aktif" value={aktif.length} sub="Klik untuk melihat daftar" /></button>
        <KpiCard icon={Trophy} label="Win Rate 12 Bulan" value={fmtPersen(winRate)} sub={`${totalHasil.menang} dari ${totalHasil.ikut} tender`} to="/laporan" />
        <button className="text-left" onClick={() => setDrill({ judul: 'Tenggat 7 hari ke depan', list: tenggat })}><KpiCard icon={Clock} label="Tenggat 7 Hari ke Depan" value={tenggat.length} sub="Klik untuk melihat daftar" /></button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <KpiCard icon={Search} label="Tender Baru Relevan" value={baruRelevan.length} sub="Skor ≥ 70, perlu dikualifikasi" action={<Button className="shrink-0" onClick={() => navigate('/peluang/radar')}>Lihat Radar</Button>} />
        <KpiCard icon={CheckCircle2} label="Keputusan Go/No-Go" value={persetujuan.filter((p) => p.jenis === 'Go/No-Go').length} sub="Menunggu persetujuan" action={<Button className="shrink-0" onClick={() => navigate('/gonogo')}>Proses</Button>} />
        <KpiCard icon={FileText} label="Persyaratan Belum Terpenuhi" value={kurang.total} sub={`Di ${kurang.per.length} tender`} action={<Button className="shrink-0" disabled={!kurang.per.length} onClick={() => kurang.per[0] && navigate(`/penawaran/workspace/${kurang.per[0].t.id}?tab=checklist`)}>Periksa</Button>} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Funnel Tender per Tahap" sub="jumlah dan nilai HPS">
          <div className="h-[310px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataFunnel} layout="vertical" margin={{ left: 8, right: 86, top: 0, bottom: 0 }} barCategoryGap={8}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={136} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#1F2937' }} />
                <Tooltip cursor={{ fill: '#F5F7FA' }} formatter={(v) => [`${v} tender`, 'Jumlah']} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E5E7EB' }} />
                <Bar dataKey="jumlah" radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false} className="cursor-pointer" onClick={(d) => bukaStatus((d as unknown as { status: Status }).status)}>
                  {dataFunnel.map((f) => <Cell key={f.status} fill="#1560B8" />)}
                  <LabelList dataKey="teks" position="right" style={{ fontSize: 12, fill: '#1F2937' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-ink-2">Klik batang untuk melihat daftar tendernya.</p>
        </Card>
        <Card title="Win Rate per Segmen" sub="(12 bulan terakhir)">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmen} margin={{ left: -16, right: 8, top: 18, bottom: 0 }}>
                <XAxis dataKey="segmen" tickLine={false} axisLine={{ stroke: '#E5E7EB' }} tick={{ fontSize: 12, fill: '#1F2937' }} />
                <YAxis domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip cursor={{ fill: '#F5F7FA' }} formatter={(v) => [fmtPersen(Number(v)), 'Win rate']} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E5E7EB' }} />
                <Bar dataKey="win" fill="#1560B8" radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false}>
                  <LabelList dataKey="win" position="top" formatter={(v) => fmtPersen(Number(v), 0)} style={{ fontSize: 12, fill: '#1F2937' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-ink-2">{segmen.map((s) => `${s.segmen} ${s.menang}/${s.ikut}`).join(' · ')}</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Tenggat 7 Hari ke Depan" action={<Button variant="outline" size="sm" onClick={() => setDrill({ judul: 'Tenggat 7 hari ke depan', list: tenggat })}>Lihat Semua</Button>}>
          <DataTable columns={kolomTenggat} rows={tenggat.slice(0, 6)} rowKey={(t) => t.id} empty="Tidak ada tenggat dalam 7 hari." />
        </Card>
        <Card title="Menunggu Persetujuan" action={<Button variant="outline" size="sm" onClick={() => navigate('/gonogo')}>Lihat Semua</Button>}>
          {persetujuan.length === 0 && <p className="py-4 text-sm text-ink-2">Tidak ada yang menunggu persetujuan.</p>}
          <ul className="divide-y divide-line">
            {persetujuan.slice(0, 6).map((p) => (
              <li key={p.id}><Link to={p.ke} className="flex items-center justify-between gap-3 py-2.5 hover:bg-canvas">
                <span className="min-w-0"><span className="block truncate text-sm font-semibold">{p.judul}</span><span className="block truncate text-xs text-ink-2">{p.sub}</span></span>
                <Badge tone="blue">{p.jenis}</Badge>
              </Link></li>
            ))}
          </ul>
        </Card>
      </div>

      <h2 className="pt-1 text-lg font-bold">Kinerja Tender</h2>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Hasil Tender per Divisi" sub="(Jan–Okt 2026)">
          <DataTable
            columns={[
              { key: 'd', header: 'Divisi', render: (h) => h.divisi },
              { key: 'i', header: 'Diikuti', align: 'right', render: (h) => h.ikut },
              { key: 'm', header: 'Menang', align: 'right', render: (h) => h.menang },
              { key: 'w', header: 'Win Rate', align: 'right', render: (h) => fmtPersen(h.win) },
              { key: 'n', header: 'NKB (Rp miliar)', align: 'right', render: (h) => fmtAngka(h.nkb) },
            ]}
            rows={hasil} rowKey={(h) => h.divisi}
            footerRow={<tr className="bg-primary-soft font-bold"><td className="px-3.5 py-3">Total</td><td className="px-3.5 text-right tabular-nums">{totalHasil.ikut}</td><td className="px-3.5 text-right tabular-nums">{totalHasil.menang}</td><td className="px-3.5 text-right tabular-nums">{fmtPersen(winRate)}</td><td className="px-3.5 text-right tabular-nums">{fmtAngka(totalHasil.nkb)}</td></tr>}
          />
        </Card>
        <Card title="Alasan Gugur dan Kalah Teratas">
          <DataTable
            columns={[
              { key: 'a', header: 'Alasan', render: (r) => r.alasan },
              { key: 'k', header: 'Kategori', render: (r) => <Badge tone={r.kategori === 'Gugur' ? 'red' : 'gray'}>{r.kategori}</Badge> },
              { key: 'j', header: 'Jumlah', align: 'right', render: (r) => r.jumlah },
              { key: 'p', header: 'Porsi', align: 'right', render: (r) => fmtPersen(alasan.total ? (r.jumlah / alasan.total) * 100 : 0) },
            ]}
            rows={alasan.rows.slice(0, 5)} rowKey={(r) => r.alasan}
            footerRow={<tr className="bg-primary-soft font-bold"><td colSpan={2} className="px-3.5 py-3">Total tender tidak menang</td><td className="px-3.5 text-right tabular-nums">{alasan.total}</td><td className="px-3.5 text-right">100%</td></tr>}
          />
        </Card>
      </div>

      <Drawer open={!!drill} onOpenChange={(o) => !o && setDrill(null)} title={drill?.judul}>
        <DataTable
          columns={[
            { key: 'n', header: 'Tender', render: (t) => <Link to={ruteTender(t)} className="font-semibold text-primary hover:underline">{t.nama}</Link> },
            { key: 'h', header: 'HPS', align: 'right', render: (t) => fmtRp(t.hps) },
            { key: 's', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
          ]}
          rows={drill?.list ?? []} rowKey={(t) => t.id}
        />
      </Drawer>
    </div>
  )
}
