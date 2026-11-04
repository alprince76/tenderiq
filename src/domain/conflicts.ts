import type { Assignment, Person, Slot } from './types'
import { HARI_INI } from './format'

/** Penugasan lain yang masih berjalan untuk personel ini, di luar tender yang sedang disusun. */
export function cariKonflik(personId: string, tenderId: string, assignments: Assignment[], hariIni = HARI_INI): Assignment | undefined {
  return assignments.find(
    (a) => a.personId === personId && a.tenderId !== tenderId && a.status !== 'dilepas' && a.sampai >= hariIni,
  )
}

export const pesanKonflik = (nama: string, a: Assignment, fmt: (iso: string) => string) =>
  a.status === 'aktif'
    ? `${nama} sedang bertugas di ${a.proyek} sampai ${fmt(a.sampai)}`
    : `${nama} sedang diajukan di ${a.proyek} sampai ${fmt(a.sampai)}`

export interface Kandidat { person: Person; skor: number; alasan: string; konflik?: Assignment }

/**
 * Rekomendasi personel (BID-07): filter aturan SKK berlaku sampai batas pemasukan,
 * lalu peringkat. Personel berkonflik tetap tampil tetapi turun peringkat.
 */
export function rekomendasiPersonel(slot: Slot, tenderId: string, batas: string, people: Person[], assignments: Assignment[], kecuali?: string | null): Kandidat[] {
  return people
    .filter((p) => p.peran.includes(slot) && p.berlaku >= batas && p.id !== kecuali)
    .map((person) => {
      const konflik = cariKonflik(person.id, tenderId, assignments)
      const skor = person.pengalamanTahun * 2 + person.proyekSejenis * 5 - (konflik ? 100 : 0)
      const alasan = `${person.skk}; ${person.pengalamanTahun} tahun pengalaman; ${person.proyekSejenis} proyek sejenis`
      return { person, skor, alasan, konflik }
    })
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 3)
}
