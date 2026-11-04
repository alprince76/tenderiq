import type { ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/AppShell'
import { Banner } from '@/components/ui'
import { DemoProvider, useDemo } from '@/store/DemoProvider'
import Dashboard from '@/pages/Dashboard'
import Radar from '@/pages/Radar'
import Rup from '@/pages/Rup'
import { AkunDetail, AkunList, Kontak, LogInteraksi } from '@/pages/Pelanggan'
import { GoNoGoForm, GoNoGoList } from '@/pages/GoNoGo'
import Workspace, { WorkspaceList } from '@/pages/workspace/Workspace'
import Capability from '@/pages/Capability'
import Pricing from '@/pages/Pricing'
import { KlarifikasiPage, NegosiasiPage } from '@/pages/Evaluasi'
import { HandoverPage, HasilPage } from '@/pages/Hasil'
import Laporan from '@/pages/Laporan'
import AiPage from '@/pages/AiPage'
import { AksesMenu, DaftarPengguna, MatriksKewenangan, Pengaturan } from '@/pages/Admin'

function Guard({ perm, children }: { perm: string; children: ReactNode }) {
  const { boleh, persona } = useDemo()
  if (!boleh(perm)) return <Banner tone="red">Peran {persona.jabatan} tidak memiliki akses ke halaman ini.</Banner>
  return <>{children}</>
}

export default function App() {
  const g = (perm: string, el: ReactNode) => <Guard perm={perm}>{el}</Guard>
  return (
    <DemoProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={g('dashboard', <Dashboard />)} />
            <Route path="ai" element={<AiPage />} />
            <Route path="peluang/radar" element={g('radar', <Radar />)} />
            <Route path="peluang/rup" element={g('rup', <Rup />)} />
            <Route path="pelanggan/akun" element={g('akun', <AkunList />)} />
            <Route path="pelanggan/akun/:id" element={g('akun', <AkunDetail />)} />
            <Route path="pelanggan/kontak" element={g('kontak', <Kontak />)} />
            <Route path="pelanggan/interaksi" element={g('interaksi', <LogInteraksi />)} />
            <Route path="gonogo" element={g('gonogo', <GoNoGoList />)} />
            <Route path="gonogo/:id" element={g('gonogo', <GoNoGoForm />)} />
            <Route path="penawaran/workspace" element={g('workspace', <WorkspaceList />)} />
            <Route path="penawaran/workspace/:id" element={g('workspace', <Workspace />)} />
            <Route path="penawaran/capability" element={g('capability', <Capability />)} />
            <Route path="penawaran/pricing" element={g('pricing', <Pricing />)} />
            <Route path="evaluasi/klarifikasi" element={g('klarifikasi', <KlarifikasiPage />)} />
            <Route path="evaluasi/negosiasi" element={g('negosiasi', <NegosiasiPage />)} />
            <Route path="hasil/tender" element={g('hasil', <HasilPage />)} />
            <Route path="hasil/handover" element={g('handover', <HandoverPage />)} />
            <Route path="laporan" element={g('laporan', <Laporan />)} />
            <Route path="pengguna/akses" element={g('akses', <AksesMenu />)} />
            <Route path="pengguna/daftar" element={g('pengguna', <DaftarPengguna />)} />
            <Route path="pengguna/kewenangan" element={g('kewenangan', <MatriksKewenangan />)} />
            <Route path="pengaturan" element={g('pengaturan', <Pengaturan />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster position="top-center" richColors closeButton />
    </DemoProvider>
  )
}
