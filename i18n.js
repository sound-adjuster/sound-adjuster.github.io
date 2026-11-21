(() => {
  'use strict';
  const languages = ['en', 'de', 'ja', 'tr', 'es', 'pt'];
  const translations = new Map(window.SoundAdjusterLocales.map(row => [row[0], row]));
  const storageKey = 'sound-adjuster.site-language';
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  let language = browserLanguages
    .map(locale => String(locale || '').toLowerCase().split(/[-_]/)[0])
    .find(locale => languages.includes(locale)) || 'en';
  // Only a deliberate choice overrides browser preferences on later visits.
  try { const saved = localStorage.getItem(storageKey); if (languages.includes(saved)) language = saved; } catch {}
  const t = (source, values = {}) => (translations.get(source)?.[languages.indexOf(language)] ?? source)
    .replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
  window.SoundAdjusterI18n = { t, get language() { return language; } };
  // Keep the original text nodes and attributes, so switching languages never
  // replaces controls, event listeners, links, or user-entered profile names.
  const texts = [], attributes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode, source = node.textContent.trim();
    if (node.parentElement.closest('script, style, noscript, #demo-status, .play-label, output, #profile-list, [data-i18n-dynamic], [translate="no"]')) continue;
    if (translations.has(source)) texts.push({ node, source, before: node.textContent.match(/^\s*/)[0], after: node.textContent.match(/\s*$/)[0] });
  }
  document.querySelectorAll('[aria-label], [placeholder], [title], meta[content]').forEach(node => {
    if (node.closest('[translate="no"]')) return;
    for (const attr of ['aria-label', 'placeholder', 'title', 'content']) {
      const source = node.getAttribute(attr);
      if (translations.has(source)) attributes.push({ node, attr, source });
    }
  });
  const title = document.title;
  const selector = document.getElementById('site-language');
  function apply() {
    document.documentElement.lang = language;
    document.title = t(title);
    texts.forEach(({ node, source, before, after }) => { node.textContent = before + t(source) + after; });
    attributes.forEach(({ node, attr, source }) => node.setAttribute(attr, t(source)));
    selector.value = language;
    selector.parentElement.dataset.languageCode = language.toUpperCase();
    document.querySelectorAll('[data-audio-guide]').forEach(link => {
      link.setAttribute('href', `default-audio-settings${language === 'en' ? '' : '-' + language}.html${link.dataset.audioGuide}`);
    });
    const accent = document.querySelector('#hero-title .accent');
    if (accent) accent.textContent = language === 'ja' ? '。' : '.';
    window.dispatchEvent(new Event('site-language-change'));
  }
  selector.addEventListener('change', () => {
    if (!languages.includes(selector.value)) return;
    language = selector.value;
    try { localStorage.setItem(storageKey, language); } catch {}
    apply();
  });
  apply();
})();
