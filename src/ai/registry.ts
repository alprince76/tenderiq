export type AiId =
  | 'RAD-03' | 'RAD-04' | 'RAD-05' | 'CRM-04' | 'GNG-02' | 'GNG-04' | 'BID-03' | 'BID-04' | 'BID-05' | 'BID-07' | 'BID-08'
  | 'PRC-02' | 'PRC-03' | 'CLR-02' | 'CLR-03' | 'NEG-02' | 'AWD-03' | 'AWD-04' | 'INS-02' | 'INS-03'

export type Fase = 'MVP' | 'Fase 2' | 'Fase 3'

/** 20 fitur AI PRD §8.2. Fase menentukan tag di antarmuka. */
export const FITUR_AI: Record<AiId, { nama: string; fase: Fase }> = {
  'RAD-03': { nama: 'Relevance Score', fase: 'MVP' },
  'RAD-04': { nama: 'Ringkasan Tender', fase: 'MVP' },
  'BID-03': { nama: 'Requirement Extractor', fase: 'MVP' },
  'BID-04': { nama: 'Compliance Checker', fase: 'MVP' },
  'BID-07': { nama: 'Personnel & Experience Matcher', fase: 'MVP' },
  'CLR-02': { nama: 'Addendum Diff', fase: 'MVP' },
  'RAD-05': { nama: 'Early Signal RUP', fase: 'Fase 2' },
  'GNG-02': { nama: 'Win Probability', fase: 'Fase 2' },
  'GNG-04': { nama: 'Competitor Forecast', fase: 'Fase 2' },
  'BID-05': { nama: 'Draft Assistant', fase: 'Fase 2' },
  'BID-08': { nama: 'KSO Partner Finder', fase: 'Fase 2' },
  'PRC-02': { nama: 'Price Recommendation', fase: 'Fase 2' },
  'CLR-03': { nama: 'Draf Jawaban Klarifikasi', fase: 'Fase 2' },
  'AWD-03': { nama: 'Sanggah Assistant', fase: 'Fase 2' },
  'AWD-04': { nama: 'Win/Loss Analysis', fase: 'Fase 2' },
  'INS-02': { nama: 'Tender Copilot', fase: 'Fase 2' },
  'CRM-04': { nama: 'Account Insight & Dedup', fase: 'Fase 3' },
  'PRC-03': { nama: 'Anomaly Check', fase: 'Fase 3' },
  'NEG-02': { nama: 'Negotiation Copilot', fase: 'Fase 3' },
  'INS-03': { nama: 'Weekly Brief', fase: 'Fase 3' },
}

export const AI_IDS = Object.keys(FITUR_AI) as AiId[]

export interface AiResult<T> { hasil: T; keyakinan: number; sumber: string[] }

/** Menirukan latensi layanan AI. Saat diganti API nyata, antarmuka pemanggil tidak berubah. */
export const simulasi = <T,>(hasil: AiResult<T>, ms = 900) =>
  new Promise<AiResult<T>>((resolve) => setTimeout(() => resolve(hasil), ms))
