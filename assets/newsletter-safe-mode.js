(function () {
  // Herken newsletter/contact forms
  function isNewsletterForm(form) {
    if (!form || !form.tagName) return false;
    try {
      const email = form.querySelector('input[name="contact[email]"]');
      const tag = form.querySelector('input[name="contact[tags]"]');
      const looksLikeContact = (form.getAttribute('action') || '').indexOf('/contact') > -1;
      const taggedNewsletter = tag && /newsletter/i.test(String(tag.value || ''));
      return !!(email && (looksLikeContact || taggedNewsletter));
    } catch (e) { return false; }
  }

  // Maak/gebruik toast element
  function ensureToast() {
    let t = document.getElementById('nl-toast');
    if (t) return t;
    t = document.createElement('div');
    t.id = 'nl-toast';
    t.style.cssText = 'display:none;position:fixed;left:50%;top:16px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 14px;border-radius:999px;font-size:.95rem;z-index:9999';
    t.textContent = 'Bedankt! Je inschrijving is ontvangen.';
    document.body.appendChild(t);
    return t;
  }
  function showToast() {
    const t = ensureToast();
    t.style.display = 'block';
    clearTimeout(showToast._to);
    showToast._to = setTimeout(() => { t.style.display = 'none'; }, 4000);
  }

  // Als Shopify net gepost heeft (sommige themes zetten dit nog), toon toast en strip query
  const qp = new URLSearchParams(location.search);
  const justPosted = qp.get('customer_posted') === 'true';
  if (justPosted) {
    showToast();
    try { history.replaceState(null, '', location.pathname + location.hash); } catch(e){}
  }

  // User-submit: sta 1 programmatic submit toe (2s), blokkeer dubbele clicks, toon toast direct
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (!isNewsletterForm(f)) return;

    // debounce dubbele klik
    if (f.__nl_lock) { e.preventDefault(); return; }
    f.__nl_lock = true;
    const btn = f.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    setTimeout(() => { f.__nl_lock = false; if (btn) btn.disabled = false; }, 5000);

    // laat 1 programmatic submit toe binnen 2s (voor themes die via JS submitten)
    f.__nl_allowProgrammaticUntil = Date.now() + 2000;

    // toon meteen een toast (werkt ook bij AJAX zonder reload)
    sessionStorage.setItem('nl_toast', '1');
    setTimeout(showToast, 100);
  }, { capture: true });

  // Programmatic submit patch: 1e toestaan binnen 2s, rest blokkeren (voorkomt loop)
  const origSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () {
    if (!isNewsletterForm(this)) return origSubmit.apply(this, arguments);

    if (!this.__nl_programmaticDone &&
        typeof this.__nl_allowProgrammaticUntil === 'number' &&
        Date.now() <= this.__nl_allowProgrammaticUntil) {
      this.__nl_programmaticDone = true;
      return origSubmit.apply(this, arguments);
    }
    console.warn('Blocked programmatic newsletter submit (loop prevention).');
    return;
  };

  // Toon toast ook na navigatie (als er wél een reload was)
  window.addEventListener('pageshow', function() {
    if (sessionStorage.getItem('nl_toast') === '1') {
      showToast();
      sessionStorage.removeItem('nl_toast');
    }
  });
})();
