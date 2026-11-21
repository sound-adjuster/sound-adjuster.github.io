(() => {
  'use strict';
  const form = document.getElementById('feedback-form');
  const submit = document.getElementById('feedback-submit');
  const message = document.getElementById('feedback-message');
  const status = document.getElementById('feedback-status');
  const formId = form.dataset.formId;
  const configured = /^[a-z\d]+$/i.test(formId);
  const categories = new Set(['bug', 'feature', 'general']);
  const copy = {
    unavailable: 'Feedback delivery is not available yet.',
    empty: 'Enter a message before sending.',
    pending: 'Sending feedback…',
    failed: 'Your feedback could not be sent. Please try again.',
    sent: 'Thanks. Your feedback was sent.'
  };
  let state = 'unavailable';

  function show(nextState) {
    state = nextState;
    const text = copy[state] || '';
    status.textContent = window.SoundAdjusterI18n?.t(text) || text;
    if (state === 'empty') message.setAttribute('aria-invalid', 'true');
    else message.removeAttribute('aria-invalid');
  }

  window.addEventListener('site-language-change', () => show(state));
  show(configured ? '' : 'unavailable');
  submit.disabled = state === 'unavailable';
  message.addEventListener('input', () => {
    if (state === 'empty' || state === 'sent') show('');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (state === 'unavailable' || state === 'pending') return;

    const text = message.value.trim();
    if (!text) {
      show('empty');
      message.focus();
      return;
    }
    const category = new FormData(form).get('category');
    if (!categories.has(category)) return;

    submit.disabled = true;
    show('pending');
    try {
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ category, message: text })
      });
      if (!response.ok || (await response.json()).ok !== true) {
        throw new Error('Submission not confirmed');
      }
      if (message.value.trim() === text) message.value = '';
      show('sent');
    } catch {
      show('failed');
    } finally {
      submit.disabled = false;
    }
  });
})();
