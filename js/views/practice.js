// Otázky: practice with immediate feedback.
(function () {
  'use strict';

  const ISI = window.ISI;
  const ui = ISI.ui;
  const h = ui.h;
  const L = window.ISILogic;
  const store = window.ISIStore;

  const STATE_LABELS = { all: 'Všetky', unseen: 'Nevidené', wrong: 'Chybné' };
  const FILTER_NAMES = ['topic', 'week', 'type', 'source', 'state'];

  // The round in progress; it survives leaving the section as long as the filters stay the same.
  let session = null;

  function readFilters(query) {
    const filters = {};
    FILTER_NAMES.forEach(function (name) { if (query.get(name)) filters[name] = query.get(name); });
    if (!STATE_LABELS[filters.state]) delete filters.state;
    if (query.get('attempt')) filters.attempt = query.get('attempt');
    if (query.get('ids')) filters.idList = query.get('ids');
    if (query.get('set') === 'weak') filters.set = 'weak';
    return filters;
  }

  // A fixed set of questions (wrong ones of a test, the weakest, an explicit list) or null.
  function presetOf(filters) {
    if (filters.attempt) {
      const attempt = store.state.attempts.find(function (a) { return a.id === filters.attempt; });
      if (!attempt) return { label: 'Chybné otázky z testu (pokus sa nenašiel)', ids: [] };
      return {
        label: 'Chybné otázky z testu ' + ui.formatDate(attempt.finishedAt),
        ids: attempt.items.filter(function (item) { return !item.ok; }).map(function (item) { return item.q; })
      };
    }
    if (filters.idList) return { label: 'Vybrané otázky', ids: filters.idList.split(',') };
    if (filters.set === 'weak') {
      return {
        label: 'Najslabšie otázky',
        ids: L.weakQuestions(ISI.data.questions, store.state.questions, 20).map(function (q) { return q.id; })
      };
    }
    return null;
  }

  function hashFor(filters) {
    const params = new URLSearchParams();
    FILTER_NAMES.forEach(function (name) { if (filters[name]) params.set(name, filters[name]); });
    if (filters.attempt) params.set('attempt', filters.attempt);
    if (filters.idList) params.set('ids', filters.idList);
    if (filters.set) params.set('set', filters.set);
    const text = params.toString();
    return '/otazky' + (text ? '?' + text : '');
  }

  function newSession(signature, questions) {
    session = {
      signature: signature,
      queue: L.orderPractice(questions, store.state.questions).map(function (q) { return q.id; }),
      index: 0,
      results: {},
      current: null
    };
  }

  // State of the question on screen: option order, ticks, whether it was checked.
  function currentCard() {
    const id = session.queue[session.index];
    if (!session.current || session.current.id !== id) {
      const question = ISI.data.questionById[id];
      session.current = {
        id: id,
        order: L.shuffle(question.options.map(function (_, k) { return k; })),
        selected: [],
        checked: false
      };
    }
    return session.current;
  }

  function select(label, name, filters, options, onChange) {
    const id = 'filter-' + name;
    const control = h('select', { id: id, onchange: function () { onChange(name, control.value); } },
      options.map(function (option) {
        return h('option', { value: option[0], selected: (filters[name] || '') === option[0] }, option[1]);
      }));
    control.value = filters[name] || '';
    return h('div', { class: 'field' }, h('label', { for: id }, label), control);
  }

  function renderFilters(filters, preset) {
    function onChange(name, value) {
      const next = Object.assign({}, filters);
      if (value) next[name] = value; else delete next[name];
      ISI.app.navigate(hashFor(next), true);
    }
    const data = ISI.data;
    const topics = ui.questionTopicKeys().map(function (key) {
      const id = key === L.NO_TOPIC ? null : key;
      return [key, ui.topicShort(id) + ' · ' + ui.topicTitle(id)];
    });
    const sources = Object.keys(ui.SOURCE_LABELS)
      .filter(function (s) { return data.questions.some(function (q) { return q.source === s; }); })
      .map(function (s) { return [s, ui.SOURCE_LABELS[s]]; });
    return h('section', { class: 'card filters', 'aria-label': 'Filter otázok' },
      preset ? h('p', { class: 'note' }, h('strong', null, 'Výber: '), preset.label + ' (' + preset.ids.length + ') ',
        h('a', { href: '#' + hashFor(Object.assign({}, filters, { attempt: null, idList: null, set: null })) }, 'Zrušiť výber')) : null,
      h('div', { class: 'field-row' },
        select('Téma', 'topic', filters, [['', 'Všetky témy']].concat(topics), onChange),
        select('Týždeň', 'week', filters, [['', 'Všetky týždne']].concat(data.weeks.map(function (w) {
          return [String(w.n), w.n + '. týždeň'];
        })), onChange),
        select('Typ', 'type', filters, [['', 'Teoretické aj praktické'], ['theory', 'Teoretické'], ['practical', 'Praktické']], onChange),
        select('Zdroj', 'source', filters, [['', 'Všetky zdroje']].concat(sources), onChange),
        select('Stav', 'state', filters, [['', STATE_LABELS.all], ['unseen', STATE_LABELS.unseen], ['wrong', STATE_LABELS.wrong]], onChange)));
  }

  function statLine(stat) {
    if (!stat || !stat.seen) return 'Túto otázku vidíš prvýkrát.';
    return 'Videná ' + stat.seen + '× · správne ' + stat.right + '× · nesprávne ' + stat.wrong + '×';
  }

  function renderQuestion(ctx, filters) {
    const card = currentCard();
    const question = ISI.data.questionById[card.id];
    const stat = store.state.questions[card.id];
    const total = session.queue.length;

    function advance() {
      session.index++;
      session.current = null;
      ctx.refresh();
      window.scrollTo(0, 0);
    }

    function check() {
      if (card.checked || !card.selected.length) return;
      const ok = L.isAnswerCorrect(question, card.selected);
      card.checked = true;
      card.ok = ok;
      session.results[card.id] = ok;
      store.update(function (state) {
        state.questions[card.id] = L.updateQuestionStat(state.questions[card.id], ok, Date.now());
      });
      ui.rememberStudy(hashFor(filters), 'Precvičovanie otázok');
      ctx.refresh(true);
      const nextButton = document.querySelector('[data-next]');
      if (nextButton) nextButton.focus();
    }

    const checkButton = ui.button('Skontrolovať', check, 'primary btn-large', { disabled: !card.selected.length });
    const removeKeys = ui.questionKeys(ctx.container, function () {
      if (card.checked) advance(); else check();
    });

    ctx.container.appendChild(h('article', { class: 'card question' + (card.checked ? ' review review-' + (card.ok ? 'ok' : 'bad') : '') },
      h('div', { class: 'question-head' },
        h('span', { class: 'muted' }, 'Otázka ' + (session.index + 1) + ' / ' + total),
        card.checked ? ui.badge(card.ok ? 'Správne' : 'Nesprávne', card.ok ? 'ok' : 'bad') : null),
      ui.questionBadges(question),
      ui.questionBody(question),
      card.checked ? null : h('p', { class: 'muted' }, 'Označ všetky správne možnosti (jedna alebo viac).'),
      ui.optionList(question, {
        order: card.order, selected: card.selected, reveal: card.checked,
        onToggle: function (original, checked) {
          card.selected = card.selected.filter(function (x) { return x !== original; });
          if (checked) card.selected.push(original);
          checkButton.disabled = !card.selected.length;
        }
      }),
      card.checked ? h('div', { role: 'status' },
        h('p', { class: 'verdict verdict-' + (card.ok ? 'ok' : 'bad') }, card.ok
          ? 'Správne – označil si presne správne možnosti.'
          : 'Nesprávne – na teste by to bolo 0 bodov (stačí jedna chyba).'),
        ui.explanationBox(question)) : null,
      h('p', { class: 'muted small' }, statLine(card.checked ? store.state.questions[card.id] : stat)),
      h('div', { class: 'actions actions-split' },
        card.checked ? h('span') : ui.button('Preskočiť', advance, 'ghost'),
        card.checked
          ? ui.button(session.index + 1 < total ? 'Ďalšia otázka →' : 'Dokončiť kolo', advance, 'primary btn-large', { 'data-next': '' })
          : checkButton)));
    return removeKeys;
  }

  function renderSummary(ctx, filters, pool) {
    const ids = Object.keys(session.results);
    const right = ids.filter(function (id) { return session.results[id]; }).length;
    const wrongIds = ids.filter(function (id) { return !session.results[id]; });
    ctx.container.appendChild(h('section', { class: 'card center' },
      h('h2', null, 'Kolo dokončené'),
      h('p', { class: 'result-score' },
        h('span', { class: 'result-points' }, String(right)),
        h('span', { class: 'result-max' }, '/ ' + ids.length + ' správne')),
      ids.length < session.queue.length
        ? h('p', { class: 'muted' }, 'Preskočené: ' + (session.queue.length - ids.length)) : null,
      h('div', { class: 'actions actions-center' },
        wrongIds.length ? ui.button('Zopakovať chybné z tohto kola (' + wrongIds.length + ')', function () {
          const signature = session.signature;
          newSession(signature, wrongIds.map(function (id) { return ISI.data.questionById[id]; }));
          ctx.refresh();
        }, 'primary') : null,
        ui.button('Nové kolo', function () {
          session = null;
          ctx.refresh();
        }, wrongIds.length ? null : 'primary'),
        ui.link('Na prehľad', '#/'))));
    if (!pool.length) {
      ctx.container.appendChild(h('p', { class: 'muted center' }, 'Pre tento filter už nezostali žiadne otázky – zmeň stav alebo tému.'));
    }
  }

  ISI.views.practice = function (ctx) {
    const filters = readFilters(ctx.query);
    const preset = presetOf(filters);
    const pool = L.filterQuestions(ISI.data.questions, Object.assign({}, filters, { ids: preset ? preset.ids : null }), store.state.questions);
    const signature = JSON.stringify(filters);
    if (!session || session.signature !== signature) newSession(signature, pool);

    ctx.container.appendChild(h('div', { class: 'page page-narrow' },
      h('header', { class: 'page-head' },
        h('h1', null, 'Otázky'),
        h('p', { class: 'lead' }, 'Odpovedaj a hneď zisti prečo. Nevidené a chybné otázky majú prednosť.')),
      renderFilters(filters, preset),
      h('p', { class: 'muted', 'aria-live': 'polite' }, 'Vo výbere: ' + ui.plural(pool.length, 'otázka', 'otázky', 'otázok') +
        (session.queue.length ? ' · toto kolo: ' + session.queue.length : ''))));
    const page = ctx.container.firstChild;
    const inner = { container: page, refresh: ctx.refresh };

    if (!session.queue.length) {
      page.appendChild(ui.emptyState('Žiadne otázky', ISI.data.questions.length
        ? 'Tomuto filtru nevyhovuje žiadna otázka. Skús iný stav, tému alebo zdroj.'
        : 'Obsah zatiaľ neobsahuje žiadne otázky.'));
      return null;
    }
    if (session.index >= session.queue.length) {
      renderSummary(inner, filters, pool);
      return null;
    }
    return renderQuestion(inner, filters);
  };
})();
