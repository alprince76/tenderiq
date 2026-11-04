import { useCallback } from 'react'
import { jawabCopilot } from '@/ai/copilot'
import { useDemo } from '@/store/DemoProvider'
import { divisiTerpilih } from '@/store/selectors'

/** Mengirim pertanyaan ke AI dan menyimpannya di riwayat chat. Mengembalikan id pesan. */
export function useTanyaAi() {
  const { persona, boleh, tenders, workspaces, people, gonogo, filterDivisi, actions } = useDemo()
  return useCallback((q: string) => {
    const jawab = jawabCopilot(q, { persona, bolehHarga: boleh('harga'), tenders, workspaces, people, gonogo, divisi: divisiTerpilih(filterDivisi, persona.divisi), semuaDivisi: filterDivisi === 'Semua' })
    const id = `m${Date.now()}`
    actions.tambahChat({ id, tanya: q, jawab })
    return id
  }, [persona, boleh, tenders, workspaces, people, gonogo, filterDivisi, actions])
}
