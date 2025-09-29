import * as path from 'path';

export type FileKind = 'pf' | 'lf' | 'dspf' | 'rpg' | 'other';

export interface FieldDef {
  id: string;
  label: string;
  start: number; // inclusive, 0-based
  end: number;   // inclusive, 0-based
}

export const OUTLINE_PF_LF = ".....A..........T.Nome++++++RLun++TPdB......Funzioni++++++++++++++++++++++++++++";
export const OUTLINE_DSPF = ".....AAN01N02N03T.Nome++++++RLun++TPdBRigColFunzioni++++++++++++++++++++++++++++";
export const OUTLINE_RPG_C = ".....CL0N01Factor1+++++++Opcode&ExtFactor2+++++++Result++++++++Len++D+HiLoEq....";
export const OUTLINE_RPG_C_EXTENDED = ".....CL0N01Factor1+++++++Opcode&ExtExtended-factor2+++++++++++++++++++++++++++++";
export const OUTLINE_RPG_D = ".....DName+++++++++++ETDsFrom+++To/L+++IDc.P.chiav.+++++++++++++++++++++++++++++";
export const OUTLINE_RPG_F = ".....FFilename++IPEASFRlen+LKlen+AIDevice+.P.chiav.+++++++++++++++++++++++++++++";

const EXTENDED_OPCODE_SET = new Set(['IF', 'EVAL', 'DO', 'DOU']);

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
  if (lower.endsWith('.rpg')) return 'rpg';
  return 'other';
}

export function getOutlineFor(fileName: string): string {
  const kind = getFileKind(fileName);
  if (kind === 'dspf') return OUTLINE_DSPF;
  if (kind === 'rpg') return OUTLINE_RPG_C;
  return OUTLINE_PF_LF;
}

export function getOutlineForLangId(langId: string): string {
  const lid = (langId || '').toLowerCase();
  if (lid.endsWith('.dspf') || lid === 'dds.dspf') return OUTLINE_DSPF;
  if (lid.indexOf('rpg') !== -1 || lid.startsWith('rpg')) return OUTLINE_RPG_C;
  return OUTLINE_PF_LF;
}

/**
 * Sceglie l'outline corretto per una riga specifica: per i file RPGLE la lettera
 * in colonna 6 (index 5) decide se usare la spec C o D.
 */
export function getOutlineForLine(langId: string, lineText: string): string {
  const lid = (langId || '').toLowerCase();
  if (lid.endsWith('.dspf') || lid === 'dds.dspf') return OUTLINE_DSPF;
  if (lid.indexOf('rpg') !== -1 || lid.startsWith('rpg')) {
    if (!lineText || lineText.length < 6) return OUTLINE_RPG_C;
    const spec = lineText[5].toUpperCase();
    if (spec === 'D') return OUTLINE_RPG_D;
    if (spec === 'F') return OUTLINE_RPG_F;
    const opcode = lineText.length >= 35 ? lineText.substring(25, 35).trim().toUpperCase() : '';
    return EXTENDED_OPCODE_SET.has(opcode) ? OUTLINE_RPG_C_EXTENDED : OUTLINE_RPG_C;
  }
  return OUTLINE_PF_LF;
}

/**
 * Restituisce la mappatura dei campi per PF/LF o DSPF secondo la tabella fornita.
 * outline serve solo per compatibilità, la logica ora è fissa per tipo file.
 */
export function buildFieldsFromOutline(outline: string, langId?: string): FieldDef[] {
  // Determina il tipo tramite langId o outline
  const lid = (langId || '').toLowerCase();
  const isDSPF = lid.endsWith('.dspf') || lid === 'dds.dspf' || outline === OUTLINE_DSPF;
  const isRPG = lid.indexOf('rpg') !== -1 || lid.startsWith('rpg') || outline === OUTLINE_RPG_C || outline === OUTLINE_RPG_C_EXTENDED || outline === OUTLINE_RPG_D || outline === OUTLINE_RPG_F;
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
  }
  if (isRPG) {
    // Se l'outline è D-spec, restituisci la mappatura D, altrimenti C-spec
    if (outline === OUTLINE_RPG_D) {
      return [
        { id: 'Nome', label: 'Nome', start: 6, end: 20 },
        { id: 'E', label: 'Esterna', start: 21, end: 21 },
        { id: 'T', label: 'S/U', start: 22, end: 22 },
        { id: 'TipoDich', label: 'Tipo dichiarazione', start: 23, end: 24 },
        { id: 'Dal', label: 'Dal', start: 25, end: 31 },
        { id: 'ALun', label: 'A / Lunghezza', start: 32, end: 38 },
        { id: 'TipoDati', label: 'Tipo dati', start: 39, end: 39 },
        { id: 'DecPos', label: 'Posizioni decimali', start: 40, end: 41 },
        { id: 'ParChi', label: 'Parole chiave', start: 43, end: 79 },
      ];
    }
    if (outline === OUTLINE_RPG_F) {
      return [
        { id: 'FileName', label: 'File name', start: 6, end: 15 },
        { id: 'FileType', label: 'File type', start: 16, end: 16 },
        { id: 'FileDesignation', label: 'File designation', start: 17, end: 17 },
        { id: 'EndOfFile', label: 'End of file', start: 18, end: 18 },
        { id: 'FileAddition', label: 'File addition', start: 19, end: 19 },
        { id: 'Sequence', label: 'Sequence', start: 20, end: 20 },
        { id: 'FileFormat', label: 'File format', start: 21, end: 21 },
        { id: 'RecordLength', label: 'Record length', start: 22, end: 26 },
        { id: 'LimitsProcessing', label: 'Limits processing', start: 27, end: 27 },
        { id: 'KeyLength', label: 'Key length / record address', start: 28, end: 32 },
        { id: 'RecordAddressType', label: 'Record address type', start: 33, end: 33 },
        { id: 'FileOrganization', label: 'File organization', start: 34, end: 34 },
        { id: 'Device', label: 'Device', start: 35, end: 41 },
        { id: 'Keywords', label: 'Keywords', start: 43, end: 79 },
      ];
    }
    if (outline === OUTLINE_RPG_C_EXTENDED) {
      return [
        { id: 'L0', label: 'Livello', start: 6, end: 7 },
        { id: 'N01', label: 'Indicatore 1', start: 8, end: 10 },
        { id: 'F1', label: 'Fattore 1', start: 11, end: 24 },
        { id: 'OP', label: 'Operazione', start: 25, end: 34 },
        { id: 'F2X', label: 'Fattore 2 esteso', start: 35, end: 79 },
      ];
    }
    return [
      { id: 'L0', label: 'Livello', start: 6, end: 7 },
      { id: 'N01', label: 'Indicatore 1', start: 8, end: 10 },
      { id: 'F1', label: 'Fattore 1', start: 11, end: 24 },
      { id: 'OP', label: 'Operazione', start: 25, end: 34 },
      { id: 'F2', label: 'Fattore 2', start: 35, end: 48 },
      { id: 'RES', label: 'Risultato', start: 49, end: 62 },
      { id: 'LUN', label: 'Lunghezza', start: 63, end: 67 },
      { id: 'DEC', label: 'Dec. Pos.', start: 68, end: 69 },
      { id: 'HI', label: 'HI', start: 70, end: 71 },
      { id: 'LO', label: 'LO', start: 72, end: 73 },
      { id: 'EQ', label: 'EQ', start: 74, end: 75 },
    ];
  }
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
