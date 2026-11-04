import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Maximize2, SendHorizontal, Sparkles } from 'lucide-react'
import { CONTOH_PERTANYAAN } from '@/ai/copilot'
import { useDemo } from '@/store/DemoProvider'
import { useTanyaAi } from './useTanyaAi'

/** Kotak chat melayang. Tidak mengambil ruang halaman; hasilnya terbuka di halaman TenderIQ AI. */
export function AiBar() {
  const { aiAktif } = useDemo()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const tanya = useTanyaAi()
  const [teks, setTeks] = useState('')
  const [fokus, setFokus] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const chatAktif = aiAktif('INS-02')

  if (pathname === '/ai' || (!chatAktif && !aiAktif('INS-03'))) return null

  const kirim = (q: string) => {
    if (!q.trim() || !chatAktif) return
    const id = tanya(q)
    setTeks('')
    setFokus(false)
    input.current?.blur()
    navigate('/ai', { state: { animId: id } })
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <div className="pointer-events-auto relative w-full max-w-3xl">
        {fokus && chatAktif && !teks && (
          <div className="absolute inset-x-4 bottom-full mb-2 rounded-xl border border-line bg-white p-2 shadow-lg">
            <p className="px-2 py-1 text-xs text-ink-2">Contoh pertanyaan</p>
            {CONTOH_PERTANYAAN.slice(0, 5).map((c) => (
              <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => kirim(c)} className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-primary-soft">{c}</button>
            ))}
          </div>
        )}
        <form
          aria-label="Tanya TenderIQ AI"
          onSubmit={(e) => { e.preventDefault(); kirim(teks) }}
          className="flex items-center gap-2 rounded-full border border-line bg-white p-1.5 shadow-[0_8px_24px_rgba(31,41,55,0.14)] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary sm:gap-3 sm:p-2"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary sm:size-10"><Sparkles size={18} /></span>
          <input
            ref={input}
            aria-label="Pertanyaan untuk AI"
            disabled={!chatAktif}
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            onFocus={() => setFokus(true)}
            onBlur={() => setFokus(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setFokus(false); input.current?.blur() } }}
            placeholder={chatAktif ? 'Tanyakan apa saja seputar tender...' : 'Chat AI dinonaktifkan'}
            className="ai-bar-input min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-2"
          />
          <button type="button" aria-label="Buka halaman TenderIQ AI" title="Buka halaman TenderIQ AI" onClick={() => navigate('/ai')} className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-canvas"><Maximize2 size={17} /></button>
          <button type="submit" aria-label="Kirim pertanyaan" disabled={!teks.trim() || !chatAktif} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark disabled:bg-primary/40 sm:size-10"><SendHorizontal size={17} /></button>
        </form>
      </div>
    </div>
  )
}
