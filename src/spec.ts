import * as path from 'path';

export type FileKind = 'pf' | 'lf' | 'dspf' | 'other';

export interface FieldDef {
  id: string;
  label: string;
  start: number; // inclusive, 0-based
  end: number;   // inclusive, 0-based
}

export const OUTLINE_PF_LF = ".....A..........T.Nome++++++RLun++TPdB......Funzioni++++++++++++++++++++++++++++";
export const OUTLINE_DSPF = ".....AAN01N02N03T.Nome++++++RLun++TPdBRigColFunzioni++++++++++++++++++++++++++++";

function findRunAfter(source: string, startIndex: number, char: string): { from: number; to: number } | undefined {
  let i = startIndex;
  while (i < source.length && source[i] === char) i++;
  if (i === startIndex) return undefined;
  return { from: startIndex, to: i - 1 };
}

function extendPlusRun(source: string, tokenStart: number, tokenLen: number): number {
  let i = tokenStart + tokenLen;
  while (i < source.length && source[i] === '+') i++;
  return i - 1; // inclusive
}

export function getFileKind(fileName: string): FileKind {
  const lower = path.basename(fileName).toLowerCase();
  if (lower.endsWith('.dspf')) return 'dspf';
  if (lower.endsWith('.pf')) return 'pf';
  if (lower.endsWith('.lf')) return 'lf';
  return 'other';
}

export function getOutlineFor(fileName: string): string {
  const kind = getFileKind(fileName);
  return kind === 'dspf' ? OUTLINE_DSPF : OUTLINE_PF_LF;
}

export function getOutlineForLangId(langId: string): string {
  const lid = (langId || '').toLowerCase();
  if (lid.endsWith('.dspf') || lid === 'dds.dspf') return OUTLINE_DSPF;
  return OUTLINE_PF_LF;
}

/**
 * Restituisce la mappatura dei campi per PF/LF o DSPF secondo la tabella fornita.
 * outline serve solo per compatibilità, la logica ora è fissa per tipo file.
 */
export function buildFieldsFromOutline(outline: string, langId?: string): FieldDef[] {
  // Determina se DSPF o PF/LF
  // Se langId non fornito, deduci da outline
  let isDSPF = false;
  if (langId) {
    const lid = langId.toLowerCase();
    isDSPF = lid.endsWith('.dspf') || lid === 'dds.dspf';
  } else {
    isDSPF = outline === OUTLINE_DSPF;
  }
  if (isDSPF) {
    // DSPF mapping (colonne 1-based, start/end inclusi)
    // Unico campo Indicatori per la form (N01+N02+N03: colonne 8-16, index 7-15)
    return [
      { id: 'A', label: 'And/Or/Commenti', start: 6, end: 6 },
      { id: 'Indicatori', label: 'Indicatori', start: 7, end: 15 },
      { id: 'T', label: 'Nome tipo', start: 16, end: 16 },
      { id: 'Nome', label: 'Nome', start: 18, end: 27 },
      { id: 'Rif', label: 'Riferimento', start: 28, end: 28 },
      { id: 'Lun', label: 'Lunghezza', start: 29, end: 33 },
      { id: 'T2', label: 'Dati tipo', start: 34, end: 34 },
      { id: 'Pd', label: 'Decimale Posizione', start: 35, end: 36 },
      { id: 'B', label: 'Uso', start: 37, end: 37 },
      { id: 'Rig', label: 'Riga', start: 38, end: 40 },
      { id: 'Col', label: 'Colonna', start: 41, end: 43 },
      { id: 'Funzioni', label: 'Funzioni', start: 44, end: 79 },
    ];
  } else {
    // PF/LF mapping
    return [
      { id: 'T', label: 'Nome tipo', start: 16, end: 16 },
      { id: 'Nome', label: 'Nome', start: 18, end: 27 },
      { id: 'Rif', label: 'Riferimento', start: 28, end: 28 },
      { id: 'Lun', label: 'Lunghezza', start: 29, end: 33 },
      { id: 'T2', label: 'Emissione Tipo', start: 34, end: 34 },
      { id: 'Pd', label: 'Decimale Posizione', start: 35, end: 36 },
      { id: 'B', label: 'Uso', start: 37, end: 37 },
      { id: 'Funzioni', label: 'Funzioni', start: 44, end: 79 },
    ];
  }
}

export function replaceSegments(line80: string, updates: Record<string, string>, fields: FieldDef[]): string {
  const arr = line80.split('');
  for (const f of fields) {
    const width = f.end - f.start + 1;
    const val = (updates[f.id] ?? '').toString();
    const padded = val.length > width ? val.substring(0, width) : val.padEnd(width, ' ');
    for (let i = 0; i < width; i++) arr[f.start + i] = padded[i];
  }
  return arr.join('');
}
