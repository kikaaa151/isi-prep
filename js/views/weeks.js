// Týždne: the ten weeks of the course with their summaries, code exercises and questions.
(function () {
  'use strict';

  const ISI = window.ISI;
  const ui = ISI.ui;
  const h = ui.h;
  const store = window.ISIStore;

  function weekContent(week) {
    return {
      codes: ISI.data.codes.filter(function (c) { return c.week === week.n; }),
      questions: ISI.data.questions.filter(function (q) { return q.week === week.n; }),
      topics: week.topicIds.map(function (id) { return ISI.data.topicById[id]; }).filter(Boolean)
    };
  }

  function renderIndex(ctx) {
    ctx.container.appendChild(h('div', { class: 'page' },
      h('header', { class: 'page-head' },
        h('h1', null, 'Týždne'),
        h('p', { class: 'lead' }, 'Učivo a cvičenia usporiadané podľa týždňov semestra.')),
      h('ol', { class: 'grid grid-2 week-list' }, ISI.data.weeks.map(function (week) {
        const content = weekContent(week);
        const mastered = content.codes.filter(function (c) { return (store.state.codes[c.id] || {}).mastered; }).length;
        return h('li', { class: 'card week-card' },
          h('h2', null, h('a', { href: '#/tyzdne/' + week.n }, week.title)),
          h('p', { class: 'muted' }, content.topics.map(function (t) { return t.short + ' · ' + t.title; }).join(' | ') || 'Bez témy'),
          h('div', { class: 'badges' },
            week.html ? null : ui.badge('Zhrnutie zatiaľ chýba', 'warn'),
            ui.badge(ui.plural(content.codes.length, 'kód', 'kódy', 'kódov') + (content.codes.length ? ', zvládnuté ' + mastered : '')),
            ui.badge(ui.plural(content.questions.length, 'otázka', 'otázky', 'otázok'))));
      }))));
    return null;
  }

  function renderWeek(ctx, week) {
    const weeks = ISI.data.weeks;
    const index = weeks.indexOf(week);
    const content = weekContent(week);
    const notes = week.html ? ui.article(week.html, 'week-notes') : null;
    const sections = notes ? Array.from(notes.querySelectorAll('.study-section > h2[id]')) : [];
    ctx.container.appendChild(h('div', { class: 'page page-narrow' },
      h('header', { class: 'page-head' },
        h('p', { class: 'crumbs' }, h('a', { href: '#/tyzdne' }, 'Týždne'), ' / ' + week.n + '. týždeň'),
        h('h1', null, week.title),
        h('div', { class: 'badges' }, content.topics.map(function (t) {
          return h('a', { class: 'badge badge-accent', href: '#/teoria/' + t.id }, t.short + ' · ' + t.title);
        }))),
      sections.length ? h('nav', { class: 'week-jump', 'aria-label': 'Časti poznámok' }, sections.map(function (heading) {
        return h('a', { href: '#/tyzdne/' + week.n + '/' + heading.id }, heading.textContent);
      })) : null,
      h('div', { class: 'week-material' + (notes ? '' : ' card') }, notes
        ? notes
        : h('p', { class: 'muted' }, 'Zhrnutie tohto týždňa zatiaľ nie je pripravené.')),
      h('section', { class: 'card' },
        h('h2', null, 'Kódy z cvičenia'),
        content.codes.length ? h('ul', { class: 'code-list' }, content.codes.map(function (code) {
          return ISI.views.codes.listItem(code);
        })) : h('p', { class: 'muted' }, 'K tomuto týždňu nie sú žiadne kódy.')),
      h('section', { class: 'card' },
        h('h2', null, 'Otázky k týždňu'),
        content.questions.length
          ? h('div', { class: 'actions' },
            ui.link('Precvičiť otázky týždňa (' + content.questions.length + ')', '#/otazky?week=' + week.n, 'primary'))
          : h('p', { class: 'muted' }, 'K tomuto týždňu nie sú žiadne otázky.')),
      h('nav', { class: 'pager', 'aria-label': 'Susedné týždne' },
        index > 0 ? h('a', { href: '#/tyzdne/' + weeks[index - 1].n }, '← ' + weeks[index - 1].title) : h('span'),
        index < weeks.length - 1 ? h('a', { href: '#/tyzdne/' + weeks[index + 1].n }, weeks[index + 1].title + ' →') : h('span'))));
    if (notes && ctx.parts[1]) {
      ctx.scrollTarget = Array.from(notes.querySelectorAll('[id]')).find(function (element) { return element.id === ctx.parts[1]; }) || null;
    }
    ui.rememberStudy('/tyzdne/' + week.n, week.title);
    return null;
  }

  ISI.views.weeks = function (ctx) {
    if (!ctx.parts[0]) return renderIndex(ctx);
    const week = ISI.data.weeks.find(function (w) { return String(w.n) === ctx.parts[0]; });
    if (!week) {
      ctx.container.appendChild(ui.emptyState('Týždeň sa nenašiel', null, ui.link('Späť na týždne', '#/tyzdne', 'primary')));
      return null;
    }
    return renderWeek(ctx, week);
  };
})();
