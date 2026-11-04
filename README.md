# TenderIQ POC

Prototipe CRM tender berbasis AI untuk BUMN Konstruksi, disusun dari PRD TenderIQ v0.3. Semua data adalah dummy dan semua keluaran AI disimulasikan di frontend: tanpa backend, tanpa API key, dan tidak ada data yang dikirim ke luar. Refresh halaman atau menu **Reset demo** mengembalikan data awal.

## Menjalankan

```bash
pnpm install
pnpm dev        # server pengembangan
pnpm test       # unit test aturan domain
pnpm lint
pnpm build      # hasil statis di dist/
```

## Skrip demo (±10 menit)

Tanggal aplikasi dibekukan pada 4 Nov 2026 agar status kedaluwarsa dan hitung mundur konsisten.

1. **Dashboard** (Rina): ganti filter divisi di header, lalu klik *Preservasi Jalan Nasional Ruas X–Y* di Tenggat 7 Hari ke Depan.
2. **Tender Radar**: baca ringkasan AI (skor 86, risiko hal. 34), lalu **Qualify**.
3. **Go/No-Go**: ubah skor dan lihat Estimasi Peluang Menang berubah, lalu **Go**. Nilai Rp142 M butuh persetujuan GM Divisi lalu Direktur.
4. **Bid Workspace**: **Buat checklist dari dokumen pemilihan**, tinjau item berkeyakinan rendah, **Konfirmasi checklist**, **Cek Kepatuhan** (33 Terpenuhi, 2 Kurang, 7 Perlu dicek manual).
5. Di Rekomendasi Pengganti, pilih pengganti Manajer Pelaksanaan dan Ahli K3. Coba Siti Aminah untuk melihat peringatan konflik. **Cek Ulang Kepatuhan**, lalu **Ready to Submit** aktif.
6. **Klarifikasi**: **Unggah adendum**. Batas pemasukan mundur ke 28 Nov dan item terdampak menjadi Perlu review.
7. Lanjutan opsional: tinjau item, Ready to Submit, konfirmasi unggah manual, evaluasi, negosiasi, hasil, kontrak, Handover Pack, BAST (pengalaman masuk Capability Library).

Ganti peran lewat menu nama pengguna di kanan atas. Sari (Estimator) melihat Harga dan Pricing Intelligence; Rina tidak. Yoga (Admin) mengelola Akses Menu, kill switch AI, dan Audit Log.

**AI** ada di kotak chat melayang di bawah setiap halaman. Mengirim pertanyaan atau menekan ikon perbesar membuka halaman **TenderIQ AI**, berisi chat, ringkasan objective, rekomendasi, insight, dan laporan sekali klik. Semuanya menghormati hak akses: ganti ke Sari lalu tanya "Berapa harga penawaran Dermaga Tahap II?", kemudian ulangi sebagai Rina. Riwayat chat dikosongkan setiap kali peran berganti.

## Struktur kode

| Folder | Isi |
|---|---|
| `src/domain/` | Aturan murni: state machine, kepatuhan, konflik personel, format (ada unit test) |
| `src/ai/` | Simulasi 20 fitur AI PRD §8.2. `registry.ts` memuat daftar dan fase rilisnya |
| `src/data/` | Data dummy |
| `src/store/` | State di memori dan seluruh aksi |
| `src/pages/`, `src/components/` | Layar dan komponen bersama |

## Batasan POC

- Hak akses yang ditegakkan hanya hak Lihat (menu dan halaman), dokumen harga, serta akses divisi. Hak Tambah, Ubah, Hapus, dan Setujui baru sebatas pengaturan di matriks, dan approver disimulasikan tanpa berganti akun.
- Checklist tender selain Preservasi X–Y memakai templat yang sama dengan penyesuaian jenis pekerjaan, sehingga sebagian butir teknis masih bernuansa pekerjaan jalan.
- Chat mengenali pola pertanyaan dengan aturan kata kunci, bukan LLM. Pertanyaan di luar pola dijawab "Saya tidak menemukan data". Metrik KR1, KR3, dan KR5 pada ringkasan objective adalah angka ilustrasi per divisi; NKB, win rate, dan tingkat gugur dihitung dari agregat hasil.
- Notifikasi, sinkronisasi portal, ERP/PMIS, dan pengunggahan berkas adalah simulasi.
