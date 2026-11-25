// Applies the stored theme before the first paint (loaded in <head>).
(function () {
  var theme = 'auto';
  try {
    var saved = JSON.parse(localStorage.getItem('isi-prep:v1') || 'null');
    if (saved && (saved.theme === 'light' || saved.theme === 'dark')) theme = saved.theme;
  } catch (error) {
    // Storage may be unavailable (private mode); the automatic theme is used.
  }
  if (theme === 'auto') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
