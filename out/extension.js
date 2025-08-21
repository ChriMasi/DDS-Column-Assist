"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
async function moveToField(direction) {
    const ctx = getActiveDDSContext();
    if (!ctx)
        return;
    const { editor, doc, lineNum } = ctx;
    // Prendi la riga corrente, pad a 80 sempre (anche se vuota)
    let lineText = doc.lineAt(lineNum).text.padEnd(80);
    const isASpec = (t) => t.length >= 6 && t[5].toUpperCase() === 'A' && t[6] !== '*';
    const isComment = (t) => t.length >= 7 && t[5].toUpperCase() === 'A' && t[6] === '*';
    // Se PageUp e la riga corrente è commento: vai alla riga precedente come "campo singolo"
    if (direction === 'prev' && isComment(lineText)) {
        const prevLine = lineNum - 1;
        if (prevLine >= 0) {
            const prevRaw = doc.lineAt(prevLine).text;
            const prevTxt = prevRaw.padEnd(80);
            if (isComment(prevTxt)) {
                // Vai all'inizio del commento precedente
                editor.selection = new vscode_1.Selection(prevLine, 0, prevLine, 0);
                editor.revealRange(new vscode_1.Range(prevLine, 0, prevLine, 0));
                updateRuler();
                return;
            }
            if (isASpec(prevTxt)) {
                const outline2 = (0, spec_1.getOutlineForLangId)(doc.languageId);
                const fields2 = (0, spec_1.buildFieldsFromOutline)(outline2, doc.languageId);
                const lastField = fields2[fields2.length - 1];
                // Assicura lunghezza sufficiente
                if (prevRaw.length <= lastField.start) {
                    const padded = prevRaw.padEnd(Math.max(80, lastField.start + 1));
                    await editor.edit((b) => b.replace(new vscode_1.Range(prevLine, 0, prevLine, prevRaw.length), padded));
                }
                editor.selection = new vscode_1.Selection(prevLine, lastField.start, prevLine, lastField.start);
                editor.revealRange(new vscode_1.Range(prevLine, lastField.start, prevLine, lastField.start));
                updateRuler();
                return;
            }
            // Riga precedente esiste ma è vuota/non-A: posiziona in colonna 6
            if (prevRaw.length < 6) {
                const padded = ''.padEnd(80);
                await editor.edit((b) => b.replace(new vscode_1.Range(prevLine, 0, prevLine, prevRaw.length), padded));
            }
            editor.selection = new vscode_1.Selection(prevLine, 5, prevLine, 5);
            editor.revealRange(new vscode_1.Range(prevLine, 5, prevLine, 5));
            updateRuler();
            return;
        }
        return;
    }
    // Se PageUp e la riga è vuota o non ha A in colonna 6 (non commento):
    if (direction === 'prev' && (lineText.length < 6 || lineText[5].toUpperCase() !== 'A')) {
        const prevLineIdx = lineNum - 1;
        if (prevLineIdx >= 0) {
            const prevRaw = doc.lineAt(prevLineIdx).text;
            const prevTxt = prevRaw.padEnd(80);
            if (!isASpec(prevTxt) && !isComment(prevTxt)) {
                // Riga sopra è anch'essa vuota/non-A: posiziona in colonna 6 (pad se serve)
                if (prevRaw.length < 6) {
                    const padded = ''.padEnd(80);
                    await editor.edit((b) => b.replace(new vscode_1.Range(prevLineIdx, 0, prevLineIdx, prevRaw.length), padded));
                }
                editor.selection = new vscode_1.Selection(prevLineIdx, 5, prevLineIdx, 5);
                editor.revealRange(new vscode_1.Range(prevLineIdx, 5, prevLineIdx, 5));
                updateRuler();
                return;
            }
        }
        // Altrimenti, cerca la riga A precedente come prima
        const prev = (() => {
            let l = lineNum - 1;
            while (l >= 0) {
                const txt = doc.lineAt(l).text.padEnd(80);
                if (txt.length >= 6 && txt[5].toUpperCase() === 'A' && txt[6] !== '*') {
                    const outline2 = (0, spec_1.getOutlineForLangId)(doc.languageId);
                    const fields2 = (0, spec_1.buildFieldsFromOutline)(outline2, doc.languageId);
                    return { line: l, fields: fields2 };
                }
                l--;
            }
            return undefined;
        })();
        if (prev) {
            const lastField = prev.fields[prev.fields.length - 1];
            editor.selection = new vscode_1.Selection(prev.line, lastField.start, prev.line, lastField.start);
            editor.revealRange(new vscode_1.Range(prev.line, lastField.start, prev.line, lastField.start));
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
                editor.selection = new vscode_1.Selection(nextLine, 0, nextLine, 0);
                editor.revealRange(new vscode_1.Range(nextLine, 0, nextLine, 0));
                updateRuler();
                return;
            }
            if (!isASpec(nextTxt)) {
                // Riga esistente ma vuota/non-A: posiziona in colonna 6, padding se necessario
                if (nextRaw.length < 6) {
                    const padded = ''.padEnd(80);
                    await editor.edit((b) => b.replace(new vscode_1.Range(nextLine, 0, nextLine, nextRaw.length), padded));
                }
                editor.selection = new vscode_1.Selection(nextLine, 5, nextLine, 5);
                editor.revealRange(new vscode_1.Range(nextLine, 5, nextLine, 5));
                updateRuler();
                return;
            }
            // Prossima riga è A-spec valida: vai al primo campo
            const outline2 = (0, spec_1.getOutlineForLangId)(doc.languageId);
            const fields2 = (0, spec_1.buildFieldsFromOutline)(outline2, doc.languageId);
            const f0 = fields2[0];
            // Assicura lunghezza sufficiente
            const currLen = nextRaw.length;
            if (currLen <= f0.start) {
                const padded = nextRaw.padEnd(Math.max(80, f0.start + 1));
                await editor.edit((b) => b.replace(new vscode_1.Range(nextLine, 0, nextLine, currLen), padded));
            }
            editor.selection = new vscode_1.Selection(nextLine, f0.start, nextLine, f0.start);
            editor.revealRange(new vscode_1.Range(nextLine, f0.start, nextLine, f0.start));
            updateRuler();
            return;
        }
        else {
            // Non esiste riga successiva: crea nuova riga e posiziona in colonna 6
            const insertLine = doc.lineCount;
            await editor.edit((b) => b.insert(new vscode_1.Position(insertLine, 0), '\n'));
            await editor.edit((b) => b.replace(new vscode_1.Range(insertLine, 0, insertLine, 0), ''.padEnd(80)));
            editor.selection = new vscode_1.Selection(insertLine, 5, insertLine, 5);
            editor.revealRange(new vscode_1.Range(insertLine, 5, insertLine, 5));
            updateRuler();
            return;
        }
    }
    // Consenti il salto solo se la riga corrente è A-spec valida (per PageDown/PageUp intra-riga)
    if (!isASpec(lineText))
        return;
    const outline = (0, spec_1.getOutlineForLangId)(doc.languageId);
    const fields = (0, spec_1.buildFieldsFromOutline)(outline, doc.languageId);
    const posIdx = editor.selection.start.character;
    // Trova il campo attuale o il primo campo dopo il cursore
    let currentIdx = fields.findIndex(f => posIdx >= f.start && posIdx <= f.end);
    if (currentIdx === -1) {
        // Se il cursore è prima di tutti i campi, vai al primo
        currentIdx = fields.findIndex(f => posIdx < f.start);
        if (currentIdx === -1)
            currentIdx = 0;
    }
    let targetIdx = -1;
    let targetLine = lineNum;
    let targetFields = fields;
    // Funzione per trovare la prossima riga valida (A-spec, non commento)
    function findNextValidLine(startLine, step) {
        let l = startLine;
        while (l >= 0 && l < doc.lineCount) {
            const txt = doc.lineAt(l).text.padEnd(80);
            if (txt.length >= 6 && txt[5].toUpperCase() === 'A' && txt[6] !== '*') {
                const outline2 = (0, spec_1.getOutlineForLangId)(doc.languageId);
                const fields2 = (0, spec_1.buildFieldsFromOutline)(outline2, doc.languageId);
                return { line: l, fields: fields2, docLine: txt };
            }
            l += step;
        }
        return undefined;
    }
    if (direction === 'next') {
        if (currentIdx < fields.length - 1) {
            targetIdx = currentIdx + 1;
        }
        else {
            // Se sono all'ultimo campo, gestisci la riga successiva in modo speciale:
            const nl = lineNum + 1;
            if (nl < doc.lineCount) {
                const nextRaw = doc.lineAt(nl).text;
                const nextTxt = nextRaw.padEnd(80);
                if (isComment(nextTxt)) {
                    // Vai all'inizio del commento
                    editor.selection = new vscode_1.Selection(nl, 0, nl, 0);
                    editor.revealRange(new vscode_1.Range(nl, 0, nl, 0));
                    updateRuler();
                    return;
                }
                if (!isASpec(nextTxt)) {
                    // Riga esistente ma vuota/non-A: posiziona in colonna 6
                    if (nextRaw.length < 6) {
                        const padded = ''.padEnd(80);
                        await editor.edit((b) => b.replace(new vscode_1.Range(nl, 0, nl, nextRaw.length), padded));
                    }
                    editor.selection = new vscode_1.Selection(nl, 5, nl, 5);
                    editor.revealRange(new vscode_1.Range(nl, 5, nl, 5));
                    updateRuler();
                    return;
                }
                // Prossima riga è A-spec valida: vai al primo campo
                targetLine = nl;
                targetFields = fields;
                targetIdx = 0;
            }
            else {
                // Non c'è una riga successiva: crea nuova riga e posiziona in colonna 6
                const insertLine = doc.lineCount;
                await editor.edit((b) => b.insert(new vscode_1.Position(insertLine, 0), '\n'));
                await editor.edit((b) => b.replace(new vscode_1.Range(insertLine, 0, insertLine, 0), ''.padEnd(80)));
                editor.selection = new vscode_1.Selection(insertLine, 5, insertLine, 5);
                editor.revealRange(new vscode_1.Range(insertLine, 5, insertLine, 5));
                updateRuler();
                return;
            }
        }
    }
    else {
        // Se sono sul primo campo (anche su riga vuota o nuova), consenti salto all'ultimo campo della riga precedente
        if (currentIdx <= 0) {
            // Se la riga precedente immediata è un commento, vai all'inizio del commento
            const prevLineIdx = lineNum - 1;
            if (prevLineIdx >= 0) {
                const prevRaw = doc.lineAt(prevLineIdx).text;
                const prevTxt = prevRaw.padEnd(80);
                if (isComment(prevTxt)) {
                    editor.selection = new vscode_1.Selection(prevLineIdx, 0, prevLineIdx, 0);
                    editor.revealRange(new vscode_1.Range(prevLineIdx, 0, prevLineIdx, 0));
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
            }
            else {
                // resta sul primo campo
                targetIdx = currentIdx;
            }
        }
        else {
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
            await editor.edit((b) => b.replace(new vscode_1.Range(targetLine, 0, targetLine, orig.length), padded));
        }
        editor.selection = new vscode_1.Selection(targetLine, f.start, targetLine, f.start);
        editor.revealRange(new vscode_1.Range(targetLine, f.start, targetLine, f.start));
        updateRuler();
    }
}
const vscode_1 = require("vscode");
const spec_1 = require("./spec");
let rulerDecoration;
let currentFieldDeco;
let otherFieldsDeco;
let currentLine = -1;
const SUPPORTED_LANGIDS = ['dds.dspf', 'dds.lf', 'dds.pf'];
function getActiveDDSContext() {
    const editor = vscode_1.window.activeTextEditor;
    if (!editor)
        return;
    const doc = editor.document;
    if (!SUPPORTED_LANGIDS.includes(doc.languageId))
        return;
    const lineNum = editor.selection.start.line;
    const lineText = doc.getText(new vscode_1.Range(lineNum, 0, lineNum, 200)).padEnd(80);
    return { editor, doc, lineNum, lineText };
}
function ensureDecoration() {
    if (!rulerDecoration) {
        rulerDecoration = vscode_1.window.createTextEditorDecorationType({
            backgroundColor: new vscode_1.ThemeColor('editor.background'),
            isWholeLine: true,
            opacity: '0',
        });
    }
    return rulerDecoration;
}
function ensureFieldDecorations() {
    if (!currentFieldDeco) {
        currentFieldDeco = vscode_1.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(242, 242, 109, 0.3)',
            border: '1px solid grey',
        });
    }
    if (!otherFieldsDeco) {
        otherFieldsDeco = vscode_1.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(242, 242, 109, 0.1)',
            border: '1px solid grey',
        });
    }
}
function updateRuler() {
    const ctx = getActiveDDSContext();
    if (!ctx)
        return clearRuler();
    const { editor, doc, lineNum, lineText } = ctx;
    // Only for 'A' spec line and not comment (col 7 == '*')
    if (lineText.length < 6 || lineText[5].toUpperCase() !== 'A' || lineText[6] === '*') {
        return clearRuler();
    }
    const outline = (0, spec_1.getOutlineForLangId)(doc.languageId);
    const deco = ensureDecoration();
    ensureFieldDecorations();
    const targetLine = lineNum > 0 ? lineNum - 1 : lineNum;
    editor.setDecorations(deco, [
        {
            range: new vscode_1.Range(targetLine, 0, targetLine, 80),
            renderOptions: {
                before: {
                    contentText: outline,
                    color: new vscode_1.ThemeColor('editorLineNumber.foreground'),
                    textDecoration: 'none',
                    // VS Code uses editor font, which is monospaced; avoid extra spacing
                    // white-space: pre is default for contentText
                }
            }
        }
    ]);
    // Highlight fields on the current line
    const fields = (0, spec_1.buildFieldsFromOutline)(outline, doc.languageId);
    const posIdx = editor.selection.start.character;
    let activeIndex = -1;
    for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        if (posIdx >= f.start && posIdx <= f.end) {
            activeIndex = i;
            break;
        }
    }
    const otherDecos = [];
    for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const range = new vscode_1.Range(lineNum, f.start, lineNum, f.end + 1);
        const opt = { range, hoverMessage: fields[i].label };
        if (i === activeIndex) {
            editor.setDecorations(currentFieldDeco, [opt]);
        }
        else {
            otherDecos.push(opt);
        }
    }
    editor.setDecorations(otherFieldsDeco, otherDecos);
    currentLine = lineNum;
}
function clearRuler() {
    const ed = vscode_1.window.activeTextEditor;
    if (ed && rulerDecoration)
        ed.setDecorations(rulerDecoration, []);
    if (ed && currentFieldDeco)
        ed.setDecorations(currentFieldDeco, []);
    if (ed && otherFieldsDeco)
        ed.setDecorations(otherFieldsDeco, []);
}
function pad80(s) {
    return (s || '').padEnd(80).substring(0, 80);
}
function getFieldsForCurrentLine() {
    const ctx = getActiveDDSContext();
    if (!ctx)
        return;
    const { doc, lineNum, lineText } = ctx;
    if (lineText.length < 6 || lineText[5].toUpperCase() !== 'A' || lineText[6] === '*')
        return;
    const outline = (0, spec_1.getOutlineForLangId)(doc.languageId);
    const fields = (0, spec_1.buildFieldsFromOutline)(outline, doc.languageId);
    return { ...ctx, outline, fields };
}
function buildHtml(panel, outline, values, labels) {
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
        return `<div><label for="${id}">${label}</label><input type="text" id="${id}" value="${val.replace(/&/g, '&amp;').replace(/</g, '&lt;')}"></div>`;
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
        vscode_1.window.showWarningMessage('DDS Column Assist is available only on DDS files and A-spec lines.');
        return;
    }
    const { editor, doc, lineNum, lineText, outline, fields } = ctx;
    // Prepare field values from line by ranges
    const values = {};
    const labels = {};
    if (doc.languageId.toLowerCase().endsWith('.dspf') || doc.languageId === 'dds.dspf') {
        for (const f of fields) {
            if (f.id === 'Indicatori') {
                // Unisci N01+N02+N03 (col 8-16, index 7-15)
                values[f.id] = lineText.substring(7, 16).trimEnd();
                labels[f.id] = `${f.label} (cols 8-16)`;
            }
            else {
                values[f.id] = lineText.substring(f.start, f.end + 1).trimEnd();
                labels[f.id] = `${f.label} (cols ${f.start + 1}-${f.end + 1})`;
            }
        }
    }
    else {
        for (const f of fields) {
            values[f.id] = lineText.substring(f.start, f.end + 1).trimEnd();
            labels[f.id] = `${f.label} (cols ${f.start + 1}-${f.end + 1})`;
        }
    }
    const panel = vscode_1.window.createWebviewPanel('ddsColumnAssist', 'DDS Column Assist', { viewColumn: vscode_1.ViewColumn.Active, preserveFocus: false }, { enableScripts: true, retainContextWhenHidden: false });
    buildHtml(panel, outline, values, labels);
    const sub = panel.webview.onDidReceiveMessage((msg) => {
        if (!msg || typeof msg !== 'object')
            return;
        if (msg.type === 'apply') {
            let updated = '';
            if (doc.languageId.toLowerCase().endsWith('.dspf') || doc.languageId === 'dds.dspf') {
                // Sostituisci Indicatori (col 8-16, index 7-15) con il valore unico
                let base = pad80(lineText);
                let indic = (msg.data?.Indicatori ?? '').padEnd(9).substring(0, 9);
                updated = base.substring(0, 7) + indic + base.substring(16);
                // Sostituisci gli altri campi normalmente
                updated = (0, spec_1.replaceSegments)(updated, msg.data || {}, fields).substring(0, 80);
            }
            else {
                updated = (0, spec_1.replaceSegments)(pad80(lineText), msg.data || {}, fields).substring(0, 80);
            }
            vscode_1.window.showTextDocument(doc).then((ed) => {
                ed.edit((b) => b.replace(new vscode_1.Range(lineNum, 0, lineNum, 80), updated));
            });
            panel.dispose();
        }
        else if (msg.type === 'cancel') {
            panel.dispose();
        }
    });
    panel.onDidDispose(() => sub.dispose());
}
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand('dds-assist.launchUI', launchUI), vscode_1.commands.registerCommand('dds-assist.nextField', () => moveToField('next')), vscode_1.commands.registerCommand('dds-assist.prevField', () => moveToField('prev')), vscode_1.window.onDidChangeTextEditorSelection(() => updateRuler()), vscode_1.window.onDidChangeActiveTextEditor(() => updateRuler()));
    // Initial attempt
    updateRuler();
}
function deactivate() {
    clearRuler();
}
//# sourceMappingURL=extension.js.map