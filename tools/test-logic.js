// Dependency-free tests of js/logic.js. Run: node tools/test-logic.js
'use strict';

const assert = require('assert');
const path = require('path');
const L = require(path.join(__dirname, '..', 'js', 'logic.js'));

let failed = 0;
let passed = 0;

function test(name, body) {
  try {
    body();
    passed++;
  } catch (error) {
    failed++;
    console.error('FAIL  ' + name + '\n      ' + String(error && error.message).split('\n').join('\n      '));
  }
}

function norms(code) {
  return L.normalizeCode(code).map((line) => line.level + '|' + line.norm);
}

function question(id, type, topicId, source, correct) {
  return {
    id, type, topicId, source: source || 'moodle', week: 1, text: id,
    options: (correct || [true, false, false, false]).map((c, i) => ({ text: 'o' + i, correct: c }))
  };
}

// ---------------------------------------------------------------- tokenizer and highlighter

test('tokenizer splits strings, numbers, names, operators and comments', () => {
  const kinds = L.tokenizePython("x = f'a{b}' + 1.5e3  # note\n").filter((t) => t.t !== 'ws').map((t) => t.t + ':' + t.s);
  assert.deepStrictEqual(kinds, ['name:x', 'op:=', "str:f'a{b}'", 'op:+', 'num:1.5e3', 'com:# note', 'nl:\n']);
});

test('tokenizer keeps triple-quoted strings and multi-character operators whole', () => {
  const tokens = L.tokenizePython('a **= 2\ns = """one\ntwo"""\nb != c // d');
  assert.ok(tokens.some((t) => t.t === 'op' && t.s === '**='));
  assert.ok(tokens.some((t) => t.t === 'str' && t.s === '"""one\ntwo"""'));
  assert.ok(tokens.some((t) => t.s === '!=') && tokens.some((t) => t.s === '//'));
});

test('an unterminated string ends at the end of its line', () => {
  const tokens = L.tokenizePython("a = 'oops\nb = 1");
  assert.ok(tokens.some((t) => t.t === 'name' && t.s === 'b'));
});

test('tokens reproduce the source exactly', () => {
  const source = "@dec\ndef f(x):\n\treturn x[1:] \\\n        + '#'  # c\n";
  assert.strictEqual(L.tokenizePython(source).map((t) => t.s).join(''), source);
});

test('highlighter returns one HTML string per line and escapes HTML', () => {
  const lines = L.highlightPython('def area(r):\n    return 3.14 * r  # <b>\n@staticmethod\nprint("a<b")');
  assert.strictEqual(lines.length, 4);
  assert.ok(lines[0].includes('<span class="tk-kw">def</span>'));
  assert.ok(lines[0].includes('<span class="tk-def">area</span>'));
  assert.ok(lines[1].includes('<span class="tk-num">3.14</span>'));
  assert.ok(lines[1].includes('<span class="tk-com"># &lt;b&gt;</span>'));
  assert.ok(lines[2].includes('<span class="tk-dec">@</span><span class="tk-dec">staticmethod</span>'));
  assert.ok(lines[3].includes('<span class="tk-builtin">print</span>'));
  assert.ok(lines[3].includes('&quot;a&lt;b&quot;'));
});

test('highlighter splits a multi-line string over its lines', () => {
  const lines = L.highlightPython('s = """a\nb"""\nx = None');
  assert.strictEqual(lines.length, 3);
  assert.ok(lines[1].startsWith('<span class="tk-str">b'));
  assert.ok(lines[2].includes('<span class="tk-const">None</span>'));
});

test('a method named like a builtin is not highlighted as a builtin', () => {
  assert.ok(!L.highlightPython('model.set(1)')[0].includes('tk-builtin'));
});

// ---------------------------------------------------------------- normalisation

test('normalisation drops comments, blank lines and docstrings', () => {
  assert.deepStrictEqual(norms('# intro\n\nx = 1  # one\n\n"""doc"""\ny = 2\n'), ['0|x = 1', '0|y = 2']);
});

test('spacing around operators, commas and brackets is ignored', () => {
  assert.deepStrictEqual(norms('a=f( x ,y )+[ 1,2 ]'), norms('a = f(x, y) + [1, 2]'));
});

test('quote characters are unified, also inside f-strings', () => {
  assert.deepStrictEqual(norms("print('a', f\"{d['k']}\")"), norms('print("a", f\'{d["k"]}\')'));
  assert.notDeepStrictEqual(norms("x = 'a'"), norms("x = 'b'"));
});

test('indentation level is part of the line, its width is not', () => {
  const two = norms('for x in xs:\n  if x:\n    print(x)\n');
  const four = norms('for x in xs:\n    if x:\n        print(x)\n');
  assert.deepStrictEqual(two, four);
  assert.deepStrictEqual(four, ['0|for x in xs :', '1|if x :', '2|print ( x )']);
  assert.notDeepStrictEqual(norms('if a:\n    b = 1\nc = 2'), norms('if a:\n    b = 1\n    c = 2'));
});

test('a uniformly indented snippet starts at level 0', () => {
  assert.deepStrictEqual(norms('    x = 1\n    y = 2'), ['0|x = 1', '0|y = 2']);
});

test('bracket and backslash continuations form one logical line', () => {
  const wrapped = L.normalizeCode('m = GridSearchCV(pipe,\n                 param_grid=grid,\n                 cv=5)\nt = a + \\\n    b\n');
  assert.strictEqual(wrapped.length, 2);
  assert.deepStrictEqual([wrapped[0].first, wrapped[0].last, wrapped[1].first, wrapped[1].last], [0, 2, 3, 4]);
  assert.deepStrictEqual(norms('m = GridSearchCV(pipe,\n    param_grid=grid,\n    cv=5,\n)'), norms('m = GridSearchCV(pipe, param_grid=grid, cv=5)'));
});

test('a trailing comma is dropped except in a one-element tuple', () => {
  assert.deepStrictEqual(norms('x = [1, 2,]'), norms('x = [1, 2]'));
  assert.notDeepStrictEqual(norms('x = (1,)'), norms('x = (1)'));
});

test('float literals are compared by value form', () => {
  assert.deepStrictEqual(norms('t = 0.20'), norms('t = 0.2'));
  assert.deepStrictEqual(norms('t = .5'), norms('t = 0.5'));
  assert.notDeepStrictEqual(norms('t = 0.2'), norms('t = 0.3'));
});

test('an unclosed bracket does not swallow the following statements', () => {
  // `for` may continue an expression (comprehension), `return` cannot.
  assert.strictEqual(L.normalizeCode('x = foo(1, 2\nfor i in x:\n    return i\n').length, 2);
  assert.deepStrictEqual(norms('x = foo(1, 2\nreturn x\n'), ['0|x = foo ( 1 , 2', '0|return x']);
});

test('semicolons split statements', () => {
  assert.deepStrictEqual(norms('a = 1; b = 2'), ['0|a = 1', '0|b = 2']);
});

test('fragments of the fill-in mode compare without indentation', () => {
  assert.ok(L.fragmentsEqual('        total += x', 'total+=x'));
  assert.ok(L.fragmentsEqual("kf = KFold(n_splits=5, shuffle=True)", 'kf=KFold( n_splits = 5 ,shuffle = True )  # c'));
  assert.ok(!L.fragmentsEqual('total += x', 'total -= x'));
  assert.ok(!L.fragmentsEqual('total += x', ''));
});

// ---------------------------------------------------------------- diff

const REFERENCE = [
  'import numpy as np',
  'from sklearn.svm import SVC',
  '',
  'def train(X, y):',
  '    model = SVC(kernel="rbf", C=1.0)',
  '    model.fit(X, y)',
  '    return model',
  '',
  'print(train(X, y))'
].join('\n');
const KEY_LINES = [4, 5];

test('identical code (different comments, spacing, quotes) scores 100 %', () => {
  const user = "import numpy as np\nfrom sklearn.svm import SVC\n# my comment\ndef train(X,y):\n  model=SVC(kernel='rbf',C=1.0)\n  model.fit(X, y)\n\n  return model\nprint( train(X, y) )\n";
  const diff = L.diffCode(REFERENCE, user, KEY_LINES);
  assert.strictEqual(diff.score, 1);
  assert.strictEqual(diff.percent, 100);
  assert.ok(diff.rows.every((row) => row.type === 'ok'));
  assert.strictEqual(diff.refLines, 7);
});

test('empty code scores 0 and every reference line is missing', () => {
  const diff = L.diffCode(REFERENCE, '', KEY_LINES);
  assert.strictEqual(diff.score, 0);
  assert.strictEqual(diff.counts.missing, 7);
});

test('a missing key line costs double', () => {
  const user = REFERENCE.split('\n').filter((line, index) => index !== 5).join('\n');
  const diff = L.diffCode(REFERENCE, user, KEY_LINES);
  // 7 lines, 2 of them key: total weight 9, the missing key line is worth 2.
  assert.strictEqual(diff.counts.missing, 1);
  assert.ok(Math.abs(diff.score - 7 / 9) < 1e-9);
  assert.strictEqual(diff.percent, 77);
  const row = diff.rows.find((r) => r.type === 'missing');
  assert.strictEqual(row.isKey, true);
  assert.strictEqual(row.refLine.raw, '    model.fit(X, y)');
});

test('a line with a small mistake is a near match with token-level parts', () => {
  const user = REFERENCE.replace('C=1.0', 'C=10');
  const diff = L.diffCode(REFERENCE, user, KEY_LINES);
  const row = diff.rows.find((r) => r.type === 'near');
  assert.ok(row, 'near row expected');
  assert.ok(row.sim >= L.NEAR_THRESHOLD && row.sim < 1);
  assert.strictEqual(row.indentDiff, false);
  assert.deepStrictEqual(row.userParts.filter((p) => p.kind === 'diff').map((p) => p.text), ['10']);
  assert.deepStrictEqual(row.refParts.filter((p) => p.kind === 'diff').map((p) => p.text), ['1.0']);
  assert.strictEqual(row.userParts.map((p) => p.text || '').join(''), '    model = SVC(kernel="rbf", C=10)');
  assert.strictEqual(diff.counts.missing, 0);
  assert.ok(Math.abs(diff.score - 7 / 9) < 1e-9, 'a near match earns nothing');
});

test('missing tokens are marked by a gap in the user line', () => {
  const diff = L.diffCode('model = SVC(kernel="rbf", C=1.0, gamma=0.1)', 'model = SVC(kernel="rbf", C=1.0)', []);
  const row = diff.rows[0];
  assert.strictEqual(row.type, 'near');
  assert.ok(row.userParts.some((p) => p.gap));
  assert.ok(!row.userParts.some((p) => p.kind === 'diff'));
});

test('wrong indentation alone is a near match flagged as indentation', () => {
  const user = REFERENCE.replace('    return model', 'return model');
  const row = L.diffCode(REFERENCE, user, KEY_LINES).rows.find((r) => r.type === 'near');
  assert.ok(row && row.indentDiff && !row.tokensDiffer);
});

test('an unrelated line is extra and does not lower the score', () => {
  const user = REFERENCE + '\nplt.show()\n';
  const diff = L.diffCode(REFERENCE, user, KEY_LINES);
  assert.strictEqual(diff.counts.extra, 1);
  assert.strictEqual(diff.score, 1);
});

test('swapped imports count fully, other misplaced lines half', () => {
  const lines = REFERENCE.split('\n');
  const swappedImports = [lines[1], lines[0]].concat(lines.slice(2)).join('\n');
  const first = L.diffCode(REFERENCE, swappedImports, KEY_LINES);
  assert.strictEqual(first.counts.moved, 1);
  assert.strictEqual(first.counts.extra, 0);
  assert.strictEqual(first.score, 1);

  const reference = 'a = 1\nb = 2\nc = 3\nd = 4';
  const second = L.diffCode(reference, 'b = 2\na = 1\nc = 3\nd = 4', []);
  assert.strictEqual(second.counts.moved, 1);
  assert.ok(Math.abs(second.score - 3.5 / 4) < 1e-9);
});

test('rows keep the reference order and cover every reference line once', () => {
  const user = 'import numpy as np\nx = 5\ndef train(X, y):\n    model.fit(X, y)\n    return model\n';
  const diff = L.diffCode(REFERENCE, user, KEY_LINES);
  const refs = diff.rows.filter((r) => r.ref !== null).map((r) => r.ref);
  assert.deepStrictEqual(refs, [0, 1, 2, 3, 4, 5, 6]);
  const users = diff.rows.filter((r) => r.user !== null).map((r) => r.user).sort();
  assert.deepStrictEqual(users, [0, 1, 2, 3, 4]);
});

test('a key marker on a continuation line makes the whole logical line key', () => {
  const reference = 'a = 1\nb = f(1,\n      2)\nc = 3';
  const diff = L.diffCode(reference, 'a = 1\nc = 3', [2]);
  assert.strictEqual(diff.rows[1].type, 'missing');
  assert.strictEqual(diff.rows[1].isKey, true);
  assert.ok(Math.abs(diff.score - 2 / 4) < 1e-9);
});

test('token similarity is symmetric and bounded', () => {
  assert.strictEqual(L.tokenSimilarity(['a', '=', '1'], ['a', '=', '1']), 1);
  assert.strictEqual(L.tokenSimilarity(['a'], ['b']), 0);
  assert.strictEqual(L.tokenSimilarity(['a', 'b', 'c', 'd'], ['a', 'b']), L.tokenSimilarity(['a', 'b'], ['a', 'b', 'c', 'd']));
});

// ---------------------------------------------------------------- editor

function applyEdit(value, start, end, key, shift) {
  const edit = L.editorEdit(value, start, end, key, shift);
  if (!edit) return null;
  return { value: value.slice(0, edit.from) + edit.text + value.slice(edit.to), selStart: edit.selStart, selEnd: edit.selEnd };
}

test('Tab inserts four spaces', () => {
  assert.deepStrictEqual(applyEdit('ab', 1, 1, 'Tab', false), { value: 'a    b', selStart: 5, selEnd: 5 });
});

test('Tab indents and Shift+Tab unindents every selected line', () => {
  const indented = applyEdit('a\nb\nc', 0, 3, 'Tab', false);
  assert.strictEqual(indented.value, '    a\n    b\nc');
  assert.deepStrictEqual([indented.selStart, indented.selEnd], [4, 11]);
  const back = applyEdit('    a\n  b\nc', 2, 9, 'Tab', true);
  assert.strictEqual(back.value, 'a\nb\nc');
  assert.deepStrictEqual([back.selStart, back.selEnd], [0, 3]);
});

test('Shift+Tab on one line removes at most four spaces', () => {
  assert.strictEqual(applyEdit('      x', 7, 7, 'Tab', true).value, '  x');
  assert.strictEqual(applyEdit('x', 1, 1, 'Tab', true).value, 'x');
});

test('Enter keeps the indentation and adds a level after a colon', () => {
  assert.strictEqual(applyEdit('    x = 1', 9, 9, 'Enter', false).value, '    x = 1\n    ');
  assert.strictEqual(applyEdit('for x in xs:', 12, 12, 'Enter', false).value, 'for x in xs:\n    ');
  assert.strictEqual(applyEdit('    if a:  # why', 16, 16, 'Enter', false).value, '    if a:  # why\n        ');
  assert.strictEqual(applyEdit('d = {"a": 1}', 12, 12, 'Enter', false).value, 'd = {"a": 1}\n');
  assert.strictEqual(applyEdit('s = "a:"', 8, 8, 'Enter', false).value, 's = "a:"\n');
});

test('Backspace in the indentation deletes to the previous tab stop', () => {
  assert.strictEqual(applyEdit('        x', 8, 8, 'Backspace', false).value, '    x');
  assert.strictEqual(applyEdit('      x', 6, 6, 'Backspace', false).value, '    x');
  assert.strictEqual(L.editorEdit('ab', 2, 2, 'Backspace', false), null);
});

// ---------------------------------------------------------------- scoring

test('an answer is correct only when the ticks equal the correct set', () => {
  const q = question('q', 'theory', 't1', 'moodle', [true, false, true, false]);
  assert.strictEqual(L.isAnswerCorrect(q, [0, 2]), true);
  assert.strictEqual(L.isAnswerCorrect(q, [2, 0]), true);
  assert.strictEqual(L.isAnswerCorrect(q, [0]), false, 'a missing correct tick');
  assert.strictEqual(L.isAnswerCorrect(q, [0, 1, 2]), false, 'one wrong tick');
  assert.strictEqual(L.isAnswerCorrect(q, []), false);
  assert.deepStrictEqual(L.correctIndexes(q), [0, 2]);
});

test('a question where every option is correct needs every tick', () => {
  const q = question('qz', 'theory', 't1', 'quizlet', [true, true, true, true]);
  assert.deepStrictEqual(L.correctIndexes(q), [0, 1, 2, 3]);
  assert.strictEqual(L.isAnswerCorrect(q, [0, 1, 2, 3]), true);
  assert.strictEqual(L.isAnswerCorrect(q, [3, 1, 0, 2]), true);
  assert.strictEqual(L.isAnswerCorrect(q, [0, 1, 2]), false);
  assert.strictEqual(L.isAnswerCorrect(q, []), false);
  // It can be drawn into a test and graded like any other question.
  const picked = L.composeTest([q], { count: 15 }, L.mulberry32(1));
  assert.deepStrictEqual(picked.map((p) => p.id), ['qz']);
  assert.deepStrictEqual(L.distributePoints(picked.map((p) => p.type), 100), [100]);
  const grade = L.gradeItems([{ points: 100, ok: L.isAnswerCorrect(q, [0, 1, 2, 3]), type: q.type, topic: q.topicId }]);
  assert.strictEqual(grade.points, 100);
  const single = question('one', 'theory', 't1', 'quizlet', [true]);
  assert.strictEqual(L.isAnswerCorrect(single, [0]), true);
  assert.strictEqual(L.isAnswerCorrect(single, []), false);
});

test('5 practical + 10 theory questions get 8 and 6 points', () => {
  const types = Array(5).fill('practical').concat(Array(10).fill('theory'));
  const points = L.distributePoints(types, 100);
  assert.deepStrictEqual(points, Array(5).fill(8).concat(Array(10).fill(6)));
});

test('points always sum to the total and practical questions never get less', () => {
  for (let practical = 0; practical <= 12; practical++) {
    for (let theory = 0; theory <= 20; theory++) {
      if (practical + theory === 0) continue;
      const types = L.shuffle(Array(practical).fill('practical').concat(Array(theory).fill('theory')), L.mulberry32(practical * 31 + theory));
      const points = L.distributePoints(types, 100);
      assert.strictEqual(points.reduce((a, b) => a + b, 0), 100, practical + 'P + ' + theory + 'T');
      const minPractical = Math.min(...points.filter((p, i) => types[i] === 'practical'), Infinity);
      const maxTheory = Math.max(...points.filter((p, i) => types[i] === 'theory'), -Infinity);
      assert.ok(minPractical >= maxTheory, practical + 'P + ' + theory + 'T: ' + points.join(','));
      assert.ok(Math.max(...points) - Math.min(...points) <= Math.ceil(100 / types.length / 3) + 1);
    }
  }
  assert.deepStrictEqual(L.distributePoints([], 100), []);
  assert.deepStrictEqual(L.distributePoints(['theory', 'theory', 'theory'], 100), [34, 33, 33]);
});

test('grading sums points per type and topic', () => {
  const grade = L.gradeItems([
    { points: 8, ok: true, type: 'practical', topic: 't1' },
    { points: 6, ok: false, type: 'theory', topic: 't1' },
    { points: 6, ok: true, type: 'theory', topic: null }
  ]);
  assert.deepStrictEqual([grade.points, grade.max, grade.correct, grade.total], [14, 20, 2, 3]);
  assert.deepStrictEqual(grade.byType.theory, { points: 6, max: 12, correct: 1, total: 2 });
  assert.deepStrictEqual(grade.byTopic.t1, { points: 8, max: 14, correct: 1, total: 2 });
  assert.deepStrictEqual(grade.byTopic[L.NO_TOPIC], { points: 6, max: 6, correct: 1, total: 1 });
});

// ---------------------------------------------------------------- test composition

function bank(topics, theoryPerTopic, practicalPerTopic) {
  const questions = [];
  for (let t = 1; t <= topics; t++) {
    for (let i = 0; i < theoryPerTopic; i++) questions.push(question('t' + t + '-th' + i, 'theory', 't' + t, i % 2 ? 'quizlet' : 'moodle'));
    for (let i = 0; i < practicalPerTopic; i++) questions.push(question('t' + t + '-pr' + i, 'practical', 't' + t));
  }
  return questions;
}

test('default test has 10 theory + 5 practical questions spread over all topics', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const picked = L.composeTest(bank(8, 6, 4), { count: 15 }, L.mulberry32(seed));
    assert.strictEqual(picked.length, 15);
    assert.strictEqual(new Set(picked.map((q) => q.id)).size, 15, 'no question twice');
    assert.strictEqual(picked.filter((q) => q.type === 'practical').length, 5);
    const perTopic = {};
    picked.forEach((q) => { perTopic[q.topicId] = (perTopic[q.topicId] || 0) + 1; });
    assert.strictEqual(Object.keys(perTopic).length, 8, 'every topic is present');
    assert.ok(Math.max(...Object.values(perTopic)) <= 2);
  }
});

test('a missing type is filled from the other one and a small bank gives a shorter test', () => {
  const noPractical = L.composeTest(bank(4, 10, 0), { count: 15 }, L.mulberry32(3));
  assert.strictEqual(noPractical.length, 15);
  assert.ok(noPractical.every((q) => q.type === 'theory'));
  const fewTheory = L.composeTest(bank(2, 1, 10), { count: 15 }, L.mulberry32(3));
  assert.strictEqual(fewTheory.filter((q) => q.type === 'theory').length, 2);
  assert.strictEqual(fewTheory.length, 15);
  assert.strictEqual(L.composeTest(bank(1, 2, 1), { count: 15 }, L.mulberry32(3)).length, 3);
});

test('topic and source restrictions are respected', () => {
  const picked = L.composeTest(bank(8, 6, 4), { count: 15, topics: ['t1', 't2'], sources: ['moodle'] }, L.mulberry32(9));
  assert.ok(picked.length > 0);
  assert.ok(picked.every((q) => (q.topicId === 't1' || q.topicId === 't2') && q.source === 'moodle'));
});

test('the same seed gives the same test, another seed a different one', () => {
  const ids = (seed) => L.composeTest(bank(8, 6, 4), { count: 15 }, L.mulberry32(seed)).map((q) => q.id).join();
  assert.strictEqual(ids(5), ids(5));
  assert.notStrictEqual(ids(5), ids(6));
});

// ---------------------------------------------------------------- practice scheduling

test('practice order: unseen, then last wrong (most recent first), then weakest', () => {
  const questions = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => question(id, 'theory', 't1'));
  const stats = {
    b: { seen: 3, right: 3, wrong: 0, last: 1, lastAt: 50 },
    c: { seen: 2, right: 1, wrong: 1, last: 0, lastAt: 100 },
    d: { seen: 1, right: 0, wrong: 1, last: 0, lastAt: 200 },
    e: { seen: 4, right: 2, wrong: 2, last: 1, lastAt: 300 }
  };
  for (let seed = 1; seed <= 10; seed++) {
    const order = L.orderPractice(questions, stats, L.mulberry32(seed)).map((q) => q.id);
    assert.deepStrictEqual(order.slice(0, 2).sort(), ['a', 'f']);
    assert.deepStrictEqual(order.slice(2), ['d', 'c', 'e', 'b']);
  }
});

test('filters by topic, week, type, source, state and ids', () => {
  const questions = [
    Object.assign(question('a', 'theory', 't1', 'moodle'), { week: 1 }),
    Object.assign(question('b', 'practical', 't1', 'quizlet'), { week: 2 }),
    Object.assign(question('c', 'theory', 't2', 'moodle'), { week: null }),
    Object.assign(question('d', 'theory', null, 'quizlet'), { week: 2 })
  ];
  const stats = { a: { seen: 1, right: 0, wrong: 1, last: 0 }, b: { seen: 2, right: 2, wrong: 0, last: 1 } };
  const ids = (filters) => L.filterQuestions(questions, filters, stats).map((q) => q.id).join('');
  assert.strictEqual(ids({}), 'abcd');
  assert.strictEqual(ids({ topic: 't1' }), 'ab');
  assert.strictEqual(ids({ topic: L.NO_TOPIC }), 'd');
  assert.strictEqual(ids({ week: '2' }), 'bd');
  assert.strictEqual(ids({ type: 'practical' }), 'b');
  assert.strictEqual(ids({ source: 'quizlet' }), 'bd');
  assert.strictEqual(ids({ state: 'unseen' }), 'cd');
  assert.strictEqual(ids({ state: 'wrong' }), 'a');
  assert.strictEqual(ids({ ids: ['c', 'a'] }), 'ac');
});

test('question stats count answers and remember the last result', () => {
  let stat = L.updateQuestionStat(undefined, false, 10);
  stat = L.updateQuestionStat(stat, true, 20);
  assert.deepStrictEqual(stat, { seen: 2, right: 1, wrong: 1, last: 1, lastAt: 20 });
  const progress = L.questionProgress([question('a'), question('b')], { a: stat });
  assert.deepStrictEqual(progress, { total: 2, seen: 1, answers: 2, right: 1, accuracy: 0.5 });
  assert.strictEqual(L.questionProgress([question('a')], {}).accuracy, null);
});

test('weak questions are the ones still answered wrong', () => {
  const questions = ['a', 'b', 'c'].map((id) => question(id, 'theory', 't1'));
  const stats = {
    a: { seen: 5, right: 5, wrong: 0, last: 1, lastAt: 1 },
    b: { seen: 4, right: 1, wrong: 3, last: 1, lastAt: 2 },
    c: { seen: 2, right: 1, wrong: 1, last: 0, lastAt: 3 }
  };
  assert.deepStrictEqual(L.weakQuestions(questions, stats, 5).map((q) => q.id), ['b', 'c']);
});

// ---------------------------------------------------------------- code exercise stats

test('an exercise is mastered at 90 % without hints only', () => {
  let stat = L.updateCodeStat(undefined, 0.95, false, 1);
  assert.strictEqual(stat.mastered, false);
  assert.strictEqual(L.codeStatus(stat), 'progress');
  stat = L.updateCodeStat(stat, 0.89, true, 2);
  assert.strictEqual(stat.mastered, false);
  stat = L.updateCodeStat(stat, 0.9, true, 3);
  assert.strictEqual(stat.mastered, true);
  assert.deepStrictEqual([stat.attempts, stat.best, stat.bestClean, stat.last], [3, 0.95, 0.9, 0.9]);
  assert.strictEqual(L.codeStatus(stat), 'mastered');
  assert.strictEqual(L.codeStatus(undefined), 'new');
});

test('fill-in mode blanks the key lines, or picks statements when none is marked', () => {
  assert.deepStrictEqual(L.fillLines('a\nb\nc', [2, 0]), [2, 0]);
  const picked = L.fillLines('import x\n\n# c\na = 1\nb = 2\nc = 3\nd = 4\ne = 5', []);
  assert.deepStrictEqual(picked, [4, 7]);
});

// ---------------------------------------------------------------- misc

test('inline text is escaped before backticks become code', () => {
  assert.strictEqual(L.inlineHtml('a < b `x<y` & "q"'), 'a &lt; b <code>x&lt;y</code> &amp; &quot;q&quot;');
  assert.strictEqual(L.inlineHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('clock formatting', () => {
  assert.strictEqual(L.formatClock(2700), '45:00');
  assert.strictEqual(L.formatClock(299.2), '05:00');
  assert.strictEqual(L.formatClock(-5), '00:00');
  assert.strictEqual(L.formatClock(61), '01:01');
});

test('search ignores case and diacritics and needs every word', () => {
  const sections = [
    { id: 'a', title: 'Krížová validácia', text: 'K-fold rozdelí dáta na K častí a každá je raz validačná.' },
    { id: 'b', title: 'Škálovanie', text: 'StandardScaler odčíta priemer a vydelí smerodajnou odchýlkou.' }
  ];
  const hits = L.searchSections(sections, 'VALIDACIA k-fold');
  assert.strictEqual(hits.length, 1);
  assert.strictEqual(hits[0].section.id, 'a');
  assert.ok(hits[0].marks.length >= 1);
  const [from, to] = hits[0].marks[0];
  assert.strictEqual(L.fold(hits[0].snippet.slice(from, to)), 'k-fold');
  assert.strictEqual(L.searchSections(sections, 'priemer').length, 1);
  assert.strictEqual(L.searchSections(sections, 'priemer k-fold').length, 0);
  assert.strictEqual(L.searchSections(sections, 'a').length, 0, 'one-letter queries are ignored');
  assert.strictEqual(L.fold('Šťastný ĽUBOŠ').length, 'Šťastný ĽUBOŠ'.length);
});

test('question hash changes with the options', () => {
  const a = question('a', 'theory', 't1');
  const b = question('a', 'theory', 't1', 'moodle', [false, true, false, false]);
  assert.notStrictEqual(L.questionHash(a), L.questionHash(b));
  assert.strictEqual(L.questionHash(a), L.questionHash(question('a', 'theory', 't1')));
});

console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
