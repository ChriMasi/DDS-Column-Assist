import assert from 'node:assert/strict';
import {
  OUTLINE_RPG_C,
  OUTLINE_RPG_C_EXTENDED,
  OUTLINE_RPG_F,
  buildFieldsFromOutline,
  getOutlineForLine,
} from './spec';

function makeRpgleCLine(opcode: string): string {
  const arr = Array(80).fill(' ');
  arr[5] = 'C'; // column 6 -> C-spec line
  for (let i = 0; i < opcode.length && i < 10; i++) {
    arr[25 + i] = opcode[i];
  }
  return arr.join('');
}

function makeRpgleFLine(): string {
  const arr = Array(80).fill(' ');
  arr[5] = 'F';
  // populate filename for easier debugging
  const name = 'TESTFILE';
  for (let i = 0; i < name.length && 7 + i < 80; i++) {
    arr[7 + i] = name[i];
  }
  return arr.join('');
}

function runTests(): void {
  assert.ok(OUTLINE_RPG_C.endsWith('....'), 'OUTLINE_RPG_C should end with four dots');

  const extendedLine = makeRpgleCLine('IF');
  assert.equal(
    getOutlineForLine('rpg', extendedLine),
    OUTLINE_RPG_C_EXTENDED,
    'IF opcode must use extended outline',
  );

  const extendedLineEval = makeRpgleCLine('EVAL');
  assert.equal(
    getOutlineForLine('rpgle', extendedLineEval),
    OUTLINE_RPG_C_EXTENDED,
    'EVAL opcode must use extended outline',
  );

  const regularLine = makeRpgleCLine('MOVE');
  assert.equal(
    getOutlineForLine('rpg', regularLine),
    OUTLINE_RPG_C,
    'Non-special opcodes must use standard outline',
  );

  const extendedFields = buildFieldsFromOutline(OUTLINE_RPG_C_EXTENDED, 'rpg');
  const extendedField = extendedFields.find((f) => f.id === 'F2X');
  assert.equal(extendedFields.length, 5, 'Extended outline should expose five fields');
  assert.ok(extendedField, 'Extended outline must provide F2X field');
  assert.equal(extendedField?.start, 35, 'F2X must start at column 36 (index 35)');
  assert.equal(extendedField?.end, 79, 'F2X must extend to column 80 (index 79)');

  const regularFields = buildFieldsFromOutline(OUTLINE_RPG_C, 'rpg');
  assert.ok(regularFields.some((f) => f.id === 'RES'), 'Standard outline still exposes result field');

  const fLine = makeRpgleFLine();
  assert.equal(
    getOutlineForLine('rpg', fLine),
    OUTLINE_RPG_F,
    'F-spec line must use F outline',
  );

  const fFields = buildFieldsFromOutline(OUTLINE_RPG_F, 'rpg');
  assert.equal(fFields.length, 14, 'F-spec outline should expose fourteen fields');
  const filenameField = fFields.find((f) => f.id === 'FileName');
  const deviceField = fFields.find((f) => f.id === 'Device');
  const keywordsField = fFields.find((f) => f.id === 'Keywords');
  assert.ok(filenameField, 'F-spec outline must expose FileName field');
  assert.equal(filenameField?.start, 6, 'FileName field should start at column 7 (index 6)');
  assert.equal(filenameField?.end, 15, 'FileName field should end at column 16 (index 15)');
  assert.ok(deviceField, 'F-spec outline must expose Device field');
  assert.equal(deviceField?.start, 35, 'Device field should start at column 36 (index 35)');
  assert.equal(deviceField?.end, 41, 'Device field should span expected width');
  assert.ok(keywordsField, 'F-spec outline must expose Keywords field');
  assert.equal(keywordsField?.start, 43, 'Keywords should start after the device and padding');
  assert.equal(keywordsField?.end, 79, 'Keywords should reach end of line');

  console.log('spec.test.ts: all tests passed');
}

export function runSpecTests(): void {
  runTests();
}

if (require.main === module) {
  runTests();
}
