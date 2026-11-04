import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/DataTable'
import { BerlakuBadge, PageHeader, StatTile } from '@/components/shared'
import { Badge, Button, Card, Field, Input, Modal } from '@/components/ui'
import { cariKonflik, pesanKonflik } from '@/domain/conflicts'
import { fmtRp, fmtTanggal, selisihHari } from '@/domain/format'
import { useDemo } from '@/store/DemoProvider'

const TAB = 'border-b-2 border-transparent px-1 pb-2.5 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:text-primary whitespace-nowrap'

export default function Capability() {
  const { sbu, people, alat, pengalaman, assignments } = useDemo()
  const [unggah, setUnggah] = useState(false)
  const [nama, setNama] = useState('')
  const [berlaku, setBerlaku] = useState('')
  const semua = [...sbu.map((s) => s.berlaku), ...people.map((p) => p.berlaku), ...alat.map((a) => a.berlaku)]
  const dalam = (n: number) => semua.filter((d) => { const h = selisihHari(d); return h >= 0 && h <= n }).length
  const kedaluwarsa = semua.filter((d) => selisihHari(d) < 0).length
  return (
    <div>
      <PageHeader crumbs={['Penawaran', 'Capability Library']} title="Capability Library" actions={<Button variant="outline" onClick={() => setUnggah(true)}><PlusCircle size={16} /> Unggah Dokumen</Button>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total Dokumen Bermasa Berlaku" value={semua.length} />
        <StatTile label="Berakhir dalam 30 Hari" value={dalam(30)} tone="bad" />
        <StatTile label="Berakhir dalam 60 Hari" value={dalam(60)} tone="warn" />
        <StatTile label="Kedaluwarsa" value={kedaluwarsa} tone="bad" />
      </div>
      <Card>
        <p className="mb-3 text-xs text-ink-2">Pemilik dokumen dan Koordinator menerima notifikasi pada H-60 dan H-30 (simulasi).</p>
        <Tabs.Root defaultValue="personel">
          <Tabs.List aria-label="Jenis kapabilitas" className="mb-4 flex gap-7 overflow-x-auto border-b border-line">
            <Tabs.Trigger className={TAB} value="sbu">SBU</Tabs.Trigger>
            <Tabs.Trigger className={TAB} value="personel">Personel & SKK</Tabs.Trigger>
            <Tabs.Trigger className={TAB} value="alat">Alat</Tabs.Trigger>
            <Tabs.Trigger className={TAB} value="pengalaman">Pengalaman Kerja</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="sbu">
            <DataTable columns={[
              { key: 'k', header: 'Kode', className: 'font-semibold', render: (s) => s.kode }, { key: 'n', header: 'Sub-klasifikasi', render: (s) => s.nama }, { key: 'q', header: 'Kualifikasi', render: (s) => s.kualifikasi },
              { key: 'f', header: 'Dokumen', render: (s) => <span className="text-primary">{s.file}</span> }, { key: 'b', header: 'Masa Berlaku', className: 'whitespace-nowrap', render: (s) => fmtTanggal(s.berlaku) }, { key: 's', header: 'Status', render: (s) => <BerlakuBadge iso={s.berlaku} /> },
            ]} rows={sbu} rowKey={(s) => s.id} />
          </Tabs.Content>
          <Tabs.Content value="personel">
            <DataTable columns={[
              { key: 'n', header: 'Nama', className: 'font-semibold', render: (p) => p.nama }, { key: 'r', header: 'Peran', render: (p) => p.peran.join(', ') }, { key: 'k', header: 'SKK', render: (p) => p.skk },
              { key: 'p', header: 'Pengalaman', align: 'right', render: (p) => `${p.pengalamanTahun} tahun` }, { key: 'b', header: 'Masa Berlaku', className: 'whitespace-nowrap', render: (p) => fmtTanggal(p.berlaku) }, { key: 's', header: 'Status', render: (p) => <BerlakuBadge iso={p.berlaku} /> },
              { key: 'a', header: 'Penugasan', render: (p) => { const c = cariKonflik(p.id, '', assignments); return c ? <span className="text-xs">{pesanKonflik(p.nama.split(' ')[0], c, fmtTanggal)}</span> : <Badge tone="green">Tersedia</Badge> } },
            ]} rows={people} rowKey={(p) => p.id} pageSize={10} noun="personel" />
          </Tabs.Content>
          <Tabs.Content value="alat">
            <DataTable columns={[
              { key: 'n', header: 'Alat', className: 'font-semibold', render: (a) => a.nama }, { key: 'k', header: 'Kepemilikan', render: (a) => a.kepemilikan }, { key: 'j', header: 'Jumlah', align: 'right', render: (a) => a.jumlah }, { key: 'l', header: 'Lokasi', render: (a) => a.lokasi },
              { key: 'd', header: 'Dokumen', render: (a) => a.dokumen }, { key: 'b', header: 'Masa Berlaku', className: 'whitespace-nowrap', render: (a) => fmtTanggal(a.berlaku) }, { key: 's', header: 'Status', render: (a) => <BerlakuBadge iso={a.berlaku} /> },
            ]} rows={alat} rowKey={(a) => a.id} />
          </Tabs.Content>
          <Tabs.Content value="pengalaman">
            <DataTable columns={[
              { key: 'n', header: 'Kontrak', className: 'font-semibold', render: (p) => <>{p.nama} {p.dariTender && <Badge tone="blue">Otomatis dari BAST</Badge>}</> }, { key: 'o', header: 'Pemilik', render: (p) => p.pemilik }, { key: 'j', header: 'Jenis', render: (p) => p.jenis },
              { key: 'v', header: 'Nilai', align: 'right', render: (p) => fmtRp(p.nilai) }, { key: 'b', header: 'Tanggal BAST', className: 'whitespace-nowrap', render: (p) => fmtTanggal(p.bast) }, { key: 'f', header: 'Dokumen', render: (p) => <span className="text-primary">{p.file}</span> },
            ]} rows={pengalaman} rowKey={(p) => p.id} />
          </Tabs.Content>
        </Tabs.Root>
      </Card>
      <Modal open={unggah} onOpenChange={setUnggah} title="Unggah Dokumen" footer={<>
        <Button variant="neutral" onClick={() => setUnggah(false)}>Batal</Button>
        <Button onClick={() => { if (!berlaku) { toast.error('Isi tanggal berlaku'); return } setUnggah(false); setNama(''); setBerlaku(''); toast.success('Dokumen tersimpan (simulasi).') }}>Simpan</Button>
      </>}>
        <div className="space-y-3">
          <Field label="Nama sertifikat"><Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Mis. SKK Ahli Madya" /></Field>
          <Field label="Tanggal berlaku (wajib)"><Input type="date" value={berlaku} onChange={(e) => setBerlaku(e.target.value)} /></Field>
          <button className="text-sm font-semibold text-primary hover:underline" onClick={() => setBerlaku('2029-06-30')}>Pakai tanggal hasil baca AI: 30 Jun 2029 (perlu dikonfirmasi)</button>
        </div>
      </Modal>
    </div>
  )
}
