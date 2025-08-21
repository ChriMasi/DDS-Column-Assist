"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTLINE_DSPF = exports.OUTLINE_PF_LF = void 0;
exports.getFileKind = getFileKind;
exports.getOutlineFor = getOutlineFor;
exports.getOutlineForLangId = getOutlineForLangId;
exports.buildFieldsFromOutline = buildFieldsFromOutline;
exports.replaceSegments = replaceSegments;
const path = __importStar(require("path"));
exports.OUTLINE_PF_LF = ".....A..........T.Nome++++++RLun++TPdB......Funzioni++++++++++++++++++++++++++++";
exports.OUTLINE_DSPF = ".....AAN01N02N03T.Nome++++++RLun++TPdBRigColFunzioni++++++++++++++++++++++++++++";
function findRunAfter(source, startIndex, char) {
    let i = startIndex;
    while (i < source.length && source[i] === char)
        i++;
    if (i === startIndex)
        return undefined;
    return { from: startIndex, to: i - 1 };
}
function extendPlusRun(source, tokenStart, tokenLen) {
    let i = tokenStart + tokenLen;
    while (i < source.length && source[i] === '+')
        i++;
    return i - 1; // inclusive
}
function getFileKind(fileName) {
    const lower = path.basename(fileName).toLowerCase();
    if (lower.endsWith('.dspf'))
        return 'dspf';
    if (lower.endsWith('.pf'))
        return 'pf';
    if (lower.endsWith('.lf'))
        return 'lf';
    return 'other';
}
function getOutlineFor(fileName) {
    const kind = getFileKind(fileName);
    return kind === 'dspf' ? exports.OUTLINE_DSPF : exports.OUTLINE_PF_LF;
}
function getOutlineForLangId(langId) {
    const lid = (langId || '').toLowerCase();
    if (lid.endsWith('.dspf') || lid === 'dds.dspf')
        return exports.OUTLINE_DSPF;
    return exports.OUTLINE_PF_LF;
}
/**
 * Restituisce la mappatura dei campi per PF/LF o DSPF secondo la tabella fornita.
 * outline serve solo per compatibilità, la logica ora è fissa per tipo file.
 */
function buildFieldsFromOutline(outline, langId) {
    // Determina se DSPF o PF/LF
    // Se langId non fornito, deduci da outline
    let isDSPF = false;
    if (langId) {
        const lid = langId.toLowerCase();
        isDSPF = lid.endsWith('.dspf') || lid === 'dds.dspf';
    }
    else {
        isDSPF = outline === exports.OUTLINE_DSPF;
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
    }
    else {
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
function replaceSegments(line80, updates, fields) {
    const arr = line80.split('');
    for (const f of fields) {
        const width = f.end - f.start + 1;
        const val = (updates[f.id] ?? '').toString();
        const padded = val.length > width ? val.substring(0, width) : val.padEnd(width, ' ');
        for (let i = 0; i < width; i++)
            arr[f.start + i] = padded[i];
    }
    return arr.join('');
}
//# sourceMappingURL=spec.js.map