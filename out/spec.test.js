"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSpecTests = runSpecTests;
const strict_1 = __importDefault(require("node:assert/strict"));
const spec_1 = require("./spec");
function makeRpgleCLine(opcode) {
    const arr = Array(80).fill(' ');
    arr[5] = 'C'; // column 6 -> C-spec line
    for (let i = 0; i < opcode.length && i < 10; i++) {
        arr[25 + i] = opcode[i];
    }
    return arr.join('');
}
function makeRpgleFLine() {
    const arr = Array(80).fill(' ');
    arr[5] = 'F';
    // populate filename for easier debugging
    const name = 'TESTFILE';
    for (let i = 0; i < name.length && 7 + i < 80; i++) {
        arr[7 + i] = name[i];
    }
    return arr.join('');
}
function runTests() {
    strict_1.default.ok(spec_1.OUTLINE_RPG_C.endsWith('....'), 'OUTLINE_RPG_C should end with four dots');
    const extendedLine = makeRpgleCLine('IF');
    strict_1.default.equal((0, spec_1.getOutlineForLine)('rpg', extendedLine), spec_1.OUTLINE_RPG_C_EXTENDED, 'IF opcode must use extended outline');
    const extendedLineEval = makeRpgleCLine('EVAL');
    strict_1.default.equal((0, spec_1.getOutlineForLine)('rpgle', extendedLineEval), spec_1.OUTLINE_RPG_C_EXTENDED, 'EVAL opcode must use extended outline');
    const regularLine = makeRpgleCLine('MOVE');
    strict_1.default.equal((0, spec_1.getOutlineForLine)('rpg', regularLine), spec_1.OUTLINE_RPG_C, 'Non-special opcodes must use standard outline');
    const extendedFields = (0, spec_1.buildFieldsFromOutline)(spec_1.OUTLINE_RPG_C_EXTENDED, 'rpg');
    const extendedField = extendedFields.find((f) => f.id === 'F2X');
    strict_1.default.equal(extendedFields.length, 5, 'Extended outline should expose five fields');
    strict_1.default.ok(extendedField, 'Extended outline must provide F2X field');
    strict_1.default.equal(extendedField?.start, 35, 'F2X must start at column 36 (index 35)');
    strict_1.default.equal(extendedField?.end, 79, 'F2X must extend to column 80 (index 79)');
    const regularFields = (0, spec_1.buildFieldsFromOutline)(spec_1.OUTLINE_RPG_C, 'rpg');
    strict_1.default.ok(regularFields.some((f) => f.id === 'RES'), 'Standard outline still exposes result field');
    const fLine = makeRpgleFLine();
    strict_1.default.equal((0, spec_1.getOutlineForLine)('rpg', fLine), spec_1.OUTLINE_RPG_F, 'F-spec line must use F outline');
    const fFields = (0, spec_1.buildFieldsFromOutline)(spec_1.OUTLINE_RPG_F, 'rpg');
    strict_1.default.equal(fFields.length, 14, 'F-spec outline should expose fourteen fields');
    const filenameField = fFields.find((f) => f.id === 'FileName');
    const deviceField = fFields.find((f) => f.id === 'Device');
    const keywordsField = fFields.find((f) => f.id === 'Keywords');
    strict_1.default.ok(filenameField, 'F-spec outline must expose FileName field');
    strict_1.default.equal(filenameField?.start, 6, 'FileName field should start at column 7 (index 6)');
    strict_1.default.equal(filenameField?.end, 15, 'FileName field should end at column 16 (index 15)');
    strict_1.default.ok(deviceField, 'F-spec outline must expose Device field');
    strict_1.default.equal(deviceField?.start, 35, 'Device field should start at column 36 (index 35)');
    strict_1.default.equal(deviceField?.end, 41, 'Device field should span expected width');
    strict_1.default.ok(keywordsField, 'F-spec outline must expose Keywords field');
    strict_1.default.equal(keywordsField?.start, 43, 'Keywords should start after the device and padding');
    strict_1.default.equal(keywordsField?.end, 79, 'Keywords should reach end of line');
    console.log('spec.test.ts: all tests passed');
}
function runSpecTests() {
    runTests();
}
if (require.main === module) {
    runTests();
}
//# sourceMappingURL=spec.test.js.map