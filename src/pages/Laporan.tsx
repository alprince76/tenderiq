import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { PageHeader } from '@/components/shared'
import { Badge, Button, Card } from '@/components/ui'
import { fmtAngka, fmtPersen } from '@/domain/format'
import { useDemo } from '@/store/DemoProvider'
import { alasanKalah, divisiTerpilih, hasilPerDivisi, winPerSegmen } from '@/store/selectors'
import { unduhCsv } from './helpers'

export default function Laporan() {
  const { persona, filterDivisi, tenders } = useDemo()
  const divs = divisiTerpilih(filterDivisi, persona.divisi)
  const hasil = divs.map((d) => ({ divisi: d, ...hasilPerDivisi(d, tenders) }))
  const seg = winPerSegmen(divs, tenders)
  const al = alasanKalah(divs, tenders)
  return (
    <div className="space-y-4">
      <PageHeader crumbs={['Laporan', 'Laporan Win/Loss']} title="Laporan Win/Loss" sub="Periode Jan–Okt 2026" actions={<Button variant="outline" onClick={() => { unduhCsv('laporan-win-loss.csv', [['Divisi', 'Diikuti', 'Menang', 'Win Rate', 'NKB (Rp miliar)'], ...hasil.map((h) => [h.divisi, h.ikut, h.menang, h.win.toFixed(1), h.nkb])]); toast.success('Laporan diunduh.') }}><Download size={16} /> Unduh Laporan</Button>} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Per Divisi">
          <DataTable columns={[{ key: 'd', header: 'Divisi', render: (h) => h.divisi }, { key: 'i', header: 'Diikuti', align: 'right', render: (h) => h.ikut }, { key: 'm', header: 'Menang', align: 'right', render: (h) => h.menang }, { key: 'w', header: 'Win Rate', align: 'right', render: (h) => fmtPersen(h.win) }, { key: 'n', header: 'NKB (Rp miliar)', align: 'right', render: (h) => fmtAngka(h.nkb) }]} rows={hasil} rowKey={(h) => h.divisi} />
        </Card>
        <Card title="Per Segmen">
          <DataTable columns={[{ key: 's', header: 'Segmen', render: (h) => h.segmen }, { key: 'i', header: 'Diikuti', align: 'right', render: (h) => h.ikut }, { key: 'm', header: 'Menang', align: 'right', render: (h) => h.menang }, { key: 'w', header: 'Win Rate', align: 'right', render: (h) => fmtPersen(h.win) }]} rows={seg} rowKey={(h) => h.segmen} />
        </Card>
      </div>
      <Card title="Alasan Gugur dan Kalah">
        <DataTable columns={[{ key: 'a', header: 'Alasan', render: (r) => r.alasan }, { key: 'k', header: 'Kategori', render: (r) => <Badge tone={r.kategori === 'Gugur' ? 'red' : 'gray'}>{r.kategori}</Badge> }, { key: 'j', header: 'Jumlah', align: 'right', render: (r) => r.jumlah }, { key: 'p', header: 'Porsi', align: 'right', render: (r) => fmtPersen(al.total ? (r.jumlah / al.total) * 100 : 0) }]} rows={al.rows} rowKey={(r) => r.alasan} />
      </Card>
    </div>
  )
}
