// DOM helpers and the pieces shared by the views.
(function () {
  'use strict';

  const L = window.ISILogic;
  const ISI = window.ISI = { views: {}, data: null, ui: {} };

  const SOURCE_LABELS = {
    moodle: 'Moodle', lecture: 'Prednáška', teams: 'Teams', archive: 'Archív', quizlet: 'Quizlet', generated: 'Doplnená'
  };
  const TYPE_LABELS = { theory: 'Teoretická', practical: 'Praktická' };

  // ---------------------------------------------------------------- data access

  if (window.ISI_DATA && Array.isArray(window.ISI_DATA.topics)) {
    const raw = window.ISI_DATA;
    const data = {
      builtAt: raw.builtAt,
      topics: raw.topics,
      weeks: raw.weeks || [],
      codes: raw.codes || [],
      questions: raw.questions || [],
      topicById: {},
      codeById: {},
      questionById: {}
    };
    data.topics.forEach(function (t, index) { t.short = 'T' + (index + 1); data.topicById[t.id] = t; });
    data.codes.forEach(function (c) { data.codeById[c.id] = c; });
    data.questions.forEach(function (q) { data.questionById[q.id] = q; });
    ISI.data = data;
  }

  function topicTitle(topicId) {
    const topic = topicId && ISI.data.topicById[topicId];
    return topic ? topic.title : 'Bez témy';
  }

  function topicShort(topicId) {
    const topic = topicId && ISI.data.topicById[topicId];
    return topic ? topic.short : '–';
  }

  // Topic keys that have questions, in topic order; questions without a topic come last.
  function questionTopicKeys() {
    const keys = ISI.data.topics.map(function (t) { return t.id; });
    if (ISI.data.questions.some(function (q) { return !q.topicId; })) keys.push(L.NO_TOPIC);
    return keys;
  }

  // ---------------------------------------------------------------- elements

  // A small, consistent line-icon set. No font or network dependency.
  function icon(name) {
    const paths = {
      dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      test: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v4H9zM9 12h6m-6 4h4"/>',
      practice: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3H13a8 8 0 0 1 8 8.5Z"/><path d="m8 12 3 3 5-6"/>',
      theory: '<path d="M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
      codes: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
      weeks: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2"/>',
      settings: '<path d="m10 2-1 3-3 1-3-1-1 4 3 2v3l-3 2 2 4 3-1 3 1 1 3 4-1 1-3 3-1 3 1 1-4-3-2v-3l3-2-2-4-3 1-3-1-1-3Z" transform="translate(0 -1) scale(.95)"/><circle cx="12" cy="11" r="3"/>',
      arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
    };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.65');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('class', 'ui-icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = paths[name] || paths.arrow;
    return svg;
  }

  ISI.ui.icon = icon;

  function append(parent, children) {
    for (const child of children) {
      if (child == null || child === false) continue;
      if (Array.isArray(child)) append(parent, child);
      else parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
    }
  }

  // h('a', { class: 'btn', href: '#/', onclick: fn }, 'text', child, [children])
  function h(tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (name) {
        const value = attrs[name];
        if (value == null || value === false) return;
        if (name === 'class') el.className = value;
        else if (name === 'html') el.innerHTML = value;
        else if (name.slice(0, 2) === 'on' && typeof value === 'function') el.addEventListener(name.slice(2), value);
        else if (value === true) el.setAttribute(name, '');
        else el.setAttribute(name, value);
      });
    }
    append(el, Array.prototype.slice.call(arguments, 2));
    return el;
  }

  function inline(tag, text, attrs) {
    return h(tag, Object.assign({ html: L.inlineHtml(text) }, attrs || {}));
  }

  function button(label, onclick, kind, attrs) {
    return h('button', Object.assign({ type: 'button', class: 'btn' + (kind ? ' btn-' + kind : ''), onclick: onclick }, attrs || {}), label);
  }

  function link(label, href, kind, attrs) {
    return h('a', Object.assign({ href: href, class: kind ? 'btn btn-' + kind : null }, attrs || {}), label);
  }

  function badge(text, kind, title) {
    return h('span', { class: 'badge' + (kind ? ' badge-' + kind : ''), title: title }, text);
  }

  function sourceBadge(source) {
    return badge(SOURCE_LABELS[source] || source, source === 'quizlet' ? 'warn' : null, 'Zdroj otázky');
  }

  function questionBadges(question) {
    return h('div', { class: 'badges' },
      badge(topicShort(question.topicId), 'accent', topicTitle(question.topicId)),
      badge(TYPE_LABELS[question.type] || question.type),
      question.week ? badge(question.week + '. týždeň') : null,
      sourceBadge(question.source),
      question.disputed ? badge('Sporná', 'warn', 'Odpoveď z Quizletu je v rozpore s prednáškami') : null);
  }

  function progressBar(value, label, kind) {
    const percent = Math.round(Math.max(0, Math.min(1, value || 0)) * 100);
    return h('div', {
      class: 'bar' + (kind ? ' bar-' + kind : ''), role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100',
      'aria-valuenow': String(percent), 'aria-label': label
    }, h('span', { style: 'width:' + percent + '%' }));
  }

  function emptyState(title, text, action) {
    return h('div', { class: 'empty' }, h('h2', null, title), text ? h('p', null, text) : null, action || null);
  }

  // ---------------------------------------------------------------- code

  // Colour calls without touching strings, comments, or the underlying code text.
  function enhanceCodeCalls(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest('[class^="tk-"]')) nodes.push(walker.currentNode);
    }
    nodes.forEach(function (node) {
      const pattern = /\b([A-Za-z_][A-Za-z_0-9]*)(?=\s*\()/g;
      const text = node.textContent;
      let match;
      let start = 0;
      const parts = document.createDocumentFragment();
      while ((match = pattern.exec(text))) {
        parts.appendChild(document.createTextNode(text.slice(start, match.index)));
        parts.appendChild(h('span', { class: /^[A-Z]/.test(match[0]) ? 'tk-class' : 'tk-call' }, match[0]));
        start = pattern.lastIndex;
      }
      if (start) {
        parts.appendChild(document.createTextNode(text.slice(start)));
        node.replaceWith(parts);
      }
    });
    return root;
  }

  // Exact course terms only. Each text block gets a small emphasis budget.
  const STUDY_TERMS = [
    'učenie s učiteľom', 'učenie bez učiteľa', 'učenie posilňovaním', 'strojové učenie',
    'lineárna regresia', 'logistická regresia', 'cieľová premenná', 'rozhodovacia hranica',
    'rozhodovací strom', 'náhodný les', 'krížová validácia', 'validačná množina', 'testovacia množina',
    'výber príznakov', 'štandardizácia', 'škálovanie', 'imputácia', 'stratifikácia',
    'matica zámen', 'hyperparametre', 'hyperparameter', 'klasifikácia', 'regresia',
    'generalizácia', 'príznak', 'vzorka', 'pipeline', 'train/test', 'hold-out', 'grid search',
    'overfitting', 'underfitting', 'data leakage', 'pretrénovanie', 'únik informácie',
    'NumPy', 'Matplotlib', 'Python', 'pandas', 'scikit-learn', 'kernel',
    'K-fold', 'PCA', 'K-means', 'DBSCAN', 'SVM', 'KNN', 'k-NN', 'BFS', 'DFS', 'UCS', 'A*',
    'Greedy', 'CSP', 'MRV', 'LCV', 'backtracking', 'forward checking', 'heuristika',
    'Manhattan', 'prioritný front', 'open list', 'closed list', 'hill climbing',
    'simulované žíhanie', 'genetický algoritmus', 'accuracy', 'precision', 'recall', 'R²'
  ];
  const STUDY_PATTERN = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + STUDY_TERMS
    .slice().sort(function (a, b) { return b.length - a.length; })
    .map(function (term) { return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') +
    ')(?![\\p{L}\\p{N}_])', 'giu');
  const CAUTION_TERM = /^(overfitting|underfitting|data leakage|pretrénovanie|únik informácie)$/i;

  function emphasizeStudy(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    const counts = new WeakMap();
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement.closest('pre, code, strong, b, a, h1, h2, h3, h4, .study-term')) nodes.push(node);
    }
    nodes.forEach(function (node) {
      const block = node.parentElement.closest('p, li, td, th') || node.parentElement;
      let count = counts.get(block) || 0;
      if (count >= 2) return;
      const text = node.textContent;
      const seen = new Set();
      const parts = document.createDocumentFragment();
      let start = 0;
      let match;
      STUDY_PATTERN.lastIndex = 0;
      while (count < 2 && (match = STUDY_PATTERN.exec(text))) {
        const term = match[0];
        if (seen.has(term.toLocaleLowerCase('sk'))) continue;
        seen.add(term.toLocaleLowerCase('sk'));
        parts.appendChild(document.createTextNode(text.slice(start, match.index)));
        parts.appendChild(h('strong', { class: 'study-term' + (CAUTION_TERM.test(term) ? ' study-term-caution' : '') }, term));
        start = STUDY_PATTERN.lastIndex;
        count++;
      }
      if (start) {
        parts.appendChild(document.createTextNode(text.slice(start)));
        node.replaceWith(parts);
        counts.set(block, count);
      }
    });
  }

  function organizeWeekNotes(root) {
    let section = null;
    Array.from(root.childNodes).forEach(function (node) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'H2') {
        const title = L.fold(node.textContent);
        const kind = title.includes('zapamatat') ? 'recap' : title.includes('robilo') ? 'work' : 'resources';
        section = h('section', { class: 'study-section study-section-' + kind, 'aria-labelledby': node.id || null });
        root.insertBefore(section, node);
      }
      if (section) section.appendChild(node);
    });
    root.querySelectorAll('.study-section-work > ol > li > strong:first-child:not(.study-term)').forEach(function (heading) {
      const next = heading.nextSibling;
      if (!next || next.nodeType !== Node.TEXT_NODE) return;
      const separator = /^\s*[–—:-]\s*/.exec(next.textContent);
      if (!separator) return;
      // Keep the original punctuation in the DOM while displaying a separate title.
      next.splitText(separator[0].length);
      heading.after(h('span', { class: 'study-step-separator', 'aria-hidden': 'true' }, next.textContent));
      next.remove();
    });
  }

  // <pre> with one block element per line; opts: { keyLines, numbers }
  function codeBlock(code, opts) {
    const o = opts || {};
    const keys = new Set(o.keyLines || []);
    const html = L.highlightPython(code).map(function (line, index) {
      return '<span class="line' + (keys.has(index) ? ' line-key' : '') + '">' + line + '\n</span>';
    }).join('');
    return h('pre', { class: 'code' + (o.numbers ? ' code-numbered' : ''), tabindex: '0', 'data-language': 'Python' },
      enhanceCodeCalls(h('code', { html: html })));
  }

  // Highlights the fenced Python blocks of build-time HTML.
  function enhanceArticle(root) {
    root.querySelectorAll('pre > code').forEach(function (code) {
      const pre = code.parentNode;
      pre.classList.add('code');
      pre.setAttribute('tabindex', '0');
      if (/language-(python|py)\b/.test(code.className)) {
        pre.setAttribute('data-language', 'Python');
        code.innerHTML = L.highlightPython(code.textContent.replace(/\n$/, '')).join('\n');
        enhanceCodeCalls(code);
      }
    });
    emphasizeStudy(root);
    if (root.classList.contains('week-notes')) organizeWeekNotes(root);
    return root;
  }

  function article(html, extraClass) {
    return enhanceArticle(h('div', { class: 'prose' + (extraClass ? ' ' + extraClass : ''), html: html }));
  }

  // ---------------------------------------------------------------- questions

  function questionBody(question) {
    return [
      inline('p', question.text, { class: 'question-text' }),
      question.code ? codeBlock(question.code, { numbers: true }) : null
    ];
  }

  /**
   * The options as checkboxes. opts: { order, selected, onToggle } while answering,
   * { order, selected, reveal: true } for the evaluated state.
   */
  function optionList(question, opts) {
    const selected = new Set(opts.selected || []);
    return h('ul', { class: 'options' + (opts.reveal ? ' options-revealed' : '') }, opts.order.map(function (original, position) {
      const option = question.options[original];
      if (!option) return null;
      const ticked = selected.has(original);
      let state = '';
      let note = null;
      if (opts.reveal) {
        if (ticked && option.correct) { state = ' option-right'; note = '✓ správne označená'; }
        else if (ticked) { state = ' option-wrong'; note = '✗ nesprávne označená'; }
        else if (option.correct) { state = ' option-missed'; note = '○ správna, neoznačená'; }
      }
      const input = h('input', {
        type: 'checkbox', checked: ticked, disabled: !!opts.reveal, 'data-option': String(position),
        onchange: opts.onToggle ? function () { opts.onToggle(original, input.checked); } : null
      });
      input.checked = ticked;
      return h('li', null, h('label', { class: 'option' + state },
        input,
        h('span', { class: 'option-key', 'aria-hidden': 'true' }, String(position + 1)),
        inline('span', option.text, { class: 'option-text' }),
        note ? h('span', { class: 'option-note' }, note) : null));
    }));
  }

  function explanationBox(question) {
    return h('div', { class: 'explanation' },
      h('h3', null, 'Vysvetlenie'),
      inline('p', question.explanation),
      question.disputed ? h('p', { class: 'note note-warn' },
        'Sporná otázka: odpoveď z Quizletu je v rozpore s prednáškami – riaď sa vysvetlením.') : null);
  }

  // Digits 1-6 toggle the options, Enter confirms. Returns the function that removes the handler.
  function questionKeys(root, onEnter) {
    function handler(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      if (document.querySelector('dialog[open]')) return;
      const target = event.target;
      const tag = target && target.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && target.type !== 'checkbox')) return;
      if (/^[1-6]$/.test(event.key)) {
        const input = root.querySelector('input[data-option="' + (Number(event.key) - 1) + '"]');
        if (input && !input.disabled) {
          input.click();
          input.focus();
          event.preventDefault();
        }
      } else if (event.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A' && tag !== 'SUMMARY') {
        event.preventDefault();
        onEnter();
      }
    }
    document.addEventListener('keydown', handler);
    return function () { document.removeEventListener('keydown', handler); };
  }

  // ---------------------------------------------------------------- feedback

  function toast(message, kind) {
    const region = document.getElementById('toasts');
    if (!region) return;
    const item = h('div', { class: 'toast' + (kind ? ' toast-' + kind : '') }, message);
    region.appendChild(item);
    setTimeout(function () { item.remove(); }, 5000);
  }

  // Resolves to true when the user confirms. opts: { title, text, confirm, cancel, danger }
  function confirmDialog(opts) {
    return new Promise(function (resolve) {
      const dialog = h('dialog', { class: 'dialog', 'aria-labelledby': 'dialog-title' },
        h('h2', { id: 'dialog-title' }, opts.title),
        h('p', null, opts.text),
        h('div', { class: 'dialog-actions' },
          button(opts.cancel || 'Zrušiť', function () { dialog.close('cancel'); }),
          button(opts.confirm || 'Potvrdiť', function () { dialog.close('ok'); }, opts.danger ? 'danger' : 'primary')));
      if (typeof dialog.showModal !== 'function') {
        resolve(window.confirm(opts.title + '\n\n' + opts.text));
        return;
      }
      document.body.appendChild(dialog);
      dialog.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          dialog.close('cancel');
        }
      });
      dialog.addEventListener('close', function () {
        dialog.remove();
        resolve(dialog.returnValue === 'ok');
      });
      dialog.showModal();
    });
  }

  // ---------------------------------------------------------------- formatting

  function formatDate(timestamp) {
    const d = new Date(timestamp);
    function two(n) { return (n < 10 ? '0' : '') + n; }
    return d.getDate() + '. ' + (d.getMonth() + 1) + '. ' + d.getFullYear() + ' ' + two(d.getHours()) + ':' + two(d.getMinutes());
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m ? m + ' min ' + (s ? s + ' s' : '') : s + ' s';
  }

  function percentText(value) {
    return value == null ? '–' : Math.round(value * 100) + ' %';
  }

  // Slovak plural: plural(5, 'otázka', 'otázky', 'otázok') -> '5 otázok'
  function plural(count, one, few, many) {
    return count + ' ' + (count === 1 ? one : count >= 2 && count <= 4 ? few : many);
  }

  // Inline SVG trend of values 0..1 (oldest first).
  function sparkline(values, label) {
    const width = 160;
    const height = 44;
    const pad = 5;
    const points = values.map(function (value, index) {
      const x = values.length === 1 ? width / 2 : pad + (index * (width - 2 * pad)) / (values.length - 1);
      const y = height - pad - Math.max(0, Math.min(1, value)) * (height - 2 * pad);
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
    });
    const path = points.map(function (p, index) { return (index ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
    const dots = points.map(function (p, index) {
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (index === points.length - 1 ? 3.5 : 2) + '"/>';
    }).join('');
    return h('span', {
      class: 'sparkline', role: 'img', 'aria-label': label,
      html: '<svg viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '" focusable="false">' +
        '<path d="' + path + '"/>' + dots + '</svg>'
    });
  }

  function rememberStudy(route, label) {
    window.ISIStore.update(function (state) {
      state.lastStudy = { route: route, label: label, at: Date.now() };
    });
  }

  Object.assign(ISI.ui, {
    SOURCE_LABELS: SOURCE_LABELS,
    TYPE_LABELS: TYPE_LABELS,
    topicTitle: topicTitle,
    topicShort: topicShort,
    questionTopicKeys: questionTopicKeys,
    h: h,
    inline: inline,
    button: button,
    link: link,
    badge: badge,
    sourceBadge: sourceBadge,
    questionBadges: questionBadges,
    progressBar: progressBar,
    emptyState: emptyState,
    codeBlock: codeBlock,
    enhanceArticle: enhanceArticle,
    article: article,
    questionBody: questionBody,
    optionList: optionList,
    explanationBox: explanationBox,
    questionKeys: questionKeys,
    toast: toast,
    confirmDialog: confirmDialog,
    formatDate: formatDate,
    formatDuration: formatDuration,
    percentText: percentText,
    plural: plural,
    sparkline: sparkline,
    rememberStudy: rememberStudy
  });
})();
