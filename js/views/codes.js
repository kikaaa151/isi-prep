// Kódy: the study mode - read the reference, fill in the key lines, write the code from memory.
(function () {
  'use strict';

  const ISI = window.ISI;
  const ui = ISI.ui;
  const h = ui.h;
  const L = window.ISILogic;
  const store = window.ISIStore;

  const MODES = [['', 'Čítať'], ['doplnit', 'Doplniť'], ['naspamat', 'Naspamäť']];

  // In-memory state of the exercise on screen; dropped when another exercise is opened.
  let fill = null;
  let memory = null;

  function percent(score) {
    return Math.floor((score || 0) * 100 + 1e-9) + ' %';
  }

  function statusBadge(code) {
    const stat = store.state.codes[code.id];
    const status = L.codeStatus(stat);
    if (status === 'mastered') return ui.badge('Zvládnuté', 'ok');
    if (status === 'progress') return ui.badge(stat.attempts ? 'Rozpracované · ' + percent(stat.best) : 'Rozpracované', 'accent');
    return ui.badge('Nové');
  }

  // The badge in the page header, after a check changed the stored result.
  function refreshStatus(code) {
    const slot = document.querySelector('[data-code-status]');
    if (!slot) return;
    slot.textContent = '';
    slot.appendChild(statusBadge(code));
  }

  function listItem(code, hideCoreBadge) {
    return h('li', { class: 'code-item' },
      h('a', { href: '#/kody/' + code.id, class: 'code-item-title' }, code.title),
      h('span', { class: 'badges' },
        code.core && hideCoreBadge !== true ? ui.badge('z cvičenia', 'accent', 'Typový kód z cvičenia s jednoduchým vysvetlením') : null,
        ui.badge(code.week + '. týždeň'),
        code.tags.slice(0, 3).map(function (tag) { return ui.badge(tag, 'tag'); }),
        statusBadge(code)));
  }

  // The codes of the chosen set: only the typical exercise codes, or all of them.
  function codesOfSet(all) {
    return all ? ISI.data.codes : ISI.data.codes.filter(function (c) { return c.core; });
  }

  // ---------------------------------------------------------------- list

  function renderList(ctx) {
    const data = ISI.data;
    const byWeek = ctx.query.get('group') === 'week';
    const topicFilter = data.topicById[ctx.query.get('topic')] ? ctx.query.get('topic') : '';
    const requested = ctx.query.get('set');
    const hasCore = data.codes.some(function (c) { return c.core; });
    const showAll = !hasCore || (requested ? requested === 'all' : store.state.codeSet === 'all');
    if ((requested === 'all' || requested === 'core') && store.state.codeSet !== requested) {
      store.update(function (state) { state.codeSet = requested; });
    }
    const inTopic = function (c) { return !topicFilter || c.topicId === topicFilter; };
    const codes = codesOfSet(showAll).filter(inTopic);
    const mastered = codes.filter(function (c) { return (store.state.codes[c.id] || {}).mastered; }).length;

    function hash(group, topic, all) {
      const params = new URLSearchParams();
      params.set('set', all ? 'all' : 'core');
      if (group) params.set('group', 'week');
      if (topic) params.set('topic', topic);
      return '#/kody?' + params.toString();
    }

    const groups = byWeek
      ? data.weeks.map(function (w) {
        return { title: w.title, href: '#/tyzdne/' + w.n, items: codes.filter(function (c) { return c.week === w.n; }) };
      })
      : data.topics.map(function (t) {
        return { title: t.short + ' · ' + t.title, href: '#/teoria/' + t.id, items: codes.filter(function (c) { return c.topicId === t.id; }) };
      });

    const topicSelect = h('select', { id: 'codes-topic', onchange: function () {
      ISI.app.navigate(hash(byWeek, topicSelect.value, showAll).slice(1), true);
    } }, [h('option', { value: '' }, 'Všetky témy')].concat(data.topics.map(function (t) {
      return h('option', { value: t.id }, t.short + ' · ' + t.title);
    })));
    topicSelect.value = topicFilter;
    const coreCount = codesOfSet(false).filter(inTopic).length;
    const allCount = data.codes.filter(inTopic).length;

    ctx.container.appendChild(h('div', { class: 'page' },
      h('header', { class: 'page-head' },
        h('h1', null, 'Kódy'),
        h('p', { class: 'lead' }, showAll
          ? 'Všetky kódy: typové kódy z cvičení a k nim kódy z prednášok, domáce úlohy a pomocné časti.'
          : 'Typové kódy z cvičení – tie, ktoré sa môžu objaviť na písomke. Každý má jednoduché vysvetlenie krok za krokom; ' +
            'potom si ho skús doplniť a napísať naspamäť.')),
      h('section', { class: 'card filters' },
        h('div', { class: 'field-row' },
          hasCore ? h('div', { class: 'field' },
            h('span', { class: 'field-label', id: 'set-label' }, 'Zobraziť'),
            h('div', { class: 'segmented', role: 'group', 'aria-labelledby': 'set-label' },
              h('a', { href: hash(byWeek, topicFilter, false), 'aria-current': showAll ? null : 'true' }, 'Kódy z cvičení (' + coreCount + ')'),
              h('a', { href: hash(byWeek, topicFilter, true), 'aria-current': showAll ? 'true' : null }, 'Všetky (' + allCount + ')'))) : null,
          h('div', { class: 'field' }, h('label', { for: 'codes-topic' }, 'Téma'), topicSelect),
          h('div', { class: 'field' },
            h('span', { class: 'field-label', id: 'group-label' }, 'Zoskupiť podľa'),
            h('div', { class: 'segmented', role: 'group', 'aria-labelledby': 'group-label' },
              h('a', { href: hash(false, topicFilter, showAll), 'aria-current': byWeek ? null : 'true' }, 'tém'),
              h('a', { href: hash(true, topicFilter, showAll), 'aria-current': byWeek ? 'true' : null }, 'týždňov')))),
        h('div', { class: 'bar-cell' },
          ui.progressBar(codes.length ? mastered / codes.length : 0, 'Zvládnuté kódy', 'ok'),
          h('span', null, 'Zvládnuté ' + mastered + ' / ' + codes.length))),
      codes.length ? groups.filter(function (g) { return g.items.length; }).map(function (group) {
        return h('section', { class: 'card' },
          h('h2', null, h('a', { href: group.href }, group.title)),
          h('ul', { class: 'code-list' }, group.items.map(function (code) { return listItem(code, !showAll); })));
      }) : ui.emptyState('Žiadne kódy', 'Pre tento výber zatiaľ nie sú žiadne kódy z cvičení.')));
    return null;
  }

  // ---------------------------------------------------------------- read mode

  function renderRead(code) {
    return [
      h('section', { class: 'card' },
        h('h2', null, 'Riešenie'),
        ui.codeBlock(code.code, { keyLines: code.keyLines, numbers: true }),
        code.keyLines.length ? h('p', { class: 'muted small' },
          h('span', { class: 'key-swatch', 'aria-hidden': 'true' }), ' Zvýraznené sú kľúčové riadky – tie nesú myšlienku riešenia.') : null),
      code.simpleHtml ? h('section', { class: 'card walkthrough' },
        h('h2', null, 'Jednoducho vysvetlené'),
        ui.article(code.simpleHtml)) : null,
      h('section', { class: 'card' },
        h('h2', null, code.simpleHtml ? 'Podrobnosti a na čo si dať pozor' : 'Vysvetlenie'),
        ui.article(code.explanationHtml)),
      code.expectedOutput ? h('section', { class: 'card' },
        h('h2', null, 'Očakávaný výstup'),
        h('pre', { class: 'code output', tabindex: '0' }, code.expectedOutput)) : null,
      h('div', { class: 'actions' },
        ui.link('Doplniť kľúčové riadky', '#/kody/' + code.id + '/doplnit', 'primary'),
        ui.link('Napísať naspamäť', '#/kody/' + code.id + '/naspamat', 'default'))
    ];
  }

  // ---------------------------------------------------------------- fill-in mode

  function renderFill(code) {
    if (!fill || fill.id !== code.id) fill = { id: code.id, values: {}, revealed: {}, results: null };
    const lines = code.code.split('\n');
    const highlighted = L.highlightPython(code.code);
    const blanks = L.fillLines(code.code, code.keyLines);
    const blankSet = new Set(blanks);
    const inputs = {};
    const rows = {};
    const status = h('p', { class: 'verdict', role: 'status' });

    function paint() {
      blanks.forEach(function (index) {
        const result = fill.results ? fill.results[index] : null;
        rows[index].className = 'line line-blank' + (fill.revealed[index] ? ' is-revealed' : result === true ? ' is-right' : result === false ? ' is-wrong' : '');
        inputs[index].readOnly = !!fill.revealed[index];
        inputs[index].setAttribute('aria-invalid', result === false ? 'true' : 'false');
      });
    }

    function checkLine(index) {
      if (!fill.results) fill.results = {};
      fill.results[index] = !fill.revealed[index] && L.fragmentsEqual(lines[index], fill.values[index] || '');
      return fill.results[index];
    }

    function checkAll() {
      const right = blanks.filter(checkLine).length;
      const share = blanks.length ? right / blanks.length : 0;
      store.update(function (state) {
        const stat = Object.assign({}, state.codes[code.id]);
        stat.fillAttempts = (stat.fillAttempts || 0) + 1;
        stat.fillBest = Math.max(stat.fillBest || 0, share);
        state.codes[code.id] = stat;
      });
      paint();
      refreshStatus(code);
      const revealed = Object.keys(fill.revealed).length;
      status.className = 'verdict verdict-' + (right === blanks.length ? 'ok' : 'bad');
      status.textContent = 'Správne ' + right + ' z ' + blanks.length + ' riadkov' + (revealed ? ' (ukázané: ' + revealed + ')' : '') +
        (right === blanks.length ? ' – skús to teraz celé naspamäť.' : '.');
    }

    const listing = h('div', { class: 'code code-numbered fill', role: 'group', 'aria-label': 'Kód s vynechanými riadkami' },
      lines.map(function (line, index) {
        if (!blankSet.has(index)) return h('div', { class: 'line', html: highlighted[index] + '\n' });
        const indent = /^\s*/.exec(line)[0];
        const input = h('input', {
          type: 'text', class: 'fill-input', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off',
          'aria-label': 'Riadok ' + (index + 1), value: fill.values[index] || '',
          oninput: function () {
            fill.values[index] = input.value;
            if (fill.results) delete fill.results[index];
            paint();
          },
          onkeydown: function (event) {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            checkLine(index);
            paint();
            const next = blanks[blanks.indexOf(index) + 1];
            if (next !== undefined) inputs[next].focus(); else checkAll();
          }
        });
        inputs[index] = input;
        rows[index] = h('div', { class: 'line line-blank' },
          h('span', { class: 'fill-indent' }, indent),
          input,
          h('span', { class: 'fill-mark', 'aria-hidden': 'true' }),
          ui.button('Ukázať', function () {
            fill.revealed[index] = true;
            fill.values[index] = line.slice(indent.length);
            input.value = fill.values[index];
            if (fill.results) fill.results[index] = false;
            paint();
          }, 'ghost btn-small', { 'aria-label': 'Ukázať riadok ' + (index + 1) }));
        return rows[index];
      }));
    paint();

    return [
      h('section', { class: 'card' },
        h('h2', null, 'Doplň vynechané riadky'),
        code.keyLines.length ? null : h('p', { class: 'note' }, 'Toto cvičenie nemá označené kľúčové riadky – vynechané riadky boli vybrané automaticky.'),
        h('p', { class: 'muted' }, 'Odsadenie je už pripravené. Na medzerách, úvodzovkách a komentároch nezáleží. Enter skontroluje riadok a prejde na ďalší.'),
        listing,
        status,
        h('div', { class: 'actions' },
          ui.button('Skontrolovať', checkAll, 'primary'),
          ui.button('Začať odznova', function () {
            fill = null;
            ISI.app.refresh(true);
          }),
          ui.link('Napísať naspamäť', '#/kody/' + code.id + '/naspamat', 'default')))
    ];
  }

  // ---------------------------------------------------------------- from-memory mode

  function createEditor(value, onInput, onSubmit) {
    const gutter = h('pre', { class: 'editor-gutter', 'aria-hidden': 'true' });
    const area = h('textarea', {
      class: 'editor-input', spellcheck: 'false', wrap: 'off', autocapitalize: 'off', autocomplete: 'off',
      autocorrect: 'off', 'aria-label': 'Tvoj kód', 'aria-describedby': 'editor-help'
    });
    area.value = value;
    let escapePressed = false;

    function sync() {
      const count = area.value.split('\n').length;
      let numbers = '';
      for (let n = 1; n <= count; n++) numbers += n + '\n';
      gutter.textContent = numbers;
      area.rows = Math.max(12, count + 1);
    }

    function apply(edit) {
      area.setSelectionRange(edit.from, edit.to);
      let done = edit.from === edit.to && !edit.text;
      if (!done) {
        // execCommand keeps the browser's undo history; setRangeText is the fallback.
        try {
          done = edit.text ? document.execCommand('insertText', false, edit.text) : document.execCommand('delete');
        } catch (error) {
          done = false;
        }
      }
      if (!done) {
        area.setRangeText(edit.text, edit.from, edit.to, 'end');
        area.dispatchEvent(new Event('input'));
      }
      area.setSelectionRange(edit.selStart, edit.selEnd);
    }

    area.addEventListener('input', function () {
      sync();
      onInput(area.value);
    });
    area.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        escapePressed = true;
        return;
      }
      // Esc, then Tab leaves the editor (Tab alone indents).
      const leave = escapePressed && event.key === 'Tab';
      escapePressed = false;
      if (leave || event.isComposing) return;
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onSubmit();
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== 'Tab' && event.key !== 'Enter' && event.key !== 'Backspace') return;
      const edit = L.editorEdit(area.value, area.selectionStart, area.selectionEnd, event.key, event.shiftKey);
      if (!edit) return;
      event.preventDefault();
      apply(edit);
    });
    sync();
    return { root: h('div', { class: 'editor' }, gutter, area), area: area, sync: sync };
  }

  function codeHtml(raw) {
    return L.highlightPython(raw).join('\n');
  }

  function partsNodes(parts, diffClass) {
    return parts.map(function (part) {
      if (part.gap) return h('span', { class: 'tok-gap', title: 'Tu niečo chýba' }, '▯');
      return part.kind === 'diff' ? h('span', { class: diffClass }, part.text) : part.text;
    });
  }

  function diffRow(row, revealed, onReveal) {
    const show = ui.button('Ukázať', onReveal, 'ghost btn-small');
    let marker;
    let label;
    let body;
    let note = null;
    let action = null;
    if (row.type === 'ok') {
      marker = '✓';
      label = 'Správne';
      body = h('code', { class: 'diff-code', html: codeHtml(row.userLine.raw) });
    } else if (row.type === 'moved') {
      marker = '↕';
      label = 'Správny riadok na inom mieste';
      body = h('code', { class: 'diff-code', html: codeHtml(row.userLine.raw) });
      note = 'správny riadok, ale na inom mieste';
    } else if (row.type === 'extra') {
      marker = '−';
      label = 'Navyše';
      body = h('code', { class: 'diff-code', html: codeHtml(row.userLine.raw) });
      note = 'navyše – v riešení nie je';
    } else if (row.type === 'near') {
      marker = '≈';
      label = 'Takmer';
      body = [h('code', { class: 'diff-code' }, partsNodes(row.userParts, 'tok-diff'))];
      note = [row.tokensDiffer ? 'takmer – líši sa vyznačená časť' : null, row.indentDiff ? 'nesprávne odsadenie' : null]
        .filter(Boolean).join(', ');
      if (revealed) {
        body.push(h('code', { class: 'diff-code diff-reference' }, partsNodes(row.refParts, 'tok-ref')));
      } else {
        action = show;
      }
    } else {
      marker = '+';
      label = 'Chýba';
      if (revealed) {
        body = h('code', { class: 'diff-code diff-reference', html: codeHtml(row.refLine.raw) });
        note = 'chýbajúci riadok (ukázaný)';
      } else {
        body = h('code', { class: 'diff-code diff-placeholder' },
          '    '.repeat(row.refLine.level) + (row.isKey ? '⋯ chýba kľúčový riadok' : '⋯ chýba riadok'));
        action = show;
      }
    }
    return h('li', { class: 'diff-row diff-' + row.type + (row.isKey ? ' diff-key' : '') },
      h('span', { class: 'diff-marker', title: label, 'aria-label': label, role: 'img' }, marker),
      h('div', { class: 'diff-body' }, body, note ? h('span', { class: 'diff-note' }, note) : null),
      action);
  }

  function renderMemory(code, ctx) {
    if (!memory || memory.id !== code.id) {
      // `tainted`: a hint or the solution was used for the stored draft before the page was reloaded.
      memory = {
        id: code.id, hints: 0, revealed: {}, solution: false, diff: null, stale: false,
        tainted: !!(store.state.codes[code.id] || {}).tainted && !!(store.state.drafts[code.id] || '').trim()
      };
    }
    const m = memory;
    const result = h('div', { class: 'memory-result' });
    const statLine = h('p', { class: 'muted small' });
    let saveTimer = null;

    function setTainted(value) {
      m.tainted = value;
      store.update(function (state) {
        const stat = Object.assign({}, state.codes[code.id]);
        if (value) stat.tainted = true; else delete stat.tainted;
        state.codes[code.id] = stat;
      });
    }

    function saveDraft() {
      clearTimeout(saveTimer);
      saveTimer = null;
      const text = editor.area.value;
      if ((store.state.drafts[code.id] || '') === text) return;
      store.update(function (state) {
        if (text.trim()) state.drafts[code.id] = text; else delete state.drafts[code.id];
      });
    }

    const editor = createEditor(store.state.drafts[code.id] || '', function (text) {
      // An emptied editor is a fresh start: hints used for the previous text no longer count.
      if (!text.trim() && (m.tainted || m.hints || m.solution)) {
        m.hints = 0;
        m.solution = false;
        m.revealed = {};
        m.diff = null;
        m.stale = false;
        setTainted(false);
        paint();
      }
      if (m.diff && !m.stale) {
        m.stale = true;
        result.classList.add('is-stale');
      }
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveDraft, 500);
    }, check);

    function isClean() {
      return !m.tainted && m.hints === 0 && !m.solution;
    }

    function compare() {
      m.diff = L.diffCode(code.code, editor.area.value, code.keyLines);
      m.stale = false;
    }

    function check() {
      if (!editor.area.value.trim()) {
        ui.toast('Najprv niečo napíš.', 'warn');
        return;
      }
      compare();
      saveDraft();
      store.update(function (state) {
        state.codes[code.id] = L.updateCodeStat(state.codes[code.id], m.diff.score, isClean(), Date.now());
      });
      paint();
      result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function reveal(refIndex) {
      m.revealed[refIndex] = true;
      m.hints++;
      saveDraft();
      if (!m.tainted) setTainted(true);
      paint();
    }

    function hint() {
      if (!m.diff || m.stale) compare();
      const row = m.diff.rows.find(function (r) {
        return (r.type === 'missing' || r.type === 'near') && !m.revealed[r.ref];
      });
      if (!row) {
        ui.toast(m.diff.score >= 1 ? 'Nič nechýba – kód sedí s riešením.' : 'Všetky chýbajúce riadky sú už ukázané.');
        paint();
        return;
      }
      reveal(row.ref);
    }

    function paintStats() {
      const stat = store.state.codes[code.id];
      statLine.textContent = stat && stat.attempts
        ? 'Pokusy: ' + stat.attempts + ' · najlepší výsledok ' + percent(stat.best) + ' · bez nápovede ' + percent(stat.bestClean) +
          (stat.mastered ? ' · zvládnuté ✓' : '')
        : 'Zatiaľ bez pokusu. Zvládnuté = aspoň 90 % bez nápovede.';
    }

    function paint() {
      paintStats();
      refreshStatus(code);
      result.textContent = '';
      result.classList.toggle('is-stale', m.stale);
      if (m.diff) {
        const d = m.diff;
        const good = d.score >= L.MASTERY_SCORE;
        const verdict = good && isClean() ? 'Zvládnuté – bez nápovede.'
          : good ? 'Výborne, ale s nápovedou. Aby sa kód počítal ako zvládnutý, začni odznova a napíš ho bez nej.'
            : 'Na zvládnutie treba aspoň 90 % bez nápovede.';
        result.appendChild(h('section', { class: 'card', 'aria-live': 'polite' },
          h('h2', null, 'Porovnanie s riešením'),
          m.stale ? h('p', { class: 'note note-warn' }, 'Kód sa odvtedy zmenil – skontroluj ho znova.') : null,
          h('div', { class: 'score' },
            h('span', { class: 'score-value' }, d.percent + ' %'),
            h('div', { class: 'score-detail' },
              ui.progressBar(d.score, 'Zhoda s riešením', good ? 'ok' : d.score < 0.5 ? 'bad' : null),
              h('p', { class: 'verdict verdict-' + (good && isClean() ? 'ok' : 'neutral') }, verdict))),
          h('p', { class: 'muted small' },
            '✓ správne ' + d.counts.ok + ' · ≈ takmer ' + d.counts.near + ' · + chýba ' + d.counts.missing +
            ' · − navyše ' + d.counts.extra + (d.counts.moved ? ' · ↕ inde ' + d.counts.moved : '') +
            ' · kľúčové riadky sa počítajú dvakrát' + (m.hints ? ' · nápovede: ' + m.hints : '')),
          h('ol', { class: 'diff' }, d.rows.map(function (row) {
            return diffRow(row, row.ref !== null && !!m.revealed[row.ref], function () { reveal(row.ref); });
          }))));
      }
      if (m.solution) {
        result.appendChild(h('section', { class: 'card' },
          h('h2', null, 'Riešenie vedľa tvojho kódu'),
          h('div', { class: 'grid grid-2 side-by-side' },
            h('div', null, h('h3', null, 'Tvoj kód'), ui.codeBlock(editor.area.value || ' ', { numbers: true })),
            h('div', null, h('h3', null, 'Riešenie'), ui.codeBlock(code.code, { keyLines: code.keyLines, numbers: true }))),
          h('h3', null, 'Vysvetlenie'),
          ui.article(code.simpleHtml || code.explanationHtml)));
      }
    }

    paint();
    // The draft is saved with a delay while typing; leaving or reloading the page must not lose it.
    window.addEventListener('pagehide', saveDraft);
    ctx.onCleanup = function () {
      window.removeEventListener('pagehide', saveDraft);
      saveDraft();
    };
    return [
      h('section', { class: 'card' },
        h('h2', null, 'Napíš kód naspamäť'),
        h('p', { class: 'muted', id: 'editor-help' },
          'Tab odsadí o 4 medzery, Shift+Tab odsadenie uberie, Ctrl+Enter skontroluje. Esc a potom Tab opustí editor. ' +
          'Na komentároch, prázdnych riadkoch, medzerách a type úvodzoviek nezáleží – na odsadení áno.'),
        editor.root,
        h('div', { class: 'actions' },
          ui.button('Skontrolovať', check, 'primary'),
          ui.button('Nápoveda', hint),
          ui.button('Ukázať riešenie', function () {
            m.solution = true;
            if (!m.tainted) setTainted(true);
            if (!m.diff || m.stale) compare();
            paint();
          }),
          ui.button('Začať odznova', function () {
            ui.confirmDialog({
              title: 'Začať odznova?', text: 'Editor sa vyprázdni a nápovede sa vynulujú. Uložené výsledky zostanú.',
              confirm: 'Vyprázdniť'
            }).then(function (yes) {
              if (!yes) return;
              memory = null;
              editor.area.value = '';
              clearTimeout(saveTimer);
              store.update(function (state) {
                delete state.drafts[code.id];
                if (state.codes[code.id]) delete state.codes[code.id].tainted;
              });
              ISI.app.refresh(true);
            });
          }, 'ghost')),
        statLine),
      result
    ];
  }

  // ---------------------------------------------------------------- exercise page

  function renderExercise(ctx, code, mode) {
    const data = ISI.data;
    // The pager stays inside the chosen set, so the typical exercise codes can be walked through in a row.
    const siblings = code.core && store.state.codeSet !== 'all' ? codesOfSet(false) : data.codes;
    const index = siblings.indexOf(code);
    const previous = siblings[index - 1];
    const next = siblings[index + 1];
    const topic = data.topicById[code.topicId];
    const base = '#/kody/' + code.id;
    if (fill && fill.id !== code.id) fill = null;
    if (memory && memory.id !== code.id) memory = null;

    const content = mode === 'doplnit' ? renderFill(code) : mode === 'naspamat' ? renderMemory(code, ctx) : renderRead(code);
    ctx.container.appendChild(h('div', { class: 'page page-code' },
      h('header', { class: 'page-head' },
        h('p', { class: 'crumbs' }, h('a', { href: '#/kody' }, 'Kódy'), ' / ',
          topic ? h('a', { href: '#/kody?topic=' + topic.id }, topic.short) : null, ' / ' + code.week + '. týždeň'),
        h('h1', null, code.title),
        h('div', { class: 'badges' },
          topic ? h('a', { class: 'badge badge-accent', href: '#/teoria/' + topic.id }, topic.short + ' · ' + topic.title) : null,
          h('a', { class: 'badge', href: '#/tyzdne/' + code.week }, code.week + '. týždeň'),
          ui.badge(code.source, null, 'Zdroj cvičenia'),
          code.core ? ui.badge('z cvičenia', 'accent', 'Typový kód z cvičenia') : null,
          h('span', { 'data-code-status': '' }, statusBadge(code)))),
      h('nav', { class: 'tabs', 'aria-label': 'Režim cvičenia' }, MODES.map(function (item) {
        return h('a', { href: base + (item[0] ? '/' + item[0] : ''), 'aria-current': item[0] === mode ? 'page' : null }, item[1]);
      })),
      h('section', { class: 'card task' },
        h('h2', null, 'Zadanie'),
        ui.article(code.taskHtml)),
      content,
      h('nav', { class: 'pager', 'aria-label': 'Susedné kódy' },
        previous ? h('a', { href: '#/kody/' + previous.id }, '← ' + previous.title) : h('span'),
        next ? h('a', { href: '#/kody/' + next.id }, next.title + ' →') : h('span'))));
    ui.rememberStudy('/kody/' + code.id + (mode ? '/' + mode : ''), 'Kód: ' + code.title);
    return ctx.onCleanup || null;
  }

  ISI.views.codes = function (ctx) {
    if (!ctx.parts[0]) return renderList(ctx);
    const code = ISI.data.codeById[ctx.parts[0]];
    const mode = ctx.parts[1] || '';
    if (!code || !MODES.some(function (item) { return item[0] === mode; })) {
      ctx.container.appendChild(ui.emptyState('Kód sa nenašiel', null, ui.link('Späť na kódy', '#/kody', 'primary')));
      return null;
    }
    return renderExercise(ctx, code, mode);
  };
  ISI.views.codes.listItem = listItem;
})();
