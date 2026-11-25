// Teória: topic list with full-text search, a topic page with its table of contents, the cram sheet.
(function () {
  'use strict';

  const ISI = window.ISI;
  const ui = ISI.ui;
  const h = ui.h;
  const L = window.ISILogic;
  const store = window.ISIStore;

  function weeksText(topic) {
    return topic.weeks.length === 1 ? topic.weeks[0] + '. týždeň' : topic.weeks.join('. a ') + '. týždeň';
  }

  function topicCounts(topic) {
    return {
      codes: ISI.data.codes.filter(function (c) { return c.topicId === topic.id; }).length,
      questions: ISI.data.questions.filter(function (q) { return q.topicId === topic.id; }).length
    };
  }

  // ---------------------------------------------------------------- index and search

  function markedSnippet(hit) {
    const nodes = [];
    let position = 0;
    hit.marks.forEach(function (mark) {
      if (mark[0] < position) return;
      nodes.push(hit.snippet.slice(position, mark[0]), h('mark', null, hit.snippet.slice(mark[0], mark[1])));
      position = mark[1];
    });
    nodes.push(hit.snippet.slice(position));
    return nodes;
  }

  function renderIndex(ctx) {
    const data = ISI.data;
    const sections = [];
    data.topics.forEach(function (topic) {
      (topic.sections || []).forEach(function (section) {
        sections.push({ topic: topic, id: section.id, title: section.title, text: section.text });
      });
    });
    const results = h('div', { class: 'search-results', 'aria-live': 'polite' });
    const input = h('input', {
      type: 'search', id: 'theory-search', placeholder: 'napr. kernel, K-fold, heuristika…', autocomplete: 'off',
      value: ctx.query.get('q') || '',
      oninput: function () { search(true); }
    });

    function search(updateUrl) {
      const query = input.value.trim();
      results.textContent = '';
      if (updateUrl && window.history.replaceState) {
        window.history.replaceState(null, '', '#/teoria' + (query ? '?q=' + encodeURIComponent(query) : ''));
      }
      if (query.length < 2) return;
      const hits = L.searchSections(sections, query, 30);
      results.appendChild(h('p', { class: 'muted' }, hits.length
        ? 'Nájdené: ' + ui.plural(hits.length, 'časť', 'časti', 'častí')
        : 'Nič sa nenašlo. Hľadá sa bez ohľadu na diakritiku, všetky slová musia byť v jednej časti.'));
      results.appendChild(h('ul', { class: 'result-list' }, hits.map(function (hit) {
        const s = hit.section;
        return h('li', null,
          h('a', { href: '#/teoria/' + s.topic.id + (s.id ? '/' + s.id : '') },
            h('span', { class: 'result-title' }, s.topic.short + ' · ' + s.title),
            h('span', { class: 'result-snippet' }, markedSnippet(hit))));
      })));
    }

    ctx.container.appendChild(h('div', { class: 'page' },
      h('header', { class: 'page-head' },
        h('h1', null, 'Teória'),
        h('p', { class: 'lead' }, 'Zhrnutá teória ku každej téme. Pred testom si prejdi ťahák.')),
      h('section', { class: 'card' },
        h('div', { class: 'field' },
          h('label', { for: 'theory-search' }, 'Hľadať v celej teórii'),
          input),
        results),
      h('div', { class: 'actions' }, ui.link('Ťahák – rýchle zhrnutie všetkých tém', '#/teoria/tahak', 'primary')),
      h('ol', { class: 'topic-list' }, data.topics.map(function (topic) {
        const counts = topicCounts(topic);
        const read = !!store.state.theoryRead[topic.id];
        return h('li', { class: 'card topic-card' },
          h('span', { class: 'topic-number', 'aria-hidden': 'true' }, topic.short),
          h('div', { class: 'topic-main' },
            h('h2', null, topic.theoryHtml ? h('a', { href: '#/teoria/' + topic.id }, topic.title) : topic.title),
            h('div', { class: 'badges' },
              ui.badge(weeksText(topic)),
              topic.theoryHtml ? (read ? ui.badge('Prečítané', 'ok') : ui.badge('Neprečítané')) : ui.badge('Teória zatiaľ chýba', 'warn')),
            h('p', { class: 'topic-links' },
              h('a', { href: '#/kody?topic=' + topic.id }, ui.plural(counts.codes, 'kód', 'kódy', 'kódov')), ' · ',
              h('a', { href: '#/otazky?topic=' + topic.id }, ui.plural(counts.questions, 'otázka', 'otázky', 'otázok')))));
      }))));
    if (input.value) search(false);
    return null;
  }

  // ---------------------------------------------------------------- topic page

  function renderTopic(ctx, topic, anchor) {
    const data = ISI.data;
    const index = data.topics.indexOf(topic);
    const previous = data.topics[index - 1];
    const next = data.topics[index + 1];
    const counts = topicCounts(topic);
    const read = !!store.state.theoryRead[topic.id];
    const base = '#/teoria/' + topic.id;

    const head = h('header', { class: 'page-head' },
      h('p', { class: 'crumbs' }, h('a', { href: '#/teoria' }, 'Teória'), ' / ' + topic.short),
      h('h1', null, topic.title),
      h('div', { class: 'badges' }, ui.badge(weeksText(topic)), read ? ui.badge('Prečítané', 'ok') : null));

    if (!topic.theoryHtml) {
      ctx.container.appendChild(h('div', { class: 'page' }, head,
        ui.emptyState('Teória k tejto téme zatiaľ nie je', 'Obsah sa ešte pripravuje. Kódy a otázky k téme už môžu byť dostupné.',
          h('div', { class: 'actions actions-center' },
            ui.link('Kódy (' + counts.codes + ')', '#/kody?topic=' + topic.id),
            ui.link('Otázky (' + counts.questions + ')', '#/otazky?topic=' + topic.id)))));
      return null;
    }

    const body = ui.article(topic.theoryHtml);
    const toc = h('details', { class: 'toc', open: window.innerWidth >= 900 },
      h('summary', null, 'Obsah'),
      h('nav', { 'aria-label': 'Obsah témy' }, h('ul', null, topic.toc.map(function (item) {
        return h('li', { class: 'toc-' + item.level }, h('a', { href: base + '/' + item.id }, item.text));
      }))));

    ctx.container.appendChild(h('div', { class: 'page' },
      head,
      h('div', { class: 'with-toc' },
        topic.toc.length ? toc : null,
        h('div', { class: 'card theory' },
          body,
          h('div', { class: 'theory-foot' },
            ui.button(read ? '✓ Prečítané – zrušiť' : 'Označiť ako prečítané', function () {
              store.update(function (state) {
                if (read) delete state.theoryRead[topic.id]; else state.theoryRead[topic.id] = Date.now();
              });
              ctx.refresh(true);
            }, read ? null : 'primary'),
            ui.link('Kódy k téme (' + counts.codes + ')', '#/kody?topic=' + topic.id, 'default'),
            ui.link('Otázky k téme (' + counts.questions + ')', '#/otazky?topic=' + topic.id, 'default')))),
      h('nav', { class: 'pager', 'aria-label': 'Susedné témy' },
        previous ? h('a', { href: '#/teoria/' + previous.id }, '← ' + previous.short + ' · ' + previous.title) : h('span'),
        next ? h('a', { href: '#/teoria/' + next.id }, next.short + ' · ' + next.title + ' →') : h('span'))));

    if (anchor) {
      const target = Array.prototype.find.call(body.querySelectorAll('[id]'), function (el) { return el.id === anchor; });
      if (target) ctx.scrollTarget = target;
    }
    ui.rememberStudy('/teoria/' + topic.id, 'Teória: ' + topic.short + ' · ' + topic.title);
    return null;
  }

  // ---------------------------------------------------------------- cram sheet

  function renderCram(ctx) {
    ctx.container.appendChild(h('div', { class: 'page cram' },
      h('header', { class: 'page-head' },
        h('p', { class: 'crumbs no-print' }, h('a', { href: '#/teoria' }, 'Teória'), ' / Ťahák'),
        h('h1', null, 'Ťahák – rýchle zhrnutie'),
        h('p', { class: 'lead no-print' }, 'Najdôležitejšie body všetkých tém na jednej stránke – na posledné zopakovanie pred testom.'),
        h('div', { class: 'actions no-print' }, ui.button('Vytlačiť', function () { window.print(); }, 'primary'))),
      h('div', { class: 'cram-grid' }, ISI.data.topics.map(function (topic) {
        return h('section', { class: 'card cram-topic' },
          h('h2', null, h('span', { class: 'topic-number' }, topic.short), ' ',
            topic.theoryHtml ? h('a', { href: '#/teoria/' + topic.id }, topic.title) : topic.title),
          topic.summaryHtml ? ui.article(topic.summaryHtml) : h('p', { class: 'muted' }, 'Zhrnutie tejto témy zatiaľ chýba.'));
      }))));
    return null;
  }

  ISI.views.theory = function (ctx) {
    const first = ctx.parts[0];
    if (!first) return renderIndex(ctx);
    if (first === 'tahak') return renderCram(ctx);
    const topic = ISI.data.topicById[first];
    if (!topic) {
      ctx.container.appendChild(ui.emptyState('Téma sa nenašla', null, ui.link('Späť na teóriu', '#/teoria', 'primary')));
      return null;
    }
    return renderTopic(ctx, topic, ctx.parts[1]);
  };
})();
