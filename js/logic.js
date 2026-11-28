// Pure logic of the app: no DOM, no storage. Loaded by the browser (global ISILogic) and by Node (module.exports).
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.ISILogic = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ---------------------------------------------------------------- utilities

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(items, rng) {
    const random = rng || Math.random;
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
    return result;
  }

  // FNV-1a; detects that a question changed after an attempt was stored.
  function hashString(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
  }

  function questionHash(question) {
    return hashString(question.text + '\u0001' + (question.code || '') + '\u0001' +
      question.options.map(function (o) { return (o.correct ? '+' : '-') + o.text; }).join('\u0001'));
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  // Question texts: HTML-escaped, `backtick` spans become <code>.
  function inlineHtml(text) {
    return escapeHtml(text == null ? '' : text).replace(/`([^`\n]+)`/g, '<code>$1</code>');
  }

  function formatClock(seconds) {
    const total = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // Lower-case without diacritics; keeps the length so that match positions fit the original text.
  function fold(text) {
    let out = '';
    for (const ch of String(text)) {
      const base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      out += base.length === ch.length ? base : ch;
    }
    return out;
  }

  // ---------------------------------------------------------------- Python tokenizer

  const KEYWORDS = new Set(['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del',
    'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
    'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']);
  const CONSTANTS = new Set(['True', 'False', 'None']);
  const BUILTINS = new Set(['abs', 'all', 'any', 'bool', 'bytes', 'callable', 'chr', 'dict', 'dir', 'divmod',
    'enumerate', 'filter', 'float', 'format', 'frozenset', 'getattr', 'hasattr', 'hash', 'id', 'input', 'int',
    'isinstance', 'issubclass', 'iter', 'len', 'list', 'map', 'max', 'min', 'next', 'object', 'open', 'ord', 'pow',
    'print', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 'str', 'sum', 'super',
    'tuple', 'type', 'vars', 'zip', 'Exception', 'ValueError', 'KeyError', 'IndexError', 'TypeError',
    'StopIteration', 'ZeroDivisionError', 'NotImplementedError']);

  const RE_STRING = /[rRbBuUfF]{0,2}('''|"""|'|")/y;
  const RE_NUMBER = /(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?[jJ]?)/y;
  const RE_NAME = /[A-Za-z_\u00a0-\uffff][A-Za-z0-9_\u00a0-\uffff]*/y;
  const RE_OPERATOR = /\*\*=|\/\/=|>>=|<<=|\.\.\.|\*\*|\/\/|>>|<<|<=|>=|==|!=|->|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|@=|:=|[^\s]/y;

  function matchAt(regex, text, index) {
    regex.lastIndex = index;
    const m = regex.exec(text);
    return m ? m[0] : null;
  }

  // Tokens: { t: 'ws' | 'nl' | 'cont' | 'com' | 'str' | 'num' | 'name' | 'op', s: text, i: offset }.
  function tokenizePython(source) {
    const s = String(source).replace(/\r\n?/g, '\n');
    const out = [];
    const n = s.length;
    let i = 0;
    while (i < n) {
      const c = s[i];
      let j = i + 1;
      let type;
      if (c === '\n') {
        type = 'nl';
      } else if (c === ' ' || c === '\t' || c === '\f') {
        while (j < n && (s[j] === ' ' || s[j] === '\t' || s[j] === '\f')) j++;
        type = 'ws';
      } else if (c === '#') {
        j = s.indexOf('\n', i);
        if (j < 0) j = n;
        type = 'com';
      } else if (c === '\\' && s[i + 1] === '\n') {
        j = i + 2;
        type = 'cont';
      } else {
        RE_STRING.lastIndex = i;
        const opening = RE_STRING.exec(s);
        if (opening) {
          const quote = opening[1];
          j = i + opening[0].length;
          while (j < n) {
            if (s[j] === '\\') {
              j += 2;
            } else if (s.startsWith(quote, j)) {
              j += quote.length;
              break;
            } else if (quote.length === 1 && s[j] === '\n') {
              break;
            } else {
              j++;
            }
          }
          if (j > n) j = n;
          type = 'str';
        } else {
          const number = (c >= '0' && c <= '9') || (c === '.' && s[i + 1] >= '0' && s[i + 1] <= '9')
            ? matchAt(RE_NUMBER, s, i) : null;
          if (number) {
            j = i + number.length;
            type = 'num';
          } else {
            const name = matchAt(RE_NAME, s, i);
            if (name) {
              j = i + name.length;
              type = 'name';
            } else {
              j = i + (matchAt(RE_OPERATOR, s, i) || c).length;
              type = 'op';
            }
          }
        }
      }
      out.push({ t: type, s: s.slice(i, j), i: i });
      i = j;
    }
    return out;
  }

  // ---------------------------------------------------------------- syntax highlighter

  // Returns the highlighted HTML of every physical line.
  function highlightPython(source) {
    const tokens = tokenizePython(source);
    const lines = [''];
    let previous = null;
    let lineHasCode = false;
    let decorator = false;

    function emit(text, cls) {
      const pieces = text.split('\n');
      for (let p = 0; p < pieces.length; p++) {
        if (p > 0) lines.push('');
        if (pieces[p]) {
          const escaped = escapeHtml(pieces[p]);
          lines[lines.length - 1] += cls ? '<span class="tk-' + cls + '">' + escaped + '</span>' : escaped;
        }
      }
    }

    for (let k = 0; k < tokens.length; k++) {
      const tok = tokens[k];
      let cls = null;
      if (tok.t === 'nl') {
        lines.push('');
        lineHasCode = false;
        decorator = false;
        continue;
      }
      if (tok.t === 'com') cls = 'com';
      else if (tok.t === 'str') cls = 'str';
      else if (tok.t === 'num') cls = 'num';
      else if (tok.t === 'name') {
        if (previous && previous.t === 'name' && (previous.s === 'def' || previous.s === 'class')) cls = 'def';
        else if (decorator) cls = 'dec';
        else if (KEYWORDS.has(tok.s)) cls = 'kw';
        else if (CONSTANTS.has(tok.s)) cls = 'const';
        else if (tok.s === 'self' || tok.s === 'cls') cls = 'self';
        else if (BUILTINS.has(tok.s) && !(previous && previous.s === '.')) cls = 'builtin';
      } else if (tok.t === 'op') {
        if (tok.s === '@' && !lineHasCode) decorator = true;
        else if (tok.s !== '.') decorator = false;
        if (decorator) cls = 'dec';
      }
      emit(tok.s, cls);
      if (tok.t !== 'ws' && tok.t !== 'cont' && tok.t !== 'com') {
        previous = tok;
        lineHasCode = true;
      }
    }
    return lines;
  }

  // ---------------------------------------------------------------- code normalisation

  const STATEMENT_START = new Set(['def', 'class', 'import', 'from', 'return', 'while', 'with', 'try', 'except',
    'finally', 'elif', 'pass', 'break', 'continue', 'raise', 'assert', 'del', 'global', 'nonlocal']);

  function normalizeToken(tok) {
    if (tok.t === 'str') {
      const m = /^([A-Za-z]*)('''|"""|'|")/.exec(tok.s);
      const prefix = m[1].toLowerCase().replace(/u/g, '').split('').sort().join('');
      let body = tok.s.slice(m[0].length);
      if (body.endsWith(m[2])) body = body.slice(0, -m[2].length);
      return prefix + '"' + body.replace(/\\(['"])/g, '$1').replace(/'/g, '"') + '"';
    }
    if (tok.t === 'num') {
      let num = tok.s.toLowerCase().replace(/_/g, '');
      if (/^\d*\.\d*$/.test(num)) {
        const parts = num.split('.');
        num = (parts[0] || '0') + '.' + (parts[1].replace(/0+$/, '') || '0');
      }
      return num;
    }
    return tok.s;
  }

  function indentWidth(whitespace) {
    let width = 0;
    for (const ch of whitespace) width += ch === '\t' ? 4 - (width % 4) : 1;
    return width;
  }

  /**
   * Splits code into normalised logical lines: comments, blank lines and docstrings are dropped, bracketed and
   * backslash continuations are joined, quotes are unified and spacing is ignored. A line keeps its indentation
   * level. Result items: { level, tokens: [{ n, t, a, b }], norm, key, first, last, raw, rawStart }.
   */
  function normalizeCode(source) {
    const s = String(source).replace(/\r\n?/g, '\n');
    const tokens = tokenizePython(s);
    const lineStarts = [0];
    for (let i = 0; i < s.length; i++) if (s[i] === '\n') lineStarts.push(i + 1);

    const lines = [];
    const brackets = [];
    let current = null;
    let lineNo = 0;
    let atLineStart = true;
    let pendingIndent = 0;
    let lineIndent = 0;

    function finish() {
      if (current && current.tokens.length) lines.push(current);
      current = null;
      brackets.length = 0;
    }

    for (const tok of tokens) {
      if (tok.t === 'nl') {
        if (!brackets.length) finish();
        lineNo++;
        atLineStart = true;
        pendingIndent = 0;
        continue;
      }
      if (tok.t === 'cont') {
        lineNo++;
        continue;
      }
      if (tok.t === 'ws') {
        if (atLineStart) pendingIndent = indentWidth(tok.s);
        continue;
      }
      if (tok.t === 'com') continue;
      if (atLineStart) {
        atLineStart = false;
        // An unclosed bracket must not swallow the rest of the program.
        if (current && tok.t === 'name' && STATEMENT_START.has(tok.s)) finish();
        if (!current) lineIndent = pendingIndent;
      }
      if (tok.t === 'op' && tok.s === ';' && !brackets.length) {
        finish();
        continue;
      }
      if (!current) current = { indent: lineIndent, tokens: [], first: lineNo, last: lineNo };
      if (tok.t === 'op') {
        if (tok.s === '(' || tok.s === '[' || tok.s === '{') {
          brackets.push({ open: tok.s, commas: 0 });
        } else if (tok.s === ')' || tok.s === ']' || tok.s === '}') {
          const top = brackets.pop();
          const last = current.tokens[current.tokens.length - 1];
          // A trailing comma is noise, except in a one-element tuple.
          if (top && last && last.n === ',' && (top.open !== '(' || top.commas > 1)) current.tokens.pop();
        } else if (tok.s === ',' && brackets.length) {
          brackets[brackets.length - 1].commas++;
        }
      }
      current.tokens.push({ n: normalizeToken(tok), t: tok.t, a: tok.i, b: tok.i + tok.s.length });
      if (tok.t === 'str') lineNo += tok.s.split('\n').length - 1;
      current.last = lineNo;
    }
    finish();

    const code = lines.filter(function (line) {
      return !(line.tokens.length === 1 && line.tokens[0].t === 'str');
    });
    const base = code.reduce(function (min, line) { return Math.min(min, line.indent); }, Infinity);
    const stack = [code.length ? base : 0];
    for (const line of code) {
      while (stack.length > 1 && line.indent < stack[stack.length - 1]) stack.pop();
      if (line.indent > stack[stack.length - 1]) stack.push(line.indent);
      line.level = stack.length - 1;
      line.norm = line.tokens.map(function (t) { return t.n; }).join(' ');
      line.key = line.level + '\u0001' + line.tokens.map(function (t) { return t.n; }).join('\u0001');
      line.rawStart = lineStarts[line.first];
      const end = line.last + 1 < lineStarts.length ? lineStarts[line.last + 1] - 1 : s.length;
      line.raw = s.slice(line.rawStart, end);
    }
    return code;
  }

  // One blanked line of the fill-in mode: indentation is given, so only the tokens count.
  function normalizeFragment(text) {
    return normalizeCode(text).map(function (line) { return line.norm; }).join(' ');
  }

  function fragmentsEqual(reference, input) {
    return normalizeFragment(reference) === normalizeFragment(input);
  }

  // ---------------------------------------------------------------- diff

  // Longest common subsequence; returns the index pairs [i, j].
  function lcsPairs(a, b) {
    const n = a.length;
    const m = b.length;
    const table = [];
    for (let i = 0; i <= n; i++) table.push(new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
    const pairs = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        pairs.push([i, j]);
        i++;
        j++;
      } else if (table[i + 1][j] >= table[i][j + 1]) {
        i++;
      } else {
        j++;
      }
    }
    return pairs;
  }

  function tokenSimilarity(a, b) {
    if (!a.length && !b.length) return 1;
    return (2 * lcsPairs(a, b).length) / (a.length + b.length);
  }

  function tokenTexts(line) {
    return line.tokens.map(function (t) { return t.n; });
  }

  // Pairs the unmatched lines of one gap as near matches, keeping their order.
  function alignGap(refLines, userLines, threshold) {
    const n = refLines.length;
    const m = userLines.length;
    const sim = [];
    for (let a = 0; a < n; a++) {
      sim.push([]);
      for (let b = 0; b < m; b++) sim[a].push(tokenSimilarity(tokenTexts(refLines[a]), tokenTexts(userLines[b])));
    }
    const best = [];
    for (let a = 0; a <= n; a++) best.push(new Array(m + 1).fill(0));
    for (let a = n - 1; a >= 0; a--) {
      for (let b = m - 1; b >= 0; b--) {
        let value = Math.max(best[a + 1][b], best[a][b + 1]);
        if (sim[a][b] >= threshold) value = Math.max(value, sim[a][b] + best[a + 1][b + 1]);
        best[a][b] = value;
      }
    }
    const ops = [];
    let a = 0;
    let b = 0;
    while (a < n || b < m) {
      if (a < n && b < m && sim[a][b] >= threshold && best[a][b] === sim[a][b] + best[a + 1][b + 1]) {
        ops.push({ ref: a, user: b, sim: sim[a][b] });
        a++;
        b++;
      } else if (a < n && (b >= m || best[a][b] === best[a + 1][b])) {
        ops.push({ ref: a, user: null });
        a++;
      } else {
        ops.push({ ref: null, user: b });
        b++;
      }
    }
    return ops;
  }

  // Segments of the raw line: { text, kind: 'plain' | 'same' | 'diff' } and { gap: true } where tokens are missing.
  function lineParts(line, other) {
    const mine = tokenTexts(line);
    const pairs = lcsPairs(mine, tokenTexts(other));
    const matched = new Array(mine.length).fill(false);
    const partner = new Array(mine.length).fill(-1);
    pairs.forEach(function (p) { matched[p[0]] = true; partner[p[0]] = p[1]; });
    const parts = [];
    let position = line.rawStart;
    let otherNext = 0;
    let previousMatched = true;
    function gapIfSkipped(upTo) {
      if (upTo > otherNext && previousMatched) parts.push({ gap: true });
    }
    line.tokens.forEach(function (tok, index) {
      if (tok.a > position) parts.push({ text: line.raw.slice(position - line.rawStart, tok.a - line.rawStart), kind: 'plain' });
      if (matched[index]) {
        gapIfSkipped(partner[index]);
        otherNext = partner[index] + 1;
      }
      parts.push({ text: line.raw.slice(tok.a - line.rawStart, tok.b - line.rawStart), kind: matched[index] ? 'same' : 'diff' });
      previousMatched = matched[index];
      position = tok.b;
    });
    gapIfSkipped(other.tokens.length);
    const rest = line.raw.slice(position - line.rawStart);
    if (rest) parts.push({ text: rest, kind: 'plain' });
    return parts;
  }

  const NEAR_THRESHOLD = 0.7;

  /**
   * Compares the user's code with the reference line by line.
   * Rows (in reference order): { type: 'ok' | 'moved' | 'near' | 'missing' | 'extra', ref, user, isKey, ... }.
   * Score = share of matched reference lines, key lines count double; a line in the wrong place counts half
   * (imports in any order count fully).
   */
  function diffCode(referenceSource, userSource, keyLines) {
    const ref = normalizeCode(referenceSource);
    const user = normalizeCode(userSource);
    const keys = new Set(keyLines || []);
    ref.forEach(function (line) {
      line.isKey = false;
      for (let p = line.first; p <= line.last; p++) if (keys.has(p)) line.isKey = true;
    });

    const anchors = lcsPairs(ref.map(function (l) { return l.key; }), user.map(function (l) { return l.key; }));
    anchors.push([ref.length, user.length]);
    const rows = [];
    let i = 0;
    let j = 0;
    anchors.forEach(function (anchor) {
      alignGap(ref.slice(i, anchor[0]), user.slice(j, anchor[1]), NEAR_THRESHOLD).forEach(function (op) {
        const r = op.ref === null ? null : i + op.ref;
        const u = op.user === null ? null : j + op.user;
        if (r !== null && u !== null) {
          rows.push({
            type: 'near', ref: r, user: u, sim: op.sim,
            indentDiff: ref[r].level !== user[u].level,
            tokensDiffer: ref[r].norm !== user[u].norm,
            userParts: lineParts(user[u], ref[r]),
            refParts: lineParts(ref[r], user[u])
          });
        } else if (r !== null) {
          rows.push({ type: 'missing', ref: r, user: null });
        } else {
          rows.push({ type: 'extra', ref: null, user: u });
        }
      });
      if (anchor[0] < ref.length) rows.push({ type: 'ok', ref: anchor[0], user: anchor[1] });
      i = anchor[0] + 1;
      j = anchor[1] + 1;
    });

    // A missing line that the user wrote elsewhere is right, only misplaced.
    rows.forEach(function (row) {
      if (row.type !== 'missing') return;
      const twin = rows.find(function (other) { return other.type === 'extra' && user[other.user].key === ref[row.ref].key; });
      if (twin) {
        row.type = 'moved';
        row.user = twin.user;
        twin.type = 'dropped';
      }
    });

    let total = 0;
    let earned = 0;
    const counts = { ok: 0, moved: 0, near: 0, missing: 0, extra: 0 };
    const result = rows.filter(function (row) { return row.type !== 'dropped'; });
    result.forEach(function (row) {
      counts[row.type]++;
      row.refLine = row.ref === null ? null : ref[row.ref];
      row.userLine = row.user === null ? null : user[row.user];
      row.isKey = !!(row.refLine && row.refLine.isKey);
      if (!row.refLine) return;
      const weight = row.isKey ? 2 : 1;
      total += weight;
      if (row.type === 'ok') {
        earned += weight;
      } else if (row.type === 'moved') {
        const first = row.refLine.tokens[0].n;
        earned += first === 'import' || first === 'from' ? weight : weight / 2;
      }
    });
    const score = total ? earned / total : 0;
    return { rows: result, score: score, percent: Math.floor(score * 100 + 1e-9), counts: counts, refLines: ref.length };
  }

  const MASTERY_SCORE = 0.9;

  // ---------------------------------------------------------------- code editor keys

  const INDENT = '    ';

  /**
   * Editing rules of the code editor. Returns null (default behaviour) or
   * { from, to, text, selStart, selEnd }: replace [from, to) with text, then select [selStart, selEnd).
   */
  function editorEdit(value, start, end, key, shift) {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    if (key === 'Enter') {
      const before = value.slice(lineStart, start);
      let indent = /^[ \t]*/.exec(before)[0].replace(/\t/g, INDENT);
      const significant = tokenizePython(before).filter(function (t) { return t.t !== 'ws' && t.t !== 'com'; });
      if (significant.length && significant[significant.length - 1].s === ':') indent += INDENT;
      const text = '\n' + indent;
      return { from: start, to: end, text: text, selStart: start + text.length, selEnd: start + text.length };
    }
    if (key === 'Tab') {
      const multiLine = value.slice(start, end).indexOf('\n') >= 0;
      if (!shift && !multiLine) {
        return { from: start, to: end, text: INDENT, selStart: start + 4, selEnd: start + 4 };
      }
      // A selection ending at the start of a line does not include that line.
      const lastChar = end > start && value[end - 1] === '\n' ? end - 1 : end;
      let blockEnd = value.indexOf('\n', lastChar);
      if (blockEnd < 0) blockEnd = value.length;
      const lines = value.slice(lineStart, blockEnd).split('\n');
      let firstDelta = 0;
      let totalDelta = 0;
      const changed = lines.map(function (line, index) {
        let next;
        if (shift) {
          next = line.replace(/^ {1,4}/, '');
        } else {
          next = line.length ? INDENT + line : line;
        }
        const delta = next.length - line.length;
        if (index === 0) firstDelta = delta;
        totalDelta += delta;
        return next;
      });
      if (!totalDelta) return { from: start, to: start, text: '', selStart: start, selEnd: end };
      return {
        from: lineStart, to: blockEnd, text: changed.join('\n'),
        selStart: Math.max(lineStart, start + firstDelta), selEnd: Math.max(lineStart, end + totalDelta)
      };
    }
    if (key === 'Backspace' && start === end) {
      const before = value.slice(lineStart, start);
      if (before.length && /^ +$/.test(before)) {
        const remove = ((before.length - 1) % 4) + 1;
        return { from: start - remove, to: start, text: '', selStart: start - remove, selEnd: start - remove };
      }
    }
    return null;
  }

  // ---------------------------------------------------------------- questions

  const NO_TOPIC = '_none';

  function topicKey(question) {
    return question.topicId || NO_TOPIC;
  }

  function correctIndexes(question) {
    const result = [];
    question.options.forEach(function (option, index) { if (option.correct) result.push(index); });
    return result;
  }

  // All or nothing: every correct option ticked and no wrong one.
  function isAnswerCorrect(question, selected) {
    const picked = new Set(selected);
    return question.options.every(function (option, index) { return option.correct === picked.has(index); });
  }

  function emptyStat() {
    return { seen: 0, right: 0, wrong: 0, last: null, lastAt: 0 };
  }

  function updateQuestionStat(stat, correct, now) {
    const next = Object.assign(emptyStat(), stat || {});
    next.seen++;
    if (correct) next.right++; else next.wrong++;
    next.last = correct ? 1 : 0;
    next.lastAt = now;
    return next;
  }

  // filters: { topic, week, type, source, state: 'all' | 'unseen' | 'wrong', ids }
  function filterQuestions(questions, filters, stats) {
    const f = filters || {};
    const ids = f.ids ? new Set(f.ids) : null;
    return questions.filter(function (q) {
      const stat = (stats || {})[q.id];
      if (ids && !ids.has(q.id)) return false;
      if (f.topic && topicKey(q) !== f.topic) return false;
      if (f.week && q.week !== Number(f.week)) return false;
      if (f.type && q.type !== f.type) return false;
      if (f.source && q.source !== f.source) return false;
      if (f.state === 'unseen' && stat && stat.seen) return false;
      if (f.state === 'wrong' && !(stat && stat.seen && stat.last === 0)) return false;
      return true;
    });
  }

  // Unseen first, then the ones answered wrong last time (most recent first), then the weakest and oldest.
  function orderPractice(questions, stats, rng) {
    function rank(q) {
      const stat = (stats || {})[q.id];
      if (!stat || !stat.seen) return [0, 0, 0];
      if (stat.last === 0) return [1, -stat.lastAt, 0];
      return [2, stat.right / stat.seen, stat.lastAt];
    }
    return shuffle(questions, rng)
      .map(function (q) { return { q: q, rank: rank(q) }; })
      .sort(function (x, y) {
        for (let k = 0; k < 3; k++) if (x.rank[k] !== y.rank[k]) return x.rank[k] - y.rank[k];
        return 0;
      })
      .map(function (item) { return item.q; });
  }

  // Questions answered wrong at least once that are not yet reliably known.
  function weakQuestions(questions, stats, limit) {
    return questions
      .map(function (q) { return { q: q, stat: (stats || {})[q.id] }; })
      .filter(function (item) {
        return item.stat && item.stat.wrong > 0 && (item.stat.last === 0 || item.stat.right / item.stat.seen < 0.6);
      })
      .sort(function (x, y) {
        return x.stat.right / x.stat.seen - y.stat.right / y.stat.seen || y.stat.wrong - x.stat.wrong ||
          y.stat.lastAt - x.stat.lastAt;
      })
      .slice(0, limit || 10)
      .map(function (item) { return item.q; });
  }

  // { total, seen, answers, right, accuracy (null without answers) }
  function questionProgress(questions, stats) {
    const result = { total: questions.length, seen: 0, answers: 0, right: 0, accuracy: null };
    questions.forEach(function (q) {
      const stat = (stats || {})[q.id];
      if (!stat || !stat.seen) return;
      result.seen++;
      result.answers += stat.seen;
      result.right += stat.right;
    });
    if (result.answers) result.accuracy = result.right / result.answers;
    return result;
  }

  // ---------------------------------------------------------------- test

  const TEST_DEFAULTS = { count: 15, minutes: 45, points: 100 };
  const POINT_WEIGHTS = { practical: 4, theory: 3 };

  /**
   * Picks the questions of one test: a third practical, the rest theory (15 -> 5 + 10), topics taken in turn
   * (always a topic with the fewest questions so far), random inside a topic, no question twice. A type that
   * runs out is filled from the other one. opts: { count, topics, sources } (null = no restriction).
   */
  function composeTest(questions, opts, rng) {
    const random = rng || Math.random;
    const o = opts || {};
    const count = o.count || TEST_DEFAULTS.count;
    const topics = o.topics ? new Set(o.topics) : null;
    const sources = o.sources ? new Set(o.sources) : null;
    const pools = { theory: new Map(), practical: new Map() };
    questions.forEach(function (q) {
      if (topics && !topics.has(topicKey(q))) return;
      if (sources && !sources.has(q.source)) return;
      const pool = pools[q.type];
      if (!pool) return;
      if (!pool.has(topicKey(q))) pool.set(topicKey(q), []);
      pool.get(topicKey(q)).push(q);
    });
    Object.keys(pools).forEach(function (type) {
      pools[type].forEach(function (list, key) { pools[type].set(key, shuffle(list, random)); });
    });

    const picked = [];
    const perTopic = new Map();
    function take(type, wanted) {
      let taken = 0;
      while (taken < wanted) {
        let candidates = [];
        let fewest = Infinity;
        pools[type].forEach(function (list, key) {
          if (!list.length) return;
          const used = perTopic.get(key) || 0;
          if (used < fewest) {
            fewest = used;
            candidates = [key];
          } else if (used === fewest) {
            candidates.push(key);
          }
        });
        if (!candidates.length) break;
        const key = candidates[Math.floor(random() * candidates.length)];
        picked.push(pools[type].get(key).pop());
        perTopic.set(key, (perTopic.get(key) || 0) + 1);
        taken++;
      }
      return taken;
    }

    const practicalWanted = Math.round(count / 3);
    const theoryWanted = count - practicalWanted;
    const theory = take('theory', theoryWanted);
    const practical = take('practical', practicalWanted);
    if (theory < theoryWanted) take('practical', theoryWanted - theory);
    if (practical < practicalWanted) take('theory', practicalWanted - practical);
    return shuffle(picked, random);
  }

  // Splits `total` points over the questions by type weight; largest remainders get the leftover points.
  function distributePoints(types, total, weights) {
    const sumTotal = total == null ? TEST_DEFAULTS.points : total;
    const w = types.map(function (type) { return (weights || POINT_WEIGHTS)[type] || POINT_WEIGHTS.theory; });
    const sum = w.reduce(function (a, b) { return a + b; }, 0);
    if (!sum) return [];
    const points = w.map(function (x) { return Math.floor((sumTotal * x) / sum); });
    let left = sumTotal - points.reduce(function (a, b) { return a + b; }, 0);
    const order = w.map(function (x, index) { return index; }).sort(function (a, b) {
      return ((sumTotal * w[b]) % sum) - ((sumTotal * w[a]) % sum) || w[b] - w[a] || a - b;
    });
    for (let k = 0; left > 0; k++, left--) points[order[k % order.length]]++;
    return points;
  }

  // items: [{ points, ok, type, topic }] -> totals and breakdowns.
  function gradeItems(items) {
    function bucket() { return { points: 0, max: 0, correct: 0, total: 0 }; }
    const result = Object.assign(bucket(), { byType: {}, byTopic: {} });
    items.forEach(function (item) {
      const groups = [
        result,
        result.byType[item.type] = result.byType[item.type] || bucket(),
        result.byTopic[item.topic || NO_TOPIC] = result.byTopic[item.topic || NO_TOPIC] || bucket()
      ];
      groups.forEach(function (group) {
        group.max += item.points;
        group.total++;
        if (item.ok) {
          group.points += item.points;
          group.correct++;
        }
      });
    });
    return result;
  }

  // ---------------------------------------------------------------- code exercises

  function codeStatus(stat) {
    if (stat && stat.mastered) return 'mastered';
    if (stat && (stat.attempts || stat.fillAttempts)) return 'progress';
    return 'new';
  }

  // One checked attempt of the from-memory mode; `clean` = no hint and no revealed solution.
  function updateCodeStat(stat, score, clean, now) {
    const next = Object.assign({ attempts: 0, best: 0, bestClean: 0, mastered: false, last: 0, lastAt: 0 }, stat || {});
    next.attempts++;
    next.last = score;
    next.lastAt = now;
    next.best = Math.max(next.best, score);
    if (clean) {
      next.bestClean = Math.max(next.bestClean, score);
      if (score >= MASTERY_SCORE) next.mastered = true;
    }
    return next;
  }

  // Lines blanked in the fill-in mode: the key lines, or every third statement when none is marked.
  function fillLines(code, keyLines) {
    if (keyLines && keyLines.length) return keyLines.slice();
    const result = [];
    let n = 0;
    code.split('\n').forEach(function (line, index) {
      const text = line.trim();
      if (!text || text[0] === '#' || /^(import|from)\s/.test(text)) return;
      if (n++ % 3 === 1) result.push(index);
    });
    return result;
  }

  // ---------------------------------------------------------------- search

  /**
   * Full-text search without diacritics; every word of the query must occur in the section.
   * sections: [{ title, text, ... }] -> [{ section, score, snippet, marks: [[from, to]] }] best first.
   */
  function searchSections(sections, query, limit) {
    const terms = fold(query).split(/\s+/).filter(function (term) { return term.length >= 2; });
    if (!terms.length) return [];
    const results = [];
    sections.forEach(function (section) {
      const title = fold(section.title || '');
      const text = fold(section.text || '');
      let score = 0;
      let firstHit = -1;
      for (const term of terms) {
        const inTitle = title.indexOf(term) >= 0;
        let from = text.indexOf(term);
        if (!inTitle && from < 0) return;
        if (inTitle) score += 5;
        if (from >= 0 && (firstHit < 0 || from < firstHit)) firstHit = from;
        while (from >= 0 && score < 1000) {
          score++;
          from = text.indexOf(term, from + term.length);
        }
      }
      const start = Math.max(0, firstHit - 60);
      const end = Math.min(section.text.length, start + 220);
      const snippet = (start > 0 ? '…' : '') + section.text.slice(start, end) + (end < section.text.length ? '…' : '');
      const folded = fold(snippet);
      const marks = [];
      terms.forEach(function (term) {
        for (let at = folded.indexOf(term); at >= 0; at = folded.indexOf(term, at + term.length)) marks.push([at, at + term.length]);
      });
      marks.sort(function (x, y) { return x[0] - y[0]; });
      results.push({ section: section, score: score, snippet: snippet, marks: marks });
    });
    results.sort(function (x, y) { return y.score - x.score; });
    return results.slice(0, limit || 30);
  }

  // ---------------------------------------------------------------- speed mode quiz

  /**
   * One round of the speed quiz from the library shelves: where does `name` live ('module') or what does it do
   * ('what'). Never repeats the name `previous`. Returns { name, module, what, kind, options, answer } or null.
   */
  function blitzRound(libraries, rng, previous) {
    const random = rng || Math.random;
    const items = [];
    libraries.forEach(function (library) {
      library.items.forEach(function (item) { items.push({ name: item.name, what: item.what, module: library.module }); });
    });
    const candidates = items.length > 1 ? items.filter(function (item) { return item.name !== previous; }) : items;
    if (!candidates.length) return null;
    const pick = candidates[Math.floor(random() * candidates.length)];
    const modules = libraries.map(function (library) { return library.module; });
    let kind = random() < 0.5 ? 'module' : 'what';
    if (kind === 'module' && modules.length < 2) kind = 'what';
    const answer = kind === 'module' ? pick.module : pick.what;
    const pool = (kind === 'module' ? modules : items.map(function (item) { return item.what; }))
      .filter(function (value, index, all) { return value !== answer && all.indexOf(value) === index; });
    if (!pool.length) return null;
    const options = shuffle([answer].concat(shuffle(pool, random).slice(0, 3)), random);
    return { name: pick.name, module: pick.module, what: pick.what, kind: kind, options: options, answer: options.indexOf(answer) };
  }

  return {
    mulberry32: mulberry32,
    shuffle: shuffle,
    hashString: hashString,
    questionHash: questionHash,
    escapeHtml: escapeHtml,
    inlineHtml: inlineHtml,
    formatClock: formatClock,
    fold: fold,
    tokenizePython: tokenizePython,
    highlightPython: highlightPython,
    normalizeCode: normalizeCode,
    normalizeFragment: normalizeFragment,
    fragmentsEqual: fragmentsEqual,
    lcsPairs: lcsPairs,
    tokenSimilarity: tokenSimilarity,
    diffCode: diffCode,
    editorEdit: editorEdit,
    NO_TOPIC: NO_TOPIC,
    topicKey: topicKey,
    correctIndexes: correctIndexes,
    isAnswerCorrect: isAnswerCorrect,
    updateQuestionStat: updateQuestionStat,
    filterQuestions: filterQuestions,
    orderPractice: orderPractice,
    weakQuestions: weakQuestions,
    questionProgress: questionProgress,
    TEST_DEFAULTS: TEST_DEFAULTS,
    POINT_WEIGHTS: POINT_WEIGHTS,
    composeTest: composeTest,
    distributePoints: distributePoints,
    gradeItems: gradeItems,
    MASTERY_SCORE: MASTERY_SCORE,
    NEAR_THRESHOLD: NEAR_THRESHOLD,
    codeStatus: codeStatus,
    updateCodeStat: updateCodeStat,
    fillLines: fillLines,
    searchSections: searchSections,
    blitzRound: blitzRound
  };
});
