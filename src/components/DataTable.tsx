import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from './ui/cn'
import { Select } from './ui'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T, index: number) => ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  pageSize?: number
  onRowClick?: (row: T) => void
  noun?: string
  empty?: ReactNode
  footerRow?: ReactNode
  showPageSize?: boolean
  rowClass?: (row: T) => string
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' }

export function DataTable<T>({ columns, rows, rowKey, pageSize = 0, onRowClick, noun = 'baris', empty, footerRow, showPageSize, rowClass }: Props<T>) {
  const [halaman, setHalaman] = useState(1)
  const [ukuran, setUkuran] = useState(pageSize)
  const pakaiPage = ukuran > 0
  const totalHal = pakaiPage ? Math.max(1, Math.ceil(rows.length / ukuran)) : 1
  const hal = Math.min(halaman, totalHal)
  const tampil = useMemo(() => (pakaiPage ? rows.slice((hal - 1) * ukuran, hal * ukuran) : rows), [rows, hal, ukuran, pakaiPage])
  const mulai = rows.length === 0 ? 0 : pakaiPage ? (hal - 1) * ukuran + 1 : 1
  const akhir = pakaiPage ? Math.min(hal * ukuran, rows.length) : rows.length

  return (
    <div>
      {showPageSize && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          Lihat
          <Select aria-label="Jumlah baris" className="h-8 w-20" value={ukuran} onChange={(e) => { setUkuran(Number(e.target.value)); setHalaman(1) }}>
            {[8, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
          baris
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c.key} scope="col" className={cn('whitespace-nowrap bg-primary px-3.5 py-3 text-[13px] font-semibold text-white', ALIGN[c.align ?? 'left'], i === 0 && 'rounded-tl-lg', i === columns.length - 1 && 'rounded-tr-lg', c.className)}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tampil.length === 0 && (
              <tr><td colSpan={columns.length} className="border-b border-line px-4 py-8 text-center text-ink-2">{empty ?? 'Tidak ada data.'}</td></tr>
            )}
            {tampil.map((row, i) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(i % 2 === 1 && 'bg-[#F9FAFB]', onRowClick && 'cursor-pointer hover:bg-primary-soft', rowClass?.(row))}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('h-11 border-b border-line px-3.5 py-2.5 align-middle', ALIGN[c.align ?? 'left'], c.align === 'right' && 'tabular-nums', c.className)}>{c.render(row, (hal - 1) * Math.max(ukuran, 0) + i)}</td>
                ))}
              </tr>
            ))}
          </tbody>
          {footerRow && <tfoot>{footerRow}</tfoot>}
        </table>
      </div>
      {pakaiPage && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>Menampilkan {mulai} sampai {akhir} dari {rows.length} {noun}</span>
          {totalHal > 1 && (
            <nav aria-label="Halaman" className="flex items-center gap-1.5">
              <button aria-label="Halaman sebelumnya" disabled={hal === 1} onClick={() => setHalaman(hal - 1)} className="flex size-9 items-center justify-center rounded-lg border border-line bg-white disabled:text-ink-2/50"><ChevronLeft size={15} /></button>
              {Array.from({ length: totalHal }, (_, i) => i + 1).map((n) => (
                <button key={n} aria-current={n === hal ? 'page' : undefined} onClick={() => setHalaman(n)} className={cn('flex size-9 items-center justify-center rounded-lg border text-sm', n === hal ? 'border-primary bg-primary font-semibold text-white' : 'border-line bg-white')}>{n}</button>
              ))}
              <button aria-label="Halaman berikutnya" disabled={hal === totalHal} onClick={() => setHalaman(hal + 1)} className="flex size-9 items-center justify-center rounded-lg border border-line bg-white disabled:text-ink-2/50"><ChevronRight size={15} /></button>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
