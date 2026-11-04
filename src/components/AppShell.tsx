import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Bell, BarChart3, Building2, CheckCircle2, ChevronDown, FileText, LayoutDashboard, Menu, MessageSquare, RotateCcw, Search, Settings, Trophy, UserPlus } from 'lucide-react'
import { PERSONAS } from '@/data/org'
import { DIVISI } from '@/domain/types'
import { useDemo } from '@/store/DemoProvider'
import type { FilterDivisi } from '@/store/selectors'
import { Select } from './ui'
import { cn } from './ui/cn'
import { AiBar } from './AiBar'

interface Nav { label: string; icon: LucideIcon; to?: string; perm?: string; sub?: { label: string; to: string; perm: string }[] }
const NAV: Nav[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/', perm: 'dashboard' },
  { label: 'Peluang', icon: Search, sub: [{ label: 'Tender Radar', to: '/peluang/radar', perm: 'radar' }, { label: 'Sinyal Awal RUP', to: '/peluang/rup', perm: 'rup' }] },
  { label: 'Pelanggan', icon: Building2, sub: [{ label: 'Akun Pemilik Proyek', to: '/pelanggan/akun', perm: 'akun' }, { label: 'Kontak', to: '/pelanggan/kontak', perm: 'kontak' }, { label: 'Log Interaksi', to: '/pelanggan/interaksi', perm: 'interaksi' }] },
  { label: 'Kualifikasi Go/No-Go', icon: CheckCircle2, to: '/gonogo', perm: 'gonogo' },
  { label: 'Penawaran', icon: FileText, sub: [{ label: 'Bid Workspace', to: '/penawaran/workspace', perm: 'workspace' }, { label: 'Capability Library', to: '/penawaran/capability', perm: 'capability' }, { label: 'Pricing Intelligence', to: '/penawaran/pricing', perm: 'pricing' }] },
  { label: 'Evaluasi & Negosiasi', icon: MessageSquare, sub: [{ label: 'Klarifikasi & Adendum', to: '/evaluasi/klarifikasi', perm: 'klarifikasi' }, { label: 'Negosiasi', to: '/evaluasi/negosiasi', perm: 'negosiasi' }] },
  { label: 'Hasil & Proyek', icon: Trophy, sub: [{ label: 'Hasil Tender', to: '/hasil/tender', perm: 'hasil' }, { label: 'Handover Pack', to: '/hasil/handover', perm: 'handover' }] },
  { label: 'Laporan', icon: BarChart3, to: '/laporan', perm: 'laporan' },
  { label: 'Manajemen Pengguna', icon: UserPlus, sub: [{ label: 'Akses Menu', to: '/pengguna/akses', perm: 'akses' }, { label: 'Daftar Pengguna', to: '/pengguna/daftar', perm: 'pengguna' }, { label: 'Matriks Kewenangan', to: '/pengguna/kewenangan', perm: 'kewenangan' }] },
  { label: 'Pengaturan', icon: Settings, to: '/pengaturan', perm: 'pengaturan' },
]

const itemCls = 'flex items-center gap-3 px-5 py-2.5 text-[13px] font-semibold text-ink hover:bg-canvas'

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { boleh } = useDemo()
  const { pathname } = useLocation()
  const menu = useMemo(() => NAV.map((n) => ({ ...n, sub: n.sub?.filter((s) => boleh(s.perm)) })).filter((n) => (n.sub ? n.sub.length > 0 : boleh(n.perm as string))), [boleh])
  return (
    <nav aria-label="Menu utama" className="py-3">
      {menu.map((n) => {
        const Icon = n.icon
        if (n.to) {
          return (
            <NavLink key={n.label} to={n.to} end={n.to === '/'} onClick={onNavigate} className={({ isActive }) => cn(itemCls, isActive && 'bg-primary-soft text-primary')}>
              <Icon size={18} className="text-primary" />{n.label}
            </NavLink>
          )
        }
        const aktif = n.sub?.some((s) => pathname.startsWith(s.to))
        return (
          <div key={n.label}>
            <Link to={n.sub?.[0].to ?? '/'} className={cn(itemCls, aktif && 'text-primary')}><Icon size={18} className="text-primary" />{n.label}</Link>
            {aktif && n.sub?.map((s) => (
              <NavLink key={s.to} to={s.to} onClick={onNavigate} className={({ isActive }) => cn('block py-2 pl-[50px] pr-4 text-[13px] text-ink hover:bg-canvas', isActive && 'bg-primary-soft font-semibold text-primary')}>{s.label}</NavLink>
            ))}
          </div>
        )
      })}
    </nav>
  )
}

function UserMenu() {
  const { persona, actions } = useDemo()
  const navigate = useNavigate()
  const [buka, setBuka] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setBuka(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button aria-haspopup="menu" aria-expanded={buka} onClick={() => setBuka(!buka)} className="flex items-center gap-3 rounded-lg px-2 py-1 text-left hover:bg-canvas">
        <span className="hidden sm:block">
          <span className="block text-sm font-semibold">{persona.nama}</span>
          <span className="block text-xs text-ink-2">{persona.jabatan} · {persona.unit}</span>
        </span>
        <span className="sm:hidden text-sm font-semibold">{persona.pendek}</span>
        <ChevronDown size={16} />
      </button>
      {buka && (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-72 rounded-lg border border-line bg-white py-1 shadow-lg">
          <div className="px-3 py-1.5 text-xs text-ink-2">Masuk sebagai (simulasi peran)</div>
          {PERSONAS.map((p) => (
            <button key={p.id} role="menuitem" onClick={() => { actions.setPersona(p.id); setBuka(false); navigate('/') }} className={cn('block w-full px-3 py-2 text-left text-sm hover:bg-canvas', p.id === persona.id && 'bg-primary-soft')}>
              <span className="font-semibold">{p.nama}</span>
              <span className="block text-xs text-ink-2">{p.jabatan}</span>
            </button>
          ))}
          <button role="menuitem" onClick={() => { actions.reset(); setBuka(false); navigate('/') }} className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left text-sm text-bad hover:bg-canvas"><RotateCcw size={14} /> Reset demo</button>
        </div>
      )}
    </div>
  )
}

export function AppShell() {
  const { persona, filterDivisi, actions, workspaces, gonogo } = useDemo()
  const [menuBuka, setMenuBuka] = useState(false)
  const [desktopTutup, setDesktopTutup] = useState(false)
  const notif = Object.values(gonogo).filter((g) => !g.keputusan && g.diajukanOleh).length + Object.values(workspaces).filter((w) => w.overrideDiminta).length + 9
  const { pathname } = useLocation()
  const main = useRef<HTMLDivElement>(null)
  useEffect(() => { main.current?.scrollTo(0, 0) }, [pathname])

  return (
    <div className="flex h-full flex-col">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-white px-4 lg:px-6">
        <div className="flex items-center gap-3 lg:gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-white">TQ</span>
            <span className="text-lg font-bold text-primary">TenderIQ</span>
          </Link>
          <button aria-label="Buka tutup menu" onClick={() => { setMenuBuka(!menuBuka); setDesktopTutup(!desktopTutup) }} className="rounded p-1 hover:bg-canvas"><Menu size={20} /></button>
        </div>
        <div className="flex items-center gap-2 lg:gap-5">
          <Select aria-label="Filter divisi" className="hidden h-9 w-44 md:block" value={filterDivisi} onChange={(e) => actions.setFilterDivisi(e.target.value as FilterDivisi)}>
            <option value="Semua">Semua Divisi</option>
            {DIVISI.filter((d) => persona.divisi.includes(d)).map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <span className="relative" aria-label={`${notif} notifikasi`} role="img">
            <Bell size={20} />
            <span className="absolute -right-2 -top-2 flex size-[18px] items-center justify-center rounded-full bg-bad text-[10px] font-bold text-white">{notif}</span>
          </span>
          <span className="hidden h-8 w-px bg-line sm:block" />
          <UserMenu />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className={cn('w-[248px] shrink-0 overflow-y-auto border-r border-line bg-white', desktopTutup ? 'lg:hidden' : 'lg:block', 'hidden')}>
          <Sidebar />
        </aside>
        {menuBuka && (
          <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setMenuBuka(false)}>
            <div className="absolute inset-0 bg-black/30" />
            <aside className="absolute inset-y-0 left-0 w-[248px] overflow-y-auto bg-white pt-16" onClick={(e) => e.stopPropagation()}>
              <Sidebar onNavigate={() => setMenuBuka(false)} />
            </aside>
          </div>
        )}
        <div className="relative min-w-0 flex-1">
        <div ref={main} className="h-full overflow-y-auto pb-24">
          <main className="px-4 py-5 lg:px-7"><Outlet /></main>
          <footer className="mx-4 border-t border-line py-4 text-xs text-ink-2 lg:mx-7">
            © 2026 TenderIQ · Prototipe untuk BUMN Konstruksi · Data dan keluaran AI disimulasikan. Tidak ada data yang dikirim ke luar.
          </footer>
        </div>
        <AiBar />
        </div>
      </div>
    </div>
  )
}
