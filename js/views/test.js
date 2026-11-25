// Test: the simulation of the credit test (start screen, sequential run, result with review).
(function () {
  'use strict';

  const ISI = window.ISI;
  const ui = ISI.ui;
  const h = ui.h;
  const L = window.ISILogic;
  const store = window.ISIStore;
  const WARN_SECONDS = 300;

  // ---------------------------------------------------------------- engine

  function allSources() {
    const present = new Set(ISI.data.questions.map(function (q) { return q.source; }));
    return Object.keys(ui.SOURCE_LABELS).filter(function (s) { return present.has(s); });
  }

  // The stored start-screen settings, limited to what the current content offers.
  function loadConfig() {
    const saved = store.state.testConfig || {};
    const topicKeys = ui.questionTopicKeys();
    const sources = allSources();
    function subset(list, all) {
      if (!Array.isArray(list)) return all.slice();
      const kept = all.filter(function (x) { return list.indexOf(x) >= 0; });
      return kept.length ? kept : all.slice();
    }
    return {
      count: clamp(saved.count, 1, 60, L.TEST_DEFAULTS.count),
      minutes: clamp(saved.minutes, 1, 180, L.TEST_DEFAULTS.minutes),
      topics: subset(saved.topics, topicKeys),
      sources: subset(saved.sources, sources)
    };
  }

  function clamp(value, min, max, fallback) {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }

  function start(config) {
    const picked = L.composeTest(ISI.data.questions, config);
    if (!picked.length) return false;
    const points = L.distributePoints(picked.map(function (q) { return q.type; }), L.TEST_DEFAULTS.points);
    const now = Date.now();
    store.update(function (state) {
      state.testConfig = config;
      state.activeTest = {
        id: 'a' + now.toString(36),
        startedAt: now,
        endsAt: now + config.minutes * 60000,
        minutes: config.minutes,
        current: 0,
        warned: false,
        items: picked.map(function (q, index) {
          return {
            q: q.id, type: q.type, topic: q.topicId || null, points: points[index],
            order: L.shuffle(q.options.map(function (_, k) { return k; })), sel: [], hash: L.questionHash(q)
          };
        })
      };
    });
    return true;
  }

  // reason: 'done' (last question confirmed) | 'early' | 'timeout'. Returns the id of the stored attempt.
  function finish(reason) {
    const active = store.state.activeTest;
    if (!active) return null;
    const finishedAt = Math.min(Date.now(), active.endsAt);
    // The question on screen counts with its current ticks; the ones after it were never shown.
    const reached = reason === 'done' ? active.items.length : active.current + 1;
    const items = active.items.map(function (item, index) {
      const question = ISI.data.questionById[item.q];
      const wasReached = index < reached;
      return Object.assign({}, item, {
        reached: wasReached,
        sel: wasReached ? item.sel : [],
        ok: !!(wasReached && question && L.isAnswerCorrect(question, item.sel))
      });
    });
    const grade = L.gradeItems(items);
    const attempt = {
      id: active.id, startedAt: active.startedAt, finishedAt: finishedAt, minutes: active.minutes,
      usedSec: Math.max(0, Math.round((finishedAt - active.startedAt) / 1000)), reason: reason,
      points: grade.points, max: grade.max, correct: grade.correct, items: items
    };
    store.update(function (state) {
      state.activeTest = null;
      state.attempts.unshift(attempt);
      state.attempts.length = Math.min(state.attempts.length, store.MAX_ATTEMPTS);
      items.forEach(function (item) {
        if (item.reached && ISI.data.questionById[item.q]) {
          state.questions[item.q] = L.updateQuestionStat(state.questions[item.q], item.ok, finishedAt);
        }
      });
    });
    return attempt.id;
  }

  function remainingSeconds() {
    const active = store.state.activeTest;
    return active ? (active.endsAt - Date.now()) / 1000 : 0;
  }

  ISI.test = { start: start, finish: finish, remainingSeconds: remainingSeconds };

  // ---------------------------------------------------------------- start screen

  function renderStart(ctx) {
    const config = loadConfig();
    const topicKeys = ui.questionTopicKeys();
    const sources = allSources();
    const summary = h('p', { class: 'note', 'aria-live': 'polite' });
    const startButton = ui.button('Spustiť test', function () {
      if (start(config)) ctx.refresh();
    }, 'primary btn-large');

    function update() {
      const picked = L.composeTest(ISI.data.questions, config, L.mulberry32(1));
      const practical = picked.filter(function (q) { return q.type === 'practical'; }).length;
      startButton.disabled = !picked.length;
      if (!picked.length) {
        summary.textContent = 'Pre tento výber nie sú žiadne otázky.';
        summary.className = 'note note-warn';
        return;
      }
      const points = L.distributePoints(picked.map(function (q) { return q.type; }), L.TEST_DEFAULTS.points);
      const pointsOf = function (type) {
        const values = points.filter(function (_, index) { return picked[index].type === type; });
        if (!values.length) return '';
        const min = Math.min.apply(null, values);
        const max = Math.max.apply(null, values);
        return ' (po ' + (min === max ? min : min + '–' + max) + ' b)';
      };
      summary.className = 'note' + (picked.length < config.count ? ' note-warn' : '');
      summary.textContent = (picked.length < config.count ? 'K dispozícii je len ' + ui.plural(picked.length, 'otázka', 'otázky', 'otázok') + ' – test bude kratší. ' : '') +
        'Zloženie: ' + (picked.length - practical) + ' teoretických' + pointsOf('theory') + ' + ' + practical + ' praktických' + pointsOf('practical') +
        ', spolu ' + L.TEST_DEFAULTS.points + ' bodov, ' + config.minutes + ' min.';
    }

    function numberField(label, name, min, max, hint) {
      const input = h('input', {
        type: 'number', id: 'test-' + name, min: String(min), max: String(max), value: String(config[name]), inputmode: 'numeric',
        onchange: function () {
          config[name] = clamp(input.value, min, max, config[name]);
          input.value = String(config[name]);
          update();
        }
      });
      return h('div', { class: 'field' }, h('label', { for: 'test-' + name }, label), input, hint ? h('small', null, hint) : null);
    }

    function checkGroup(legend, name, values, labelOf) {
      return h('fieldset', { class: 'checks' }, h('legend', null, legend), values.map(function (value) {
        const input = h('input', {
          type: 'checkbox', checked: config[name].indexOf(value) >= 0,
          onchange: function () {
            config[name] = values.filter(function (v) { return v === value ? input.checked : config[name].indexOf(v) >= 0; });
            update();
          }
        });
        return h('label', { class: 'check' }, input, h('span', null, labelOf(value)));
      }));
    }

    function countOf(predicate) {
      return ISI.data.questions.filter(predicate).length;
    }

    update();
    ctx.container.appendChild(h('div', { class: 'page' },
      h('header', { class: 'page-head' },
        h('h1', null, 'Zápočtový test'),
        h('p', { class: 'lead' }, 'Simulácia skutočného testu: rovnaký počet otázok, čas, bodovanie aj pravidlo „bez návratu“.')),
      h('div', { class: 'grid grid-2' },
        h('section', { class: 'card' },
          h('h2', null, 'Pravidlá'),
          h('ul', { class: 'rules' },
            h('li', null, h('strong', null, '15 otázok, 45 minút, 100 bodov.')),
            h('li', null, 'Pri každej otázke môže byť správna ', h('strong', null, 'jedna alebo viac'), ' možností – preto sú to vždy zaškrtávacie políčka.'),
            h('li', null, h('strong', null, 'Všetko alebo nič:'), ' jedna nesprávne označená alebo jedna chýbajúca správna možnosť znamená 0 bodov za otázku.'),
            h('li', null, 'Test je ', h('strong', null, 'sekvenčný'), ' – po kliknutí na „Ďalšia otázka“ sa už nedá vrátiť.'),
            h('li', null, 'Praktické otázky (kód) majú vyššiu váhu než teoretické (4 : 3).'),
            h('li', null, 'Vyhodnotenie a vysvetlenia uvidíš až po odovzdaní. Po uplynutí času sa test odovzdá sám.')),
          h('p', { class: 'muted' }, 'Klávesy: 1–6 označia možnosť, Enter potvrdí otázku.')),
        h('section', { class: 'card' },
          h('h2', null, 'Nastavenie'),
          h('div', { class: 'field-row' },
            numberField('Počet otázok', 'count', 1, 60),
            numberField('Čas (minúty)', 'minutes', 1, 180)),
          checkGroup('Témy', 'topics', topicKeys, function (key) {
            return ui.topicShort(key === L.NO_TOPIC ? null : key) + ' · ' + ui.topicTitle(key === L.NO_TOPIC ? null : key) +
              ' (' + countOf(function (q) { return L.topicKey(q) === key; }) + ')';
          }),
          checkGroup('Zdroje otázok', 'sources', sources, function (source) {
            return ui.SOURCE_LABELS[source] + ' (' + countOf(function (q) { return q.source === source; }) + ')';
          }),
          summary,
          h('div', { class: 'actions' }, startButton))),
      renderHistory()));
  }

  function renderHistory() {
    const attempts = store.state.attempts;
    if (!attempts.length) return null;
    return h('section', { class: 'card' },
      h('h2', null, 'Predchádzajúce pokusy'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null,
          h('th', { scope: 'col' }, 'Dátum'), h('th', { scope: 'col', class: 'num' }, 'Body'),
          h('th', { scope: 'col', class: 'num' }, 'Správne'), h('th', { scope: 'col', class: 'num' }, 'Čas'), h('th', { scope: 'col' }, ''))),
        h('tbody', null, attempts.map(function (a) {
          return h('tr', null,
            h('td', null, ui.formatDate(a.finishedAt)),
            h('td', { class: 'num' }, h('strong', null, a.points + ' / ' + a.max)),
            h('td', { class: 'num' }, a.correct + ' / ' + a.items.length),
            h('td', { class: 'num' }, ui.formatDuration(a.usedSec)),
            h('td', null, h('a', { href: '#/test/vysledok/' + a.id }, 'Výsledok')));
        })))));
  }

  // ---------------------------------------------------------------- running test

  function renderRunning(ctx) {
    const active = store.state.activeTest;
    const index = active.current;
    const item = active.items[index];
    const question = ISI.data.questionById[item.q];
    const total = active.items.length;
    const isLast = index === total - 1;
    const shownAt = Date.now();

    const timer = h('div', { class: 'test-timer', role: 'timer', 'aria-label': 'Zostávajúci čas' });
    function tick() {
      const left = remainingSeconds();
      timer.textContent = L.formatClock(left);
      timer.classList.toggle('test-timer-warn', left <= WARN_SECONDS);
      if (left <= WARN_SECONDS && left > 0 && store.state.activeTest && !store.state.activeTest.warned) {
        store.update(function (state) { state.activeTest.warned = true; });
        ui.toast('Zostáva posledných 5 minút.', 'warn');
      }
    }
    tick();
    document.addEventListener('isi:tick', tick);

    function next() {
      if (!store.state.activeTest || store.state.activeTest.id !== active.id) return;
      if (isLast) {
        const id = finish('done');
        ISI.app.navigate('/test/vysledok/' + id, true);
      } else {
        store.update(function (state) { state.activeTest.current = index + 1; });
        ctx.refresh();
      }
    }

    const removeKeys = ui.questionKeys(ctx.container, function () {
      // A held or doubled Enter must not skip a question that cannot be revisited.
      if (Date.now() - shownAt > 600) next();
    });

    const card = h('article', { class: 'card question', 'aria-labelledby': 'test-position' },
      h('div', { class: 'question-head' },
        h('span', { class: 'question-points' }, ui.plural(item.points, 'bod', 'body', 'bodov')),
        h('span', { class: 'muted' }, 'Označ všetky správne možnosti (jedna alebo viac).')),
      question ? ui.questionBody(question) : h('p', { class: 'note note-warn' }, 'Táto otázka už nie je v obsahu – pokračuj ďalej.'),
      question ? ui.optionList(question, {
        order: item.order,
        selected: item.sel,
        onToggle: function (original, checked) {
          store.update(function (state) {
            const current = state.activeTest && state.activeTest.items[index];
            if (!current) return;
            current.sel = current.sel.filter(function (x) { return x !== original; });
            if (checked) current.sel.push(original);
          });
        }
      }) : null);

    ctx.container.appendChild(h('div', { class: 'page page-narrow test-run' },
      h('header', { class: 'test-bar' },
        h('div', { class: 'test-position' },
          h('span', { id: 'test-position' }, 'Otázka ', h('strong', null, String(index + 1)), ' / ' + total),
          ui.progressBar(index / total, 'Postup v teste')),
        timer),
      card,
      h('div', { class: 'actions actions-split' },
        ui.button('Odovzdať predčasne', function () {
          ui.confirmDialog({
            title: 'Odovzdať test predčasne?',
            text: 'Otázky, ku ktorým si sa ešte nedostal, budú za 0 bodov. Táto otázka sa započíta tak, ako je teraz označená.',
            confirm: 'Odovzdať', danger: true
          }).then(function (yes) {
            if (yes && store.state.activeTest && store.state.activeTest.id === active.id) {
              ISI.app.navigate('/test/vysledok/' + finish('early'), true);
            }
          });
        }, 'ghost'),
        ui.button(isLast ? 'Odovzdať test' : 'Ďalšia otázka →', next, 'primary btn-large')),
      h('p', { class: 'muted center' }, isLast
        ? 'Toto je posledná otázka – po odovzdaní uvidíš vyhodnotenie.'
        : 'K tejto otázke sa po pokračovaní už nedá vrátiť.')));

    return function () {
      document.removeEventListener('isi:tick', tick);
      removeKeys();
    };
  }

  // ---------------------------------------------------------------- result

  function breakdownTable(caption, rows) {
    return h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('caption', null, caption),
      h('thead', null, h('tr', null,
        h('th', { scope: 'col' }, ''), h('th', { scope: 'col', class: 'num' }, 'Správne'),
        h('th', { scope: 'col', class: 'num' }, 'Body'), h('th', { scope: 'col' }, 'Úspešnosť'))),
      h('tbody', null, rows.map(function (row) {
        const share = row.max ? row.points / row.max : 0;
        return h('tr', null,
          h('th', { scope: 'row' }, row.label),
          h('td', { class: 'num' }, row.correct + ' / ' + row.total),
          h('td', { class: 'num' }, row.points + ' / ' + row.max),
          h('td', null, h('div', { class: 'bar-cell' },
            ui.progressBar(share, row.label, share >= 0.75 ? 'ok' : share < 0.5 ? 'bad' : null),
            h('span', null, ui.percentText(share)))));
      }))));
  }

  function renderResult(ctx, attemptId) {
    const attempt = store.state.attempts.find(function (a) { return a.id === attemptId; });
    if (!attempt) {
      ctx.container.appendChild(ui.emptyState('Pokus sa nenašiel', 'Tento výsledok už nie je uložený.', ui.link('Späť na test', '#/test', 'primary')));
      return;
    }
    const grade = L.gradeItems(attempt.items);
    const wrong = attempt.items.filter(function (item) { return !item.ok; });
    const reasonText = { timeout: 'Čas vypršal – test bol odovzdaný automaticky.', early: 'Test bol odovzdaný predčasne.' }[attempt.reason];
    const typeNames = { theory: 'Teoretické otázky', practical: 'Praktické otázky' };
    const typeRows = Object.keys(typeNames).filter(function (type) { return grade.byType[type]; }).map(function (type) {
      return Object.assign({ label: typeNames[type] }, grade.byType[type]);
    });
    const topicRows = ui.questionTopicKeys().filter(function (key) { return grade.byTopic[key]; }).map(function (key) {
      const id = key === L.NO_TOPIC ? null : key;
      return Object.assign({ label: ui.topicShort(id) + ' · ' + ui.topicTitle(id) }, grade.byTopic[key]);
    });

    ctx.container.appendChild(h('div', { class: 'page' },
      h('header', { class: 'page-head' },
        h('h1', null, 'Výsledok testu'),
        h('p', { class: 'lead' }, ui.formatDate(attempt.finishedAt) + (reasonText ? ' · ' + reasonText : ''))),
      h('section', { class: 'card result-summary' },
        h('div', { class: 'result-score' },
          h('span', { class: 'result-points' }, String(attempt.points)),
          h('span', { class: 'result-max' }, '/ ' + attempt.max + ' bodov')),
        h('dl', { class: 'stats' },
          h('div', null, h('dt', null, 'Úspešnosť'), h('dd', null, ui.percentText(attempt.max ? attempt.points / attempt.max : 0))),
          h('div', null, h('dt', null, 'Správne otázky'), h('dd', null, attempt.correct + ' / ' + attempt.items.length)),
          h('div', null, h('dt', null, 'Použitý čas'), h('dd', null, ui.formatDuration(attempt.usedSec) + ' z ' + attempt.minutes + ' min'))),
        h('div', { class: 'actions' },
          wrong.length ? ui.link('Precvičiť chybné (' + wrong.length + ')', '#/otazky?attempt=' + attempt.id, 'primary') : null,
          ui.link('Nový test', '#/test', wrong.length ? 'default' : 'primary'))),
      h('div', { class: 'grid grid-wide' },
        h('section', { class: 'card' }, breakdownTable('Podľa typu otázky', typeRows)),
        h('section', { class: 'card' }, breakdownTable('Podľa témy', topicRows))),
      h('section', null,
        h('h2', null, 'Prehľad otázok'),
        attempt.items.map(function (item, index) { return reviewCard(item, index); }))));
  }

  function reviewCard(item, index) {
    const question = ISI.data.questionById[item.q];
    const verdict = !item.reached ? ['Nezodpovedaná', 'bad'] : item.ok ? ['Správne', 'ok'] : ['Nesprávne', 'bad'];
    const head = h('div', { class: 'question-head' },
      h('h3', null, 'Otázka ' + (index + 1)),
      ui.badge(verdict[0], verdict[1]),
      h('span', { class: 'question-points' }, (item.ok ? item.points : 0) + ' / ' + item.points + ' b'));
    if (!question) {
      return h('article', { class: 'card question review review-bad' }, head,
        h('p', { class: 'note note-warn' }, 'Otázka ' + item.q + ' už nie je v obsahu.'));
    }
    const sameOptions = item.order.length === question.options.length;
    return h('article', { class: 'card question review review-' + (item.ok ? 'ok' : 'bad') },
      head,
      ui.questionBadges(question),
      item.hash !== L.questionHash(question)
        ? h('p', { class: 'note note-warn' }, 'Otázka bola od tohto pokusu upravená – zobrazené vyhodnotenie nemusí sedieť.') : null,
      ui.questionBody(question),
      ui.optionList(question, {
        order: sameOptions ? item.order : question.options.map(function (_, k) { return k; }),
        selected: item.sel, reveal: true
      }),
      ui.explanationBox(question));
  }

  ISI.views.test = function (ctx) {
    if (ctx.parts[0] === 'vysledok') return renderResult(ctx, ctx.parts[1]);
    if (store.state.activeTest) {
      if (remainingSeconds() <= 0) {
        ISI.app.navigate('/test/vysledok/' + finish('timeout'), true);
        return null;
      }
      return renderRunning(ctx);
    }
    return renderStart(ctx);
  };
})();
