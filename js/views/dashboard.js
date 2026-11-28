// Prehľad: progress per topic, last tests, weakest spots and quick actions.
(function () {
  'use strict';

  const ISI = window.ISI;
  const ui = ISI.ui;
  const h = ui.h;
  const L = window.ISILogic;
  const store = window.ISIStore;

  function topicRows() {
    const state = store.state;
    return ISI.data.topics.map(function (topic) {
      const codes = ISI.data.codes.filter(function (c) { return c.topicId === topic.id; });
      return {
        topic: topic,
        read: !!state.theoryRead[topic.id],
        codes: codes.length,
        mastered: codes.filter(function (c) { return (state.codes[c.id] || {}).mastered; }).length,
        questions: L.questionProgress(ISI.data.questions.filter(function (q) { return q.topicId === topic.id; }), state.questions)
      };
    });
  }

  function tile(label, value, detail) {
    return h('div', { class: 'tile' }, h('dt', null, label), h('dd', null, value), detail ? h('small', null, detail) : null);
  }

  function accuracyKind(accuracy) {
    return accuracy == null ? null : accuracy >= 0.75 ? 'ok' : accuracy < 0.5 ? 'bad' : null;
  }

  function renderActions() {
    const state = store.state;
    const active = state.activeTest;
    const weak = L.weakQuestions(ISI.data.questions, state.questions, 20);
    const nextTopic = ISI.data.topics.find(function (t) { return t.theoryHtml && !state.theoryRead[t.id]; }) || ISI.data.topics[0];
    const route = state.lastStudy ? '#' + state.lastStudy.route : nextTopic ? '#/teoria/' + nextTopic.id : '#/teoria';
    return h('div', { class: 'study-start' },
      h('section', { class: 'exam-feature' },
      h('div', { class: 'exam-copy' },
        h('p', { class: 'eyebrow' }, ui.icon('test'), 'TEST NANEČISTO'),
        h('h2', null, active ? 'Dokonči rozbehnutý test.' : 'Vyskúšaj si zápočet.'),
        h('p', { class: 'exam-description' }, '15 otázok. 45 minút. Rovnaké pravidlá ako na teste.'),
      h('div', { class: 'actions' },
        active
          ? ui.link(['Pokračovať · ' + L.formatClock(ISI.test.remainingSeconds()), ui.icon('arrow')], '#/test', 'primary btn-large')
          : ui.link(['Spustiť test', ui.icon('arrow')], '#/test', 'primary btn-large'),
        h('span', { class: 'exam-points' }, '100 bodov'))),
        h('div', { class: 'search-art', 'aria-hidden': 'true', html: '<svg viewBox="0 0 190 190" fill="none"><circle cx="95" cy="95" r="86" stroke="currentColor" stroke-dasharray="2 8"/><path d="M95 34 43 87l25 65m27-118 52 53-25 65M43 87h104M68 152l27-53 27 53M95 34v65" stroke="currentColor"/><circle cx="95" cy="34" r="9" class="art-node"/><circle cx="43" cy="87" r="9" class="art-node-dim"/><circle cx="147" cy="87" r="9" class="art-node"/><circle cx="95" cy="99" r="9" class="art-node-dim"/><circle cx="68" cy="152" r="9" class="art-node-dim"/><circle cx="122" cy="152" r="14" class="art-node"/><path d="m116 152 4 4 8-9" class="art-check" stroke-width="2"/></svg>' })),
      h('section', { class: 'card continue-card' },
        h('p', { class: 'eyebrow' }, state.lastStudy ? 'TVOJE POSLEDNÉ UČENIE' : 'ZAČNI S TEÓRIOU'),
        h('h2', null, state.lastStudy ? state.lastStudy.label : nextTopic ? nextTopic.title : 'Prehľad tém'),
        h('a', { class: 'text-action', href: route }, state.lastStudy ? 'Pokračovať v učení' : 'Otvoriť tému', ui.icon('arrow')),
        h('div', { class: 'continue-foot' },
          h('a', { href: '#/speed' }, 'Speed mód – len fakty na zápočet', ui.icon('speed')),
          h('a', { href: '#/teoria/tahak' }, 'Ťahák ku všetkým témam', ui.icon('theory')),
          weak.length ? h('a', { href: '#/otazky?set=weak' }, 'Precvičiť slabé miesta (' + weak.length + ')', ui.icon('arrow')) : null)));
  }

  function renderTiles(rows) {
    const state = store.state;
    const all = L.questionProgress(ISI.data.questions, state.questions);
    const withTheory = rows.filter(function (r) { return r.topic.theoryHtml; }).length;
    const last = state.attempts[0];
    return h('dl', { class: 'tiles' },
      tile('Teória', rows.filter(function (r) { return r.read; }).length + ' / ' + withTheory, 'prečítaných tém'),
      tile('Kódy', rows.reduce(function (sum, r) { return sum + r.mastered; }, 0) + ' / ' + ISI.data.codes.length, 'zvládnutých naspamäť'),
      tile('Otázky', all.seen + ' / ' + all.total, 'videných'),
      tile('Presnosť', ui.percentText(all.accuracy), all.answers ? 'z ' + ui.plural(all.answers, 'odpovede', 'odpovedí', 'odpovedí') : 'zatiaľ bez odpovedí'),
      tile('Posledný test', last ? last.points + ' / ' + last.max : '–', last ? ui.formatDate(last.finishedAt) : 'zatiaľ žiadny'));
  }

  function renderTopics(rows) {
    return h('section', { class: 'card topic-overview' },
      h('div', { class: 'section-heading' }, h('h2', null, 'Téma po téme'),
        h('a', { class: 'text-action', href: '#/teoria' }, 'Celá teória', ui.icon('arrow'))),
      h('div', { class: 'topic-columns', 'aria-hidden': 'true' },
        h('span', null, 'UČIVO'), h('span', null, 'TEÓRIA'), h('span', null, 'KÓDY'), h('span', null, 'OTÁZKY'), h('span', null, 'PRESNOSŤ')),
      h('ol', { class: 'dashboard-topics' }, rows.map(function (row) {
          const t = row.topic;
          const q = row.questions;
          return h('li', { class: 'dashboard-topic' },
            h('a', { class: 'dashboard-topic-title', href: '#/teoria/' + t.id },
              h('span', { class: 'topic-number' }, t.short.replace('T', '').padStart(2, '0')),
              h('span', null, t.title)),
            h('a', { class: 'topic-theory', href: '#/teoria/' + t.id }, !t.theoryHtml ? ui.badge('Chýba', 'warn') : row.read ? ui.badge('✓ Prečítané', 'ok') : ui.badge('Na prečítanie')),
            h('div', { class: 'topic-progress' }, h('span', { class: 'mobile-label' }, 'Kódy'), h('a', { class: 'bar-cell', href: '#/kody?topic=' + t.id, 'aria-label': t.title + ': zvládnuté kódy ' + row.mastered + ' z ' + row.codes },
              ui.progressBar(row.codes ? row.mastered / row.codes : 0, 'Zvládnuté kódy', 'ok'),
              h('span', null, row.mastered + ' / ' + row.codes))),
            h('div', { class: 'topic-progress' }, h('span', { class: 'mobile-label' }, 'Otázky'), h('a', { class: 'bar-cell', href: '#/otazky?topic=' + t.id, 'aria-label': t.title + ': videné otázky ' + q.seen + ' z ' + q.total },
              ui.progressBar(q.total ? q.seen / q.total : 0, 'Videné otázky'),
              h('span', null, q.seen + ' / ' + q.total))),
            h('div', { class: 'topic-accuracy', 'aria-label': 'Presnosť: ' + ui.percentText(q.accuracy) },
              h('span', { class: 'mobile-label' }, 'Presnosť'),
              h('span', { class: accuracyKind(q.accuracy) === 'bad' ? 'verdict-bad' : '' }, ui.percentText(q.accuracy))));
        })));
  }

  function renderTests() {
    const attempts = store.state.attempts;
    if (!attempts.length) {
      return h('section', { class: 'card' },
        h('h2', null, 'Testy'),
        h('p', { class: 'muted' }, 'Po prvom teste tu nájdeš výsledok a históriu pokusov.'),
        h('div', { class: 'actions' }, ui.link('Vyskúšať prvý test →', '#/test')));
    }
    const recent = attempts.slice(0, 10).reverse();
    const shares = recent.map(function (a) { return a.max ? a.points / a.max : 0; });
    const delta = attempts.length > 1 ? attempts[0].points - attempts[1].points : null;
    return h('section', { class: 'card' },
      h('h2', null, 'Testy'),
      h('div', { class: 'trend' },
        ui.sparkline(shares, 'Vývoj výsledkov posledných ' + recent.length + ' testov'),
        h('p', null,
          h('strong', null, attempts[0].points + ' / ' + attempts[0].max), ' v poslednom teste',
          delta === null ? '' : delta === 0 ? ' – rovnako ako predtým.' : delta > 0 ? ' – o ' + delta + ' b lepšie než predtým.' : ' – o ' + -delta + ' b horšie než predtým.')),
      h('ul', { class: 'plain-list' }, attempts.slice(0, 5).map(function (a) {
        return h('li', null,
          h('a', { href: '#/test/vysledok/' + a.id }, ui.formatDate(a.finishedAt)),
          h('span', { class: 'spacer' }),
          h('strong', null, a.points + ' / ' + a.max),
          h('span', { class: 'muted' }, ' · ' + a.correct + ' z ' + a.items.length + ' správne'));
      })),
      attempts.length > 5 ? h('p', null, h('a', { href: '#/test' }, 'Všetky pokusy (' + attempts.length + ')')) : null);
  }

  function renderWeak(rows) {
    const weakTopics = rows
      .filter(function (r) { return r.questions.answers >= 3; })
      .sort(function (a, b) { return a.questions.accuracy - b.questions.accuracy; })
      .filter(function (r) { return r.questions.accuracy < 0.75; })
      .slice(0, 3);
    const weakQuestions = L.weakQuestions(ISI.data.questions, store.state.questions, 5);
    return h('section', { class: 'card' },
      h('h2', null, 'Kde strácaš body'),
      !weakTopics.length && !weakQuestions.length
        ? h('div', null, h('p', { class: 'muted' }, 'Po niekoľkých odpovediach tu uvidíš, čo si zopakovať.'),
          h('div', { class: 'actions' }, ui.link('Precvičiť otázky →', '#/otazky'))) : null,
      weakTopics.length ? h('div', null,
        h('h3', null, 'Najslabšie témy'),
        h('ul', { class: 'plain-list' }, weakTopics.map(function (r) {
          return h('li', null,
            h('a', { href: '#/otazky?topic=' + r.topic.id + '&state=wrong' }, r.topic.short + ' · ' + r.topic.title),
            h('span', { class: 'spacer' }),
            ui.badge(ui.percentText(r.questions.accuracy), accuracyKind(r.questions.accuracy) || 'warn'));
        }))) : null,
      weakQuestions.length ? h('div', null,
        h('h3', null, 'Najslabšie otázky'),
        h('ul', { class: 'plain-list' }, weakQuestions.map(function (q) {
          const stat = store.state.questions[q.id];
          return h('li', null,
            h('a', { href: '#/otazky?ids=' + encodeURIComponent(q.id) }, ui.inline('span', q.text)),
            h('span', { class: 'spacer' }),
            ui.badge(stat.right + ' z ' + stat.seen, 'bad', 'Správne odpovede z počtu pokusov'));
        })),
        h('div', { class: 'actions' }, ui.link('Precvičiť najslabšie', '#/otazky?set=weak', 'primary'))) : null);
  }

  ISI.views.dashboard = function (ctx) {
    const rows = topicRows();
    ctx.container.appendChild(h('div', { class: 'page dashboard' },
      h('header', { class: 'page-head dashboard-head' },
        h('div', null, h('p', { class: 'eyebrow' }, 'INTELIGENTNÉ SYSTÉMY V INFORMATIKE'),
          h('h1', null, 'Prehľad prípravy')),
        h('a', { class: 'course-tag', href: '#/tyzdne' }, ui.icon('weeks'), ISI.data.weeks.length + ' týždňov učiva')),
      renderActions(),
      renderTiles(rows),
      renderTopics(rows),
      h('div', { class: 'grid grid-2' }, renderTests(), renderWeak(rows))));
    return null;
  };
})();
