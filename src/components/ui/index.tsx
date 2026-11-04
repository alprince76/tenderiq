import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from './cn'

const button = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark disabled:bg-[#E5E7EB] disabled:text-[#6B7280]',
        outline: 'border border-primary text-primary bg-white hover:bg-primary-soft disabled:border-line disabled:text-ink-2 disabled:bg-white',
        neutral: 'border border-line text-ink bg-white hover:bg-canvas disabled:text-ink-2',
        danger: 'border border-bad text-bad bg-white hover:bg-bad-soft disabled:border-line disabled:text-ink-2',
        ghost: 'text-primary hover:bg-primary-soft',
      },
      size: { md: 'h-10 px-4 text-sm', sm: 'h-8 px-3 text-xs' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, type, ...p }, ref) {
  return <button ref={ref} type={type ?? 'button'} className={cn(button({ variant, size }), className)} {...p} />
})

export type Tone = 'green' | 'red' | 'orange' | 'blue' | 'gray' | 'solid'
const TONE: Record<Tone, string> = {
  green: 'bg-good-soft text-good',
  red: 'bg-bad-soft text-bad',
  orange: 'bg-warn-soft text-warn',
  blue: 'bg-info-soft text-info',
  gray: 'bg-[#EEF0F3] text-[#4B5563]',
  solid: 'bg-primary text-white',
}
export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap', TONE[tone], className)}>{children}</span>
}

export function Card({ className, children, title, sub, action }: { className?: string; children: ReactNode; title?: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cn('rounded-xl border border-line bg-white p-5', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink">{title} {sub && <span className="text-xs font-normal text-ink-2">{sub}</span>}</h2>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export const Label = ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">{children}</label>

const inputCls = 'h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-2 focus:border-primary focus:outline-none'
export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn(inputCls, className)} {...p} /> }
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn(inputCls, 'pr-8', className)} {...p}>{children}</select> }
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn(inputCls, 'h-24 py-2', className)} {...p} /> }

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={className}><Label>{label}</Label>{children}</div>
}

export function Drawer({ open, onOpenChange, title, children, footer, width = 'max-w-xl' }: { open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: string }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content aria-describedby={undefined} className={cn('fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-xl', width)}>
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <Dialog.Title className="text-base font-bold">{title}</Dialog.Title>
            <Dialog.Close aria-label="Tutup" className="rounded p-1 text-ink-2 hover:bg-canvas"><X size={18} /></Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Modal({ open, onOpenChange, title, children, footer, width = 'max-w-lg' }: { open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: string }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content aria-describedby={undefined} className={cn('fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-5 shadow-xl', width)}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <Dialog.Title className="text-base font-bold">{title}</Dialog.Title>
            <Dialog.Close aria-label="Tutup" className="rounded p-1 text-ink-2 hover:bg-canvas"><X size={18} /></Dialog.Close>
          </div>
          {children}
          {footer && <div className="mt-4 flex flex-wrap justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Banner({ tone = 'orange', children }: { tone?: 'orange' | 'red' | 'blue' | 'green'; children: ReactNode }) {
  const c = { orange: 'bg-warn-soft', red: 'bg-bad-soft', blue: 'bg-info-soft', green: 'bg-good-soft' }[tone]
  return <div className={cn('rounded-lg px-4 py-3 text-sm text-ink', c)}>{children}</div>
}

export function Progress({ value }: { value: number }) {
  return (
    <div role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full overflow-hidden rounded-full bg-primary-soft">
      <div className="h-full rounded-full bg-primary transition-[width] duration-100" style={{ width: `${value}%` }} />
    </div>
  )
}

export function DefList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-2">{k}</dt>
          <dd className="text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
