(() => {
  const key = 'sound-adjuster.site-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let chosen = null;
  try { const saved = localStorage.getItem(key); if (saved === 'dark' || saved === 'light') chosen = saved; } catch {}
  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#181b18' : '#f6f4ef';
    const toggle = document.getElementById('theme-toggle');
    if (toggle) { toggle.setAttribute('aria-pressed', String(theme === 'dark')); const title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'; toggle.title = window.SoundAdjusterI18n ? window.SoundAdjusterI18n.t(title) : title; toggle.setAttribute('aria-label', window.SoundAdjusterI18n ? window.SoundAdjusterI18n.t('Dark theme') : 'Dark theme'); }
  }
  apply(chosen || (system.matches ? 'dark' : 'light'));
  document.addEventListener('DOMContentLoaded', () => {
    apply(document.documentElement.dataset.theme);
    document.getElementById('theme-toggle').addEventListener('click', () => {
      chosen = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, chosen); } catch {}
      apply(chosen);
    });
  });
  window.addEventListener('site-language-change', () => apply(document.documentElement.dataset.theme));
  system.addEventListener('change', () => { if (!chosen) apply(system.matches ? 'dark' : 'light'); });
})();
