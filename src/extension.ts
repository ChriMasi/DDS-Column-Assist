


async function moveToField(direction: 'next' | 'prev') {
  const ctx = getActiveDDSContext();
  if (!ctx) return;
  const { editor, doc, lineNum } = ctx;
  // Prendi la riga corrente, pad a 80 sempre (anche se vuota)
  let lineText = doc.lineAt(lineNum).text.padEnd(80);
  const isASpec = (t: string) => {
    if (t.length < 6) return false;
    const spec = t[5].toUpperCase();
    return (spec === 'A' || spec === 'C' || spec === 'D') && t[6] !== '*';
  };
  const isComment = (t: string) => {
    if (t.length < 7) return false;
    const spec = t[5].toUpperCase();
    return (spec === 'A' || spec === 'C' || spec === 'D') && t[6] === '*';
  };

  // Se PageUp e la riga corrente è commento: vai alla riga precedente come "campo singolo"
  if (direction === 'prev' && isComment(lineText)) {
    const prevLine = lineNum - 1;
    if (prevLine >= 0) {
      const prevRaw = doc.lineAt(prevLine).text;
      const prevTxt = prevRaw.padEnd(80);
      if (isComment(prevTxt)) {
        // Vai all'inizio del commento precedente
        editor.selection = new Selection(prevLine, 0, prevLine, 0);
        editor.revealRange(new Range(prevLine, 0, prevLine, 0));
        updateRuler();
        return;
      }
      if (isASpec(prevTxt)) {
        const outline2 = getOutlineForLine(doc.languageId, prevTxt);
        const fields2 = buildFieldsFromOutline(outline2, doc.languageId);
        const lastField = fields2[fields2.length - 1];
        // Assicura lunghezza sufficiente
        if (prevRaw.length <= lastField.start) {
          const padded = prevRaw.padEnd(Math.max(80, lastField.start + 1));
          await editor.edit((b) => b.replace(new Range(prevLine, 0, prevLine, prevRaw.length), padded));
        }
        editor.selection = new Selection(prevLine, lastField.start, prevLine, lastField.start);
        editor.revealRange(new Range(prevLine, lastField.start, prevLine, lastField.start));
        updateRuler();
        return;
      }
      // Riga precedente esiste ma è vuota/non-A: posiziona in colonna 6
      if (prevRaw.length < 6) {
        const padded = ''.padEnd(80);
        await editor.edit((b) => b.replace(new Range(prevLine, 0, prevLine, prevRaw.length), padded));
      }
      editor.selection = new Selection(prevLine, 5, prevLine, 5);
      editor.revealRange(new Range(prevLine, 5, prevLine, 5));
      updateRuler();
      return;
    }
    return;
  }
  // Se PageUp e la riga è vuota o non ha A in colonna 6 (non commento):
  if (direction === 'prev' && (lineText.length < 6 || !['A','C','D'].includes(lineText[5].toUpperCase()))) {
    const prevLineIdx = lineNum - 1;
    if (prevLineIdx >= 0) {
      const prevRaw = doc.lineAt(prevLineIdx).text;
      const prevTxt = prevRaw.padEnd(80);
      if (!isASpec(prevTxt) && !isComment(prevTxt)) {
        // Riga sopra è anch'essa vuota/non-A: posiziona in colonna 6 (pad se serve)
        if (prevRaw.length < 6) {
          const padded = ''.padEnd(80);
          await editor.edit((b) => b.replace(new Range(prevLineIdx, 0, prevLineIdx, prevRaw.length), padded));
        }
        editor.selection = new Selection(prevLineIdx, 5, prevLineIdx, 5);
        editor.revealRange(new Range(prevLineIdx, 5, prevLineIdx, 5));
        updateRuler();
        return;
      }
    }
    // Altrimenti, cerca la riga A precedente come prima
    const prev = (() => {
      let l = lineNum - 1;
        while (l >= 0) {
        const txt = doc.lineAt(l).text.padEnd(80);
        if (txt.length >= 6 && ['A','C','D'].includes(txt[5].toUpperCase()) && txt[6] !== '*') {
          const outline2 = getOutlineForLine(doc.languageId, txt);
          const fields2 = buildFieldsFromOutline(outline2, doc.languageId);
          return { line: l, fields: fields2 };
        }
        l--;
      }
      return undefined;
    })();
    if (prev) {
      const lastField = prev.fields[prev.fields.length - 1];
      editor.selection = new Selection(prev.line, lastField.start, prev.line, lastField.start);
      editor.revealRange(new Range(prev.line, lastField.start, prev.line, lastField.start));
      updateRuler();
    }
    return;
  }
  // Gestione spostamento in avanti da riga non-A o commento
  if (direction === 'next' && !isASpec(lineText)) {
    const nextLine = lineNum + 1;
  if (nextLine < doc.lineCount) {
      const nextRaw = doc.lineAt(nextLine).text;
      const nextTxt = nextRaw.padEnd(80);
      if (isComment(nextTxt)) {
        // Vai all'inizio del commento
        editor.selection = new Selection(nextLine, 0, nextLine, 0);
        editor.revealRange(new Range(nextLine, 0, nextLine, 0));
        updateRuler();
        return;
      }
      if (!isASpec(nextTxt)) {
        // Riga esistente ma vuota/non-A: posiziona in colonna 6, padding se necessario
        if (nextRaw.length < 6) {
          const padded = ''.padEnd(80);
          await editor.edit((b) => b.replace(new Range(nextLine, 0, nextLine, nextRaw.length), padded));
        }
        editor.selection = new Selection(nextLine, 5, nextLine, 5);
        editor.revealRange(new Range(nextLine, 5, nextLine, 5));
        updateRuler();
        return;
      }
      // Prossima riga è A-spec valida: vai al primo campo
  const outline2 = getOutlineForLine(doc.languageId, nextTxt);
  const fields2 = buildFieldsFromOutline(outline2, doc.languageId);
      const f0 = fields2[0];
      // Assicura lunghezza sufficiente
      const currLen = nextRaw.length;
      if (currLen <= f0.start) {
        const padded = nextRaw.padEnd(Math.max(80, f0.start + 1));
        await editor.edit((b) => b.replace(new Range(nextLine, 0, nextLine, currLen), padded));
      }
      editor.selection = new Selection(nextLine, f0.start, nextLine, f0.start);
      editor.revealRange(new Range(nextLine, f0.start, nextLine, f0.start));
      updateRuler();
      return;
    } else {
      // Non esiste riga successiva: crea nuova riga e posiziona in colonna 6
      const insertLine = doc.lineCount;
      await editor.edit((b) => b.insert(new Position(insertLine, 0), '\n'));
      await editor.edit((b) => b.replace(new Range(insertLine, 0, insertLine, 0), ''.padEnd(80)));
      editor.selection = new Selection(insertLine, 5, insertLine, 5);
      editor.revealRange(new Range(insertLine, 5, insertLine, 5));
      updateRuler();
      return;
    }
  }

  // Consenti il salto solo se la riga corrente è una spec valida (A, C o D)
  if (!isASpec(lineText)) return;
  const outline = getOutlineForLine(doc.languageId, lineText);
  const fields = buildFieldsFromOutline(outline, doc.languageId);
  const posIdx = editor.selection.start.character;
  // Trova il campo attuale o il primo campo dopo il cursore
  let currentIdx = fields.findIndex(f => posIdx >= f.start && posIdx <= f.end);
  if (currentIdx === -1) {
    // Se il cursore è prima di tutti i campi, vai al primo
    currentIdx = fields.findIndex(f => posIdx < f.start);
    if (currentIdx === -1) currentIdx = 0;
  }
  let targetIdx = -1;
  let targetLine = lineNum;
  let targetFields = fields;
  // Funzione per trovare la prossima riga valida (A-spec, non commento)
  function findNextValidLine(startLine: number, step: number): { line: number, fields: typeof fields, docLine: string } | undefined {
    let l = startLine;
    while (l >= 0 && l < doc.lineCount) {
      const txt = doc.lineAt(l).text.padEnd(80);
      if (txt.length >= 6 && ['A','C','D'].includes(txt[5].toUpperCase()) && txt[6] !== '*') {
        const outline2 = getOutlineForLine(doc.languageId, txt);
        const fields2 = buildFieldsFromOutline(outline2, doc.languageId);
        return { line: l, fields: fields2, docLine: txt };
      }
      l += step;
    }
    return undefined;
  }
  if (direction === 'next') {
    if (currentIdx < fields.length - 1) {
      targetIdx = currentIdx + 1;
    } else {
      // Se sono all'ultimo campo, gestisci la riga successiva in modo speciale:
      const nl = lineNum + 1;
      if (nl < doc.lineCount) {
        const nextRaw = doc.lineAt(nl).text;
        const nextTxt = nextRaw.padEnd(80);
        if (isComment(nextTxt)) {
          // Vai all'inizio del commento
          editor.selection = new Selection(nl, 0, nl, 0);
          editor.revealRange(new Range(nl, 0, nl, 0));
          updateRuler();
          return;
        }
        if (!isASpec(nextTxt)) {
          // Riga esistente ma vuota/non-A: posiziona in colonna 6
          if (nextRaw.length < 6) {
            const padded = ''.padEnd(80);
            await editor.edit((b) => b.replace(new Range(nl, 0, nl, nextRaw.length), padded));
          }
          editor.selection = new Selection(nl, 5, nl, 5);
          editor.revealRange(new Range(nl, 5, nl, 5));
          updateRuler();
          return;
        }
        // Prossima riga è A-spec valida: vai al primo campo
        targetLine = nl;
        targetFields = fields;
        targetIdx = 0;
      } else {
        // Non c'è una riga successiva: crea nuova riga e posiziona in colonna 6
        const insertLine = doc.lineCount;
        await editor.edit((b) => b.insert(new Position(insertLine, 0), '\n'));
        await editor.edit((b) => b.replace(new Range(insertLine, 0, insertLine, 0), ''.padEnd(80)));
        editor.selection = new Selection(insertLine, 5, insertLine, 5);
        editor.revealRange(new Range(insertLine, 5, insertLine, 5));
        updateRuler();
        return;
      }
    }
  } else {
    // Se sono sul primo campo (anche su riga vuota o nuova), consenti salto all'ultimo campo della riga precedente
    if (currentIdx <= 0) {
      // Se la riga precedente immediata è un commento, vai all'inizio del commento
      const prevLineIdx = lineNum - 1;
      if (prevLineIdx >= 0) {
        const prevRaw = doc.lineAt(prevLineIdx).text;
        const prevTxt = prevRaw.padEnd(80);
        if (isComment(prevTxt)) {
          editor.selection = new Selection(prevLineIdx, 0, prevLineIdx, 0);
          editor.revealRange(new Range(prevLineIdx, 0, prevLineIdx, 0));
          updateRuler();
          return;
        }
      }
      // Cerca la riga precedente valida
      const prev = findNextValidLine(lineNum - 1, -1);
      if (prev) {
        targetLine = prev.line;
        targetFields = prev.fields;
        targetIdx = targetFields.length - 1;
      } else {
        // resta sul primo campo
        targetIdx = currentIdx;
      }
    } else {
      targetIdx = currentIdx - 1;
    }
  }
  if (targetFields[targetIdx]) {
    const f = targetFields[targetIdx];
    // Ensure line is long enough to place the cursor at field start
    const currLen = doc.lineAt(targetLine).text.length;
    if (currLen <= f.start) {
      const orig = doc.lineAt(targetLine).text;
      const padded = orig.padEnd(Math.max(80, f.start + 1));
      await editor.edit((b) => b.replace(new Range(targetLine, 0, targetLine, orig.length), padded));
    }
    editor.selection = new Selection(targetLine, f.start, targetLine, f.start);
    editor.revealRange(new Range(targetLine, f.start, targetLine, f.start));
    updateRuler();
  }
}
import { commands, ExtensionContext, Range, TextEditorDecorationType, ThemeColor, window, WebviewPanel, ViewColumn, Selection, DecorationOptions, Position, workspace, ConfigurationTarget, extensions } from 'vscode';
import { buildFieldsFromOutline, getOutlineFor, getOutlineForLangId, getOutlineForLine, replaceSegments } from './spec';

let rulerDecoration: TextEditorDecorationType | undefined;
let currentFieldDeco: TextEditorDecorationType | undefined;
let otherFieldsDeco: TextEditorDecorationType | undefined;
let currentLine = -1;
let extensionContext: ExtensionContext | undefined;

function getSpecIdForLine(doc: import('vscode').TextDocument, lineText: string) {
  const lid = (doc.languageId || '').toLowerCase();
  if (lid.endsWith('.dspf') || doc.languageId === 'dds.dspf') return 'dspf';
  if (lid.endsWith('.pf') || doc.languageId === 'dds.pf') return 'pf';
  if (lid.endsWith('.lf') || doc.languageId === 'dds.lf') return 'lf';
  if (lid.indexOf('rpg') !== -1 || lid.startsWith('rpg')) {
    if (!lineText || lineText.length < 6) return 'rpgleC';
    const spec = lineText[5].toUpperCase();
    return spec === 'D' ? 'rpgleD' : 'rpgleC';
  }
  return 'other';
}

function getEffectiveSetting(doc: import('vscode').TextDocument, specId: string, feature: 'guideline' | 'highlight'): boolean {
  const cfgKey = `ddsColumnAssist.${feature}.${specId}`;
  return workspace.getConfiguration().get<boolean>(cfgKey, true);
}

async function toggleFeature(feature: 'guideline' | 'highlight') {
  const ctx = getActiveDDSContext();
  if (!ctx) { window.showInformationMessage(`No active DDS/RPG line to toggle ${feature}.`); return; }
  const { doc, lineText } = ctx;
  const specId = getSpecIdForLine(doc, lineText);
  const cfgKey = `ddsColumnAssist.${feature}.${specId}`;
  const curr = getEffectiveSetting(doc, specId, feature);
  const next = !curr;
  // Update global user settings
  await workspace.getConfiguration().update(cfgKey, next, ConfigurationTarget.Global);
  updateRuler();
  window.showInformationMessage(`${feature === 'guideline' ? 'Guideline' : 'Highlight'} for ${specId} (global) is now ${next ? 'enabled' : 'disabled'}.`);
}

const SUPPORTED_LANGIDS = ['dds.dspf', 'dds.lf', 'dds.pf', 'rpg', 'rpgle', 'sqlrpgle'];
function getActiveDDSContext() {
  const editor = window.activeTextEditor;
  if (!editor) return;
  const doc = editor.document;
  const lid = (doc.languageId || '').toLowerCase();
  if (!SUPPORTED_LANGIDS.includes(doc.languageId) && lid.indexOf('rpg') === -1 && lid.indexOf('rpgle') === -1) return;
  const lineNum = editor.selection.start.line;
  const lineText = doc.getText(new Range(lineNum, 0, lineNum, 200)).padEnd(80);
  return { editor, doc, lineNum, lineText };
}

function ensureDecoration() {
  if (!rulerDecoration) {
    rulerDecoration = window.createTextEditorDecorationType({
      backgroundColor: new ThemeColor('editor.background'),
      isWholeLine: true,
      opacity: '0',
    });
  }
  return rulerDecoration!;
}

function ensureFieldDecorations() {
  if (!currentFieldDeco) {
    currentFieldDeco = window.createTextEditorDecorationType({
      backgroundColor: 'rgba(242, 242, 109, 0.3)',
      border: '1px solid grey',
    });
  }
  if (!otherFieldsDeco) {
    otherFieldsDeco = window.createTextEditorDecorationType({
      backgroundColor: 'rgba(242, 242, 109, 0.1)',
      border: '1px solid grey',
    });
  }
}

function updateRuler() {
  const ctx = getActiveDDSContext();
  if (!ctx) return clearRuler();
  const { editor, doc, lineNum, lineText } = ctx;

  // Only for 'A', 'C' or 'D' spec line and not comment (col 7 == '*')
  if (lineText.length < 6) return clearRuler();
  const specChar = lineText[5].toUpperCase();
  if (!['A','C','D'].includes(specChar) || lineText[6] === '*') return clearRuler();

  const outline = getOutlineForLine(doc.languageId, lineText);
  const deco = ensureDecoration();
  ensureFieldDecorations();
  // Guideline toggle: check per-file/spec and global config
  const specId = getSpecIdForLine(doc, lineText);
  const showGuideline = getEffectiveSetting(doc, specId, 'guideline');
  const targetLine = lineNum > 0 ? lineNum - 1 : lineNum;
  if (showGuideline) {
    const deco = ensureDecoration();
    editor.setDecorations(deco, [
      {
        range: new Range(targetLine, 0, targetLine, 80),
        renderOptions: {
          before: {
            contentText: outline,
            color: new ThemeColor('editorLineNumber.foreground'),
            textDecoration: 'none',
          }
        }
      }
    ]);
  } else {
    const dec = ensureDecoration();
    editor.setDecorations(dec, []);
  }

  // Highlight fields on the current line
  const fields = buildFieldsFromOutline(outline, doc.languageId);
  const posIdx = editor.selection.start.character;
  let activeIndex = -1;
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (posIdx >= f.start && posIdx <= f.end) { activeIndex = i; break; }
  }

  // Highlight toggle: per-file/spec and global
  const showHighlight = getEffectiveSetting(doc, specId, 'highlight');
  const otherDecos: DecorationOptions[] = [];
  let currentOpt: DecorationOptions | undefined;
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const range = new Range(lineNum, f.start, lineNum, f.end + 1);
    const opt: DecorationOptions = { range, hoverMessage: fields[i].label };
    if (i === activeIndex) {
      currentOpt = opt;
    } else {
      otherDecos.push(opt);
    }
  }
  if (showHighlight) {
    if (currentOpt) editor.setDecorations(currentFieldDeco!, [currentOpt]);
    else editor.setDecorations(currentFieldDeco!, []);
    editor.setDecorations(otherFieldsDeco!, otherDecos);
  } else {
    // Clear any previous decorations so highlight doesn't stick on a line
    if (currentFieldDeco) editor.setDecorations(currentFieldDeco, []);
    if (otherFieldsDeco) editor.setDecorations(otherFieldsDeco, []);
  }

  currentLine = lineNum;
}

function clearRuler() {
  const ed = window.activeTextEditor;
  if (ed && rulerDecoration) ed.setDecorations(rulerDecoration, []);
  if (ed && currentFieldDeco) ed.setDecorations(currentFieldDeco, []);
  if (ed && otherFieldsDeco) ed.setDecorations(otherFieldsDeco, []);
}

function pad80(s: string) {
  return (s || '').padEnd(80).substring(0, 80);
}

function getFieldsForCurrentLine() {
  const ctx = getActiveDDSContext();
  if (!ctx) return;
  const { doc, lineNum, lineText } = ctx;
  if (lineText.length < 6) return;
  const specC = lineText[5].toUpperCase();
  if (!['A','C','D'].includes(specC) || lineText[6] === '*') return;
  const outline = getOutlineForLine(doc.languageId, lineText);
  const fields = buildFieldsFromOutline(outline, doc.languageId);
  return { ...ctx, outline, fields };
}

function buildHtml(panel: WebviewPanel, outline: string, values: Record<string, string>, labels: Record<string, string>) {
  const nonce = Date.now().toString(36);
  const style = `
    body{ font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); }
    .ruler{ font-family: monospace, var(--vscode-editor-font-family, Consolas, 'Courier New', monospace); white-space: pre; opacity: .8; margin: 8px 0; font-size: 1em; letter-spacing: normal; }
    form{ display:grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
    label{ font-size: 12px; opacity: .9; }
    input[type=text]{ width: 100%; padding: 6px; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); font-family: monospace, var(--vscode-editor-font-family, Consolas, 'Courier New', monospace); font-size: 1em; letter-spacing: normal; }
    .row{ grid-column: 1 / -1; }
    .actions{ display:flex; gap:8px; margin-top:12px; }
    button{ padding:6px 10px; }
    .hint{ font-size: 11px; opacity:.7; }
  `;
  const fieldsHtml = Object.keys(values).map(id => {
    const val = values[id] ?? '';
    const label = labels[id] ?? id;
    return `<div><label for="${id}">${label}</label><input type="text" id="${id}" value="${val.replace(/&/g,'&amp;').replace(/</g,'&lt;')}"></div>`;
  }).join('');

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';" />
    <style nonce="${nonce}">${style}</style>
    <title>DDS Column Assist</title>
  </head>
  <body>
    <div class="ruler">${outline}</div>
    <form id="f">
      ${fieldsHtml}
      <div class="actions row">
        <button type="submit">Apply changes</button>
        <button type="button" id="cancel">Cancel</button>
      </div>
      <div class="hint row">Values will be padded/truncated to their fixed column widths.</div>
    </form>
    <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const form = document.getElementById('f');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {};
      for (const el of form.querySelectorAll('input[type=text]')) {
        data[el.id] = el.value || '';
      }
      vscode.postMessage({ type: 'apply', data });
    });
    document.getElementById('cancel').addEventListener('click', () => vscode.postMessage({ type: 'cancel' }));
    </script>
  </body>
  </html>`;
  panel.webview.html = html;
}

async function launchUI() {
  const ctx = getFieldsForCurrentLine();
  if (!ctx) {
    window.showWarningMessage('DDS Column Assist is available only on DDS files and A-spec lines.');
    return;
  }
  const { editor, doc, lineNum, lineText, outline, fields } = ctx;

  // Prepare field values from line by ranges
  const values: Record<string, string> = {};
  const labels: Record<string, string> = {};
  if (doc.languageId.toLowerCase().endsWith('.dspf') || doc.languageId === 'dds.dspf') {
    for (const f of fields) {
      if (f.id === 'Indicatori') {
        // Unisci N01+N02+N03 (col 8-16, index 7-15)
        values[f.id] = lineText.substring(7, 16).trimEnd();
        labels[f.id] = `${f.label} (cols 8-16)`;
      } else {
        values[f.id] = lineText.substring(f.start, f.end + 1).trimEnd();
        labels[f.id] = `${f.label} (cols ${f.start + 1}-${f.end + 1})`;
      }
    }
  } else {
    for (const f of fields) {
      values[f.id] = lineText.substring(f.start, f.end + 1).trimEnd();
      labels[f.id] = `${f.label} (cols ${f.start + 1}-${f.end + 1})`;
    }
  }

  const panel = window.createWebviewPanel('ddsColumnAssist', 'DDS Column Assist', { viewColumn: ViewColumn.Active, preserveFocus: false }, { enableScripts: true, retainContextWhenHidden: false });
  buildHtml(panel, outline, values, labels);

  const sub = panel.webview.onDidReceiveMessage((msg: { type: 'apply' | 'cancel'; data?: Record<string, string> }) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'apply') {
      let updated = '';
      if (doc.languageId.toLowerCase().endsWith('.dspf') || doc.languageId === 'dds.dspf') {
        // Sostituisci Indicatori (col 8-16, index 7-15) con il valore unico
        let base = pad80(lineText);
        let indic = (msg.data?.Indicatori ?? '').padEnd(9).substring(0, 9);
        updated = base.substring(0, 7) + indic + base.substring(16);
        // Sostituisci gli altri campi normalmente
        updated = replaceSegments(updated, msg.data || {}, fields).substring(0, 80);
      } else {
        updated = replaceSegments(pad80(lineText), msg.data || {}, fields).substring(0, 80);
      }
      window.showTextDocument(doc).then((ed: import('vscode').TextEditor) => {
        ed.edit((b: import('vscode').TextEditorEdit) => b.replace(new Range(lineNum, 0, lineNum, 80), updated));
      });
      panel.dispose();
    } else if (msg.type === 'cancel') {
      panel.dispose();
    }
  });

  panel.onDidDispose(() => sub.dispose());
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('dds-assist.launchUI', launchUI),
    commands.registerCommand('dds-assist.nextField', () => moveToField('next')),
    commands.registerCommand('dds-assist.prevField', () => moveToField('prev')),
    commands.registerCommand('dds-assist.toggleGuideline', () => toggleFeature('guideline')),
    commands.registerCommand('dds-assist.toggleHighlight', () => toggleFeature('highlight')),
  commands.registerCommand('dds-assist.checkRpgle', () => checkRpgleConflict()),
    window.onDidChangeTextEditorSelection(() => updateRuler()),
    window.onDidChangeActiveTextEditor(() => updateRuler())
  );

  extensionContext = context;
  // Initial attempt
  updateRuler();
  // Check for potential conflicts with vscode-rpgle and offer to mitigate
  checkRpgleConflict();
}

async function checkRpgleConflict() {
  try {
    // Try to find any installed extension that looks like an RPGLE helper
    const rpgleExt = extensions.all.find((e) => {
      try {
        const id = (e.id || '').toLowerCase();
        const pkg = e.packageJSON || {};
        const name = (pkg.name || '').toLowerCase();
        const display = (pkg.displayName || '').toLowerCase();
        return id.includes('rpgle') || name.includes('rpgle') || display.includes('rpgle') || id.includes('vscode-rpgle') || name.includes('vscode-rpgle') || display.includes('vscode-rpgle');
      } catch (err) {
        return false;
      }
    });
    if (!rpgleExt) return;

    // If user previously asked not to show this prompt, skip
    try {
      const hidden = extensionContext?.globalState.get<boolean>('dds-assist.rpglePromptHidden');
      if (hidden) return;
    } catch (e) {
      // ignore
    }

    const choice = await window.showInformationMessage(
      'Detected installed "vscode-rpgle" extension. DDS Column Assist guideline/highlight may conflict with it. Do you want to disable the rpgle ruler setting to avoid conflicts?',
      'Yes', 'No', "Don't show again"
    );
    if (choice === "Don't show again") {
      try {
        await extensionContext?.globalState.update('dds-assist.rpglePromptHidden', true);
      } catch (e) {
        // ignore
      }
      return;
    }
    if (choice !== 'Yes') return;

    // Try to update the rpgle extension setting
    try {
      await workspace.getConfiguration().update('vscode-rpgle.rulerEnabledByDefault', false, ConfigurationTarget.Global);
      window.showInformationMessage('Updated global setting "vscode-rpgle.rulerEnabledByDefault" to false.');
    } catch (err) {
      window.showErrorMessage('Failed to update vscode-rpgle setting: ' + String(err));
    }

    // Add an unbind override to user's keybindings.json to disable the rpgle toggle shortcut
    try {
      const kbPath = await getUserKeybindingsPath();
      if (!kbPath) {
        window.showWarningMessage('Could not locate user keybindings.json to add unbind entry for rpgle.');
        return;
      }
      const fs = require('fs');
      const unbindEntry = {
        key: 'shift+f4',
        command: '-vscode-rpgle.assist.toggleFixedRuler',
        when: "editorLangId == 'rpgle'"
      };
      if (!fs.existsSync(kbPath)) {
        // create file with the unbind entry
        fs.writeFileSync(kbPath, JSON.stringify([unbindEntry], null, 2), 'utf8');
        window.showInformationMessage('Added unbind entry to user keybindings.json to disable rpgle toggle shortcut.');
        return;
      }
      const content = fs.readFileSync(kbPath, 'utf8');
      let parsed: any = null;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // If JSON parse fails (file may include comments), attempt to insert before the final closing bracket if present
        if (content.indexOf("-vscode-rpgle.assist.toggleFixedRuler") !== -1) {
          window.showInformationMessage('User keybindings.json already contains an unbind entry for rpgle.');
          return;
        }
        const toInsert = JSON.stringify(unbindEntry, null, 2);
        const lastBracket = content.lastIndexOf(']');
        if (lastBracket !== -1) {
          // Determine whether we need a preceding comma
          const beforeSlice = content.slice(0, lastBracket);
          const trimmedBefore = beforeSlice.trimEnd();
          const needsComma = !trimmedBefore.endsWith('[');
          const insertText = (needsComma ? ',\n' : '\n') + toInsert + '\n';
          const newContent = content.slice(0, lastBracket) + insertText + content.slice(lastBracket);
          fs.writeFileSync(kbPath, newContent, 'utf8');
          window.showInformationMessage('Inserted unbind entry into user keybindings.json.');
          return;
        }
        // As fallback, append the entry (best effort)
        const appendText = '\n' + toInsert + '\n';
        fs.appendFileSync(kbPath, appendText, 'utf8');
        window.showInformationMessage('Appended unbind entry to user keybindings.json (fallback append).');
        return;
      }
      if (!Array.isArray(parsed)) {
        window.showWarningMessage('Unexpected format for user keybindings.json; cannot safely add unbind entry.');
        return;
      }
      // Remove any existing positive bindings for the rpgle toggle command
      const beforeLen = parsed.length;
      const filtered = parsed.filter((e: any) => (e && e.command) ? e.command !== 'vscode-rpgle.assist.toggleFixedRuler' : true);
      if (filtered.length !== beforeLen) {
        fs.writeFileSync(kbPath, JSON.stringify(filtered, null, 2), 'utf8');
        window.showInformationMessage('Removed existing rpgle keybinding(s) for "vscode-rpgle.assist.toggleFixedRuler" from user keybindings.json.');
      }
      // Reload parsed array variable to the filtered list for further processing
      parsed = filtered;
      const existsUnbind = parsed.some((e: any) => e.command === '-vscode-rpgle.assist.toggleFixedRuler' && e.key === 'shift+f4');
      if (existsUnbind) {
        window.showInformationMessage('User keybindings.json already contains the unbind for rpgle.');
        return;
      }
      parsed.push(unbindEntry);
      fs.writeFileSync(kbPath, JSON.stringify(parsed, null, 2), 'utf8');
      window.showInformationMessage('Added unbind entry to user keybindings.json to disable rpgle toggle shortcut.');
    } catch (err) {
      window.showErrorMessage('Error while attempting to update keybindings.json: ' + String(err));
    }

  } catch (err) {
    console.error('checkRpgleConflict error', err);
  }
}

function removeKeybindingLines(text: string, commandId: string) {
  // Remove any JSON object that contains the commandId. This uses a regex approach
  // to find {...} blocks containing the command and removes them including an optional
  // trailing comma. It's a best-effort textual cleanup for fallback scenarios.
  try {
    const pattern = new RegExp('\\{[\\s\\S]*?"command"\\s*:\\s*"' + commandId.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&') + '"[\\s\\S]*?\\},?', 'g');
    const cleaned = text.replace(pattern, '');
    // Also remove any leftover double commas or trailing commas before closing bracket
    let result = cleaned.replace(/,\s*,/g, ',');
    result = result.replace(/,\s*\]/g, ']');
    return result;
  } catch (e) {
    return text;
  }
}

async function getUserKeybindingsPath(): Promise<string | undefined> {
  try {
    // VS Code user settings path varies by platform and installation; try to derive from env
    const homedir = require('os').homedir();
    const platform = process.platform;
    let base: string | undefined;
    if (platform === 'win32') {
      base = process.env.APPDATA;
    } else if (platform === 'darwin') {
      base = homedir + '/Library/Application Support';
    } else {
      base = homedir + '/.config';
    }
    if (!base) return undefined;
    const candidate = require('path').join(base, 'Code', 'User', 'keybindings.json');
    const fs = require('fs');
    if (fs.existsSync(candidate)) return candidate;
    // Try alternative path for VSCode - Insiders or different product name
    const candidate2 = require('path').join(base, 'Code - Insiders', 'User', 'keybindings.json');
    if (fs.existsSync(candidate2)) return candidate2;
    return undefined;
  } catch (e) {
    return undefined;
  }
}

export function deactivate() {
  clearRuler();
}
