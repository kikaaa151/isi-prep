// Speed mód: the exam facts as levels of flip cards, a map of the libraries and a 60-second import quiz.
(function () {
  'use strict';

  const ISI = window.ISI;
  const ui = ISI.ui;
  const h = ui.h;
  const L = window.ISILogic;
  const store = window.ISIStore;

  const LEVEL_HUES = [145, 28, 205, 265, 330, 45, 175, 5];
  const SHELF_HUES = [145, 205, 28, 265, 330, 45, 175];
  const BLITZ_SECONDS = 60;

  function speed() {
    return ISI.data.speed;
  }

  function levelHue(level) {
    return LEVEL_HUES[speed().levels.indexOf(level) % LEVEL_HUES.length];
  }

  function knownCount(level) {
    const known = store.state.speed.known;
    return level.cards.filter(function (card) { return known[card.id]; }).length;
  }

  function totals() {
    return speed().levels.reduce(function (sum, level) {
      return { known: sum.known + knownCount(level), cards: sum.cards + level.cards.length };
    }, { known: 0, cards: 0 });
  }

  function crumbs(label) {
    return h('p', { class: 'crumbs' }, h('a', { href: '#/speed' }, 'Speed mód'), ' / ' + label);
  }

  // ---------------------------------------------------------------- index

  function renderIndex(ctx) {
    const data = speed();
    const sum = totals();
    const libraryItems = data.libraries.reduce(function (n, lib) { return n + lib.items.length; }, 0);
    ctx.container.appendChild(h('div', { class: 'page speed-page' },
      h('header', { class: 'speed-hero' },
        h('div', { class: 'speed-hero-copy' },
          h('p', { class: 'eyebrow' }, ui.icon('speed'), 'SPEED MÓD · LEN TO PODSTATNÉ'),
          h('h1', null, 'Zápočet na rýchlo'),
          h('p', { class: 'lead' }, 'Výcuc z cvičení: kúsky kódu, knižnice a čísla, ktoré sa oplatí vedieť na zápočet. ' +
            'Ku každej téme postup cvičenia, kartičky a typické pasce.')),
        h('div', { class: 'speed-score' },
          h('strong', null, sum.known + ' / ' + sum.cards),
          h('span', null, 'kartičiek viem'),
          ui.progressBar(sum.cards ? sum.known / sum.cards : 0, 'Zvládnuté kartičky', 'ok'),
          h('span', { class: 'speed-best' }, 'Rekord v bleskovke: ' + store.state.speed.best))),
      h('ol', { class: 'speed-method', 'aria-label': 'Ako sa učiť' },
        h('li', null, h('span', { 'aria-hidden': 'true' }, '1'), h('strong', null, 'Pozri postup'), h('small', null, 'obrázok so slovom sa pamätá ľahšie')),
        h('li', null, h('span', { 'aria-hidden': 'true' }, '2'), h('strong', null, 'Vybav si z hlavy'), h('small', null, 'odpovedz skôr, než kartu otočíš')),
        h('li', null, h('span', { 'aria-hidden': 'true' }, '3'), h('strong', null, 'Otoč a over'), h('small', null, 'označ „Viem“ alebo „Ešte nie“'))),
      h('div', { class: 'speed-modes' },
        h('a', { class: 'speed-mode', href: '#/speed/bleskovka' },
          h('span', { class: 'speed-mode-icon', 'aria-hidden': 'true' }, ui.icon('speed')),
          h('span', null, h('strong', null, 'Bleskovka – 60 sekúnd'),
            h('small', null, 'Z ktorého modulu sa trieda importuje a čo robí.'))),
        h('a', { class: 'speed-mode', href: '#/speed/kniznice' },
          h('span', { class: 'speed-mode-icon', 'aria-hidden': 'true' }, ui.icon('codes')),
          h('span', null, h('strong', null, 'Mapa knižníc'),
            h('small', null, data.libraries.length + ' políc, ' + libraryItems + ' tried a funkcií – každá polica s riadkom importu.')))),
      h('section', null,
        h('h2', { class: 'speed-section-title' }, 'Levely'),
        h('ol', { class: 'speed-levels' }, data.levels.map(function (level, index) {
          const known = knownCount(level);
          const done = known === level.cards.length;
          return h('li', null, h('a', {
            class: 'speed-level speed-tint' + (done ? ' is-done' : ''), href: '#/speed/' + level.id, style: '--hue:' + levelHue(level)
          },
          h('span', { class: 'speed-level-icon', 'aria-hidden': 'true' }, level.icon),
          h('span', { class: 'speed-level-body' },
            h('small', null, 'Level ' + (index + 1) + ' · ' + ui.topicShort(level.topicId) + (done ? ' · hotovo' : '')),
            h('strong', null, level.title),
            h('span', { class: 'speed-level-tagline' }, level.tagline),
            h('span', { class: 'bar-cell' },
              ui.progressBar(known / level.cards.length, 'Zvládnuté kartičky levelu ' + (index + 1), 'ok'),
              h('span', null, known + ' / ' + level.cards.length)))));
        })))));
    return null;
  }

  // ---------------------------------------------------------------- level

  function flipCard(card, onMark) {
    let flipped = false;
    const article = h('article', { class: 'flip' + (store.state.speed.known[card.id] ? ' is-known' : '') });
    const front = h('button', { type: 'button', class: 'flip-face flip-front' },
      h('span', { class: 'flip-icon', 'aria-hidden': 'true' }, card.icon),
      ui.inline('span', card.q, { class: 'flip-q' }),
      h('span', { class: 'flip-hint', 'aria-hidden': 'true' }, 'otočiť'),
      h('span', { class: 'flip-known', 'aria-hidden': 'true' }, '✓'));
    const back = h('div', { class: 'flip-face flip-back' },
      ui.inline('p', card.q, { class: 'flip-back-q' }),
      ui.inline('p', card.a, { class: 'flip-a' }),
      card.code ? ui.codeBlock(card.code) : null,
      h('div', { class: 'flip-actions' },
        ui.button('Viem', function () { mark(true); }, 'primary btn-small'),
        ui.button('Ešte nie', function () { mark(false); }, 'small'),
        ui.button('↺', function () { set(false); front.focus(); }, 'ghost btn-small', { 'aria-label': 'Otočiť späť', title: 'Otočiť späť' }),
        card.codeId ? h('a', { class: 'flip-code-link', href: '#/kody/' + card.codeId }, 'Celý kód →') : null));

    function set(value) {
      flipped = value;
      article.classList.toggle('is-flipped', flipped);
      front.inert = flipped;
      back.inert = !flipped;
      back.setAttribute('aria-hidden', String(!flipped));
    }

    function mark(known) {
      store.update(function (state) {
        if (known) state.speed.known[card.id] = Date.now();
        else delete state.speed.known[card.id];
      });
      article.classList.toggle('is-known', known);
      set(false);
      front.focus();
      onMark(known);
    }

    front.addEventListener('click', function () {
      set(true);
      const first = back.querySelector('button');
      if (first) first.focus({ preventScroll: true });
    });
    article.append(h('div', { class: 'flip-inner' }, front, back));
    set(false);
    return { element: article, set: set, card: card };
  }

  function renderLevel(ctx, level) {
    const levels = speed().levels;
    const index = levels.indexOf(level);
    const topic = ISI.data.topicById[level.topicId];
    const counter = h('span', { class: 'speed-counter' });
    const barSlot = h('span', { class: 'speed-level-bar' });
    let wasDone = knownCount(level) === level.cards.length;

    function refreshProgress() {
      const known = knownCount(level);
      counter.textContent = 'Viem ' + known + ' / ' + level.cards.length;
      barSlot.textContent = '';
      barSlot.appendChild(ui.progressBar(known / level.cards.length, 'Zvládnuté kartičky', 'ok'));
      const done = known === level.cards.length;
      if (done && !wasDone) ui.toast('Level hotový – všetky kartičky sú označené ako známe.', 'ok');
      wasDone = done;
    }

    const cards = level.cards.map(function (card) { return flipCard(card, refreshProgress); });
    const grid = h('div', { class: 'flip-grid' }, cards.map(function (c) { return c.element; }));
    let showAll = false;
    const showAllButton = ui.button('Ukázať všetky odpovede', function () {
      showAll = !showAll;
      cards.forEach(function (c) { c.set(showAll); });
      showAllButton.textContent = showAll ? 'Skryť odpovede' : 'Ukázať všetky odpovede';
      showAllButton.setAttribute('aria-pressed', String(showAll));
    }, 'small', { 'aria-pressed': 'false' });

    ctx.container.appendChild(h('div', { class: 'page speed-page speed-tint', style: '--hue:' + levelHue(level) },
      h('header', { class: 'speed-level-head' },
        crumbs('Level ' + (index + 1)),
        h('div', { class: 'speed-level-title' },
          h('span', { class: 'speed-level-icon speed-level-icon-large', 'aria-hidden': 'true' }, level.icon),
          h('div', null,
            h('h1', null, level.title),
            h('p', { class: 'lead' }, level.tagline))),
        h('div', { class: 'badges' },
          topic ? h('a', { class: 'badge badge-accent', href: '#/teoria/' + topic.id }, topic.short + ' · ' + topic.title) : null,
          counter),
        barSlot),
      h('section', { class: 'speed-flow-card' },
        h('h2', { class: 'speed-section-title' }, 'Postup'),
        h('ol', { class: 'speed-flow' }, level.flow.map(function (step, i) {
          return h('li', null,
            h('span', { class: 'speed-flow-num', 'aria-hidden': 'true' }, String(i + 1)),
            h('span', { class: 'speed-flow-icon', 'aria-hidden': 'true' }, step.icon),
            ui.inline('span', step.text, { class: 'speed-flow-text' }));
        }))),
      h('aside', { class: 'speed-hook' },
        h('div', null, h('strong', null, 'Na zapamätanie'), ui.inline('p', level.hook))),
      h('section', null,
        h('div', { class: 'speed-cards-head' },
          h('h2', { class: 'speed-section-title' }, 'Kartičky'),
          h('div', { class: 'actions' },
            showAllButton,
            ui.button('Zamiešať', function () {
              L.shuffle(cards).forEach(function (c) { grid.appendChild(c.element); });
            }, 'small'))),
        h('p', { class: 'muted speed-tip' }, 'Najprv si odpoveď vybav z hlavy, až potom kartu otoč.'),
        grid),
      level.traps.length ? h('section', { class: 'speed-traps' },
        h('h2', { class: 'speed-section-title' }, 'Pasce na teste'),
        h('ul', null, level.traps.map(function (trap) { return ui.inline('li', trap); }))) : null,
      h('div', { class: 'actions' },
        ui.link('Bleskovka', '#/speed/bleskovka', 'primary'),
        ui.link('Mapa knižníc', '#/speed/kniznice', 'default')),
      h('nav', { class: 'pager', 'aria-label': 'Susedné levely' },
        index > 0 ? h('a', { href: '#/speed/' + levels[index - 1].id }, '← ' + levels[index - 1].title) : h('span'),
        index < levels.length - 1 ? h('a', { href: '#/speed/' + levels[index + 1].id }, levels[index + 1].title + ' →') : h('span'))));
    refreshProgress();
    ui.rememberStudy('/speed/' + level.id, 'Speed: ' + level.title);
    return null;
  }

  // ---------------------------------------------------------------- library map

  function renderLibraries(ctx) {
    const shelves = h('div', { class: 'shelves' });
    const toggle = ui.button('Zakryť importy', function () {
      const hidden = !shelves.classList.contains('hide-imports');
      shelves.classList.toggle('hide-imports', hidden);
      shelves.querySelectorAll('.shelf.is-revealed').forEach(function (shelf) { shelf.classList.remove('is-revealed'); });
      toggle.textContent = hidden ? 'Ukázať importy' : 'Zakryť importy';
      toggle.setAttribute('aria-pressed', String(hidden));
    }, 'small', { 'aria-pressed': 'false' });

    speed().libraries.forEach(function (library, index) {
      const shelf = h('section', { class: 'shelf speed-tint', style: '--hue:' + SHELF_HUES[index % SHELF_HUES.length] });
      shelf.append(
        h('header', { class: 'shelf-head' },
          h('span', { class: 'shelf-icon', 'aria-hidden': 'true' }, library.icon),
          h('div', null, h('h2', null, library.module), h('small', null, library.nick))),
        h('div', { class: 'shelf-import' },
          ui.codeBlock(library.import),
          h('button', {
            type: 'button', class: 'shelf-reveal btn btn-small',
            onclick: function () { shelf.classList.add('is-revealed'); }
          }, 'Ukáž import')),
        h('ul', { class: 'shelf-items' }, library.items.map(function (item) {
          return h('li', null, h('code', null, item.name), ui.inline('span', item.what));
        })));
      shelves.appendChild(shelf);
    });

    ctx.container.appendChild(h('div', { class: 'page speed-page' },
      h('header', { class: 'page-head' },
        crumbs('Mapa knižníc'),
        h('h1', null, 'Mapa knižníc'),
        h('p', { class: 'lead' }, 'Moduly z cvičení s riadkom importu. Na teste sa pýta aj to, odkiaľ sa trieda ' +
          'importuje – zakry importy a skús si ich vybaviť z hlavy.'),
        h('div', { class: 'actions' }, toggle, ui.link('Bleskovka', '#/speed/bleskovka', 'primary'))),
      shelves));
    return null;
  }

  // ---------------------------------------------------------------- blitz quiz

  function renderBlitz(ctx) {
    const libraries = speed().libraries;
    const stage = h('div', { class: 'blitz' });
    const timers = [];
    let ticker = null;
    let game = null;

    function later(fn, ms) {
      timers.push(setTimeout(fn, ms));
    }

    function stopTimers() {
      if (ticker) clearInterval(ticker);
      ticker = null;
      timers.splice(0).forEach(clearTimeout);
    }

    function intro() {
      stopTimers();
      game = null;
      stage.textContent = '';
      stage.append(h('div', { class: 'blitz-intro' },
        h('h1', null, 'Bleskovka'),
        h('p', { class: 'lead' }, BLITZ_SECONDS + ' sekúnd. Dostaneš triedu alebo funkciu z cvičení a vyberieš, z ktorého modulu sa ' +
          'importuje alebo čo robí. Za každú správnu odpoveď je bod.'),
        h('p', { class: 'muted' }, 'Klávesy 1 – 4 vyberajú odpoveď, Enter spustí hru. Rekord: ' + store.state.speed.best + ' · odohrané: ' + store.state.speed.plays),
        h('div', { class: 'actions actions-center' }, ui.button('Začať', start, 'primary btn-large'))));
      stage.querySelector('.btn-primary').focus();
    }

    function start() {
      stopTimers();
      game = { score: 0, streak: 0, bestStreak: 0, answered: 0, mistakes: [], round: null, locked: false, end: Date.now() + BLITZ_SECONDS * 1000 };
      stage.textContent = '';
      game.timer = h('span', { class: 'blitz-timer' });
      game.scoreEl = h('span', { class: 'blitz-points' });
      game.streakEl = h('span', { class: 'blitz-streak' });
      game.timeBar = h('span', { class: 'blitz-timebar' }, h('span'));
      game.board = h('div', { class: 'blitz-board' });
      stage.append(
        h('div', { class: 'blitz-top' }, game.timer, game.scoreEl, game.streakEl),
        game.timeBar,
        game.board);
      ticker = setInterval(tick, 200);
      tick();
      next();
    }

    function tick() {
      if (!game) return;
      const left = Math.max(0, (game.end - Date.now()) / 1000);
      game.timer.textContent = Math.ceil(left) + ' s';
      game.timer.classList.toggle('is-hurry', left <= 10);
      game.timeBar.firstChild.style.width = (left / BLITZ_SECONDS * 100) + '%';
      if (left <= 0) finish();
    }

    function updateHud() {
      game.scoreEl.textContent = 'Body: ' + game.score;
      game.streakEl.textContent = game.streak >= 2 ? 'Séria ' + game.streak : '';
    }

    function next() {
      if (!game) return;
      game.round = L.blitzRound(libraries, null, game.round && game.round.name);
      game.locked = false;
      updateHud();
      const round = game.round;
      game.board.textContent = '';
      game.board.append(
        h('p', { class: 'blitz-kind' }, round.kind === 'module' ? 'Z ktorého modulu sa importuje?' : 'Čo to robí?'),
        h('p', { class: 'blitz-name' }, h('code', null, round.name)),
        h('div', { class: 'blitz-options' }, round.options.map(function (option, index) {
          return h('button', {
            type: 'button', class: 'blitz-option', 'data-index': String(index),
            onclick: function () { answer(index); }
          }, h('span', { class: 'option-key', 'aria-hidden': 'true' }, String(index + 1)),
          round.kind === 'module' ? h('code', null, option) : ui.inline('span', option));
        })),
        h('p', { class: 'blitz-feedback', role: 'status' }));
    }

    function answer(index) {
      if (!game || game.locked) return;
      game.locked = true;
      const round = game.round;
      const right = index === round.answer;
      const buttons = game.board.querySelectorAll('.blitz-option');
      buttons[round.answer].classList.add('is-right');
      const feedback = game.board.querySelector('.blitz-feedback');
      game.answered++;
      if (right) {
        game.score++;
        game.streak++;
        game.bestStreak = Math.max(game.bestStreak, game.streak);
        feedback.textContent = 'Správne';
      } else {
        buttons[index].classList.add('is-wrong');
        game.streak = 0;
        game.mistakes.push(round);
        const library = libraries.find(function (lib) { return lib.module === round.module; });
        feedback.textContent = '';
        feedback.append('Nesprávne – ', h('code', null, library ? library.import : round.module));
      }
      updateHud();
      later(next, right ? 450 : 1500);
    }

    function finish() {
      const result = game;
      stopTimers();
      game = null;
      const record = result.score > store.state.speed.best;
      store.update(function (state) {
        state.speed.plays++;
        if (record) state.speed.best = result.score;
      });
      const seen = new Set();
      const mistakes = result.mistakes.filter(function (m) { return !seen.has(m.name) && seen.add(m.name); });
      stage.textContent = '';
      stage.append(h('div', { class: 'blitz-over' },
        h('h1', null, result.score + ' ' + (result.score === 1 ? 'bod' : result.score >= 2 && result.score <= 4 ? 'body' : 'bodov')),
        h('p', { class: 'lead' }, record && result.score > 0 ? 'Nový rekord!' : 'Rekord: ' + store.state.speed.best),
        h('p', { class: 'muted' }, 'Odpovedí: ' + result.answered + ' · najdlhšia séria: ' + result.bestStreak),
        mistakes.length ? h('section', { class: 'blitz-mistakes' },
          h('h2', { class: 'speed-section-title' }, 'Toto si zopakuj'),
          h('ul', null, mistakes.map(function (m) {
            const library = libraries.find(function (lib) { return lib.module === m.module; });
            return h('li', null, h('code', null, m.name), ' – ', ui.inline('span', m.what),
              h('br'), h('small', null, library ? library.import : m.module));
          }))) : null,
        h('div', { class: 'actions actions-center' },
          ui.button('Hrať znova', start, 'primary btn-large'),
          ui.link('Mapa knižníc', '#/speed/kniznice', 'default'),
          ui.link('Späť na levely', '#/speed', 'ghost'))));
      stage.querySelector('.btn-primary').focus();
    }

    function onKey(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      if (document.querySelector('dialog[open]')) return;
      if (game && /^[1-4]$/.test(event.key)) {
        const button = game.board.querySelector('.blitz-option[data-index="' + (Number(event.key) - 1) + '"]');
        if (button) {
          event.preventDefault();
          button.click();
        }
      } else if (!game && event.key === 'Enter' && event.target.tagName !== 'A' && event.target.tagName !== 'BUTTON') {
        event.preventDefault();
        start();
      }
    }

    ctx.container.appendChild(h('div', { class: 'page page-narrow speed-page' }, crumbs('Bleskovka'), stage));
    if (!libraries.length) {
      stage.appendChild(ui.emptyState('Bleskovka nemá obsah', 'V content/speed.json chýbajú knižnice.'));
      return null;
    }
    intro();
    document.addEventListener('keydown', onKey);
    return function () {
      stopTimers();
      game = null;
      document.removeEventListener('keydown', onKey);
    };
  }

  ISI.views.speed = function (ctx) {
    if (!speed().levels.length) {
      ctx.container.appendChild(ui.emptyState('Speed mód zatiaľ nemá obsah',
        'Dáta sú zostavené bez content/speed.json. Spusti start.ps1 alebo príkaz „python tools\\build.py“ a obnov stránku.'));
      return null;
    }
    const part = ctx.parts[0];
    if (!part) return renderIndex(ctx);
    if (part === 'kniznice') return renderLibraries(ctx);
    if (part === 'bleskovka') return renderBlitz(ctx);
    const level = speed().levels.find(function (l) { return l.id === part; });
    if (!level) {
      ctx.container.appendChild(ui.emptyState('Level sa nenašiel', null, ui.link('Späť na Speed mód', '#/speed', 'primary')));
      return null;
    }
    return renderLevel(ctx, level);
  };
})();
