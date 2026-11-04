import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { buatLaporan, laporanKeTeks } from '@/ai/reports'
import type { ReportId } from '@/ai/reports'
import { unduhTeks } from '@/pages/helpers'
import { useDemo } from '@/store/DemoProvider'
import { divisiTerpilih } from '@/store/selectors'
import { AiLabel } from './shared'
import { Button, Drawer, Progress } from './ui'

const DURASI_MS = 1100

/** Laporan AI: disusun dari data saat ini, hanya bisa disalin atau diunduh, tidak terkirim otomatis. */
export function LaporanDrawer({ id, onClose }: { id: ReportId; onClose: () => void }) {
  const { tendersTerlihat, persona, filterDivisi, workspaces, gonogo, people, boleh, actions } = useDemo()
  const [siap, setSiap] = useState(false)
  const l = useMemo(() => buatLaporan(id, { tenders: tendersTerlihat, divs: divisiTerpilih(filterDivisi, persona.divisi), semuaDivisi: filterDivisi === 'Semua', workspaces, gonogo, people }), [id, tendersTerlihat, filterDivisi, persona.divisi, workspaces, gonogo, people])
  const judul = l.judul

  useEffect(() => {
    const t = window.setTimeout(() => { setSiap(true); actions.catatAudit('Membuat laporan AI', judul) }, DURASI_MS)
    return () => window.clearTimeout(t)
  }, [actions, judul])

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(laporanKeTeks(l))
      toast.success('Laporan disalin. Tinjau sebelum dibagikan.')
    } catch {
      toast.error('Browser menolak akses clipboard. Gunakan Unduh .txt.')
    }
  }
  const tindakan = l.tindakan.filter((t) => boleh(t.perm))

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title={l.judul} width="max-w-2xl" footer={siap ? <>
      <Button variant="outline" onClick={salin}>Salin laporan</Button>
      <Button onClick={() => { unduhTeks(`${l.id}-tenderiq.txt`, laporanKeTeks(l)); toast.success('Laporan diunduh.') }}>Unduh .txt</Button>
    </> : undefined}>
      {!siap ? (
        <div className="py-6">
          <p role="status" className="mb-2 text-sm font-semibold">AI sedang menyusun laporan...</p>
          <p className="mb-3 text-xs text-ink-2">Membaca {l.sumber.join(', ')}.</p>
          <Progress value={70} />
        </div>
      ) : (
        <div className="space-y-5 text-sm">
          <div className="rounded-lg border-l-4 border-primary bg-primary-soft px-4 py-3">
            <p className="text-xs text-ink-2">{l.cakupan} · per 4 Nov 2026</p>
            <p className="mt-1 font-semibold">{l.ringkasan}</p>
          </div>
          {l.bagian.map((b) => (
            <section key={b.judul}>
              <h3 className="mb-1.5 font-semibold">{b.judul}</h3>
              {b.butir && <ul className="list-disc space-y-1 pl-5">{b.butir.map((x) => <li key={x}>{x}</li>)}</ul>}
              {b.tabel && (b.tabel.baris.length === 0 ? <p className="text-ink-2">Tidak ada data.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead><tr>{b.tabel.kolom.map((k) => <th key={k} scope="col" className="whitespace-nowrap border-b-2 border-line px-2 py-1.5 text-left font-semibold">{k}</th>)}</tr></thead>
                    <tbody>{b.tabel.baris.map((r) => <tr key={r.join('|')}>{r.map((v, i) => <td key={i} className="border-b border-line px-2 py-1.5">{v}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              ))}
            </section>
          ))}
          {tindakan.length > 0 && (
            <section>
              <h3 className="mb-1.5 font-semibold">Tindakan cepat</h3>
              <div className="flex flex-wrap gap-2">{tindakan.map((t) => <Link key={t.ke} to={t.ke} onClick={onClose} className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-soft">{t.label}</Link>)}</div>
            </section>
          )}
          <AiLabel id="INS-03" keyakinan={l.keyakinan} sumber={l.sumber} />
          <p className="text-xs font-semibold">Draf AI. Tinjau sebelum dibagikan; laporan tidak dikirim otomatis ke siapa pun.</p>
        </div>
      )}
    </Drawer>
  )
}
