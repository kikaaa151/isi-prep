// Nastavenia: theme, export / import and reset of the progress.
(function () {
  'use strict';

  const ISI = window.ISI;
  const ui = ISI.ui;
  const h = ui.h;
  const store = window.ISIStore;

  const THEMES = [['auto', 'Automaticky podľa systému'], ['light', 'Svetlá'], ['dark', 'Tmavá']];

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const anchor = h('a', { href: url, download: name });
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  ISI.views.settings = function (ctx) {
    const state = store.state;
    const data = ISI.data;
    const fileInput = h('input', {
      type: 'file', accept: 'application/json,.json', class: 'visually-hidden', tabindex: '-1', 'aria-hidden': 'true',
      onchange: function () {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function () {
          ui.confirmDialog({
            title: 'Nahradiť súčasný postup?',
            text: 'Import prepíše všetok postup uložený v tomto prehliadači obsahom súboru ' + file.name + '.',
            confirm: 'Importovať', danger: true
          }).then(function (yes) {
            fileInput.value = '';
            if (!yes) return;
            try {
              store.importJson(String(reader.result));
              ISI.app.applyTheme();
              ui.toast('Postup bol importovaný.', 'ok');
              ctx.refresh();
            } catch (error) {
              ui.toast(error.message, 'bad');
            }
          });
        };
        reader.readAsText(file);
      }
    });

    ctx.container.appendChild(h('div', { class: 'page page-narrow' },
      h('header', { class: 'page-head' }, h('h1', null, 'Nastavenia')),
      store.persistent ? null : h('p', { class: 'note note-warn' },
        'Prehliadač nedovolil uložiť dáta (súkromný režim alebo plné úložisko) – postup sa po zatvorení stránky stratí.'),
      h('section', { class: 'card' },
        h('h2', null, 'Vzhľad'),
        h('fieldset', { class: 'checks' }, h('legend', null, 'Téma'), THEMES.map(function (theme) {
          const input = h('input', {
            type: 'radio', name: 'theme', value: theme[0], checked: state.theme === theme[0],
            onchange: function () {
              store.update(function (s) { s.theme = theme[0]; });
              ISI.app.applyTheme();
            }
          });
          return h('label', { class: 'check' }, input, h('span', null, theme[1]));
        }))),
      h('section', { class: 'card' },
        h('h2', null, 'Záloha postupu'),
        h('p', null, 'Postup (prečítaná teória, štatistiky otázok, kódy, výsledky testov) je uložený iba v tomto prehliadači. Exportom ho prenesieš na iné zariadenie.'),
        h('div', { class: 'actions' },
          ui.button('Exportovať do súboru', function () {
            download('isi-priprava-' + new Date().toISOString().slice(0, 10) + '.json', store.exportJson());
          }, 'primary'),
          ui.button('Importovať zo súboru', function () { fileInput.click(); }),
          fileInput)),
      h('section', { class: 'card' },
        h('h2', null, 'Vymazať postup'),
        h('p', null, 'Vymaže štatistiky otázok, prečítanú teóriu, zvládnuté kódy, rozpísané kódy aj výsledky testov. Téma vzhľadu zostane.'),
        h('div', { class: 'actions' },
          ui.button('Vymazať všetok postup', function () {
            ui.confirmDialog({
              title: 'Naozaj vymazať všetok postup?',
              text: 'Túto akciu nie je možné vrátiť. Ak si nie si istý, najprv si postup exportuj.',
              confirm: 'Vymazať', danger: true
            }).then(function (yes) {
              if (!yes) return;
              store.reset();
              ui.toast('Postup bol vymazaný.', 'ok');
              ctx.refresh();
            });
          }, 'danger'))),
      data ? h('section', { class: 'card' },
        h('h2', null, 'Obsah'),
        h('dl', { class: 'stats' },
          h('div', null, h('dt', null, 'Témy'), h('dd', null, String(data.topics.length))),
          h('div', null, h('dt', null, 'Otázky'), h('dd', null, String(data.questions.length))),
          h('div', null, h('dt', null, 'Kódy'), h('dd', null, String(data.codes.length))),
          h('div', null, h('dt', null, 'Zostavený'), h('dd', { class: 'small' }, data.builtAt ? ui.formatDate(data.builtAt) : '–'))),
        h('p', { class: 'muted' }, 'Učivo je dostupné aj bez pripojenia na internet.')) : null));
    return null;
  };
})();
