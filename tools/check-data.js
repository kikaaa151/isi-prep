// Sanity check of the built js/data.js against the app logic. Run: node tools/check-data.js [path to data.js]
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const L = require(path.join(__dirname, '..', 'js', 'logic.js'));

const file = process.argv[2] || path.join(__dirname, '..', 'js', 'data.js');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox);
const data = sandbox.window.ISI_DATA;
assert.ok(data && Array.isArray(data.topics), 'window.ISI_DATA is missing');

const problems = [];
function check(condition, message) {
  if (!condition) problems.push(message);
}

const topicIds = new Set(data.topics.map((t) => t.id));

data.codes.forEach((code) => {
  const lines = code.code.split('\n');
  check(topicIds.has(code.topicId), code.id + ': unknown topic');
  check(L.highlightPython(code.code).length === lines.length, code.id + ': highlighter changed the line count');
  check(L.tokenizePython(code.code).map((t) => t.s).join('') === code.code, code.id + ': tokens do not reproduce the code');
  const same = L.diffCode(code.code, code.code, code.keyLines);
  check(same.score === 1 && same.rows.every((row) => row.type === 'ok'), code.id + ': the reference does not match itself');
  check(same.refLines > 0, code.id + ': no code lines');
  check(!code.core === !code.simpleHtml, code.id + ': a walkthrough belongs to core exercises only');
  check(code.keyLines.every((index) => index >= 0 && index < lines.length && lines[index].trim()), code.id + ': key line out of range or blank');
  check(code.keyLines.length === 0 || same.rows.some((row) => row.isKey), code.id + ': key lines map to no logical line');
  L.fillLines(code.code, code.keyLines).forEach((index) => {
    check(L.normalizeFragment(lines[index]) !== '', code.id + ': blanked line ' + (index + 1) + ' has no code');
    check(L.fragmentsEqual(lines[index], lines[index].trim() + '  # comment'), code.id + ': blanked line ' + (index + 1) + ' does not match itself');
  });
  // The comparison must not depend on the indentation width, blank lines or comments.
  if (code.code.indexOf('"""') < 0 && code.code.indexOf("'''") < 0) {
    const reformatted = lines
      .filter((line) => line.trim() && line.trim()[0] !== '#')
      .map((line) => line.replace(/^( {4})+/, (indent) => '  '.repeat(indent.length / 4)))
      .join('\n\n');
    const diff = L.diffCode(code.code, reformatted, code.keyLines);
    check(diff.score === 1, code.id + ': a 2-space re-indented copy scores ' + diff.percent + ' %');
  }
  const withoutFirst = L.diffCode(code.code, lines.slice(1).join('\n'), code.keyLines);
  check(withoutFirst.score < 1 || !lines[0].trim() || lines[0].trim()[0] === '#', code.id + ': removing the first line is not detected');
});

data.questions.forEach((q) => {
  check(q.topicId === null || topicIds.has(q.topicId), q.id + ': unknown topic');
  check(L.isAnswerCorrect(q, L.correctIndexes(q)), q.id + ': the correct answer is not accepted');
  check(!L.isAnswerCorrect(q, []), q.id + ': an empty answer is accepted');
  check(L.inlineHtml(q.text).indexOf('<script') < 0, q.id + ': unescaped HTML');
  if (q.code) check(L.highlightPython(q.code).length === q.code.split('\n').length, q.id + ': highlighter changed the line count');
});

if (data.questions.length) {
  for (let seed = 1; seed <= 300; seed++) {
    const picked = L.composeTest(data.questions, { count: 15 }, L.mulberry32(seed));
    const points = L.distributePoints(picked.map((q) => q.type), 100);
    check(new Set(picked.map((q) => q.id)).size === picked.length, 'seed ' + seed + ': a question twice in one test');
    check(points.reduce((a, b) => a + b, 0) === 100, 'seed ' + seed + ': points do not sum to 100');
    if (data.questions.length >= 15) check(picked.length === 15, 'seed ' + seed + ': ' + picked.length + ' questions');
  }
  const sample = L.composeTest(data.questions, { count: 15 }, L.mulberry32(7));
  const practical = sample.filter((q) => q.type === 'practical').length;
  console.log('Sample test: ' + sample.length + ' questions, ' + (sample.length - practical) + ' theory + ' + practical +
    ' practical, topics: ' + new Set(sample.map((q) => q.topicId)).size + ', points: ' +
    L.distributePoints(sample.map((q) => q.type), 100).join(' '));
}

console.log(data.topics.length + ' topics, ' + data.codes.length + ' codes, ' + data.questions.length + ' questions checked');
if (problems.length) {
  problems.forEach((message) => console.error('PROBLEM  ' + message));
  process.exit(1);
}
console.log('OK');
