// Shell: hash routing, navigation, theme and the clock of a running test.
(function () {
  'use strict';

  const ISI = window.ISI;
  const ui = ISI.ui;
  const h = ui.h;
  const L = window.ISILogic;
  const store = window.ISIStore;

  const SECTIONS = [
    { id: '', label: 'Prehľad', view: 'dashboard' },
    { id: 'speed', label: 'Speed mód', view: 'speed' },
    { id: 'test', label: 'Test', view: 'test' },
    { id: 'otazky', label: 'Otázky', view: 'practice' },
    { id: 'teoria', label: 'Teória', view: 'theory' },
    { id: 'kody', label: 'Kódy', view: 'codes' },
    { id: 'tyzdne', label: 'Týždne', view: 'weeks' },
    { id: 'nastavenia', label: 'Nastavenia', view: 'settings' }
  ];
  const THEME_LABELS = { auto: 'automatická', light: 'svetlá', dark: 'tmavá' };

  const main = document.getElementById('app');
  const nav = document.getElementById('nav');
  const testChip = document.getElementById('test-chip');
  const themeButton = document.getElementById('theme-toggle');
  let cleanup = null;

  document.querySelector('.skip-link').addEventListener('click', function (event) {
    event.preventDefault();
    main.focus();
  });

  // ---------------------------------------------------------------- theme

  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function applyTheme() {
    const choice = store.state.theme;
    const resolved = choice === 'auto' ? (darkQuery && darkQuery.matches ? 'dark' : 'light') : choice;
    document.documentElement.setAttribute('data-theme', resolved);
    themeButton.setAttribute('aria-label', 'Téma: ' + THEME_LABELS[choice] + ' – zmeniť');
    themeButton.title = 'Téma: ' + THEME_LABELS[choice];
    themeButton.textContent = choice === 'auto' ? '◐' : choice === 'light' ? '☀' : '☾';
  }

  themeButton.addEventListener('click', function () {
    const order = ['auto', 'light', 'dark'];
    store.update(function (state) { state.theme = order[(order.indexOf(state.theme) + 1) % order.length]; });
    applyTheme();
    if (currentSection() === 'nastavenia') render(true);
  });
  if (darkQuery) {
    const onChange = function () { applyTheme(); };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onChange);
    else if (darkQuery.addListener) darkQuery.addListener(onChange);
  }

  // ---------------------------------------------------------------- routing

  function parseRoute() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const queryAt = hash.indexOf('?');
    const path = queryAt >= 0 ? hash.slice(0, queryAt) : hash;
    const parts = path.split('/').filter(Boolean).map(function (part) {
      try {
        return decodeURIComponent(part);
      } catch (error) {
        return part;
      }
    });
    return { parts: parts, query: new URLSearchParams(queryAt >= 0 ? hash.slice(queryAt + 1) : '') };
  }

  function currentSection() {
    return parseRoute().parts[0] || '';
  }

  // path like '/otazky?topic=t1'; replace = do not add a history entry.
  function navigate(path, replace) {
    const target = '#' + path;
    if (window.location.hash === target) {
      render(false);
    } else if (replace) {
      window.location.replace(target);
    } else {
      window.location.hash = target;
    }
  }

  function renderNav(active) {
    nav.textContent = '';
    SECTIONS.forEach(function (section) {
      nav.appendChild(h('a', { href: '#/' + section.id, 'aria-current': section.id === active ? 'page' : null },
        ui.icon(section.view), h('span', null, section.label),
        h('span', { class: 'nav-indicator', 'aria-hidden': 'true' }, '')));
    });
  }

  function render(keepScroll) {
    const route = parseRoute();
    const id = route.parts[0] || '';
    const section = SECTIONS.find(function (s) { return s.id === id; });
    const scroll = window.scrollY;

    if (cleanup) {
      try {
        cleanup();
      } catch (error) {
        console.error(error);
      }
      cleanup = null;
    }
    main.textContent = '';
    main.setAttribute('data-section', section ? section.view : '');
    renderNav(section ? section.id : null);
    document.title = (section && section.id ? section.label + ' – ' : '') + 'ISI príprava';

    const ctx = {
      container: main,
      parts: route.parts.slice(1),
      query: route.query,
      refresh: function (keep) { render(!!keep); },
      scrollTarget: null,
      onCleanup: null
    };
    if (!section) {
      main.appendChild(ui.emptyState('Stránka sa nenašla', 'Táto adresa v aplikácii neexistuje.', ui.link('Na prehľad', '#/', 'primary')));
    } else if (!ISI.data && section.view !== 'settings') {
      main.appendChild(ui.emptyState('Obsah nie je zostavený',
        'Chýba súbor js/data.js. Spusti start.ps1 alebo príkaz „python tools\\build.py“ a obnov stránku.'));
    } else {
      try {
        cleanup = ISI.views[section.view](ctx) || null;
      } catch (error) {
        console.error(error);
        main.appendChild(h('div', { class: 'note note-bad', role: 'alert' },
          'Pri zobrazení stránky nastala chyba: ' + (error && error.message ? error.message : String(error))));
      }
    }
    updateTestChip();
    if (keepScroll) {
      window.scrollTo(0, scroll);
    } else if (ctx.scrollTarget) {
      ctx.scrollTarget.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  window.addEventListener('hashchange', function () {
    render(false);
    // Screen readers and keyboard users continue from the new content.
    main.focus({ preventScroll: true });
  });

  // ---------------------------------------------------------------- running test clock

  function updateTestChip() {
    const active = store.state.activeTest;
    const onTestPage = currentSection() === 'test' && parseRoute().parts.length === 1;
    testChip.hidden = !active || onTestPage;
    if (active) testChip.textContent = 'Test beží · ' + L.formatClock(ISI.test.remainingSeconds());
  }

  setInterval(function () {
    const active = store.state.activeTest;
    if (active && ISI.data) {
      if (ISI.test.remainingSeconds() <= 0) {
        const id = ISI.test.finish('timeout');
        ui.toast('Čas vypršal – test bol odovzdaný.', 'warn');
        navigate('/test/vysledok/' + id, currentSection() === 'test');
        return;
      }
      document.dispatchEvent(new CustomEvent('isi:tick'));
    }
    updateTestChip();
  }, 500);

  ISI.app = { navigate: navigate, refresh: function (keep) { render(!!keep); }, applyTheme: applyTheme };

  applyTheme();
  if (!window.location.hash) {
    window.history.replaceState(null, '', '#/');
  }
  render(false);

  // Offline cache and installability on phones; service workers do not exist on file://.
  if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* the app works without it */ });
    });
  }
})();
