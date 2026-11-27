// All progress lives in one versioned localStorage key.
(function () {
  'use strict';

  const KEY = 'isi-prep:v1';
  const VERSION = 1;
  const MAX_ATTEMPTS = 30;

  function defaults() {
    return {
      version: VERSION,
      theme: 'auto',          // 'auto' | 'light' | 'dark'
      theoryRead: {},         // topicId -> timestamp
      questions: {},          // questionId -> { seen, right, wrong, last, lastAt }
      codes: {},              // codeId -> { attempts, best, bestClean, mastered, last, lastAt, fillAttempts, fillBest }
      drafts: {},             // codeId -> text typed in the from-memory editor
      codeSet: 'core',        // list of codes: 'core' (typical exercise codes) | 'all'
      attempts: [],           // finished tests, newest first, at most MAX_ATTEMPTS
      activeTest: null,       // the test in progress
      testConfig: null,       // last used start-screen settings
      lastStudy: null         // { route, label, at } for "continue where I left off"
    };
  }

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  // Fills in missing parts so that old or hand-edited data cannot break the views.
  function sanitize(raw) {
    const base = defaults();
    if (!isObject(raw)) return base;
    const state = Object.assign(base, raw);
    state.version = VERSION;
    if (['auto', 'light', 'dark'].indexOf(state.theme) < 0) state.theme = 'auto';
    if (state.codeSet !== 'all') state.codeSet = 'core';
    ['theoryRead', 'questions', 'codes', 'drafts'].forEach(function (name) {
      if (!isObject(state[name])) state[name] = {};
    });
    state.attempts = Array.isArray(state.attempts)
      ? state.attempts.filter(function (a) { return isObject(a) && Array.isArray(a.items); }).slice(0, MAX_ATTEMPTS)
      : [];
    if (!isObject(state.activeTest) || !Array.isArray(state.activeTest.items) || !state.activeTest.items.length) {
      state.activeTest = null;
    }
    if (!isObject(state.testConfig)) state.testConfig = null;
    if (!isObject(state.lastStudy)) state.lastStudy = null;
    return state;
  }

  let persistent = true;
  let state = load();

  function load() {
    try {
      return sanitize(JSON.parse(localStorage.getItem(KEY) || 'null'));
    } catch (error) {
      return defaults();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      persistent = true;
    } catch (error) {
      persistent = false;
    }
    return persistent;
  }

  // Another tab changed the progress: take it over instead of overwriting it later.
  window.addEventListener('storage', function (event) {
    if (event.key === KEY || event.key === null) state = load();
  });

  window.ISIStore = {
    KEY: KEY,
    MAX_ATTEMPTS: MAX_ATTEMPTS,
    get state() { return state; },
    get persistent() { return persistent; },
    save: save,
    update: function (change) {
      change(state);
      return save();
    },
    reset: function () {
      const theme = state.theme;
      state = defaults();
      state.theme = theme;
      save();
    },
    exportJson: function () {
      return JSON.stringify(Object.assign({ app: 'isi-prep', exportedAt: new Date().toISOString() }, state), null, 2);
    },
    // Throws an Error with a Slovak message when the text is not an export of this app.
    importJson: function (text) {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        throw new Error('Súbor nie je platný JSON.');
      }
      if (!isObject(parsed) || parsed.app !== 'isi-prep') throw new Error('Súbor nie je export z aplikácie ISI príprava.');
      if (parsed.version !== VERSION) throw new Error('Export je z inej verzie aplikácie (verzia ' + parsed.version + ').');
      delete parsed.app;
      delete parsed.exportedAt;
      state = sanitize(parsed);
      save();
    }
  };
})();
