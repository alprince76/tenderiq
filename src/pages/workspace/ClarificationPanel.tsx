import { useEffect, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { DIFF_DURASI_MS, drafKlarifikasi, metaDiff } from '@/ai/clarification'
import { DataTable } from '@/components/DataTable'
import { AiGate, AiLabel, ItemBadge } from '@/components/shared'
import { Badge, Banner, Button, Card, Field, Input, Modal, Progress, Select, Textarea } from '@/components/ui'
import { fmtTanggal, HARI_INI, selisihHari, tambahHari } from '@/domain/format'
import type { Clarification, Tender } from '@/domain/types'
import { useDemo } from '@/store/DemoProvider'

const PIC = ['Budi S.', 'Dewi A.', 'Andi R.', 'Sari P.']

export function ClarificationPanel({ tender }: { tender: Tender }) {
  const { workspaces, actions, aiAktif } = useDemo()
  const w = workspaces[tender.id]
  const [progres, setProgres] = useState<number | null>(null)
  const timer = useRef<number | null>(null)
  const [tambah, setTambah] = useState(false)
  const [form, setForm] = useState({ pertanyaan: '', pic: PIC[0], tenggat: tambahHari(HARI_INI, 2), sumber: 'Klarifikasi Pokja' as Clarification['sumber'] })
  const [jawab, setJawab] = useState<Clarification | null>(null)
  const [teks, setTeks] = useState('')
  const [drafAi, setDrafAi] = useState<ReturnType<typeof drafKlarifikasi> | null>(null)

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current) }, [])

  const unggah = () => {
    const mulai = Date.now()
    setProgres(0)
    timer.current = window.setInterval(() => {
      const p = Math.min(100, ((Date.now() - mulai) / DIFF_DURASI_MS) * 100)
      setProgres(p)
      if (p >= 100) {
        if (timer.current) window.clearInterval(timer.current)
        setProgres(null)
        actions.terapkanAdendum(tender.id)
        toast.success('Adendum 1 dianalisis. Item terdampak kembali ke status Perlu review.')
      }
    }, 80)
  }

  const terdampak = w.checklist.filter((i) => i.perluReview)

  return (
    <div className="space-y-4">
      <Card title="Adendum" action={
        <Button variant="outline" disabled={progres !== null || !!w.adendum || !aiAktif('CLR-02')} onClick={unggah}><Upload size={16} /> Unggah adendum</Button>
      }>
        <AiGate id="CLR-02" manual="Bandingkan adendum dengan dokumen pemilihan secara manual.">
          {progres !== null && (
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Menganalisis Adendum 1...</p><p className="text-xs text-ink-2">Item yang terdampak perubahan akan ditandai "Perlu review" dan PIC-nya mendapat notifikasi.</p></div>
              <div className="w-1/2"><Progress value={progres} /></div>
              <span className="w-10 text-right text-sm font-semibold tabular-nums">{Math.round(progres)}%</span>
            </div>
          )}
          {progres === null && !w.adendum && <p className="text-sm text-ink-2">Belum ada adendum. Saat diunggah, AI menampilkan perubahan per kategori dan menandai item checklist yang terdampak.</p>}
          {w.adendum && (
            <>
              <DataTable
                columns={[
                  { key: 'k', header: 'Kategori', render: (c) => <Badge tone="blue">{c.kategori}</Badge> },
                  { key: 'l', header: 'Sebelum', render: (c) => <span className="text-ink-2">{c.lama}</span> },
                  { key: 'b', header: 'Sesudah', render: (c) => <span className="font-medium">{c.baru}</span> },
                  { key: 'r', header: 'Rujukan', className: 'whitespace-nowrap', render: (c) => c.rujukan },
                  { key: 't', header: 'Item Terdampak', render: (c) => c.itemTerdampak.join(', ') },
                ]}
                rows={w.adendum.perubahan} rowKey={(c) => c.kategori}
              />
              <AiLabel id="CLR-02" keyakinan={metaDiff.keyakinan} sumber={metaDiff.sumber} />
              {w.checklist.length === 0 && <Banner tone="blue">Checklist belum dibuat, sehingga belum ada item yang ditandai.</Banner>}
              {terdampak.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-semibold">Item checklist perlu ditinjau ({terdampak.length})</h3>
                  <ul className="divide-y divide-line rounded-lg border border-line">
                    {terdampak.map((i) => (
                      <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                        <span><span className="font-medium">{i.teks}</span> <span className="text-xs text-ink-2">PIC {i.pic} · notifikasi terkirim (simulasi)</span></span>
                        <span className="flex items-center gap-2"><ItemBadge status="Perlu review" /><Button size="sm" variant="outline" onClick={() => { actions.selesaiReview(tender.id, i.id); toast.success('Item selesai ditinjau dan dicek ulang.') }}>Selesai ditinjau</Button></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </AiGate>
      </Card>

      <Card title="Q&A Aanwijzing & Klarifikasi" action={<Button variant="outline" onClick={() => setTambah(true)}>Catat klarifikasi</Button>}>
        <DataTable<Clarification>
          columns={[
            { key: 'q', header: 'Pertanyaan', className: 'min-w-[260px]', render: (c) => <><div className="font-medium">{c.pertanyaan}</div>{c.jawaban && <div className="text-xs text-ink-2">Jawaban: {c.jawaban}</div>}</> },
            { key: 's', header: 'Sumber', render: (c) => c.sumber },
            { key: 'p', header: 'PIC', className: 'whitespace-nowrap', render: (c) => c.pic },
            { key: 't', header: 'Tenggat', className: 'whitespace-nowrap', render: (c) => { const h = selisihHari(c.tenggat); return <span className={c.status === 'Terbuka' && h <= 2 ? 'font-semibold text-bad' : ''}>{fmtTanggal(c.tenggat)}</span> } },
            { key: 'st', header: 'Status', render: (c) => <Badge tone={c.status === 'Dijawab' ? 'green' : 'orange'}>{c.status}</Badge> },
            { key: 'a', header: 'Aksi', render: (c) => c.status === 'Terbuka' ? <Button size="sm" variant="outline" onClick={() => { setJawab(c); setTeks(''); setDrafAi(null) }}>Jawab</Button> : null },
          ]}
          rows={w.klarifikasi} rowKey={(c) => c.id} empty="Belum ada klarifikasi."
        />
      </Card>

      <Modal open={tambah} onOpenChange={setTambah} title="Catat klarifikasi" footer={<>
        <Button variant="neutral" onClick={() => setTambah(false)}>Batal</Button>
        <Button disabled={!form.pertanyaan.trim()} onClick={() => { actions.tambahKlarifikasi(tender.id, { id: `q${Date.now()}`, pertanyaan: form.pertanyaan, jawaban: '', sumber: form.sumber, pic: form.pic, tenggat: form.tenggat, status: 'Terbuka' }); setTambah(false); setForm({ ...form, pertanyaan: '' }); toast.success('Klarifikasi tercatat. PIC menerima tugas (simulasi).') }}>Simpan</Button>
      </>}>
        <div className="space-y-3">
          <Field label="Pertanyaan"><Textarea value={form.pertanyaan} onChange={(e) => setForm({ ...form, pertanyaan: e.target.value })} /></Field>
          <Field label="Sumber"><Select value={form.sumber} onChange={(e) => setForm({ ...form, sumber: e.target.value as Clarification['sumber'] })}><option>Klarifikasi Pokja</option><option>Aanwijzing</option></Select></Field>
          <Field label="PIC"><Select value={form.pic} onChange={(e) => setForm({ ...form, pic: e.target.value })}>{PIC.map((p) => <option key={p}>{p}</option>)}</Select></Field>
          <Field label="Tenggat"><Input type="date" value={form.tenggat} onChange={(e) => setForm({ ...form, tenggat: e.target.value })} /></Field>
        </div>
      </Modal>

      <Modal open={!!jawab} onOpenChange={(o) => !o && setJawab(null)} title="Jawab klarifikasi" footer={<>
        <Button variant="neutral" onClick={() => setJawab(null)}>Batal</Button>
        <Button disabled={!teks.trim()} onClick={() => { if (jawab) actions.jawabKlarifikasi(tender.id, jawab.id, teks); setJawab(null); toast.success('Jawaban tersimpan. Kirim ke Pokja dilakukan manual.') }}>Simpan jawaban</Button>
      </>}>
        {jawab && <div className="space-y-3">
          <p className="text-sm">{jawab.pertanyaan}</p>
          <Textarea aria-label="Jawaban" value={teks} onChange={(e) => setTeks(e.target.value)} />
          {aiAktif('CLR-03') && <Button size="sm" variant="outline" onClick={() => { const d = drafKlarifikasi(jawab, tender); setDrafAi(d); setTeks(d.hasil) }}>Buat draf jawaban</Button>}
          {drafAi && <AiLabel id="CLR-03" keyakinan={drafAi.keyakinan} sumber={drafAi.sumber} />}
          {drafAi && <p className="text-xs font-semibold">Draf wajib ditinjau sebelum dikirim. Pengiriman ke Pokja dilakukan manual oleh tim.</p>}
        </div>}
      </Modal>
    </div>
  )
}
