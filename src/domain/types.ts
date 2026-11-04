export type Divisi = 'Infrastruktur 1' | 'Infrastruktur 2' | 'Gedung'
export const DIVISI: Divisi[] = ['Infrastruktur 1', 'Infrastruktur 2', 'Gedung']
export type Segmen = 'Pemerintah' | 'BUMN' | 'Swasta' | 'KPBU'
export const SEGMEN: Segmen[] = ['Pemerintah', 'BUMN', 'Swasta', 'KPBU']

/** Status bisnis tender, PRD §9.4 */
export type Status =
  | 'Discovered' | 'Qualifying' | 'NoGo' | 'Preparing' | 'ReadyToSubmit' | 'Submitted'
  | 'UnderEvaluation' | 'Negotiation' | 'Won' | 'Lost' | 'Cancelled' | 'Handover' | 'Executing' | 'Closed'

export interface Milestone { tahap: string; tanggal: string; kesiapan: 'Belum lengkap' | 'Perlu dicek' | 'Terjadwal' | 'Siap' }

export interface Tender {
  id: string
  kode: string
  nama: string
  divisi: Divisi
  accountId: string
  pemilik: string
  segmen: Segmen
  hps: number // miliar rupiah
  metode: string
  lokasi: string
  sbu: string
  sumber: string[]
  batasPemasukan: string
  relevance: number
  alasan: string[]
  risiko: { teks: string; sumber: string }
  lingkup: string
  jadwal: { tahap: string; tanggal: string }[]
  persyaratanKunci: string[]
  status: Status
  pic: string
  milestone?: Milestone
  tidakRelevan?: string
  alasanNoGo?: string
  hasil?: TenderResult
  sesi?: boolean // hasil dicatat selama sesi demo
  kontrakTtd?: boolean
  bastDicatat?: boolean
}

export interface TenderResult {
  tanggal: string
  hasil: 'Won' | 'Lost' | 'Cancelled'
  peringkat?: number
  alasan?: string
  kategori?: 'Kalah' | 'Gugur'
  nilaiKontrak?: number
  peserta: { nama: string; harga: number; peringkat: number; status: string }[]
  sanggah?: SanggahState
}
export interface SanggahState { tahap: 'masa-sanggah' | 'diajukan' | 'masa-banding' | 'selesai'; batas: string; catatan?: string }

export interface Account {
  id: string; nama: string; tipe: 'K/L' | 'Pemda' | 'BUMN' | 'Swasta'; wilayah: string; pic: string; tier: string; alias?: string
}
export interface Contact {
  id: string; accountId: string; nama: string; jabatan: string; unit: string; kanal: string; relasi: 'Kuat' | 'Sedang' | 'Lemah'; pengaruh: 'Tinggi' | 'Sedang' | 'Rendah'; consent: boolean
}
export interface Interaction {
  id: string; accountId: string; tanggal: string; jenis: 'Kunjungan' | 'Rapat' | 'Email'; ringkasan: string; kontak: string; oleh: string; tindakLanjut?: { teks: string; tanggal: string; selesai: boolean }
}

export interface Sbu { id: string; kode: string; nama: string; kualifikasi: string; berlaku: string; file: string }
export type Slot = 'Manajer Pelaksanaan' | 'Ahli K3' | 'Manajer Teknik'
export const SLOTS: Slot[] = ['Manajer Pelaksanaan', 'Manajer Teknik', 'Ahli K3']
export interface Person {
  id: string; nama: string; peran: Slot[]; skk: string; berlaku: string; pengalamanTahun: number; proyekSejenis: number; file: string
}
export interface Assignment { personId: string; tenderId?: string; proyek: string; sampai: string; status: 'diajukan' | 'aktif' | 'dilepas' }
export interface Alat { id: string; nama: string; kepemilikan: 'Milik' | 'Sewa'; jumlah: number; lokasi: string; berlaku: string; dokumen: string }
export interface Pengalaman { id: string; nama: string; pemilik: string; jenis: string; nilai: number; bast: string; file: string; dariTender?: boolean }

export type Kategori = 'Administrasi' | 'Kualifikasi' | 'Teknis' | 'Harga'
export type ItemStatus = 'Belum dicek' | 'Terpenuhi' | 'Kurang' | 'Perlu dicek manual' | 'Perlu review'

export type ItemRule =
  | { tipe: 'dokumen'; berlaku?: string; catatan: string }
  | { tipe: 'naratif'; catatan: string }
  | { tipe: 'personel'; slot: Slot }
  | { tipe: 'sbu'; sbuId: string }
  | { tipe: 'pengalaman'; minNilai: number; jenis: string }

export interface ChecklistItem {
  id: string
  kategori: Kategori
  teks: string
  sumber: string
  kutipan: string
  wajib: boolean
  pic: string
  dokumen?: string
  keyakinan: number
  rule: ItemRule
  status: ItemStatus
  keterangan: string
  ditinjau: boolean // item berkeyakinan rendah sudah ditinjau manusia
  perluReview: boolean // terdampak adendum
  dampakAdendum?: string
  manual?: boolean
  override?: string
}

export interface Clarification { id: string; pertanyaan: string; jawaban: string; sumber: 'Aanwijzing' | 'Klarifikasi Pokja'; pic: string; tenggat: string; status: 'Terbuka' | 'Dijawab'; lampiran?: string }
export interface AddendumChange { kategori: 'Jadwal' | 'Teknis' | 'Harga' | 'Administrasi'; lama: string; baru: string; rujukan: string; itemTerdampak: string[] }
export interface TimelineEvent { tanggal: string; judul: string; oleh?: string }

export interface Workspace {
  tenderId: string
  tahapChecklist: 'kosong' | 'draf' | 'dikonfirmasi'
  dicekPada?: string
  checklist: ChecklistItem[]
  slots: Record<Slot, string | null>
  alasanKonflik: Partial<Record<Slot, string>>
  hargaDisetujui: boolean
  penawaran: { total: number; biaya: number; approver: string }
  klarifikasi: Clarification[]
  adendum: { versi: number; perubahan: AddendumChange[] } | null
  overrideDiminta?: { itemId: string; alasan: string }
  linimasa: TimelineEvent[]
  bond: { jenis: string; penerbit: string; nilai: number; berlaku: string; status: string }[]
  dokumen: { nama: string; jenis: string; versi: string; oleh: string; rahasia?: boolean }[]
  draf: { judul: string; isi: { teks: string; sumber: string }[] } | null
  buktiUnggah?: string
}

export type Kriteria = 'strategic' | 'kapabilitas' | 'kapasitas' | 'risiko' | 'margin'
export interface Approval { peran: string; nama: string; status: 'Menunggu' | 'Disetujui' | 'Ditolak'; waktu?: string }
export interface GoNoGo {
  tenderId: string
  skor: Record<Kriteria, number>
  diajukanOleh?: string
  keputusan?: 'Go' | 'No-Go'
  alasan?: string
  catatan?: string
  approvals: Approval[]
}

export interface NegotiationRound { no: number; harga: number; konsesi: string; margin: number; status: 'Tercatat' | 'Butuh approval' | 'Disetujui' | 'Final'; alasan?: string }
export interface Negotiation { tenderId: string; batasMargin: number; biaya: number; disetujuiOleh: string; rounds: NegotiationRound[] }

export interface HandoverState {
  tenderId: string
  pm: string
  ceklis: { teks: string; selesai: boolean }[]
  merah: string[]
  sync: 'Belum' | 'Terkirim'
}

export type PeranId = 'staf' | 'koordinator' | 'estimator' | 'gm' | 'direksi' | 'pm' | 'legal' | 'admin'
export interface Persona { id: string; nama: string; pendek: string; peran: PeranId; jabatan: string; unit: string; divisi: Divisi[] }
export type Hak = 'lihat' | 'tambah' | 'ubah' | 'hapus' | 'setujui'
export type PermMatrix = Record<PeranId, Record<string, Hak[]>>
export interface AuditEntry { waktu: string; aktor: string; aksi: string; objek: string; detail?: string }
