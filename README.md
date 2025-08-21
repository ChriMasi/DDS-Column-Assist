# DDS Column Assist

A lightweight VS Code extension that shows a visual ruler and provides a form-based editor for IBM i DDS A-spec lines in PF, LF, and DSPF members.

## Features

- Ruler overlay: when your caret is on a DDS line with `A` in the 6th column, a hint bar appears above the line:
  - PF/LF: `.....A..........T.Nome++++++RLun++TPdB......Funzioni++++++++++++++++++++++++++++`
  - DSPF: `.....AAN01N02N03T.Nome++++++RLun++TPdBRigColFunzioni++++++++++++++++++++++++++++`
- Edit assistant: a command opens a small form where you can edit the fixed-width fields of the selected A-spec line. On apply, the line in the editor is updated preserving fixed-column widths (padding/truncation).

## Usage

1. Open a DDS file (extensions: `.pf`, `.lf`, `.dspf`).
2. Place the caret on a line that has `A` in column 6.
3. See the visual ruler above the line.
4. Run the command "DDS: Edit A-spec line (Column Assist)" from the Command Palette. A form opens with fields aligned to the fixed columns.
5. Fill the inputs and press "Apply changes". The line is updated in the editor.

Notes:
- The assistant infers editable ranges from the ruler shown above the line. Values are padded/truncated to match column widths.
- The extension doesn't validate DDS semantics; it focuses on column alignment and quick edits.

## Build and Install

- Install dependencies: `npm install`
- Build: `npm run build`
- Launch the extension in VS Code: press F5 to start the Extension Host.

## Requirements

- VS Code 1.75+

## License

MIT
