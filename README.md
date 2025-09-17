# IBM I Column Assist

[See the English version below](#english-version)

---

## Versione italiana

**IBM I Column Assist** è un'estensione VS Code che fornisce una guida a colonne e un assist per la modifica delle linee DDS (PF/LF/DSPF) e per RPGLE (C/D-spec).  

### Caratteristiche principali

- Mostra una *guideline* (riga guida) sopra la linea attiva che riporta l'outline dei campi.
- Evidenzia il campo corrente (e gli altri campi) sulla riga attiva.
- Navigazione tra i campi con **PageDown** (campo successivo) e **PageUp** (campo precedente).
- Supporto per i file DDS (`.pf`, `.lf`, `.dspf`) e per RPGLE (`rpg`, `rpgle`, `sqlrpgle`), con differenziazione della specifica C o D basata sul carattere in colonna 6 della riga.
- Un comando UI che apre un piccolo pannello per modificare i campi in modo strutturato.

### Conflitto con `vscode-rpgle`

Se viene rilevata l'estensione `vscode-rpgle`, l'estensione chiederà conferma: il guideline/highlight può entrare in conflitto con il *ruler* di `vscode-rpgle`.  
Se si accetta, l'estensione tenta di:

- Disattivare l'opzione globale `vscode-rpgle.rulerEnabledByDefault` impostandola su `false`.
- Aggiungere una voce in `keybindings.json` per "unbindare" il keybinding di toggle (aggiunge un oggetto con `command: "-vscode-rpgle.assist.toggleFixedRuler"`), o rimuovere eventuali binding esistenti per `vscode-rpgle.assist.toggleFixedRuler`.

Selezionando **Don't show again** il prompt non verrà più mostrato — è possibile richiamare manualmente il controllo dal Command Palette con il comando  
**DDS: Check and fix vscode-rpgle conflicts**.

> Nota: l’operazione cerca di rimuovere tutte le voci che assegnano `vscode-rpgle.assist.toggleFixedRuler` (qualsiasi key) e aggiunge un *unbind* per `shift+f4`.  
> Se sono presenti keybinding personalizzati diversi, potrebbe essere necessario intervenire manualmente.

### Impostazioni

Le impostazioni sono organizzate per tipo di file e specifica:

- `ddsColumnAssist.guideline.dspf` (boolean)
- `ddsColumnAssist.guideline.pf` (boolean)
- `ddsColumnAssist.guideline.lf` (boolean)
- `ddsColumnAssist.guideline.rpgleC` (boolean)
- `ddsColumnAssist.guideline.rpgleD` (boolean)
- `ddsColumnAssist.highlight.*` corrispondenti per ogni tipo

### Scorciatoie

Queste impostazioni definiscono il comportamento di default; è possibile modificarle dalle impostazioni di VS Code oppure tramite delle scorciatoie:

- Posizionarsi nella riga della specifica del tipo di file di cui si vuole modificare l'impostazione:  
  - **Shift + F2** → Evidenziazione  
  - **Shift + F3** → Linea guida  

### Comportamento

- La guideline viene mostrata sopra la riga attiva (o non mostrata se disabilitata nelle impostazioni).
- L’highlight mette in evidenza il campo corrente (giallo) e gli altri campi in opacità minore.
- **PageUp/PageDown** spostano il cursore tra i campi, gestiscono righe commento, righe vuote e la creazione di nuove righe quando necessario.
- Se una riga è un commento (colonna 7 = `*`), il comportamento di movimento è differenziato (si sposta all'inizio del commento o salta righe appropriate).

### Note

- L’assistente deduce gli intervalli modificabili dal righello mostrato sopra la riga.  
- Le righe vengono riempite/tagliate per adattarsi alle larghezze delle colonne.  
- L’estensione non convalida la semantica DDS; si concentra sull’allineamento delle colonne e sulle modifiche rapide.  

---

## English version

**IBM I Column Assist** is a VS Code extension providing a column guideline and edit assistant for IBM i DDS (PF/LF/DSPF) and RPGLE (C/D-spec) lines.  

### Main features

- Shows a guideline above the active line with the field outline.
- Highlights the current field (and other fields) on the active line.
- Navigate fields with **PageDown** (next field) and **PageUp** (previous field).
- Supports DDS files (`.pf`, `.lf`, `.dspf`) and RPGLE (`rpg`, `rpgle`, `sqlrpgle`). For RPGLE the spec (C or D) is chosen by the character in column 6 of the line.
- A small UI panel to edit fields in a structured way.

### Conflict with `vscode-rpgle`

If the extension `vscode-rpgle` is detected, IBM I Column Assist will show a prompt because the guideline/highlight can conflict with the rpgle ruler.  
If you accept:

- It will try to set `vscode-rpgle.rulerEnabledByDefault` to `false` in global settings.
- It will try to add an unbind entry (or remove existing bindings) in the user's `keybindings.json` for `vscode-rpgle.assist.toggleFixedRuler`.

There is a **Don't show again** button in the prompt; if chosen the prompt will not appear again.  
You can re-run the check from the Command Palette using **DDS: Check and fix vscode-rpgle conflicts**.

> Note: the extension attempts to remove all bindings that call `vscode-rpgle.assist.toggleFixedRuler` (any key).  
> If you have custom keybindings not covered by the default (`shift+f4`), you might need a manual cleanup.

### Settings

The extension exposes per-file/per-spec settings:  
- `ddsColumnAssist.guideline.dspf` (boolean)
- `ddsColumnAssist.guideline.pf` (boolean)
- `ddsColumnAssist.guideline.lf` (boolean)
- `ddsColumnAssist.guideline.rpgleC` (boolean)
- `ddsColumnAssist.guideline.rpgleD` (boolean)
- `ddsColumnAssist.highlight.*` per type

### Shortcuts

These settings define the default behavior; you can change them either from the VS Code settings or using shortcuts:

- Place the cursor on the specification line of the file type you want to modify:  
  - **Shift + F2** → Highlight  
  - **Shift + F3** → Guideline  

### Behavior

- The guideline is drawn above the active line.
- Field highlighting follows the cursor. **PageUp/PageDown** navigate and handle comments and empty lines sensibly.
- For comment lines (column 7 = `*`) behaviour is adapted: navigation moves to the start of the comment or skips appropriately.

### Notes

- The assistant infers editable ranges from the ruler shown above the line.  
- Rows are padded/truncated to match column widths.  
- The extension doesn't validate DDS semantics; it focuses on column alignment and quick edits.  

---

## Requirements

- VS Code 1.75+

## License

MIT

This extension is based on RPGLE extension: https://marketplace.visualstudio.com/items?itemName=HalcyonTechLtd.vscode-rpgle
Repository: https://github.com/halcyon-tech/vscode-rpgle
