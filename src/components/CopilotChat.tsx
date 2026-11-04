import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTOH_PERTANYAAN } from '@/ai/copilot'
import type { ChatPesan } from '@/ai/copilot'
import { useDemo } from '@/store/DemoProvider'
import { useTanyaAi } from './useTanyaAi'
import { LaporanDrawer } from './LaporanDrawer'
import type { ReportId } from '@/ai/reports'
import { AiLabel } from './shared'
import { Button, Input } from './ui'
import { cn } from './ui/cn'

const JEDA_BERPIKIR_MS = 700
const JEDA_KATA_MS = 28
const kataDari = (teks: string) => teks.match(/\S+\s*/g) ?? []
const tanpaAnimasi = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Chat simulasi: jawaban muncul bertahap dan selalu dihitung dari data yang boleh diakses peran aktif. */
export function CopilotChat({ className, animAwal }: { className?: string; animAwal?: string }) {
  const { persona, chat, aiAktif } = useDemo()
  const tanya = useTanyaAi()
  const [teks, setTeks] = useState('')
  const [animState, setAnim] = useState<{ id: string; kata: number; berpikir: boolean } | null>(() => (animAwal && !tanpaAnimasi() ? { id: animAwal, kata: 0, berpikir: true } : null))
  const [laporan, setLaporan] = useState<ReportId | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const aktif = chat.find((m) => m.id === animState?.id)
  // Tanpa pesan yang cocok (mis. setelah Reset demo), animasi dianggap selesai agar input tidak terkunci.
  const anim = aktif ? animState : null

  useEffect(() => {
    if (!anim || !aktif) return
    const total = kataDari(aktif.jawab.teks).length
    const timer = window.setTimeout(() => {
      if (anim.berpikir) setAnim({ ...anim, berpikir: false })
      else if (anim.kata >= total) setAnim(null)
      else setAnim({ ...anim, kata: anim.kata + 1 })
    }, anim.berpikir ? JEDA_BERPIKIR_MS : JEDA_KATA_MS)
    return () => window.clearTimeout(timer)
  }, [anim, aktif])

  // Hanya area chat yang bergulir, halaman tidak ikut bergeser.
  useEffect(() => { if (area.current) area.current.scrollTop = area.current.scrollHeight }, [chat.length, anim])

  const kirim = (q: string) => {
    if (!q.trim() || anim) return
    const id = tanya(q)
    setTeks('')
    if (!tanpaAnimasi()) setAnim({ id, kata: 0, berpikir: true })
  }

  const isi = (m: ChatPesan) => {
    if (m.id !== anim?.id) return { teks: m.jawab.teks, selesai: true }
    return { teks: kataDari(m.jawab.teks).slice(0, anim.kata).join(''), selesai: false }
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div ref={area} aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <div className="rounded-lg border border-line px-3 py-2 text-sm">
          Halo {persona.nama.split(' ')[0]}, tanyakan pipeline, objective, atau minta laporan. Jawaban mengikuti hak akses {persona.jabatan} dan filter divisi. Saya hanya membaca data, tidak mengirim apa pun ke pihak luar.
        </div>
        {chat.map((m) => {
          const v = isi(m)
          const berpikir = m.id === anim?.id && anim.berpikir
          return (
            <div key={m.id}>
              <div className="ml-8 rounded-lg bg-primary px-3 py-2 text-sm text-white">{m.tanya}</div>
              <div className="mr-4 mt-2 rounded-lg border border-line px-3 py-2 text-sm">
                {berpikir ? <p role="status" className="animate-pulse text-ink-2">AI sedang menganalisis data...</p> : <p className="whitespace-pre-line">{v.teks}</p>}
                {v.selesai && m.jawab.tautan.length > 0 && <ul className="mt-1.5 space-y-1">{m.jawab.tautan.map((l) => <li key={l.ke + l.label}><Link to={l.ke} className="font-medium text-primary hover:underline">{l.label}</Link></li>)}</ul>}
                {v.selesai && m.jawab.laporan && aiAktif('INS-03') && <Button className="mt-2" size="sm" variant="outline" onClick={() => setLaporan(m.jawab.laporan ?? null)}>Buka laporan lengkap</Button>}
                {v.selesai && m.jawab.keyakinan !== undefined && <AiLabel id="INS-02" keyakinan={m.jawab.keyakinan} sumber={m.jawab.sumber} />}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {CONTOH_PERTANYAAN.map((c) => <button key={c} disabled={!!anim} onClick={() => kirim(c)} className="rounded-full border border-line bg-white px-2.5 py-1 text-xs hover:border-primary hover:text-primary disabled:opacity-50">{c}</button>)}
      </div>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); kirim(teks) }}>
        <Input aria-label="Pertanyaan untuk AI" placeholder="Tanyakan ke AI..." value={teks} onChange={(e) => setTeks(e.target.value)} />
        <Button type="submit" disabled={!teks.trim() || !!anim}>Kirim</Button>
      </form>
      {laporan && <LaporanDrawer key={laporan} id={laporan} onClose={() => setLaporan(null)} />}
    </div>
  )
}
