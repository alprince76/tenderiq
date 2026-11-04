import { DIVISI } from '@/domain/types'
import type { Hak, PeranId, PermMatrix, Persona } from '@/domain/types'

export const PERSONAS: Persona[] = [
  { id: 'rina', nama: 'Rina Kartika', pendek: 'Rina K.', peran: 'staf', jabatan: 'Staf Pemasaran', unit: 'Divisi Infrastruktur 1', divisi: DIVISI },
  { id: 'budi', nama: 'Budi Santoso', pendek: 'Budi S.', peran: 'koordinator', jabatan: 'Koordinator Tim Tender', unit: 'Divisi Infrastruktur 1', divisi: DIVISI },
  { id: 'sari', nama: 'Sari Pratiwi', pendek: 'Sari P.', peran: 'estimator', jabatan: 'Estimator', unit: 'Divisi Infrastruktur 2', divisi: DIVISI },
  { id: 'hendra', nama: 'Hendra Wijaya', pendek: 'Hendra W.', peran: 'gm', jabatan: 'GM Divisi', unit: 'Divisi Infrastruktur 1', divisi: DIVISI },
  { id: 'suryo', nama: 'Suryo Adiwijaya', pendek: 'Suryo A.', peran: 'direksi', jabatan: 'Direktur Operasi', unit: 'Kantor Pusat', divisi: DIVISI },
  { id: 'dewi', nama: 'Dewi Anggraini', pendek: 'Dewi A.', peran: 'pm', jabatan: 'Project Manager', unit: 'Divisi Infrastruktur 1', divisi: ['Infrastruktur 1', 'Infrastruktur 2'] },
  { id: 'lina', nama: 'Lina Marpaung', pendek: 'Lina M.', peran: 'legal', jabatan: 'Legal & Keuangan', unit: 'Kantor Pusat', divisi: DIVISI },
  { id: 'yoga', nama: 'Yoga Pratama', pendek: 'Yoga P.', peran: 'admin', jabatan: 'Admin Sistem', unit: 'Kantor Pusat', divisi: DIVISI },
]

export const PERAN_LABEL: Record<PeranId, string> = {
  staf: 'Staf Pemasaran', koordinator: 'Koordinator Tender', estimator: 'Estimator', gm: 'GM Divisi',
  direksi: 'Direksi', pm: 'Project Manager', legal: 'Legal & Keuangan', admin: 'Admin Sistem',
}
export const PERAN_URUT: PeranId[] = ['staf', 'koordinator', 'estimator', 'gm', 'direksi', 'pm', 'legal', 'admin']

/** Menu > sub-menu sesuai sidebar dan matriks Akses Menu di contoh desain. */
export const MENU_AKSES: { menu: string; sub: { id: string; nama: string }[] }[] = [
  { menu: 'Dashboard', sub: [{ id: 'dashboard', nama: 'Dashboard Pipeline' }] },
  { menu: 'Peluang', sub: [{ id: 'radar', nama: 'Tender Radar' }, { id: 'rup', nama: 'Sinyal Awal RUP' }] },
  { menu: 'Pelanggan', sub: [{ id: 'akun', nama: 'Akun Pemilik Proyek' }, { id: 'kontak', nama: 'Kontak' }, { id: 'interaksi', nama: 'Log Interaksi' }] },
  { menu: 'Kualifikasi Go/No-Go', sub: [{ id: 'gonogo', nama: 'Form Go/No-Go' }] },
  { menu: 'Penawaran', sub: [{ id: 'workspace', nama: 'Bid Workspace' }, { id: 'capability', nama: 'Capability Library' }, { id: 'pricing', nama: 'Pricing Intelligence' }, { id: 'harga', nama: 'Dokumen Harga (rahasia)' }] },
  { menu: 'Evaluasi & Negosiasi', sub: [{ id: 'klarifikasi', nama: 'Klarifikasi & Adendum' }, { id: 'negosiasi', nama: 'Negosiasi' }] },
  { menu: 'Hasil & Proyek', sub: [{ id: 'hasil', nama: 'Hasil Tender' }, { id: 'handover', nama: 'Handover Pack' }] },
  { menu: 'Laporan', sub: [{ id: 'laporan', nama: 'Laporan Win/Loss' }] },
  { menu: 'Manajemen Pengguna', sub: [{ id: 'akses', nama: 'Akses Menu' }, { id: 'pengguna', nama: 'Daftar Pengguna' }, { id: 'kewenangan', nama: 'Matriks Kewenangan' }] },
  { menu: 'Pengaturan', sub: [{ id: 'pengaturan', nama: 'Pengaturan & Audit Log' }] },
]

const SEMUA = MENU_AKSES.flatMap((m) => m.sub.map((s) => s.id))
const L: Hak[] = ['lihat']
const LTU: Hak[] = ['lihat', 'tambah', 'ubah']
const LTUH: Hak[] = ['lihat', 'tambah', 'ubah', 'hapus']
const ADMIN_ONLY = new Set(['akses', 'pengguna', 'kewenangan', 'pengaturan'])

function matriks(tulis: string[], tanpa: string[], setujui: string[] = [], penuh: string[] = []): Record<string, Hak[]> {
  const out: Record<string, Hak[]> = {}
  for (const id of SEMUA) {
    if (tanpa.includes(id) || ADMIN_ONLY.has(id)) { out[id] = []; continue }
    let hak: Hak[] = penuh.includes(id) ? LTUH : tulis.includes(id) ? LTU : L
    if (setujui.includes(id)) hak = [...hak, 'setujui']
    out[id] = hak
  }
  return out
}

export const buatPerm = (): PermMatrix => ({
  staf: matriks(['radar', 'rup', 'akun', 'kontak', 'interaksi', 'gonogo'], ['harga', 'pricing']),
  koordinator: matriks(['gonogo', 'workspace', 'capability', 'klarifikasi', 'hasil'], [], []),
  // Baris estimator sama dengan contoh desain Akses Menu
  estimator: matriks(['gonogo', 'workspace', 'klarifikasi', 'negosiasi'], [], [], ['pricing', 'harga']),
  gm: matriks([], [], ['gonogo', 'workspace', 'negosiasi', 'harga']),
  direksi: matriks([], [], ['gonogo', 'negosiasi', 'harga']),
  pm: matriks(['handover'], ['harga', 'pricing', 'negosiasi']),
  legal: matriks(['hasil'], ['pricing']),
  admin: { ...matriks([], ['harga', 'pricing']), akses: LTU, pengguna: LTUH, kewenangan: LTU, pengaturan: LTU },
})

export const MATRIKS_KEWENANGAN = [
  { keputusan: 'Go/No-Go', batas: 'HPS ≤ Rp100 M', rantai: 'GM Divisi' },
  { keputusan: 'Go/No-Go', batas: 'HPS > Rp100 M', rantai: 'GM Divisi, lalu Direktur Operasi' },
  { keputusan: 'Override item Kurang', batas: 'Semua nilai', rantai: 'GM Divisi' },
  { keputusan: 'Harga penawaran', batas: 'Margin ≥ batas walk-away', rantai: 'GM Divisi' },
  { keputusan: 'Konsesi negosiasi', batas: 'Margin < batas walk-away', rantai: 'GM Divisi (approval ponsel)' },
]
