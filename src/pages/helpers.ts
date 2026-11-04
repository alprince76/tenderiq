import type { Tender } from '@/domain/types'

/** Halaman kerja yang tepat untuk tender sesuai statusnya. */
export function ruteTender(t: Tender): string {
  switch (t.status) {
    case 'Discovered': return `/peluang/radar?tender=${t.id}`
    case 'Qualifying': case 'NoGo': return `/gonogo/${t.id}`
    case 'Preparing': case 'ReadyToSubmit': case 'Submitted': case 'UnderEvaluation': return `/penawaran/workspace/${t.id}`
    case 'Negotiation': return `/evaluasi/negosiasi?tender=${t.id}`
    case 'Won': case 'Lost': case 'Cancelled': return `/hasil/tender?tender=${t.id}`
    default: return `/hasil/handover?tender=${t.id}`
  }
}

export function unduhCsv(nama: string, baris: (string | number)[][]) {
  unduhTeks(nama, baris.map((b) => b.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv')
}

export function unduhTeks(nama: string, isi: string, tipe = 'text/plain') {
  const url = URL.createObjectURL(new Blob([isi], { type: `${tipe};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = nama
  a.click()
  URL.revokeObjectURL(url)
}
