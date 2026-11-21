(() => {
  'use strict';
  const languages = ['en', 'de', 'ja', 'tr', 'es', 'pt'];
  // The requested URL determines the article language, including without JS.
  const language = document.documentElement.lang.split('-')[0];
  const translations = new Map(window.SoundAdjusterLocales.map(row => [row[0], row]));
  window.SoundAdjusterI18n = {
    t: source => translations.get(source)?.[languages.indexOf(language)] ?? source,
    get language() { return language; }
  };
  const selector = document.getElementById('site-language');
  selector.value = language;
  selector.parentElement.dataset.languageCode = language.toUpperCase();
  selector.addEventListener('change', () => {
    if (!languages.includes(selector.value)) return;
    try { localStorage.setItem('sound-adjuster.site-language', selector.value); } catch {}
    const page = `default-audio-settings${selector.value === 'en' ? '' : '-' + selector.value}.html`;
    location.assign(page + location.hash);
  });
  window.dispatchEvent(new Event('site-language-change'));
})();
