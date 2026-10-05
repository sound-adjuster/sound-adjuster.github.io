(() => {
  'use strict';
  const model = window.SoundAdjusterDemo;
  const key = 'sound-adjuster.site-demo.v1';
  const $ = id => document.getElementById(id);
  let stored = null;
  try { stored = localStorage.getItem(key); } catch {}
  const saved = model.readSaved(stored);
  let settings = saved.settings;
  let profiles = saved.profiles;
  let remember = saved.remember;
  let context = null, graph = null, playing = false;
  let levelTimer = null;
  const bands = [...document.querySelectorAll('[data-band]')];
  const panel = document.querySelector('.original-demo');
  const q = selector => panel.querySelector(selector);
  const presets = {
    flat: [0, 0, 0, 0, 0], rock: [4, 2, -1, 2, 3], pop: [2, 1, 3, 2, 1],
    jazz: [3, 1, -1, 1, 2], classical: [3, 2, -1, -2, 2], bassBoost: [6, 3, -2, -1, 0],
    vocal: [-2, 3, 5, 3, -1], dance: [5, 2, 1, 4, 4]
  };
  const presetButtons = [...panel.querySelectorAll('.preset-btn')];
  let manageProfiles = false;
  let profileErrorKey = '';
  const profileMenu = q('.more-menu'), flyout = q('.profile-flyout'), form = $('profile-form');
  let demoTheme = 'dark';
  try { if (localStorage.getItem('sound-adjuster.original-demo-theme') === 'light') demoTheme = 'light'; } catch {}

  const t = (source, values) => window.SoundAdjusterI18n.t(source, values);
  const siteText = t;
  let statusKey = 'Try the controls. Headphones help with balance.', statusValues = {};
  const status = (source, values = {}) => { statusKey = source; statusValues = values; $('demo-status').textContent = siteText(source, values); };
  function persist() {
    try { localStorage.setItem(key, JSON.stringify({ version: 1, remember, settings: remember ? settings : undefined, profiles })); return true; }
    catch { status('Settings work now, but this browser could not save them.'); return false; }
  }
  function audioSettings() {
    if (!graph) return;
    const when = context.currentTime;
    graph.gain.gain.setTargetAtTime(settings.gain, when, 0.025);
    graph.pan.pan.setTargetAtTime(settings.pan, when, 0.025);
    graph.filters.forEach((filter, i) => filter.gain.setTargetAtTime(settings.eq[i], when, 0.025));
    const values = model.matrix(settings.mono, settings.flip);
    graph.routes.forEach((node, i) => node.gain.setTargetAtTime(values[i], when, 0.025));
  }
  function monitorLevel() {
    clearTimeout(levelTimer);
    levelTimer = null;
    let state = 'unavailable';
    if (playing && graph && context.state === 'running') {
      graph.analyser.getFloatTimeDomainData(graph.levelSamples);
      let peak = 0;
      for (const sample of graph.levelSamples) peak = Math.max(peak, Math.abs(sample));
      // Match the extension's thresholds; measure the output after EQ and gain.
      state = peak >= 0.98 ? 'clipping' : peak >= 0.8 ? 'high' : 'normal';
      levelTimer = setTimeout(monitorLevel, 160);
    }
    const label = state === 'clipping' ? 'Clipping risk'
      : state === 'high' ? 'Output level high'
      : state === 'normal' ? 'Output level normal' : 'Output level unavailable';
    const indicator = $('demo-level');
    indicator.dataset.state = state;
    indicator.setAttribute('aria-label', t(label));
    indicator.title = t(label);
  }
  function render() {
    $('demo-gain').value = settings.gain;
    $('demo-pan').value = settings.pan;
    if (document.activeElement !== $('gain-value')) $('gain-value').value = settings.gain.toFixed(2);
    if (document.activeElement !== $('pan-value')) $('pan-value').value = String(settings.pan);
    $('demo-gain').setAttribute('aria-valuetext', t('{value} times', { value: settings.gain }));
    $('demo-pan').setAttribute('aria-valuetext', settings.pan === 0 ? t('Centered') : t(settings.pan < 0 ? '{value} percent left' : '{value} percent right', { value: Math.round(Math.abs(settings.pan) * 100) }));
    $('demo-gain').style.setProperty('--fill', `${settings.gain / 5 * 100}%`);
    $('demo-pan').style.setProperty('--fill', `${(settings.pan + 1) / 2 * 100}%`);
    $('demo-mono').checked = settings.mono;
    $('demo-flip').checked = settings.flip;
    $('demo-remember').checked = remember;
    bands.forEach((input, i) => { input.value = settings.eq[i]; input.nextElementSibling.textContent = `${settings.eq[i] > 0 ? '+' : ''}${settings.eq[i]} dB`; input.setAttribute('aria-valuetext', t('{value} decibels', { value: settings.eq[i] })); });
    presetButtons.forEach(button => {
      const active = presets[button.dataset.preset].every((value, i) => value === settings.eq[i]);
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    audioSettings();
  }
  function update(change) { settings = model.normalize({ ...settings, ...change }); render(); renderProfiles(); if (remember) persist(); }
  function hideNameForm() {
    form.hidden = true; flyout.classList.remove('profile-form-open'); q('.menu-new-profile').hidden = false;
    $('profile-name').value = ''; setProfileError('');
  }
  function setProfileError(source) {
    profileErrorKey = source;
    q('.profile-form-status').textContent = t(source);
  }
  function setMenu(open, restoreFocus = false) {
    profileMenu.hidden = !open; q('.more-menu-button').setAttribute('aria-expanded', String(open));
    flyout.hidden = true; q('.menu-main').hidden = false; q('.menu-profiles').setAttribute('aria-expanded', 'false');
    hideNameForm(); manageProfiles = false; renderProfiles();
    if (!open && restoreFocus) q('.more-menu-button').focus();
  }
  function setProfiles(open) {
    flyout.hidden = !open; q('.menu-main').hidden = open;
    q('.menu-profiles').setAttribute('aria-expanded', String(open)); hideNameForm();
    if (open) { manageProfiles = false; renderProfiles(); updateScrollHint(); }
    else q('.menu-profiles').focus();
  }
  function updateScrollHint() {
    const list = $('profile-list');
    q('.profile-scroll-hint').hidden = list.scrollTop + list.clientHeight >= list.scrollHeight - 1;
  }
  function renderProfiles() {
    const list = $('profile-list'), defaults = q('.profile-default'); list.replaceChildren(); defaults.replaceChildren();
    const matches = value => JSON.stringify(model.normalize(value)) === JSON.stringify(settings);
    const active = matches(model.normalize()) ? t('Default') : profiles.find(profile => matches(profile.settings))?.name || t('Custom');
    q('.active-profile-name').textContent = active;
    function itemFor(profile, index) {
      const item = document.createElement('div'); item.className = 'profile-item';
      const load = document.createElement('button'); load.type = 'button'; load.className = 'profile-select-button';
      const check = document.createElement('span'); check.className = 'profile-check'; check.textContent = matches(profile.settings) ? '✓' : '';
      const name = document.createElement('span'); name.className = 'profile-item-name'; name.textContent = profile.name;
      load.append(check, name); load.setAttribute('aria-pressed', String(matches(profile.settings)));
      load.addEventListener('click', () => {
        settings = model.normalize(profile.settings); render(); renderProfiles(); setMenu(false, true);
        if (!remember || persist()) status(remember ? '{name} applied and remembered.' : '{name} applied for this visit.', { name: profile.name });
      });
      item.append(load);
      if (index >= 0) {
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'profile-delete-button'; remove.textContent = '×';
        remove.hidden = !manageProfiles; remove.setAttribute('aria-label', t('Delete {name}', { name: profile.name }));
        remove.addEventListener('click', () => { profiles.splice(index, 1); if (!profiles.length) manageProfiles = false; const okay = persist(); renderProfiles(); if (okay) status('Profile removed.'); });
        item.append(remove);
      }
      return item;
    }
    defaults.append(itemFor({ name: t('Default'), settings: model.normalize() }, -1));
    profiles.forEach((profile, index) => list.append(itemFor(profile, index)));
    if (!profiles.length) { const empty = document.createElement('div'); empty.className = 'empty-profiles'; empty.textContent = t('No saved profiles yet.'); list.append(empty); }
    q('.menu-manage-profiles').textContent = t(manageProfiles ? 'Done' : 'Manage profiles');
    q('.menu-manage-profiles').disabled = profiles.length === 0;
    requestAnimationFrame(updateScrollHint);
  }
  function saveProfile() {
    const name = $('profile-name').value.trim().slice(0, 32);
    if (!name) { setProfileError('Give your profile a name first.'); $('profile-name').focus(); return; }
    const match = profiles.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    if (match < 0 && profiles.length >= 12) { setProfileError('This demo holds twelve profiles. Remove one to save another.'); return; }
    const profile = { name, settings: model.normalize(settings) };
    if (match >= 0) profiles[match] = profile; else profiles.push(profile);
    const okay = persist(); renderProfiles(); hideNameForm();
    if (okay) status('{name} saved on this device.', { name });
  }
  function renderDemoTheme() {
    panel.classList.toggle('light-theme', demoTheme === 'light');
    const button = $('demo-theme-toggle'); button.textContent = demoTheme === 'light' ? '☾' : '☼';
    button.title = t(demoTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    button.setAttribute('aria-label', button.title);
  }
  function renderEqualizer() {
    const open = !q('.equalizer-section').classList.contains('collapsed');
    q('.equalizer-toggle').setAttribute('aria-expanded', String(open));
    q('.equalizer-toggle').setAttribute('aria-label', t(open ? 'Close Equalizer' : 'Open Equalizer'));
    q('.equalizer-toggle').title = t(open ? 'Close Equalizer' : 'Open Equalizer');
  }
  function resetAudio() {
    update(model.normalize());
    status('Original sound settings restored.');
  }
  function createAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Audio unavailable');
    context = new AudioContext();
    const channels = model.makeSample(context.sampleRate);
    const buffer = context.createBuffer(2, channels[0].length, context.sampleRate);
    channels.forEach((channel, i) => buffer.copyToChannel(channel, i));
    const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
    const filters = [250, 500, 2000, 6000, 8000].map((frequency, i) => { const node = context.createBiquadFilter(); node.type = i === 0 ? 'lowshelf' : i === 4 ? 'highshelf' : 'peaking'; node.frequency.value = frequency; node.Q.value = 1; return node; });
    const gain = context.createGain(), pan = context.createStereoPanner(), analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.65;
    const splitter = context.createChannelSplitter(2), merger = context.createChannelMerger(2);
    const routes = Array.from({ length: 4 }, () => context.createGain());
    source.connect(filters[0]); filters.slice(1).forEach((filter, i) => filters[i].connect(filter));
    filters[4].connect(gain); gain.connect(analyser); analyser.connect(pan); pan.connect(splitter);
    routes.forEach((route, i) => { splitter.connect(route, Math.floor(i / 2), 0); route.connect(merger, 0, i % 2); });
    merger.connect(context.destination);
    graph = { source, filters, gain, pan, routes, analyser, levelSamples: new Float32Array(analyser.fftSize) };
    // Set the remembered values before the source can produce audio.
    gain.gain.value = settings.gain; pan.pan.value = settings.pan;
    filters.forEach((filter, i) => filter.gain.value = settings.eq[i]);
    const routing = model.matrix(settings.mono, settings.flip); routes.forEach((route, i) => route.gain.value = routing[i]);
    source.start();
    const createdContext = context;
    context.addEventListener('statechange', () => { if (createdContext === context && createdContext.state !== 'running' && playing) setPlaying(false); });
  }
  function setPlaying(value) {
    playing = value; $('sample-play').setAttribute('aria-pressed', String(value));
    document.querySelector('.play-label').textContent = siteText(value ? 'Pause sample' : 'Play sample');
    document.querySelector('.play-symbol').textContent = value ? 'Ⅱ' : '▶';
    document.querySelector('.demo').dataset.playing = String(value);
    monitorLevel();
  }
  $('sample-play').addEventListener('click', async () => {
    $('sample-play').disabled = true;
    try {
      if (playing) { await context.suspend(); setPlaying(false); status('Paused. Your settings are still here.'); }
      else {
        if (!context || context.state === 'closed') createAudio();
        await context.resume(); setPlaying(true); audioSettings(); status('Playing a locally generated sample. Try the controls.');
      }
    } catch { setPlaying(false); if (context) context.close().catch(() => {}); context = null; graph = null; status('Audio could not start. Try again in Firefox or Chrome.'); }
    finally { $('sample-play').disabled = false; }
  });
  $('demo-gain').addEventListener('input', e => update({ gain: Number(e.target.value) }));
  $('demo-pan').addEventListener('input', e => update({ pan: Number(e.target.value) }));
  $('demo-mono').addEventListener('change', e => update({ mono: e.target.checked }));
  $('demo-flip').addEventListener('change', e => update({ flip: e.target.checked }));
  bands.forEach((input, i) => input.addEventListener('input', () => { const eq = [...settings.eq]; eq[i] = Number(input.value); update({ eq }); }));
  $('demo-reset').addEventListener('click', resetAudio);
  $('demo-remember').addEventListener('change', e => { remember = e.target.checked; if (persist()) status(remember ? 'These demo settings will be here when you return.' : 'Remember is off. Your current sound is unchanged.'); });
  form.addEventListener('submit', event => { event.preventDefault(); saveProfile(); });
  $('profile-name').addEventListener('input', () => setProfileError(''));
  for (const [id, setting] of [['gain-value', 'gain'], ['pan-value', 'pan']]) {
    $(id).addEventListener('input', event => { if (event.target.value !== '') update({ [setting]: Number(event.target.value) }); });
    $(id).addEventListener('change', event => { update({ [setting]: Number(event.target.value) }); event.target.value = setting === 'gain' ? settings.gain.toFixed(2) : String(settings.pan); });
  }
  q('.equalizer-toggle').addEventListener('click', () => { q('.equalizer-section').classList.toggle('collapsed'); renderEqualizer(); });
  presetButtons.forEach(button => button.addEventListener('click', () => update({ eq: [...presets[button.dataset.preset]] })));
  q('.more-menu-button').addEventListener('click', () => setMenu(profileMenu.hidden));
  profileMenu.addEventListener('click', event => event.stopPropagation());
  q('.menu-profiles').addEventListener('click', () => setProfiles(true));
  q('.menu-back-main').addEventListener('click', () => setProfiles(false));
  q('.menu-new-profile').addEventListener('click', () => { hideNameForm(); form.hidden = false; flyout.classList.add('profile-form-open'); q('.menu-new-profile').hidden = true; $('profile-name').focus(); });
  q('.profile-cancel-button').addEventListener('click', () => { hideNameForm(); q('.menu-new-profile').focus(); });
  q('.menu-manage-profiles').addEventListener('click', () => { manageProfiles = !manageProfiles; renderProfiles(); });
  $('profile-list').addEventListener('scroll', updateScrollHint);
  document.addEventListener('click', event => { if (!q('.more-menu-wrap').contains(event.target)) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || profileMenu.hidden) return;
    if (!form.hidden) { hideNameForm(); q('.menu-new-profile').focus(); }
    else if (!flyout.hidden) setProfiles(false);
    else setMenu(false, true);
  });
  q('.menu-profiles').addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowDown') return;
    event.preventDefault(); setProfiles(true); q('.profile-select-button').focus();
  });
  $('demo-theme-toggle').addEventListener('click', () => {
    demoTheme = demoTheme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('sound-adjuster.original-demo-theme', demoTheme); } catch {}
    renderDemoTheme();
  });
  // The extension's wheel gestures are available in this sample too.
  function wheel(target, value, change, step) {
    let total = 0;
    target.addEventListener('wheel', event => {
      event.preventDefault(); const delta = event.deltaY * (event.deltaMode ? 24 : 1);
      if (total && Math.sign(total) !== Math.sign(delta)) total = 0;
      total += delta; if (Math.abs(total) < 24) return;
      change(Number((value() + (total < 0 ? step : -step)).toFixed(2))); total = 0;
    }, { passive: false });
  }
  wheel(q('.gain-control'), () => settings.gain, value => update({ gain: value }), .05);
  wheel(q('.pan-control'), () => settings.pan, value => update({ pan: value }), .05);
  bands.forEach((input, i) => wheel(input.parentElement, () => settings.eq[i], value => { const eq = [...settings.eq]; eq[i] = value; update({ eq }); }, 1));
  document.addEventListener('visibilitychange', () => { if (document.hidden && context && playing) { context.suspend().catch(() => {}); setPlaying(false); status('Paused while the page is in the background.'); } });
  window.addEventListener('pagehide', () => { if (context && context.state !== 'closed') context.close().catch(() => {}); setPlaying(false); });
  window.addEventListener('site-language-change', () => {
    setPlaying(playing); status(statusKey, statusValues);
    render(); renderProfiles(); renderDemoTheme(); renderEqualizer();
    setProfileError(profileErrorKey);
  });
  renderDemoTheme(); renderEqualizer();
  status(statusKey); setPlaying(false);
  render(); renderProfiles(); $('demo-controls').disabled = false; $('sample-play').disabled = false;
  if (remember) status('Your saved demo settings are ready. Press play to listen.');
})();
