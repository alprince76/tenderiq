import { useState } from 'react'
import { toast } from 'sonner'
import { AI_IDS, FITUR_AI } from '@/ai/registry'
import { SUMBER_DATA } from '@/data/history'
import { MATRIKS_KEWENANGAN, MENU_AKSES, PERAN_LABEL, PERAN_URUT, PERSONAS } from '@/data/org'
import { DataTable } from '@/components/DataTable'
import { PageHeader } from '@/components/shared'
import { Badge, Button, Card } from '@/components/ui'
import type { Hak, PeranId, PermMatrix } from '@/domain/types'
import { DIVISI } from '@/domain/types'
import { useDemo } from '@/store/DemoProvider'

const HAK: { id: Hak; label: string }[] = [{ id: 'lihat', label: 'Lihat' }, { id: 'tambah', label: 'Tambah' }, { id: 'ubah', label: 'Ubah' }, { id: 'hapus', label: 'Hapus' }, { id: 'setujui', label: 'Setujui' }]

export function AksesMenu() {
  const { perm, actions } = useDemo()
  const [peran, setPeran] = useState<PeranId>('estimator')
  const [draf, setDraf] = useState<PermMatrix>(perm)
  const hak = draf[peran]
  const toggle = (id: string, h: Hak) => {
    const cur = hak[id] ?? []
    setDraf({ ...draf, [peran]: { ...hak, [id]: cur.includes(h) ? cur.filter((x) => x !== h) : [...cur, h] } })
  }
  const semua = (id: string) => {
    const penuh = HAK.every((h) => (hak[id] ?? []).includes(h.id))
    setDraf({ ...draf, [peran]: { ...hak, [id]: penuh ? [] : HAK.map((h) => h.id) } })
  }
  return (
    <div>
      <PageHeader crumbs={['Manajemen Pengguna', 'Akses Menu']} title="Akses Menu" />
      <Card>
        <p className="mb-2 text-sm font-semibold">Peran</p>
        <div role="radiogroup" aria-label="Peran" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {PERAN_URUT.map((p) => (
            <label key={p} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${p === peran ? 'border-primary bg-primary-soft font-semibold' : 'border-line'}`}>
              <input type="radio" name="peran" className="size-4 accent-primary" checked={p === peran} onChange={() => setPeran(p)} /> {PERAN_LABEL[p]}
            </label>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead><tr>
              {['Menu', 'Sub-Menu', 'Centang Semua', ...HAK.map((h) => h.label)].map((h, i, a) => <th key={h} scope="col" className={`whitespace-nowrap bg-primary px-3.5 py-3 font-semibold text-white ${i < 2 ? 'text-left' : 'text-center'} ${i === 0 ? 'rounded-tl-lg' : ''} ${i === a.length - 1 ? 'rounded-tr-lg' : ''}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {MENU_AKSES.map((m) => m.sub.map((s, i) => (
                <tr key={s.id} className="even:bg-[#F9FAFB]">
                  {i === 0 && <th scope="rowgroup" rowSpan={m.sub.length} className="border-b border-r border-line bg-white px-3.5 text-left font-semibold">{m.menu}</th>}
                  <td className="h-11 border-b border-line px-3.5">{s.nama}</td>
                  <td className="border-b border-line text-center"><input aria-label={`Centang semua ${s.nama}`} type="checkbox" className="size-4 accent-primary" checked={HAK.every((h) => (hak[s.id] ?? []).includes(h.id))} onChange={() => semua(s.id)} /></td>
                  {HAK.map((h) => <td key={h.id} className="border-b border-line text-center"><input aria-label={`${h.label} ${s.nama}`} type="checkbox" className="size-4 accent-primary" checked={(hak[s.id] ?? []).includes(h.id)} onChange={() => toggle(s.id, h.id)} /></td>)}
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">Perubahan hak Lihat langsung memengaruhi menu pada POC ini dan tercatat di log audit.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="px-8" onClick={() => setDraf(perm)}>Batalkan</Button>
            <Button onClick={() => { actions.simpanPerm(draf); toast.success('Perubahan akses menu disimpan.') }}>Simpan Perubahan</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function DaftarPengguna() {
  return (
    <div>
      <PageHeader crumbs={['Manajemen Pengguna', 'Daftar Pengguna']} title="Daftar Pengguna" sub="Tersinkron dari SSO korporat (simulasi SCIM)." />
      <Card>
        <DataTable columns={[
          { key: 'n', header: 'Nama', className: 'font-semibold', render: (p) => p.nama }, { key: 'j', header: 'Jabatan', render: (p) => p.jabatan }, { key: 'u', header: 'Unit', render: (p) => p.unit },
          { key: 'r', header: 'Peran', render: (p) => <Badge tone="blue">{PERAN_LABEL[p.peran]}</Badge> }, { key: 'd', header: 'Akses Divisi', render: (p) => p.divisi.length === DIVISI.length ? 'Semua divisi' : p.divisi.join(', ') }, { key: 's', header: 'Status', render: () => <Badge tone="green">Aktif</Badge> },
        ]} rows={PERSONAS} rowKey={(p) => p.id} pageSize={10} noun="pengguna" />
      </Card>
    </div>
  )
}

export function MatriksKewenangan() {
  return (
    <div>
      <PageHeader crumbs={['Manajemen Pengguna', 'Matriks Kewenangan']} title="Matriks Kewenangan" sub="Rantai persetujuan yang dipakai Go/No-Go, override, harga, dan negosiasi." />
      <Card>
        <DataTable columns={[{ key: 'k', header: 'Keputusan', className: 'font-semibold', render: (m) => m.keputusan }, { key: 'b', header: 'Batas', render: (m) => m.batas }, { key: 'r', header: 'Rantai Persetujuan', render: (m) => m.rantai }]} rows={MATRIKS_KEWENANGAN} rowKey={(m) => m.keputusan + m.batas} />
      </Card>
    </div>
  )
}

export function Pengaturan() {
  const { ai, actions, audit } = useDemo()
  return (
    <div className="space-y-4">
      <PageHeader crumbs={['Pengaturan']} title="Pengaturan" />
      <Card title="Sumber Data">
        <DataTable columns={[{ key: 'n', header: 'Sumber', className: 'font-semibold', render: (s) => s.nama }, { key: 'j', header: 'Metode', render: (s) => s.jenis }, { key: 'd', header: 'Jadwal', render: (s) => s.jadwal }, { key: 't', header: 'Terakhir Sinkron', render: (s) => s.terakhir }, { key: 's', header: 'Status', render: (s) => <Badge tone={s.status === 'Tersinkron' ? 'green' : 'red'}>{s.status}</Badge> }]} rows={SUMBER_DATA} rowKey={(s) => s.nama} />
      </Card>
      <Card title="Kill Switch Fitur AI" sub="saat dimatikan, alur kembali ke mode manual tanpa kehilangan data">
        <div className="grid gap-x-6 gap-y-1 md:grid-cols-2">
          {AI_IDS.map((id) => (
            <label key={id} className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm">
              <span><span className="font-semibold">{FITUR_AI[id].nama}</span> <span className="text-xs text-ink-2">{id} · {FITUR_AI[id].fase}</span></span>
              <input type="checkbox" role="switch" className="size-4 accent-primary" checked={ai[id]} onChange={() => actions.toggleAi(id)} />
            </label>
          ))}
        </div>
      </Card>
      <Card title="Audit Log" sub="hanya tambah, tidak bisa diubah">
        <DataTable columns={[{ key: 'w', header: 'Waktu', className: 'whitespace-nowrap', render: (a) => a.waktu }, { key: 'k', header: 'Aktor', className: 'whitespace-nowrap', render: (a) => a.aktor }, { key: 'a', header: 'Aksi', render: (a) => a.aksi }, { key: 'o', header: 'Objek', render: (a) => a.objek }, { key: 'd', header: 'Detail', render: (a) => a.detail ?? '-' }]} rows={audit} rowKey={(a) => a.waktu + a.aksi + a.objek} pageSize={10} noun="catatan" />
      </Card>
    </div>
  )
}
