import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { FITUR_AI } from '@/ai/registry'
import type { AiId } from '@/ai/registry'
import { fmtKeyakinan, statusBerlaku } from '@/domain/format'
import { STATUS_LABEL } from '@/domain/transitions'
import type { ItemStatus, Status } from '@/domain/types'
import { useDemo } from '@/store/DemoProvider'
import { Badge, Banner } from './ui'
import type { Tone } from './ui'

export function PageHeader({ crumbs, title, sub, actions }: { crumbs: string[]; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 border-b border-line pb-3 text-sm">
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={12} className="text-ink-2" />}
            <span className={i === crumbs.length - 1 ? 'font-semibold text-primary' : 'text-ink-2'}>{c}</span>
          </span>
        ))}
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          {sub && <div className="mt-1 text-sm text-ink-2">{sub}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/** Penanda keluaran AI: keyakinan, sumber, dan fase rilis di PRD. */
export function AiLabel({ id, keyakinan, sumber, label }: { id: AiId; keyakinan?: number; sumber?: string[]; label?: string }) {
  const f = FITUR_AI[id]
  return (
    <div className="mt-2 text-xs text-ink-2">
      <span>{label ?? 'Dihasilkan AI'}{keyakinan !== undefined && ` · tingkat keyakinan ${fmtKeyakinan(keyakinan)}`}</span>
      <span> · {f.nama} ({id}, {f.fase})</span>
      {sumber && sumber.length > 0 && <div>Sumber: {sumber.join('; ')}</div>}
    </div>
  )
}

/** Kill switch: saat fitur dimatikan, alur kembali ke mode manual (PRD §9.3). */
export function AiGate({ id, children, manual }: { id: AiId; children: ReactNode; manual?: ReactNode }) {
  const { aiAktif } = useDemo()
  if (aiAktif(id)) return <>{children}</>
  return <Banner tone="blue"><strong>{FITUR_AI[id].nama} dinonaktifkan.</strong> {manual ?? 'Alur tetap bisa dijalankan manual.'}</Banner>
}

const STATUS_TONE: Record<Status, Tone> = {
  Discovered: 'gray', Qualifying: 'blue', NoGo: 'gray', Preparing: 'blue', ReadyToSubmit: 'green', Submitted: 'blue',
  UnderEvaluation: 'orange', Negotiation: 'orange', Won: 'green', Lost: 'red', Cancelled: 'gray', Handover: 'blue', Executing: 'blue', Closed: 'green',
}
export const StatusBadge = ({ status }: { status: Status }) => <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>

const ITEM_TONE: Record<ItemStatus, Tone> = { 'Belum dicek': 'gray', Terpenuhi: 'green', Kurang: 'red', 'Perlu dicek manual': 'orange', 'Perlu review': 'blue' }
export const ItemBadge = ({ status }: { status: ItemStatus }) => <Badge tone={ITEM_TONE[status]}>{status}</Badge>

export function BerlakuBadge({ iso }: { iso: string }) {
  const s = statusBerlaku(iso)
  return <Badge tone={s === 'Berlaku' ? 'green' : s === 'Akan berakhir' ? 'orange' : 'red'}>{s}</Badge>
}

export function KpiCard({ label, value, sub, icon: Icon, action, to }: { label: string; value: ReactNode; sub?: ReactNode; icon?: LucideIcon; action?: ReactNode; to?: string }) {
  const isi = (
    <>
      {Icon && <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"><Icon size={20} /></span>}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-ink-2">{label}</div>
        <div className="text-2xl font-bold tabular-nums text-ink">{value}</div>
        {sub && <div className="text-xs text-ink-2">{sub}</div>}
      </div>
      {action}
    </>
  )
  const cls = 'flex items-center gap-4 rounded-xl border border-line bg-white p-5'
  return to ? <Link to={to} className={`${cls} hover:border-primary`}>{isi}</Link> : <div className={cls}>{isi}</div>
}

export const StatTile = ({ label, value, tone }: { label: string; value: ReactNode; tone?: 'good' | 'bad' | 'warn' | 'info' }) => {
  const c = tone ? { good: 'text-good', bad: 'text-bad', warn: 'text-warn', info: 'text-info' }[tone] : 'text-ink'
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="text-sm text-ink-2">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${c}`}>{value}</div>
    </div>
  )
}

export function Spinner({ teks }: { teks: string }) {
  return <p role="status" className="py-3 text-sm text-ink-2">{teks}</p>
}
