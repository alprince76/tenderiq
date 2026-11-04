import { toast } from 'sonner'
import { DataTable } from '@/components/DataTable'
import { AiGate, AiLabel, PageHeader } from '@/components/shared'
import { Badge, Button, Card } from '@/components/ui'
import { fmtKeyakinan, fmtRp } from '@/domain/format'
import { useDemo } from '@/store/DemoProvider'

export default function Rup() {
  const { rup, actions, persona, filterDivisi } = useDemo()
  const rows = rup.filter((r) => persona.divisi.includes(r.divisi) && (filterDivisi === 'Semua' || r.divisi === filterDivisi))
  return (
    <div>
      <PageHeader crumbs={['Peluang', 'Sinyal Awal RUP']} title="Sinyal Awal RUP" sub="Paket RUP konstruksi yang cocok dengan kapabilitas, sebelum tender diumumkan." />
      <Card>
        <AiGate id="RAD-05" manual="Pantau paket RUP langsung di SiRUP.">
          <DataTable
            columns={[
              { key: 'n', header: 'Paket RUP', className: 'min-w-[260px]', render: (r) => <><div className="font-semibold">{r.nama}</div><div className="text-xs text-ink-2">{r.sinyal}</div></> },
              { key: 'p', header: 'Pemilik Proyek', render: (r) => r.pemilik },
              { key: 'v', header: 'Pagu', align: 'right', render: (r) => fmtRp(r.pagu) },
              { key: 'j', header: 'Rencana Pemilihan', className: 'whitespace-nowrap', render: (r) => r.rencana },
              { key: 'k', header: 'Keyakinan', align: 'right', render: (r) => r.keyakinan < 0.7 ? <Badge tone="orange">{fmtKeyakinan(r.keyakinan)} · cek manual</Badge> : fmtKeyakinan(r.keyakinan) },
              { key: 's', header: 'Sumber', render: (r) => <span className="text-xs">{r.sumber}</span> },
              { key: 'a', header: 'Aksi', render: (r) => <Button size="sm" variant={r.dipantau ? 'neutral' : 'outline'} onClick={() => { actions.pantauRup(r.id); toast.success(r.dipantau ? 'Pemantauan dihentikan.' : 'Paket dipantau sampai tender diumumkan.') }}>{r.dipantau ? 'Berhenti pantau' : 'Pantau'}</Button> },
            ]}
            rows={rows} rowKey={(r) => r.id} pageSize={10} noun="paket"
          />
          <AiLabel id="RAD-05" sumber={['Data publik SiRUP', 'Profil kapabilitas divisi']} label="Sinyal dihasilkan AI" />
        </AiGate>
      </Card>
    </div>
  )
}
