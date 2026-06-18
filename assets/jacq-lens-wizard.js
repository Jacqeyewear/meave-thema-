(() => {
  // Geef aan dat de echte wizard-JS geladen is
  window.__jacqLensWizardLoaded = true;

  // Confirm modal open counter (for blur fallback)
  window.__jacqConfirmOpenCount = window.__jacqConfirmOpenCount || 0;

  // ===== Helpers =====
  const $  = (q, r=document) => r.querySelector(q);
  const $$ = (q, r=document) => Array.from(r.querySelectorAll(q));
  const show = (el, v) => { if (!el) return; el.hidden = !v; };

  // ===== Confetti (canvas-confetti) =====
    // Wordt getriggerd op de laatste "Voeg toe aan winkelwagen" actie (stap 3).
    // Vereist: canvas-confetti (via script tag in Liquid).
    let __jacqConfettiInstance = null;

    function getJacqConfetti(){
      const w = window;
      const c = w && w.confetti;
      if (!c || typeof c !== 'function' || !c.create) return null;

      if (__jacqConfettiInstance) return __jacqConfettiInstance;

      let canvas = document.getElementById('jacq-confetti-canvas');
      if (!canvas){
        canvas = document.createElement('canvas');
        canvas.id = 'jacq-confetti-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.position = 'fixed';
        canvas.style.inset = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '2147483647';
        document.body.appendChild(canvas);
      }

      __jacqConfettiInstance = c.create(canvas, { resize: true, useWorker: true });
      return __jacqConfettiInstance;
    }

    function fireJacqConfettiFrom(el){
      const inst = getJacqConfetti();
      if (!inst || !el || !el.getBoundingClientRect) return;

      const rect = el.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      const base = {
        origin: { x, y },
        spread: 70,
        startVelocity: 36,
        ticks: 38,
        gravity: 1.0,
        scalar: 1,
        zIndex: 9999,
      };

      inst(Object.assign({}, base, { particleCount: 60 }));
      inst(Object.assign({}, base, { particleCount: 35, spread: 110, startVelocity: 30 }));
      setTimeout(() => inst(Object.assign({}, base, { particleCount: 45, spread: 90, startVelocity: 33 })), 70);
    }
  const section = $('#jacq-lens-wizard-section');
  if (!section) return;

  const IS_SUNGLASSES = section.dataset.sunglasses === 'true';

  const OPEN_BTN = $('#jacq-lens-open', section);
  let   DRAWER   = $('#jacq-lens-drawer') || $('.jacq-drawer', section);

  // Verplaats drawer naar <body> zodat hij overal boven staat
  if (DRAWER && DRAWER.parentNode !== document.body) document.body.appendChild(DRAWER);

  const Q  = (q) => DRAWER.querySelector(q);
  const QA = (q) => Array.from(DRAWER.querySelectorAll(q));

  // Loading overlay – Apple-style bag → checkmark animatie
  let __jacqLoadingEl = null;

  function __jacqCreateBagSvg(){
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('data-jacq-bag', '1');
    svg.setAttribute('width', '48');
    svg.setAttribute('height', '48');
    svg.setAttribute('viewBox', '0 0 48 48');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.animation = 'jacqBagEnter 500ms cubic-bezier(0.22,1,0.36,1) both';
    svg.innerHTML =
      '<path d="M12 16h24a2 2 0 0 1 2 2v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V18a2 2 0 0 1 2-2z"/>' +
      '<path d="M18 16v-2a6 6 0 0 1 12 0v2"/>';
    svg.addEventListener('animationend', function onBagIn(){
      svg.removeEventListener('animationend', onBagIn);
      svg.style.animation = 'jacqBagPulse 1800ms ease-in-out infinite';
    }, {once: true});
    return svg;
  }

  function showWizardLoading(message){
    const panel = Q('.jacq-drawer__panel') || DRAWER;
    if (!__jacqLoadingEl){
      const el = document.createElement('div');
      el.setAttribute('data-jacq-loading', '1');
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.style.position = 'absolute';
      el.style.inset = '0';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.padding = '24px';
      el.style.textAlign = 'center';
      el.style.background = 'rgba(255,255,255,0.92)';
      el.style.backdropFilter = 'blur(6px)';
      el.style.webkitBackdropFilter = 'blur(6px)';
      el.style.zIndex = '9998';
      el.style.borderRadius = 'inherit';
      el.style.opacity = '0';
      el.style.transition = 'opacity 280ms ease';

      const inner = document.createElement('div');
      inner.style.maxWidth = '420px';
      inner.style.width = '100%';
      inner.style.display = 'flex';
      inner.style.flexDirection = 'column';
      inner.style.alignItems = 'center';
      inner.style.gap = '14px';

      // Icon container (houdt bag, later check)
      const iconWrap = document.createElement('div');
      iconWrap.setAttribute('data-jacq-icon-wrap', '1');
      iconWrap.style.width = '48px';
      iconWrap.style.height = '48px';
      iconWrap.style.position = 'relative';
      iconWrap.style.color = 'rgba(0,0,0,0.78)';
      iconWrap.appendChild(__jacqCreateBagSvg());

      const txt = document.createElement('div');
      txt.setAttribute('data-jacq-loading-text', '1');
      txt.style.fontSize = window.matchMedia('(max-width: 767px)').matches ? '14px' : '15px';
      txt.style.fontWeight = '400';
      txt.style.color = 'rgba(0,0,0,0.78)';
      txt.style.animation = 'jacqFadeUp 400ms cubic-bezier(0.22,1,0.36,1) 150ms both';
      txt.textContent = message || 'Toevoegen aan winkelwagen\u2026';

      inner.appendChild(iconWrap);
      inner.appendChild(txt);
      el.appendChild(inner);

      const cs = window.getComputedStyle(panel);
      if (cs.position === 'static') panel.style.position = 'relative';

      panel.appendChild(el);
      __jacqLoadingEl = el;

      // Inject keyframes 1x
      if (!document.getElementById('jacq-spin-kf')){
        const st = document.createElement('style');
        st.id = 'jacq-spin-kf';
        st.textContent = [
          '@keyframes jacqBagEnter{0%{opacity:0;transform:scale(0.8)}60%{opacity:1;transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}',
          '@keyframes jacqBagPulse{0%{transform:scale(1)}50%{transform:scale(1.04)}100%{transform:scale(1)}}',
          '@keyframes jacqCheckDraw{to{stroke-dashoffset:0}}',
          '@keyframes jacqCircleDraw{to{stroke-dashoffset:0}}',
          '@keyframes jacqFadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
          '@keyframes jacqIconOut{to{opacity:0;transform:scale(0.92)}}',
          '@keyframes jacqIconIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}',
          '@media(prefers-reduced-motion:reduce){[data-jacq-loading] *{animation:none!important;transition:none!important}[data-jacq-check-circle],[data-jacq-check-mark]{stroke-dashoffset:0!important}}'
        ].join('');
        document.head.appendChild(st);
      }
    } else {
      // Bij hergebruik (na error → retry): reset icon container
      const iconWrap = __jacqLoadingEl.querySelector('[data-jacq-icon-wrap]');
      if (iconWrap){
        iconWrap.innerHTML = '';
        iconWrap.appendChild(__jacqCreateBagSvg());
      }
    }
    const textEl = __jacqLoadingEl.querySelector('[data-jacq-loading-text]');
    if (textEl){
      textEl.textContent = message || 'Toevoegen aan winkelwagen\u2026';
      textEl.style.animation = 'jacqFadeUp 400ms cubic-bezier(0.22,1,0.36,1) 150ms both';
    }
    __jacqLoadingEl.style.display = 'flex';
    void __jacqLoadingEl.offsetWidth;
    __jacqLoadingEl.style.opacity = '1';
  }

  function showWizardSuccess(){
    if (!__jacqLoadingEl) return;
    const ns = 'http://www.w3.org/2000/svg';
    const iconWrap = __jacqLoadingEl.querySelector('[data-jacq-icon-wrap]');
    const bagSvg = __jacqLoadingEl.querySelector('[data-jacq-bag]');
    const textEl = __jacqLoadingEl.querySelector('[data-jacq-loading-text]');
    if (!iconWrap || !bagSvg) return;

    // Bag fade-out
    bagSvg.style.animation = 'jacqIconOut 250ms cubic-bezier(0.22,1,0.36,1) forwards';
    bagSvg.addEventListener('animationend', function onBagOut(){
      bagSvg.removeEventListener('animationend', onBagOut);
      bagSvg.style.display = 'none';

      // Check SVG
      const checkSvg = document.createElementNS(ns, 'svg');
      checkSvg.setAttribute('data-jacq-check', '1');
      checkSvg.setAttribute('width', '48');
      checkSvg.setAttribute('height', '48');
      checkSvg.setAttribute('viewBox', '0 0 48 48');
      checkSvg.setAttribute('fill', 'none');
      checkSvg.setAttribute('stroke-linecap', 'round');
      checkSvg.setAttribute('stroke-linejoin', 'round');
      checkSvg.setAttribute('aria-hidden', 'true');
      checkSvg.style.animation = 'jacqIconIn 300ms cubic-bezier(0.22,1,0.36,1) both';

      // Cirkel (omtrek = 2*PI*19 ≈ 119.38)
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('data-jacq-check-circle', '1');
      circle.setAttribute('cx', '24');
      circle.setAttribute('cy', '24');
      circle.setAttribute('r', '19');
      circle.setAttribute('stroke', 'rgba(0,0,0,0.78)');
      circle.setAttribute('stroke-width', '1.5');
      circle.setAttribute('stroke-dasharray', '119.38');
      circle.setAttribute('stroke-dashoffset', '119.38');
      circle.style.animation = 'jacqCircleDraw 500ms cubic-bezier(0.65,0,0.35,1) 180ms forwards';

      // Vinkje (padlengte ≈ 24.4)
      const check = document.createElementNS(ns, 'polyline');
      check.setAttribute('data-jacq-check-mark', '1');
      check.setAttribute('points', '16,25 22,31 32,19');
      check.setAttribute('stroke', 'rgba(0,0,0,0.78)');
      check.setAttribute('stroke-width', '2');
      check.setAttribute('stroke-dasharray', '24.4');
      check.setAttribute('stroke-dashoffset', '24.4');
      check.style.animation = 'jacqCheckDraw 350ms cubic-bezier(0.65,0,0.35,1) 380ms forwards';

      checkSvg.appendChild(circle);
      checkSvg.appendChild(check);
      iconWrap.appendChild(checkSvg);
    }, {once: true});

    // Tekst crossfade
    if (textEl){
      textEl.style.transition = 'opacity 200ms ease';
      textEl.style.opacity = '0';
      setTimeout(function(){
        textEl.textContent = 'Toegevoegd aan winkelwagen';
        textEl.style.animation = 'jacqFadeUp 350ms cubic-bezier(0.22,1,0.36,1) both';
        textEl.style.opacity = '1';
      }, 220);
    }
  }

  function hideWizardLoading(){
    if (!__jacqLoadingEl) return;
    __jacqLoadingEl.style.opacity = '0';
    const el = __jacqLoadingEl;
    __jacqLoadingEl = null;
    setTimeout(function(){ el.style.display = 'none'; el.remove(); }, 300);
  }


  const BTN_CLOSE = Q('[data-close]');
  const BTN_BACK  = Q('.jacq-back');
  const BTN_NEXT  = Q('.jacq-next');
  const SUB        = Q('#jacq-sub');
  const KLARNA_AMT = Q('#jacq-klarna-amt');

  if (!BTN_NEXT || !BTN_BACK) {
    console.error('[JACQ] Wizard knoppen niet gevonden');
    return;
  }
  const ERROR_BOX = Q('#jacq-error');

  function showError(msg){
    if (!ERROR_BOX){
      // fallback, voor het geval het element ooit ontbreekt
      alert(msg);
      return;
    }
    ERROR_BOX.textContent = msg;
    ERROR_BOX.hidden = false;
    ERROR_BOX.classList.remove('is-success');
  }

  function clearError(){
    if (!ERROR_BOX) return;
    ERROR_BOX.hidden = true;
    ERROR_BOX.textContent = '';
    ERROR_BOX.classList.remove('is-success');
  }

  // ===== Lightweight confirm modal (in-drawer, Apple-clean) =====
  function ensureJacqConfirmStyle(){
    const css = `
      /* Confirm modal */
      .jacq-confirm{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:18px;}
      .jacq-confirm[hidden]{display:none!important;}
      .jacq-confirm__backdrop{
        position:absolute;inset:0;
        background:rgba(17,24,39,.45);
        -webkit-backdrop-filter:saturate(180%) blur(12px);
        backdrop-filter:saturate(180%) blur(12px);
      }

      /* Fallback blur (when backdrop-filter is flaky) */
      html.jacq-confirm-open body > :not(#jacq-confirm){
        filter:saturate(115%) blur(10px);
        will-change:filter;
      }

      .jacq-confirm__card{position:relative;width:min(420px,100%);background:#fff;border-radius:18px;box-shadow:0 24px 60px rgba(15,23,42,.25);padding:18px 18px 16px;}
      .jacq-confirm__title{font-size:16px;font-weight:650;margin:0 0 6px;}
      .jacq-confirm__msg{font-size:14px;line-height:1.45;color:#374151;margin:0 0 14px;}
      .jacq-confirm__actions{display:flex;gap:10px;justify-content:flex-end;}
      .jacq-confirm__btn{border-radius:999px;border:1px solid rgba(0,0,0,.12);background:#fff;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;}
      .jacq-confirm__btn{transition:background .18s,border-color .18s,box-shadow .18s,transform .08s;}
      .jacq-confirm__btn:not(.jacq-confirm__btn--primary):hover{background:#f5f5f7;}
      .jacq-confirm__btn--primary{background:#0071E3;border-color:#0071E3;color:#fff;}
      .jacq-confirm__btn--primary:hover{background:#2689EC;border-color:#2689EC;}
      .jacq-confirm__btn--primary:active{transform:translateY(1px);}
      .jacq-confirm__btn--primary:focus-visible{
        outline:none;
        box-shadow:0 0 0 1px #fff, 0 0 0 3px rgba(0,113,227,.7);
      }

      /* Disable state for custom selects (used for As when CYL=0) */
      .jacq-select-wrap.is-disabled .jacq-select-btn{background:#f5f5f7;color:#6b7280;cursor:not-allowed;box-shadow:none;}
      .jacq-select-wrap.is-disabled .jacq-select-chevron{opacity:.45;}
    `;
    const existing = document.getElementById('jacq-confirm-style');
    if (existing){ existing.textContent = css; return; }
    const s = document.createElement('style');
    s.id = 'jacq-confirm-style';
    s.textContent = css;
    document.head.appendChild(s);
  }


  function ensureJacqConfirm(){
    ensureJacqConfirmStyle();
    let el = document.getElementById('jacq-confirm');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'jacq-confirm';
    el.className = 'jacq-confirm';
    el.hidden = true;
    el.innerHTML = `
      <div class="jacq-confirm__backdrop" data-cancel></div>
      <div class="jacq-confirm__card" role="dialog" aria-modal="true" aria-labelledby="jacq-confirm-title" aria-describedby="jacq-confirm-msg">
        <div id="jacq-confirm-title" class="jacq-confirm__title"></div>
        <div id="jacq-confirm-msg" class="jacq-confirm__msg"></div>
        <div class="jacq-confirm__actions">
          <button type="button" class="jacq-confirm__btn" data-cancel>Terug</button>
          <button type="button" class="jacq-confirm__btn jacq-confirm__btn--primary" data-ok>Doorgaan</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    return el;
  }

  function jacqConfirm({ title='Even checken', message='', okText='Doorgaan', cancelText='Terug' } = {}){
    const root = ensureJacqConfirm();
    const titleEl = root.querySelector('#jacq-confirm-title');
    const msgEl   = root.querySelector('#jacq-confirm-msg');
    const okBtn   = root.querySelector('[data-ok]');
    const cancelEls = root.querySelectorAll('[data-cancel]');                 // backdrop + knop (voor click)
const cancelBtnEls = root.querySelectorAll('.jacq-confirm__btn[data-cancel]'); // alleen knop (voor tekst)

    titleEl.textContent = title;
    msgEl.textContent   = message;
    okBtn.textContent   = okText;
    cancelBtnEls.forEach(b => b.textContent = cancelText);

    root.hidden = false;

    window.__jacqConfirmOpenCount++;
    document.documentElement.classList.add('jacq-confirm-open');

    return new Promise((resolve) => {
      const cleanup = (val) => {
        root.hidden = true;
        okBtn.removeEventListener('click', onOk);
        cancelEls.forEach(b => b.removeEventListener('click', onCancel));
        document.removeEventListener('keydown', onKey);
        if (window.__jacqConfirmOpenCount > 0) window.__jacqConfirmOpenCount--;
        if (window.__jacqConfirmOpenCount === 0) document.documentElement.classList.remove('jacq-confirm-open');
        resolve(val);
      };
      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);
      const onKey = (e) => {
        if (e.key === 'Escape') cleanup(false);
      };

      okBtn.addEventListener('click', onOk);
      cancelEls.forEach(b => b.addEventListener('click', onCancel));
      document.addEventListener('keydown', onKey);

      // focus voor toetsenbord
      setTimeout(() => okBtn.focus(), 0);
    });
  }


  const CURRENCY      = section.dataset.currency || '€';
  const FRAME_PRICE   = Number((OPEN_BTN && OPEN_BTN.dataset && OPEN_BTN.dataset.framePrice) || 0);
  const ADDON_PRICE   = Number(section.dataset.addonPrice || 0);
  const ADDON_VARIANT = Number(section.dataset.addonVariant || 0);
  const MODE_PRICE    = { 'Zonder sterkte':0, 'Leesbril':0, 'Bril op sterkte':0, 'Multifocaal':95 };
  const INDEX_PRICE = {
    'Basis': 0,
    'Comfort': 35,
    'Premium': 65,
    'Luxe': 95
  };
  // Variant-ID's voor de betaalde lensindexes (komen uit data-attributes in de <section>)
  const INDEX_VARIANTS = {
    'Comfort': Number(section.dataset.indexVariantComfort || 0),
    'Premium': Number(section.dataset.indexVariantPremium || 0),
    'Luxe':    Number(section.dataset.indexVariantLuxe    || 0)
    // 'Basis' is gratis → geen aparte variant nodig
  };

  // Variant-ID voor multifocale glazen (komt uit data-multi-variant)
  const MULTI_VARIANT = Number(section.dataset.multiVariant || 0);
  const SINGLE_VARIANT = Number(section.dataset.singleVariant || 0);
  const POLARISED_VARIANT = Number(section.dataset.polarisedVariant || 0);
  const PHOTOCHROMIC_VARIANT = Number(section.dataset.photochromicVariant || 0);

  const money = (v) => `${CURRENCY}${Math.round(v)}`;
  const moneyDec = (v) => {
    try {
      return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(v);
    } catch (e) {
      return `${CURRENCY} ${Number(v).toFixed(2).replace('.', ',')}`;
    }
  };

  function getFrameVariantId() {
    // Shopify houdt ALTIJD de huidige variant-id in <input name="id">
    const input = document.querySelector('form[action^="/cart"] [name="id"], form[action^="/cart/add"] [name="id"]');
    if (input && input.value) {
      return Number(input.value);
    }

    return 0;
  }

  // Veilige fetch helper: gooit duidelijke foutmelding bij 4xx/5xx
  async function shopifyRequest(url, options){
    const res = await fetch(url, options);
    if (!res.ok){
      let msg = `${res.status} ${res.statusText}`;
      try {
        const j = await res.json();
        msg = (j && (j.description || j.message)) || msg;
      } catch(_){ /* ignore */ }
      throw new Error(msg);
    }
    // sommige Shopify endpoints geven geen JSON terug (change.js) → probeer, anders leeg object
    try { return await res.json(); } catch { return {}; }
  }

  const GLASTYPE_PRICE = { 'Helder': 0, 'Gepolariseerd': 30, 'Meekleurend': 50 };

  const getTotal = () => {
    const m = MODE_PRICE[state.mode] || 0;
    const g = GLASTYPE_PRICE[state.glasType] || 0;
    const b = state.blauwlichtFilter ? ADDON_PRICE : 0;
    const i = INDEX_PRICE[state.indexChoice] || 0;
    return FRAME_PRICE + m + g + b + i;
  };
  const setSub = () => {
    const total = getTotal();
    if (SUB) SUB.textContent = money(total);
    if (KLARNA_AMT) KLARNA_AMT.textContent = moneyDec(total / 3);
  };

  // ===============================
// Lensindex gating op basis van SPH
// ===============================
function parseSph(val){
  if (!val || val === '-') return null;
  const n = Number(String(val).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function getMaxAbsSph(){
  if (state.mode === 'Leesbril') {
    if (state.readingSame) {
      const v = parseSph(state.readingSph);
      return v !== null ? Math.abs(v) : null;
    }
    const od = parseSph(state.readingSphOd);
    const os = parseSph(state.readingSphOs);
    const vals = [od, os].filter(v => v !== null).map(v => Math.abs(v));
    return vals.length ? Math.max(...vals) : null;
  }
  const od = parseSph(state.od && state.od.sph);
  const os = parseSph(state.os && state.os.sph);
  const vals = [od, os].filter(v => v !== null).map(v => Math.abs(v));
  return vals.length ? Math.max(...vals) : null;
}

const INDEX_DISABLED_NOTES = {
  Basis:   'Niet beschikbaar bij sterkte boven ±4.00',
  Comfort: 'Niet beschikbaar bij sterkte boven ±6.00',
  Premium: 'Niet beschikbaar bij sterkte boven ±8.00'
};

function setIndexOptionVisible(value, visible){
  // value = 'Basis' | 'Comfort' | 'Premium' | 'Luxe'
  const input = Q(`input[name="opt_index"][value="${value}"]`);
  const card  = input ? input.closest('label.jacq-card') : null;
  if (!card) return;

  // niet meer verbergen → alleen disable/enable
  const allowed = !!visible;

  card.classList.toggle('is-disabled', !allowed);
  input.disabled = !allowed;

  // Voeg label toe als die nog niet bestaat
  let note = card.querySelector('.jacq-disabled-note');
  if (!note){
    note = document.createElement('div');
    note.className = 'jacq-disabled-note';
    card.appendChild(note);
  }
  note.textContent = INDEX_DISABLED_NOTES[value] || 'Niet beschikbaar bij jouw sterkte';

  // Als huidige keuze nu niet meer mag → reset keuze
  if (!allowed && state.indexChoice === value){
    state.indexChoice = null;
    input.checked = false;
  }
}

function updateExtraRxVisibility(){
  const prismEls = QA('.jacq-extra--prism');

  prismEls.forEach(el => el.hidden = !state.prismEnabled);
}

function updateIndexAvailability(){
  // Alleen relevant bij glazen mét sterkte (incl. Leesbril)
  if (!state.mode || state.mode === 'Zonder sterkte') {
    // alles terug zichtbaar maken
    ['Basis','Comfort','Premium','Luxe'].forEach(v => setIndexOptionVisible(v, true));
    return;
  }

  const maxAbs = getMaxAbsSph();

  // Als nog niks ingevuld: toon alles (of pas dit aan als je strenger wilt)
  if (maxAbs === null){
    ['Basis','Comfort','Premium','Luxe'].forEach(v => setIndexOptionVisible(v, true));
    return;
  }

  // Regels:
  // Basis verdwijnt bij >= 4.25
  // Comfort verdwijnt bij >= 6.25
  // Premium verdwijnt bij >= 8.25
  // Luxe blijft altijd
  setIndexOptionVisible('Basis',   maxAbs < 4.25);
  setIndexOptionVisible('Comfort', maxAbs < 6.25);
  setIndexOptionVisible('Premium', maxAbs < 8.25);
  setIndexOptionVisible('Luxe',    true);

    // Auto-scroll: alleen op het lensindex scherm (stap 2, view 1)
  if (state.stage === 2 && state.view === 1) {
    const firstAllowed = Q('input[name="opt_index"]:not(:disabled)');
    if (firstAllowed) {
      const card = firstAllowed.closest('label.jacq-card');
      if (card && typeof card.scrollIntoView === 'function') {
        // klein beetje delay zodat de DOM zeker is bijgewerkt
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    }
  }
}


  function ensureTabs(){
    const bar = Q('.jacq-tabbar');
    if (!bar) return [];
    const expectedCount = 3;
    let tabs = bar.querySelectorAll('.jacq-tab');
    if (tabs.length !== expectedCount){
        bar.innerHTML = `
          <button type="button" class="jacq-tab">1. Glazen</button>
          <button type="button" class="jacq-tab">2. Opties</button>
          <button type="button" class="jacq-tab">3. Kijk na</button>
        `;
      tabs = bar.querySelectorAll('.jacq-tab');
    }
    return Array.from(tabs);
  }

  // ===== Inline validation helpers =====
  function setFieldError(selectName, message) {
    var select = Q('select[name="' + selectName + '"]');
    if (!select) return;
    var wrap = select.closest('.jacq-select-wrap');
    if (!wrap) return;
    wrap.classList.add('has-error');
    var errorEl = wrap.parentElement.querySelector('.jacq-field-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'jacq-field-error';
      wrap.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
    errorEl.classList.add('is-visible');
  }

  function clearFieldError(selectName) {
    var select = Q('select[name="' + selectName + '"]');
    if (!select) return;
    var wrap = select.closest('.jacq-select-wrap');
    if (!wrap) return;
    wrap.classList.remove('has-error');
    var errorEl = wrap.parentElement.querySelector('.jacq-field-error');
    if (errorEl) errorEl.classList.remove('is-visible');
  }

  function clearAllFieldErrors() {
    QA('.jacq-select-wrap.has-error').forEach(function(w) { w.classList.remove('has-error'); });
    QA('.jacq-field-error.is-visible').forEach(function(e) { e.classList.remove('is-visible'); });
  }

  // *** AANGEPAST: PD is NIET meer verplicht ***
  function validateManualRx(state){
    // Alleen valideren bij handmatig recept (niet bij 'Zonder')
    if (state.mode === 'Zonder sterkte' || state.rxSource !== 'Handmatig') return true;

    clearAllFieldErrors();
    var hasErrors = false;

    var odSphEl = Q('select[name="od_sph"]');
    var osSphEl = Q('select[name="os_sph"]');
    var odSph   = odSphEl ? odSphEl.value : '';
    var osSph   = osSphEl ? osSphEl.value : '';

    // Sterkte verplicht (beide ogen)
    if (!odSph || odSph === '-') {
      setFieldError('od_sph', 'Verplicht');
      hasErrors = true;
    }
    if (!osSph || osSph === '-') {
      setFieldError('os_sph', 'Verplicht');
      hasErrors = true;
    }

    // As verplicht als er een Cilinder ≠ 0 is ingevuld
    var odCylEl = Q('select[name="od_cyl"]');
    var osCylEl = Q('select[name="os_cyl"]');
    var odAxEl  = Q('select[name="od_ax"]');
    var osAxEl  = Q('select[name="os_ax"]');
    var odCyl   = odCylEl ? odCylEl.value : '';
    var osCyl   = osCylEl ? osCylEl.value : '';
    var odAx    = odAxEl ? odAxEl.value : '';
    var osAx    = osAxEl ? osAxEl.value : '';

    if (cylNeedsAxis(odCyl) && (!odAx || odAx === '-')){
      setFieldError('od_ax', 'As is verplicht bij cilinder');
      hasErrors = true;
    }
    if (cylNeedsAxis(osCyl) && (!osAx || osAx === '-')){
      setFieldError('os_ax', 'As is verplicht bij cilinder');
      hasErrors = true;
    }

    // Pupilafstand mag nu leeg blijven → géén PD-validatie meer

    // Additie verplicht bij multifocaal
    if (state.mode === 'Multifocaal') {
      var odAddEl = Q('select[name="od_add"]');
      var osAddEl = Q('select[name="os_add"]');
      var odAdd   = odAddEl ? odAddEl.value : '';
      var osAdd   = osAddEl ? osAddEl.value : '';
      if (!odAdd || odAdd === '-') {
        setFieldError('od_add', 'Verplicht bij multifocaal');
        hasErrors = true;
      }
      if (!osAdd || osAdd === '-') {
        setFieldError('os_add', 'Verplicht bij multifocaal');
        hasErrors = true;
      }
    }

    if (hasErrors) {
      showError('Controleer de gemarkeerde velden');
      // Scroll to first error
      var firstError = Q('.jacq-select-wrap.has-error');
      if (firstError && firstError.scrollIntoView) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  }

  // ===== Smart defaults: As alleen actief als Cilinder ≠ 0 =====
  function _num(val){
    if (val == null) return null;
    const s = String(val).trim().replace(',', '.');
    if (!s || s === '-') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  function cylNeedsAxis(cylVal){
    const n = _num(cylVal);
    return n != null && Math.abs(n) > 1e-6;
  }
  function setJacqSelectDisabled(select, disabled){
    if (!select) return;
    select.disabled = !!disabled;
    const wrap = select.closest('.jacq-select-wrap');
    const btn  = wrap ? wrap.querySelector('.jacq-select-btn') : null;
    if (btn) btn.disabled = !!disabled;
    if (wrap) wrap.classList.toggle('is-disabled', !!disabled);
  }
  function updateAxisRequirementForEye(eye){
    const cylSel = Q(`select[name="${eye}_cyl"]`);
    const axSel  = Q(`select[name="${eye}_ax"]`);
    if (!cylSel || !axSel) return;

    const needs = cylNeedsAxis(cylSel.value);
    const wrap = axSel.closest('.jacq-select-wrap');

    // Als CYL niet van toepassing is: zet As terug op '-' en disable
    if (!needs){
      if (axSel.value !== '-'){
        axSel.value = '-';
        axSel.dispatchEvent(new Event('change', { bubbles:true }));
      }
      setJacqSelectDisabled(axSel, true);

      // Show disabled hint
      if (wrap) {
        var hint = wrap.parentElement.querySelector('.jacq-disabled-hint');
        if (!hint) {
          hint = document.createElement('div');
          hint.className = 'jacq-disabled-hint';
          hint.textContent = 'Wordt actief bij cilinder';
          wrap.parentElement.appendChild(hint);
        }
        hint.hidden = false;
      }
      return;
    }

    // CYL ≠ 0: As moet kunnen worden gekozen
    setJacqSelectDisabled(axSel, false);

    // Hide disabled hint
    if (wrap) {
      var hint = wrap.parentElement.querySelector('.jacq-disabled-hint');
      if (hint) hint.hidden = true;
    }
  }
  function updateAxisRequirementAll(){
    updateAxisRequirementForEye('od');
    updateAxisRequirementForEye('os');
  }

  // ===== Warnings / confirmation before proceeding =====
  function pdIsMissing(){
    // Alleen relevant bij handmatig recept
    const isHalf = !!state.twoPds;
    if (isHalf){
      const _odEl = Q('select[name="pd_od"]');
      const od = (_odEl && _odEl.value) ? _odEl.value : '-';
            const _osEl = Q('select[name="pd_os"]');
      const os = (_osEl && _osEl.value) ? _osEl.value : '-';
      return (od === '-' || os === '-');
    }
        const _singleEl = Q('select[name="pd_single"]');
    const single = (_singleEl && _singleEl.value) ? _singleEl.value : '-';
    return (single === '-');
  }

  async function runManualRxWarnings(){
    // PD-confirm alleen tonen als het echt relevant is:
    // - altijd bij Multifocaal
    // - of bij hoge sterktes: |SPH| > 4.00 of |CYL| > 2.00
    const _odSphEl = Q('select[name="od_sph"]');
    const _osSphEl = Q('select[name="os_sph"]');
    const odSph = parseSph(_odSphEl ? _odSphEl.value : '-');
    const osSph = parseSph(_osSphEl ? _osSphEl.value : '-');

    const maxAbsSph = (() => {
      const vals = [odSph, osSph].filter(v => v != null).map(v => Math.abs(v));
      return vals.length ? Math.max(...vals) : null;
    })();

    const _odCylEl = Q('select[name="od_cyl"]');
    const _osCylEl = Q('select[name="os_cyl"]');
    const odCyl = _num(_odCylEl ? _odCylEl.value : '-');
    const osCyl = _num(_osCylEl ? _osCylEl.value : '-');

    const maxAbsCyl = (() => {
      const vals = [odCyl, osCyl].filter(v => v != null).map(v => Math.abs(v));
      return vals.length ? Math.max(...vals) : null;
    })();

    const needsPdConfirm =
      (state.mode === 'Multifocaal') ||
      (maxAbsSph != null && maxAbsSph > 4) ||
      (maxAbsCyl != null && maxAbsCyl > 2);

    // 1) PD ontbreekt → confirm (niet blokkeren)
    if (needsPdConfirm && !state.pdSkipConfirmed && pdIsMissing()){
      const message = (state.mode === 'Multifocaal')
        ? 'Je hebt geen pupilafstand (PD) ingevuld. Voor multifocale glazen is dit extra belangrijk voor comfort en kijkkwaliteit. Weet je zeker dat je wilt doorgaan?'
        : 'Je hebt geen pupilafstand (PD) ingevuld. Dit kan de kijkkwaliteit beïnvloeden. Weet je zeker dat je wilt doorgaan?';

      const ok = await jacqConfirm({
        title: 'Pupilafstand ontbreekt',
        message,
        okText: 'Toch doorgaan',
        cancelText: 'Invullen'
      });
      if (!ok) return false;
      state.pdSkipConfirmed = true;
    }

    // 2) Zeldzaam: één oog + en het andere oog -
    if (!state.mixedSignConfirmed && odSph != null && osSph != null && (odSph * osSph) < 0){
      const ok = await jacqConfirm({
        title: 'Even checken',
        message: 'Je hebt een negatieve én een positieve sterkte ingevuld (één oog “-” en het andere “+”). Dit is vrij zeldzaam. Klopt dit en wil je doorgaan?',
        okText: 'Ja, klopt',
        cancelText: 'Aanpassen'
      });
      if (!ok) return false;
      state.mixedSignConfirmed = true;
    }

    return true;
  }



  function updateAdditionVisibility(){
    const showIt = (
      state.mode === 'Multifocaal' &&
      state.stage === 1 &&
      state.view === 3 &&
      state.rxSource === 'Handmatig'
    );
    QA('.jacq-addition').forEach(el => {
      el.hidden = !showIt;
    });
  }

  // ===== Dynamic form layout (multifocaal vs enkelvoudig) =====
  function updateFormLayout(){
    var isMulti = state.mode === 'Multifocaal';
    var extrasGrid = Q('.rx-extras-grid');
    if (!extrasGrid) return;

    var optDiv   = extrasGrid.querySelector('.rx-section-divider--optional');
    var reassure = extrasGrid.querySelector('.jacq-reassurance--small');
    var pdLabel  = extrasGrid.querySelector('.rx-label--pd');
    var pdSingle = extrasGrid.querySelector('.rx-field--pd-single');
    var pdOd     = extrasGrid.querySelector('.rx-field--pd-od');
    var pdOs     = extrasGrid.querySelector('.rx-field--pd-os');
    var pdGrp    = extrasGrid.querySelector('.rx-pd-group');
    var prisma   = extrasGrid.querySelector('.rx-extras-toggle');
    var extDiv   = extrasGrid.querySelector('.rx-extras-divider');

    if (!optDiv || !pdLabel || !prisma) return;

    // PD label asterisk
    var tn = pdLabel.firstChild;
    while (tn && tn.nodeType !== 3) tn = tn.nextSibling;
    if (tn) {
      tn.textContent = isMulti ? 'Pupilafstand* ' : 'Pupilafstand ';
    }

    // Re-order elements before the prisma toggle
    var order;
    if (isMulti) {
      // Multifocaal: PD first, then divider + reassurance, then prisma
      order = [pdLabel, pdSingle, pdOd, pdOs, pdGrp, optDiv, reassure, extDiv];
    } else {
      // Enkelvoudig: divider + reassurance first, then PD, then prisma
      order = [optDiv, reassure, pdLabel, pdSingle, pdOd, pdOs, pdGrp, extDiv];
    }

    order.forEach(function(el){
      if (el) extrasGrid.insertBefore(el, prisma);
    });
  }

  // ===== State =====
  const state = {
    stage: 1,
    view:  1,
    mode: null,
    rxSource: null,
    manualConfirmed: false, // ✅ nieuw: handmatig recept echt bevestigd
    pdSkipConfirmed: false,
    mixedSignConfirmed: false,
    file: null,
    samePower: false,
    twoPds: false,
    od: { sph:'-', cyl:'-', ax:'-', add:'-' },
    os: { sph:'-', cyl:'-', ax:'-', add:'-' },
    pd: { single:'-', od:'-', os:'-' },
    readingSame: true,
    readingSph: '+1.50',
    readingSphOd: '+1.50',
    readingSphOs: '+1.50',
    coating: null,
    glasType: null,
    blauwlichtFilter: false,
    meekleurendKleur: null,
    indexChoice: null,
        prismEnabled: false,
    prismH: { od:'-', os:'-' },
    prismV: { od:'-', os:'-' },
    prismBaseH: { od:'-', os:'-' },
    prismBaseV: { od:'-', os:'-' },
    isSubmittingStage3: false,
    tintColor: null,
  };

  // ===== Microsoft Clarity API events =====
  // Fire-and-forget funnel tracking. Each event fires only once per
  // wizard session; flags are reset whenever the drawer closes/opens.
  const clarityFlags = {};
  function fireClarity(name){
    if (clarityFlags[name]) return;
    clarityFlags[name] = true;
    try {
      if (typeof clarity === "function") {
        clarity("event", name);
      }
    } catch (e) { /* no-op: never break the wizard on tracking */ }
  }
  function resetClarityFlags(){
    for (const k in clarityFlags) delete clarityFlags[k];
  }

  // Edit context wanneer je vanuit de cart op “Bewerken” komt
  let editCtx = null; // { parentKey, bundle, childKeys:[], parentUrl }

  // ===== Header offset =====
  function setHeaderOffset() {
    try {
      const headerSelectors = [
        '#shopify-section-header', '.shopify-section-header', '.header-wrapper',
        'header[is="sticky-header"]', '[data-sticky-type]', 'header.header',
        'header[role="banner"]', 'header.site-header', '.sticky-header',
        '.site-header', 'header'
      ];

      // Alle mogelijke headers verzamelen
      let headers = [];
      headerSelectors.forEach(sel => {
        headers.push(...document.querySelectorAll(sel));
      });
      headers = Array.from(new Set(headers)); // duplicates eruit

      // Hoogste header pakken
      let headerEl = null;
      let headerHeight = 0;
      headers.forEach(el => {
        const h = Math.round(el.getBoundingClientRect().height);
        if (h > headerHeight) {
          headerHeight = h;
          headerEl = el;
        }
      });

      const announceSelectors = [
        '#shopify-section-announcement',
        '#shopify-section-announcement-bar',
        '.shopify-section-announcement',
        '.announcement-bar',
        '.announcement'
      ];

      let announces = [];
      announceSelectors.forEach(sel => {
        announces.push(...document.querySelectorAll(sel));
      });
      announces = Array.from(new Set(announces));

      // Totaal announcement-hoogte (los van header zelf)
      let announceHeight = 0;
      announces.forEach(el => {
        const h = Math.round(el.getBoundingClientRect().height);
        if (h > 0 && !(headerEl && headerEl.contains(el))) {
          announceHeight += h;
        }
      });

      const main = document.querySelector(
        'main#MainContent, main[role="main"], main'
      );
      const mainTop = main
        ? Math.max(0, Math.round(main.getBoundingClientRect().top))
        : 0;

      const offset = Math.max(headerHeight + announceHeight, mainTop, 0);
      DRAWER.style.setProperty('--jacq-header-offset', offset + 'px');
    } catch (e) {
      DRAWER.style.setProperty('--jacq-header-offset', '0px');
    }
  }

  // ===== Afbeelding van huidige variant overnemen =====
  function syncDrawerImageFromPdp(){
    try{
      const drawerImg = DRAWER.querySelector('.jacq-drawer__left img');
      if (!drawerImg) return;

      // Probeer een paar veelgebruikte selectors voor de hoofd-afbeelding op de PDP
      const selectors = [
        '.product__media-item--featured img',
        '.product-media--featured img',
        '[data-product-featured-media] img',
        '.product__media img',
        'main img'
      ];

      let sourceImg = null;
      for (const sel of selectors){
        const el = document.querySelector(sel);
        if (el && el.src){
          sourceImg = el;
          break;
        }
      }

      if (!sourceImg) return;

      drawerImg.src = sourceImg.src;
      if (sourceImg.srcset) drawerImg.srcset = sourceImg.srcset;
      if (sourceImg.alt) drawerImg.alt = sourceImg.alt;
    } catch(e){
      console.warn('[JACQ] syncDrawerImageFromPdp failed', e);
    }
  }

  // ===== Scroll-lock zonder verspringen (scrollbar compensatie) =====
  function lockScrollWithCompensation() {
    const doc = document.documentElement;
    // Breedte van de scrollbar (0 op Mac met overlay-scrollbars)
    const scrollBarWidth = window.innerWidth - doc.clientWidth;

    if (scrollBarWidth > 0) {
      doc.style.setProperty('--jacq-scrollbar-comp', scrollBarWidth + 'px');
    } else {
      doc.style.removeProperty('--jacq-scrollbar-comp');
    }

    doc.classList.add('jacq-open', 'jacq-no-scroll');
  }

  function unlockScrollWithCompensation() {
    const doc = document.documentElement;
    doc.classList.remove('jacq-open', 'jacq-no-scroll');
    doc.style.removeProperty('--jacq-scrollbar-comp');
  }

  // Zorgt dat drawer + <html> ALTIJD teruggaan naar een volledig gesloten state
  function hardResetDrawerState(){
    try{
      // Reset Clarity funnel flags: next openDrawer starts a fresh session
      resetClarityFlags();

      const doc = document.documentElement;

      // Scroll-lock + gating weghalen
      doc.classList.remove('jacq-open', 'jacq-no-scroll');
      doc.style.removeProperty('--jacq-scrollbar-comp');

      // Zelf de drawer forceren naar "dicht"
      const d = DRAWER || document.querySelector('.jacq-drawer');
      if (d){
        d.setAttribute('aria-hidden', 'true');
        d.classList.remove('is-open', 'is-closing');
        d.hidden = true;
        d.style.display = 'none';

        // extra cleanup: achtergrond en inline-styles die we tijdens open/close zetten
        d.style.removeProperty('background');
      }

      // *** BELANGRIJK: GEEN unlockDrawerHeightMobile() MEER HIER ***
    } catch (e){
      console.warn('[JACQ] hardResetDrawerState failed', e);
    }
    const overlay = DRAWER?.querySelector('.jacq-drawer__overlay');
if (overlay){
  overlay.style.display = 'none';
  overlay.style.pointerEvents = 'none';
}
  }
  function cleanupScrollLockIfDrawerClosed(){
  try{
    const doc = document.documentElement;
    const d = DRAWER || document.getElementById('jacq-lens-drawer');

    const drawerOpen =
      d &&
      !d.hidden &&
      d.getAttribute('aria-hidden') !== 'true' &&
      doc.classList.contains('jacq-open');

    // ✅ Als drawer niet open is, mag scroll-lock nooit aan staan
    if (!drawerOpen && (doc.classList.contains('jacq-open') || doc.classList.contains('jacq-no-scroll'))){
      hardResetDrawerState();
    }
  } catch(e){}
}

window.addEventListener('pageshow', cleanupScrollLockIfDrawerClosed);
window.addEventListener('DOMContentLoaded', cleanupScrollLockIfDrawerClosed);
window.addEventListener('pagehide', () => {
  // als je weg navigeert terwijl er nog state hangt
  cleanupScrollLockIfDrawerClosed();
});

  function openDrawer(){
    try{
      // 0) Super-failsafe: als er iets is blijven hangen, eerst ALLES clean
      hardResetDrawerState();

      // 0b) Zorg dat we altijd de actuele drawer uit de DOM hebben
      if (!DRAWER || !document.body.contains(DRAWER)) {
        DRAWER = document.getElementById('jacq-lens-drawer') || document.querySelector('.jacq-drawer');
      }
      if (!DRAWER) return;

      // 1) oude sluit-state weghalen
      DRAWER.classList.remove('is-closing');

      // Offset bovenin bepalen zodat header niet overlapt
      setHeaderOffset();

      // Huidige PDP-afbeelding in de wizard zetten
      syncDrawerImageFromPdp();

      // Drawer zichtbaar maken
      DRAWER.hidden = false;
      DRAWER.removeAttribute('hidden');
      DRAWER.style.removeProperty('display');
      DRAWER.setAttribute('aria-hidden','false');
      DRAWER.classList.add('is-open');

      // <html> krijgt jacq-open + jacq-no-scroll → wizard zichtbaar + achtergrond niet scrollen
      lockScrollWithCompensation();

      // Tabs en state
      ensureTabs();
      state.stage = 1;
      state.view = 1;
      if (IS_SUNGLASSES && !state.tintColor) state.tintColor = 'Grijs';

      // Clarity funnel: wizard opened (fires once per session)
      fireClarity('wizard_opened');

      refresh();

      // Bij scroll/resize header-offset updaten
      window.addEventListener('resize', setHeaderOffset, { passive: true });
      window.addEventListener('scroll',  setHeaderOffset, { passive: true });

      // Layout eventueel nog even stabiliseren (maar zonder visibility-hack)
      stabilizeDrawerLayout();

      const img = DRAWER.querySelector('.jacq-drawer__left img');
      if (img && !img.complete) {
        img.addEventListener('load', stabilizeDrawerLayout, { once:true });
      }
    } catch(e){
  console.error('[JACQ] openDrawer error', e);
  hardResetDrawerState(); // ✅ belangrijk: nooit scroll-lock laten hangen
}

    // *** GEEN lockDrawerHeightMobile() MEER HIER ***
  }

  const CLOSE_ANIMATIONS = ['jacq-slide-out-right', 'jacq-slide-down-mobile'];

  function closeDrawer(){
    const panel = Q('.jacq-drawer__panel');

    // === MOBIEL (iOS/Android): GEEN ANIMATIE, DIRECT HARD CLOSE ===
    // Dit voorkomt dat iOS blijft hangen in een rare animatie/scroll-lock state
    if (window.matchMedia && window.matchMedia('(max-width:1024px)').matches) {
      hardResetDrawerState();
      return;
    }

    // === DESKTOP: bestaande animatie-gedrag behouden ===

    // Deze functie doet het echte "dicht gooien"
    const finish = () => {
      // Als er inmiddels geen sluit-animatie meer actief is (bijv. weer geopend),
      // dan niks meer doen.
      if (!DRAWER.classList.contains('is-closing')) return;

      hardResetDrawerState();
    };

    // Geen panel? meteen hard closen
    if (!panel){
      finish();
      return;
    }

    // Als hij al in sluit-modus zit → niet dubbel
    if (DRAWER.classList.contains('is-closing')) return;

    // Sluit-state starten → CSS gaat nu jacq-slide-out-right afspelen
    DRAWER.classList.add('is-closing');

    // Desktop: achtergrond eventueel transparant tijdens animatie
    if (window.matchMedia && window.matchMedia('(min-width:1025px)').matches) {
      const d = DRAWER || document.querySelector('.jacq-drawer');
      if (d) d.style.background = 'transparent';
    }

    // Tijdens de animatie zichtbaar laten
    DRAWER.hidden = false;
    DRAWER.style.removeProperty('display');

    // We vertrouwen NIET meer op animationend (iOS is daar wispelturig in),
    // maar altijd op één timer die net langer duurt dan de CSS-animatie (1000ms).
    setTimeout(finish, 1100);
  }

  if (OPEN_BTN) {
    OPEN_BTN.addEventListener('click', openDrawer);
  }

  /// Eén gedelegeerde handler voor ALLE [data-close]-targets (kruisje én backdrop)
  DRAWER.addEventListener('click', (e)=>{
    const closer = e.target.closest('[data-close]');
    if (!closer) return;

    e.preventDefault();
    e.stopPropagation();   // blokkeer fallback-document-click

    const isMobile =
      window.matchMedia &&
      window.matchMedia('(max-width:1024px)').matches;

    // TIJDELIJKE FIX:
    // op mobile: als je op het kruisje klikt, herlaad de pagina
    if (isMobile && closer.classList.contains('jacq-close')) {
      window.location.reload();
      return;
    }

    // alle andere gevallen (desktop kruisje + backdrop): normaal sluiten
    closeDrawer();
  });

  // Escape-toets sluit ook
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && DRAWER.classList.contains('is-open')) closeDrawer();
  });

  async function stabilizeDrawerLayout(){
    await new Promise(r => requestAnimationFrame(r));
    setHeaderOffset();
    const panel = Q('.jacq-drawer__panel');
    if (panel) {
      const prev = panel.style.transform;
      panel.style.transform = 'translateZ(0)';
      void panel.offsetHeight;
      panel.style.transform = prev || '';
    }
    window.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(r));
    return true;
  }

  // ===== Progress + Views =====
  function getActiveTabIndex() {
    return state.stage - 1;
  }

  function setProgress() {
    const tabs = ensureTabs();
    const activeIdx = getActiveTabIndex();
    tabs.forEach((t, i) => {
      t.classList.toggle('is-active', i === activeIdx);
      t.classList.toggle('is-done',   i <  activeIdx);
    });
  }

  function showView(){
    const v = state.view;
    const STAGE1 = Q('.jacq-steps[data-stage="1"]');
    const STAGE2 = Q('.jacq-steps[data-stage="2"]');
    const STAGE3 = Q('.jacq-steps[data-stage="3"]');

    show(STAGE1, state.stage === 1);
    show(STAGE2, state.stage === 2);
    show(STAGE3, state.stage === 3);
    show(Q('.jacq-view[data-view-id="review"]'), state.stage === 3);

    // stage 1 intern
    show(Q('.jacq-view[data-view-id="tint"]'), state.stage === 1 && v === 'tint');
    show(Q('.jacq-view[data-view-id="1"]'), state.stage === 1 && v === 1);
    show(Q('.jacq-view[data-view-id="glastype"]'), state.stage === 1 && v === 'glastype');
    show(Q('.jacq-view[data-view-id="2"]'), state.stage === 1 && v === 2);

    // Leesbril view
    show(Q('.jacq-view[data-view-id="reading"]'), state.stage === 1 && v === 'reading');

    const inRxDetail = (state.stage === 1 && v === 3);
    show(Q('.jacq-view[data-view-id="3-upload"]'), inRxDetail && state.rxSource === 'Upload');
    show(Q('.jacq-view[data-view-id="3-manual"]'), inRxDetail && state.rxSource !== 'Upload');

    if (inRxDetail && state.rxSource !== 'Upload') {
      updateRxTimingUI();
    }
    show(Q('[data-view-id="opt-index"]'), state.stage === 2 && state.view === 1);

    // knoppen
    BTN_BACK.hidden = (state.stage === 1 && v === 1);
    // Sync glastype expand panels when showing glastype view
    if (state.stage === 1 && v === 'glastype') syncGlastypeExpand();
    if (state.stage === 1 && v === 'reading') initReadingSelectsIfNeeded();
    if (state.stage === 1){
      BTN_NEXT.textContent = (v === 3) ? 'Volgende' : 'Volgende';
    } else if (state.stage === 2){
      BTN_NEXT.textContent = 'Volgende';
    } else if (state.stage === 3){
      BTN_NEXT.textContent = 'Voeg toe aan winkelwagen';
    }

    if (state.stage === 1 && v === 3 && state.rxSource === 'Handmatig') applyPdMode();
    if (state.stage === 1 && v === 3) {
      updateAdditionVisibility();
      updateFormLayout();
    }

    setSub();
    if (state.stage === 3) {
      buildReview();
      fireClarity('step_controle');
    }
  }

  function refresh(){
  setProgress();
  showView();
  initRxSelectsIfNeeded();
  initReadingSelectsIfNeeded();

  // ✅ cruciaal: zet radios/selects terug zoals state ze bedoelt
  syncUIFromState();

  // (optioneel maar netjes, zodat additie klopt na sync)
  updateAdditionVisibility();
  updateFormLayout();

  updateIndexAvailability();
  updateExtraRxVisibility();

  // Upload UI v3
  initUploadUI();
  var _fileEl = document.getElementById('ju-input');
  var _f = state.file || (_fileEl && _fileEl.files && _fileEl.files[0]) || null;
  if (_f) { state.file = _f; updateUploadUI(_f); }
  else { updateUploadUI(null); }
}

  // ===== RX selects =====
  function fillRange(select, from, to, step){
    if (!select || select.options.length) return;
    const pad = n => (n>0?`+${n.toFixed(2)}`:n.toFixed(2)).replace('.00','');
    const frag = document.createDocumentFragment();
    const dash = document.createElement('option'); dash.value='-'; dash.textContent='-';
    frag.appendChild(dash);
    for (let v=from; v<=to+1e-6; v+=step){
      const o = document.createElement('option');
      o.value = v.toFixed(2); o.textContent = pad(v);
      frag.appendChild(o);
    }
    select.appendChild(frag);
  }

  // As (AX): 0–180 in stappen van 5, zonder +/-  
  function fillAxisRange(select, from, to, step){
    if (!select || select.options.length) return;
    const frag = document.createDocumentFragment();
    const dash = document.createElement('option');
    dash.value = '-';
    dash.textContent = '-';
    frag.appendChild(dash);

    for (let v = from; v <= to + 1e-6; v += step){
      const o = document.createElement('option');
      o.value = String(Math.round(v));
      o.textContent = String(Math.round(v));
      frag.appendChild(o);
    }
    select.appendChild(frag);
  }

  // PD-selects vullen
// - Totale PD: 50–75 mm (gebruikelijk bij volwassenen)
// - Halve PD per oog: 26–40 mm (monoculaire PD)
function fillPdSelects(){
  const mkTotal = (sel) => {
    if (!sel || sel.options.length) return;
    const frag = document.createDocumentFragment();
    const dash = document.createElement('option');
    dash.value = '-';
    dash.textContent = '-';
    frag.appendChild(dash);

    // Totale PD: 50–75 mm in stappen van 0,5
    for (let v = 50; v <= 75 + 1e-6; v += 0.5){
      const o = document.createElement('option');
      o.value = v.toFixed(1);
      o.textContent = o.value.replace('.0','');
      frag.appendChild(o);
    }
    sel.appendChild(frag);
  };

  const mkHalf = (sel) => {
    if (!sel || sel.options.length) return;
    const frag = document.createDocumentFragment();
    const dash = document.createElement('option');
    dash.value = '-';
    dash.textContent = '-';
    frag.appendChild(dash);

    // Halve PD per oog: 26–40 mm in stappen van 0,5
    for (let v = 26; v <= 40 + 1e-6; v += 0.5){
      const o = document.createElement('option');
      o.value = v.toFixed(1);
      o.textContent = o.value.replace('.0','');
      frag.appendChild(o);
    }
    sel.appendChild(frag);
  };

  // Totale PD
  mkTotal(Q('select[name="pd_single"]'));

  // Halve PD per oog
  mkHalf(Q('select[name="pd_od"]'));
  mkHalf(Q('select[name="pd_os"]'));
}

  // Additie-range: 0.75 t/m 3.50 in stappen van 0.25
  function fillAddRange(select, from, to, step){
    if (!select || select.options.length) return;

    const pad = n => `+${n.toFixed(2)}`.replace('.00','');
    const frag = document.createDocumentFragment();

    const dash = document.createElement('option');
    dash.value = '-';
    dash.textContent = '-';
    frag.appendChild(dash);

    for (let v = from; v <= to + 1e-6; v += step){
      const o = document.createElement('option');
      o.value = v.toFixed(2);
      o.textContent = pad(v);
      frag.appendChild(o);
    }

    select.appendChild(frag);
  }

  // ====================================================================
  //  Jacq: wrap ALL RX selects automatically
  // ====================================================================
  function wrapAllRxSelects(){
    if (!DRAWER) return;
    DRAWER.querySelectorAll('.rx-field select.rx-select').forEach(select => {
      // Skip if already wrapped
      if (select.closest('.jacq-select-wrap')) return;

      // Create wrapper container
      const wrap = document.createElement('div');
      wrap.className = 'jacq-select-wrap';

      // Create visible button
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'jacq-select-btn';
      btn.innerHTML = `
        <span class="jacq-select-label">-</span>
        <span class="jacq-select-chevron">▾</span>
      `;

      // Insert wrapper and move select inside
      select.parentNode.insertBefore(wrap, select);
      wrap.appendChild(btn);
      wrap.appendChild(select);

      // Menu container (will be filled later)
      const menu = document.createElement('div');
      menu.className = 'jacq-select-menu';
      menu.hidden = true;
      wrap.appendChild(menu);
    });
  }

  // Symmetrische range voor sterkte/cilinder:
  // +max ... +0.25, 0, -0.25 ... min
  function fillSphRange(select, minNeg, maxPos, step){
    if (!select || select.options.length) return;

    const pad = n => (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2)).replace('.00','');
    const frag = document.createDocumentFragment();

    // placeholder
    const dash = document.createElement('option');
    dash.value = '-';
    dash.textContent = '-';
    frag.appendChild(dash);

    // eerst de positieve waardes: van max naar klein (boven 0)
    for (let v = maxPos; v >= step - 1e-6; v -= step){
      const o = document.createElement('option');
      o.value = v.toFixed(2);
      o.textContent = pad(v);
      frag.appendChild(o);
    }

    // 0 precies in het midden
    const zero = document.createElement('option');
    zero.value = '0.00';
    zero.textContent = '0';
    frag.appendChild(zero);

    // dan de negatieve waardes: -0.25, -0.50, ... tot minNeg
    for (let v = -step; v >= minNeg - 1e-6; v -= step){
      const o = document.createElement('option');
      o.value = v.toFixed(2);
      o.textContent = pad(v);
      frag.appendChild(o);
    }

    select.appendChild(frag);
  }

  // ==== Jacq custom select boven op native <select> ====
  function enhanceRxSelect(select){
    if (!select) return;
    if (select.dataset.jacqEnhanced === '1') return;

    const wrap = select.closest('.jacq-select-wrap');
    if (!wrap) return;

    const btn   = wrap.querySelector('.jacq-select-btn');
    if (!btn) return;

    // label in button
    const labelEl   = btn.querySelector('.jacq-select-label');
    const chevronEl = btn.querySelector('.jacq-select-chevron');

    // menu element maken
    let menu = wrap.querySelector('.jacq-select-menu');
    if (!menu){
      menu = document.createElement('div');
      menu.className = 'jacq-select-menu';
      menu.hidden = true;
      wrap.appendChild(menu);
    }
        const rootScope =
      wrap.closest('#jacq-lens-drawer, #jacq-lens-wizard-section') || document;

    function syncOpenSelectStacks(){
      const scope = rootScope.querySelectorAll ? rootScope : document;

      scope.querySelectorAll('.rx-grid, .rx-extras-grid').forEach(g => {
        const hasOpen = !!g.querySelector('.jacq-select-wrap.is-open');
        g.classList.toggle('jacq-has-open-select', hasOpen);
      });
    }

    function buildMenu(){
      menu.innerHTML = '';

      Array.from(select.options).forEach(opt => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'jacq-select-option';
        item.dataset.value = opt.value;
        item.textContent = opt.textContent;
        if (opt.selected) item.classList.add('is-active');
        item.addEventListener('click', () => {
          select.value = opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          updateLabel();
          closeMenu();
        });
        menu.appendChild(item);
      });
    }

    function updateLabel(){
      const opt = select.selectedOptions[0] || select.options[0];
      if (labelEl) labelEl.textContent = opt ? opt.textContent : '-';

      // active markering bijwerken
      const val = select.value;
      menu.querySelectorAll('.jacq-select-option').forEach(el => {
        if (el.dataset.value === val) el.classList.add('is-active');
        else el.classList.remove('is-active');
      });
    }

        function openMenu(){
      // eerst alle andere open dropdowns sluiten
      if (typeof QA === 'function'){
        QA('.jacq-select-wrap.is-open').forEach(w => {
          if (w !== wrap){
            w.classList.remove('is-open');
            const m = w.querySelector('.jacq-select-menu');
            if (m) m.hidden = true;
          }
        });
      }

      wrap.classList.add('is-open');
      menu.hidden = false;

      // ✅ belangrijkste: til de juiste containers omhoog zolang er een dropdown open is
      syncOpenSelectStacks();

      // ✅ Auto-scroll zodat het menu altijd in beeld komt (mobile)
requestAnimationFrame(() => {
  const scroller =
    wrap.closest('.jacq-steps') ||
    wrap.closest('.jacq-drawer__panel') ||
    document.scrollingElement;

  if (!scroller) return;

  const pad = 16;
  const menuRect = menu.getBoundingClientRect();

  const isDocScroller =
    scroller === document.scrollingElement ||
    scroller === document.documentElement ||
    scroller === document.body;

  const scRect = isDocScroller
    ? { top: 0, bottom: window.innerHeight }
    : scroller.getBoundingClientRect();

  let delta = 0;

  // menu valt onder de viewport → scroll omlaag
  if (menuRect.bottom > scRect.bottom - pad) {
    delta = menuRect.bottom - (scRect.bottom - pad);
  }
  // menu valt boven de viewport → scroll omhoog
  else if (menuRect.top < scRect.top + pad) {
    delta = menuRect.top - (scRect.top + pad);
  }

  if (!delta) return;

  const target = isDocScroller ? window : scroller;
  target.scrollBy({ top: delta, behavior: 'smooth' }); // of 'auto' als je geen animatie wil
});

      // Scroll naar huidige waarde, of anders naar 0 (voor SPH/CYL/AX)
      let target = null;
      const val = select.value;

      if (val && val !== '-'){
        target = menu.querySelector(`.jacq-select-option[data-value="${val}"]`);
      }
      if (!target){
        // eerst 0.00 (SPH/CYL), dan 0 (As)
        target =
          menu.querySelector('.jacq-select-option[data-value="0.00"]') ||
          menu.querySelector('.jacq-select-option[data-value="0"]');
      }

      if (target && typeof target.scrollIntoView === 'function'){
        target.scrollIntoView({ block: 'center' });
      }

    }

        function closeMenu(){
      wrap.classList.remove('is-open');
      menu.hidden = true;

      // ✅ stack resetten als er geen dropdowns meer open zijn
      syncOpenSelectStacks();
    }

    function toggleMenu(){
      if (menu.hidden) openMenu(); else closeMenu();
    }

    btn.addEventListener('click', (e) => {
      if (select.disabled || btn.disabled) return;
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // Klik buiten de select → sluiten
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) closeMenu();
    });

    // Als de native select verandert (bijv. door JS), label updaten
    select.addEventListener('change', updateLabel);

    // Initialisatie
    buildMenu();
    updateLabel();

    select.dataset.jacqEnhanced = '1';
  }

  function fillPrismRange(select, max=10){
  if (!select || select.options.length) return;
  const frag = document.createDocumentFragment();

  const dash = document.createElement('option');
  dash.value = '-'; dash.textContent = '-';
  frag.appendChild(dash);

  for (let v = 0.25; v <= max + 1e-6; v += 0.25){
    const o = document.createElement('option');
    o.value = v.toFixed(2);
    o.textContent = v.toFixed(2).replace('.00','');
    frag.appendChild(o);
  }
  select.appendChild(frag);
}

function fillPrismBaseH(select){
  if (!select || select.options.length) return;
  const frag = document.createDocumentFragment();
  [['-','-'],['BI','Binnen (BI)'],['BO','Buiten (BO)']].forEach(([v,t])=>{
    const o=document.createElement('option');
    o.value=v; o.textContent=t;
    frag.appendChild(o);
  });
  select.appendChild(frag);
}

function fillPrismBaseV(select){
  if (!select || select.options.length) return;
  const frag = document.createDocumentFragment();
  [['-','-'],['BU','Omhoog (BU)'],['BD','Omlaag (BD)']].forEach(([v,t])=>{
    const o=document.createElement('option');
    o.value=v; o.textContent=t;
    frag.appendChild(o);
  });
  select.appendChild(frag);
}

function setSegValue(name, value){
  const seg   = Q(`.jacq-seg[data-seg="${name}"]`);
  const input = Q(`input[type="hidden"][name="${name}"]`);
  const sel   = Q(`select[name="${name}"]`);

  const v = (value == null ? '-' : String(value));

  // Hidden input (alleen als je segmented controls gebruikt)
  if (input) input.value = v;

  // Native select (dit is wat we in de huidige Liquid gebruiken)
  // → zorg dat label van de custom select ook meteen bijwerkt.
  if (sel && sel.value !== v){
    sel.value = v;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Segmented UI (alleen aanwezig in sommige varianten)
  if (seg){
    Array.from(seg.querySelectorAll('button[data-value]')).forEach(btn => {
      const active = (btn.getAttribute('data-value') === v);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  // Sync -> state
  if (name === 'od_prism_h_base') state.prismBaseH.od = v;
  if (name === 'os_prism_h_base') state.prismBaseH.os = v;
  if (name === 'od_prism_v_base') state.prismBaseV.od = v;
  if (name === 'os_prism_v_base') state.prismBaseV.os = v;
}

function initSegGroups(){
  // ✅ Belangrijk: lees uit hidden input óf uit de select (als er geen hidden inputs zijn),
  // anders wordt de gekozen basis telkens teruggezet naar '-'.
  ['od_prism_h_base','os_prism_h_base','od_prism_v_base','os_prism_v_base'].forEach(name => {
    const input = Q(`input[type="hidden"][name="${name}"]`);
    const sel   = Q(`select[name="${name}"]`);
    const v = input ? input.value : (sel ? sel.value : '-');
    setSegValue(name, v);
  });
}
function fillPrismDir(select){
  if (!select || select.options.length) return;
  const opts = [
  { v:'90',  t:'90°' },
  { v:'270', t:'270°' },
  { v:'180', t:'180°' },
  { v:'0',   t:'0°' }
];
  const frag = document.createDocumentFragment();
  opts.forEach(x => {
    const o = document.createElement('option');
    o.value = x.v; o.textContent = x.t;
    frag.appendChild(o);
  });
  select.appendChild(frag);
}


  function initRxSelectsIfNeeded(){
    const grid = Q('.rx-grid');
    if (!grid) return;

    wrapAllRxSelects();

    ['od','os'].forEach(eye=>{
      const sphSel = Q(`select[name="${eye}_sph"]`);
      const cylSel = Q(`select[name="${eye}_cyl"]`);
      const axSel  = Q(`select[name="${eye}_ax"]`);
      const addSel = Q(`select[name="${eye}_add"]`);

      // Sterkte: -10 ... 0 ... +10
      fillSphRange(sphSel, -12, 12, 0.25);

      // Cilinder: -6 ... 0 ... +6
      fillSphRange(cylSel, -6, 6, 0.25);

      // As: 0–180
      fillAxisRange(axSel, 0, 180, 5);

      // Additie: 0.75–3.50
      fillAddRange(addSel, 0.75, 3.50, 0.25);
    });

    fillPdSelects();

        // Prisma (horizontaal/verticaal)
    fillPrismRange(Q('select[name="od_prism_h"]'), 8);
    fillPrismRange(Q('select[name="os_prism_h"]'), 8);
    fillPrismRange(Q('select[name="od_prism_v"]'), 8);
    fillPrismRange(Q('select[name="os_prism_v"]'), 8);
    initSegGroups();
    fillPrismBaseH(Q('select[name="od_prism_h_base"]'));
fillPrismBaseH(Q('select[name="os_prism_h_base"]'));
fillPrismBaseV(Q('select[name="od_prism_v_base"]'));
fillPrismBaseV(Q('select[name="os_prism_v_base"]'));

    [
  'od_sph','os_sph',
  'od_cyl','os_cyl',
  'od_ax','os_ax',
  'od_add','os_add',
  'pd_single','pd_od','pd_os',
  'od_prism_h','os_prism_h',
  'od_prism_v','os_prism_v',
  'od_prism_h_base','os_prism_h_base',
  'od_prism_v_base','os_prism_v_base',
].forEach(name => {
  const sel = Q(`select[name="${name}"]`);
  if (sel) enhanceRxSelect(sel);
});

    updateAxisRequirementAll();
  }

  // ===== Leesbril selects init =====
  let _readingSelectsInited = false;
  function initReadingSelectsIfNeeded(){
    if (_readingSelectsInited) return;
    const sels = [
      Q('select[name="reading_sph"]'),
      Q('select[name="reading_sph_od"]'),
      Q('select[name="reading_sph_os"]')
    ];
    if (!sels[0]) return;
    sels.forEach(sel => {
      if (!sel || sel.options.length) return;
      const frag = document.createDocumentFragment();
      for (let v = 0.50; v <= 6.00 + 1e-6; v += 0.25){
        const o = document.createElement('option');
        o.value = `+${v.toFixed(2)}`;
        o.textContent = `+${v.toFixed(2)}`.replace('.00','');
        if (Math.abs(v - 1.50) < 0.01) o.selected = true;
        frag.appendChild(o);
      }
      sel.appendChild(frag);
      enhanceRxSelect(sel);
    });
    // Toggle same/different eyes
    const toggle = Q('#jacq-reading-same');
    if (toggle) {
      toggle.addEventListener('change', function(){
        state.readingSame = toggle.checked;
        Q('#jacq-reading-single').hidden = !state.readingSame;
        Q('#jacq-reading-dual').hidden = state.readingSame;
      });
    }
    // Change listeners
    ['reading_sph','reading_sph_od','reading_sph_os'].forEach(name => {
      const sel = Q(`select[name="${name}"]`);
      if (!sel) return;
      sel.addEventListener('change', function(){
        if (name === 'reading_sph') state.readingSph = sel.value;
        if (name === 'reading_sph_od') state.readingSphOd = sel.value;
        if (name === 'reading_sph_os') state.readingSphOs = sel.value;
      });
    });
    _readingSelectsInited = true;
  }

  // UI <- state (prefill radios/selects)
  function syncUIFromState(){

   // stap 1 view1: type glazen
if (state.mode) {
  QA('input[name="mode"]').forEach(r => r.checked = (r.value === state.mode));
}

// stap 1 view2: bron
if (state.rxSource) {
  QA('input[name="rxSource"]').forEach(r => r.checked = (r.value === state.rxSource));
}

// glastype
if (state.glasType) {
  QA('input[name="glastype"]').forEach(r => r.checked = (r.value === state.glasType));
}
syncGlastypeExpand();

// stap 2: lensindex
if (state.indexChoice) {
  QA('input[name="opt_index"]').forEach(r => r.checked = (r.value === state.indexChoice));
}

    // stap 1 view3: handmatig
    if (state.rxSource === 'Handmatig'){
      // PD radio – volg expliciet state.twoPds (niet afleiden van ingevulde waarden)
if (PD_TOTAL) PD_TOTAL.checked = !state.twoPds;
if (PD_HALF)  PD_HALF.checked  = !!state.twoPds;
applyPdMode();

      const set = (name, val) => {
  const el = Q(`select[name="${name}"]`);
  if (!el) return;

  const next = (val == null ? '-' : String(val));
  if (el.value !== next) el.value = next;

  // 🔥 Belangrijk: forceer update van het custom select label
  el.dispatchEvent(new Event('change', { bubbles: true }));
};
      set('od_sph', state.od.sph); set('os_sph', state.os.sph);
      set('od_cyl', state.od.cyl); set('os_cyl', state.os.cyl);
      set('od_ax',  state.od.ax);  set('os_ax',  state.os.ax);
      set('od_add', state.od.add); set('os_add', state.os.add);
      set('pd_single', state.pd.single);
      set('pd_od', state.pd.od); set('pd_os', state.pd.os);

      const prismToggle = Q('input[name="prism_enabled"]');
if (prismToggle) prismToggle.checked = !!state.prismEnabled;
updateExtraRxVisibility();

set('od_prism_h', state.prismH.od);
set('os_prism_h', state.prismH.os);
set('od_prism_v', state.prismV.od);
set('os_prism_v', state.prismV.os);

setSegValue('od_prism_h_base', state.prismBaseH.od);
setSegValue('os_prism_h_base', state.prismBaseH.os);
setSegValue('od_prism_v_base', state.prismBaseV.od);
setSegValue('os_prism_v_base', state.prismBaseV.os);
    }

    // Leesbril sync
    const readingSameToggle = Q('#jacq-reading-same');
    if (readingSameToggle) readingSameToggle.checked = state.readingSame;
    const rSingle = Q('#jacq-reading-single');
    const rDual   = Q('#jacq-reading-dual');
    if (rSingle) rSingle.hidden = !state.readingSame;
    if (rDual)   rDual.hidden   = state.readingSame;
  }

  // ===== PD toggle =====
  const PD_HALF = Q('#pd_half');
  const PD_TOTAL = Q('#pd_total');
  function applyPdMode(){
  const isHalf = !!(PD_HALF && PD_HALF.checked);

  // ✅ onthoud keuze (belangrijk bij switch totaal -> half)
  state.twoPds = isHalf;

  const singles = QA('.jacq-pd--single');
  const duals   = QA('.jacq-pd--dual');
  singles.forEach(el => el.hidden = isHalf);
  duals.forEach(el   => el.hidden = !isHalf);
}
  if (PD_HALF) PD_HALF.addEventListener('change', applyPdMode);
  if (PD_TOTAL) PD_TOTAL.addEventListener('change', applyPdMode);

  // Zorg dat bij laden meteen de juiste velden zichtbaar zijn
  applyPdMode();


  // Toon/verberg blok "nu invullen" vs "later doorgeven"
  function updateRxTimingUI(){
    const manualBlock = Q('.jacq-rx-manual');
    const laterBlock  = Q('.jacq-rx-later');

    const isLater = (state.rxSource === 'Later');

    if (manualBlock) manualBlock.hidden = isLater;
    if (laterBlock)  laterBlock.hidden  = !isLater;

    const timing = isLater ? 'Later' : 'Nu';
    QA('input[name="rxTiming"]').forEach(r => {
      r.checked = (r.value === timing);
    });
  }

  
  // ===== Upload v6 – SVG spinner indicator, no progress bar =====
  var __juBound = false;
  var __juTimeout = null;
  var __juPreviewUrl = null;
  var __juDone = false;

  // SVG spinner – uses SVG-native animateTransform (no CSS animations needed)
  var __juSpinnerSVG = '<svg width="14" height="14" viewBox="0 0 20 20" style="vertical-align:middle;margin-right:5px;"><circle cx="10" cy="10" r="8" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-dasharray="38 62" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="0.8s" repeatCount="indefinite"/></circle></svg>';

  // SVG checkmark
  var __juCheckSVG = '<svg width="14" height="14" viewBox="0 0 20 20" style="vertical-align:middle;margin-right:5px;"><circle cx="10" cy="10" r="10" fill="#10b981"/><path d="M6 10.5l2.5 2.5 5.5-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function jacqFormatFileSize(bytes){
    if (!bytes) return '0 B';
    var k = 1024, s = ['B','KB','MB','GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(i ? 1 : 0) + ' ' + s[i];
  }

  function jacqSetInputFile(input, file){
    try { var dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; return true; }
    catch(e){ return false; }
  }

  function jacqClearUpload(input){
    state.file = null;
    if (input) input.value = '';
    __juDone = false;
    updateUploadUI(null);
  }

  function updateUploadUI(file){
    var card    = document.getElementById('ju-card');
    var nameEl  = document.getElementById('ju-name');
    var sizeEl  = document.getElementById('ju-size');
    var pctEl   = document.getElementById('ju-pct');
    var thumbEl = document.getElementById('ju-thumb');
    var removeBtn = document.getElementById('ju-remove');
    var titleEl = document.getElementById('ju-title');
    var subEl   = document.getElementById('ju-sub');

    // Stop any running timeout
    if (__juTimeout){ clearTimeout(__juTimeout); __juTimeout = null; }

    if (!file){
      // --- Empty state ---
      if (card) card.style.display = 'none';
      if (titleEl) titleEl.textContent = 'Upload je recept';
      if (subEl) subEl.innerHTML = 'Sleep je bestand hierheen, of <span class="ju-link">kies bestand</span>';
      if (pctEl){ pctEl.innerHTML = ''; pctEl.style.color = '#86868b'; }
      if (removeBtn) removeBtn.style.display = 'none';
      if (thumbEl) thumbEl.innerHTML = '';
      if (__juPreviewUrl){ try{ URL.revokeObjectURL(__juPreviewUrl); }catch(e){} __juPreviewUrl = null; }
      __juDone = false;
      return;
    }

    // --- File selected ---
    if (titleEl) titleEl.textContent = 'Bestand gekozen';
    if (subEl) subEl.innerHTML = 'Sleep een ander bestand, of <span class="ju-link">vervang</span>';
    if (nameEl) nameEl.textContent = file.name || 'Bestand';
    if (sizeEl) sizeEl.textContent = jacqFormatFileSize(file.size);

    // Thumbnail
    if (thumbEl){
      thumbEl.innerHTML = '';
      if (__juPreviewUrl){ try{ URL.revokeObjectURL(__juPreviewUrl); }catch(e){} __juPreviewUrl = null; }
      if (file.type && file.type.startsWith('image/')){
        __juPreviewUrl = URL.createObjectURL(file);
        var img = document.createElement('img');
        img.alt = file.name || '';
        img.src = __juPreviewUrl;
        thumbEl.appendChild(img);
      } else {
        thumbEl.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-6Z"/><path d="M14 2v6h6"/></svg>';
      }
    }

    // Show card
    if (card) card.style.display = '';

    // If already done (revisiting view), show complete immediately
    if (__juDone){
      if (pctEl){ pctEl.innerHTML = __juCheckSVG + 'Gereed'; pctEl.style.color = '#10b981'; }
      if (removeBtn) removeBtn.style.display = '';
      return;
    }

    // --- Show spinning indicator ---
    if (removeBtn) removeBtn.style.display = 'none';
    if (pctEl){ pctEl.innerHTML = __juSpinnerSVG + 'Uploaden...'; pctEl.style.color = '#3b82f6'; }

    __juTimeout = setTimeout(function(){
      __juTimeout = null;
      __juDone = true;
      if (pctEl){ pctEl.innerHTML = __juCheckSVG + 'Gereed'; pctEl.style.color = '#10b981'; }
      if (removeBtn) removeBtn.style.display = '';
      if (navigator.vibrate) navigator.vibrate(100);
    }, 3000);
  }

  function initUploadUI(){
    if (__juBound) return;
    var drop  = document.getElementById('ju-drop');
    var input = document.getElementById('ju-input');
    if (!drop || !input) return;
    __juBound = true;

    // Click & keyboard
    drop.addEventListener('click', function(){ input.click(); });
    drop.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); input.click(); }
    });

    // Drag & drop
    var dc = 0;
    drop.addEventListener('dragenter', function(e){ e.preventDefault(); dc++; drop.classList.add('is-dragging'); });
    drop.addEventListener('dragleave', function(){ dc--; if(dc<=0){dc=0; drop.classList.remove('is-dragging');} });
    drop.addEventListener('dragover', function(e){ e.preventDefault(); });
    drop.addEventListener('drop', function(e){
      e.preventDefault(); dc = 0; drop.classList.remove('is-dragging');
      var files = e.dataTransfer && e.dataTransfer.files;
      if (!files || !files[0]) return;
      var f = files[0];
      var ok = (f.type && f.type.startsWith('image/')) || (f.name && f.name.toLowerCase().endsWith('.pdf')) || (f.type && f.type === 'application/pdf');
      if (!ok){ showError('Upload een JPG, PNG of PDF'); return; }
      state.file = f; __juDone = false;
      jacqSetInputFile(input, f);
      updateUploadUI(f);
    });

    // Remove
    var removeBtn = document.getElementById('ju-remove');
    if (removeBtn) removeBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); jacqClearUpload(input); });

    // File input change
    input.addEventListener('change', function(e){
      e.stopPropagation();
      var f = (input.files && input.files[0]) || null;
      state.file = f; __juDone = false;
      updateUploadUI(f);
    });

    // Init existing
    var existing = (input.files && input.files[0]) || state.file || null;
    if (existing){ state.file = existing; updateUploadUI(existing); }
    else { updateUploadUI(null); }
  }
  // ===== Glastype expand panels =====
  function syncGlastypeExpand(){
    QA('.jacq-gt-expand').forEach(function(el){
      var shouldOpen = el.dataset.gt === state.glasType;
      if (shouldOpen && !el.classList.contains('is-open')) {
        el.classList.add('is-open');
        el.classList.remove('is-animated');
        // Trigger reflow, then animate
        void el.offsetHeight;
        requestAnimationFrame(function(){ el.classList.add('is-animated'); });
      } else if (!shouldOpen) {
        el.classList.remove('is-open', 'is-animated');
      }
    });
    // Sync toggle state across all panels
    QA('[data-view-id="glastype"] .jacq-toggle').forEach(function(t){
      t.setAttribute('aria-checked', state.blauwlichtFilter ? 'true' : 'false');
      t.classList.toggle('is-on', state.blauwlichtFilter);
    });
    // Sync swatch selection in the active panel
    var activeExpand = Q('.jacq-gt-expand[data-gt="' + state.glasType + '"]');
    if (activeExpand) {
      activeExpand.querySelectorAll('.jacq-swatch').forEach(function(s){
        var sel = s.dataset.kleur === state.meekleurendKleur;
        s.classList.toggle('is-selected', sel);
        s.setAttribute('aria-checked', sel ? 'true' : 'false');
      });
    }
    // Hide swatch errors when switching
    QA('.jacq-swatch-error').forEach(function(e){ e.hidden = true; });
  }

  // Blauwlichtfilter toggle (global state, synced across panels)
  Q('.jacq-drawer__panel').addEventListener('click', (e) => {
    const toggle = e.target.closest('.jacq-toggle');
    if (!toggle) return;
    if (!toggle.closest('[data-view-id="glastype"]')) return;
    const isOn = toggle.getAttribute('aria-checked') === 'true';
    state.blauwlichtFilter = !isOn;
    // Sync ALL toggles
    QA('[data-view-id="glastype"] .jacq-toggle').forEach(function(t){
      t.setAttribute('aria-checked', state.blauwlichtFilter ? 'true' : 'false');
      t.classList.toggle('is-on', state.blauwlichtFilter);
    });
    setSub();
    fireClarity('step_coating');
  });

  // Color swatch selection (Gepolariseerd + Meekleurend)
  Q('.jacq-drawer__panel').addEventListener('click', (e) => {
    const swatch = e.target.closest('.jacq-swatch');
    if (!swatch) return;
    clearError();
    state.meekleurendKleur = swatch.dataset.kleur;
    // Update swatches within the same expand panel
    var panel = swatch.closest('.jacq-gt-expand');
    if (panel) {
      panel.querySelectorAll('.jacq-swatch').forEach(function(s){
        var sel = s === swatch;
        s.classList.toggle('is-selected', sel);
        s.setAttribute('aria-checked', sel ? 'true' : 'false');
      });
    }
    // Also sync the other panel's swatches (same color name)
    QA('.jacq-gt-expand .jacq-swatch').forEach(function(s){
      if (s.closest('.jacq-gt-expand') === panel) return;
      var sel = s.dataset.kleur === state.meekleurendKleur;
      s.classList.toggle('is-selected', sel);
      s.setAttribute('aria-checked', sel ? 'true' : 'false');
    });
    QA('.jacq-swatch-error').forEach(function(e){ e.hidden = true; });
  });

// ===== Form events =====
  Q('.jacq-drawer__panel').addEventListener('change', (e)=>{
    const t=e.target;
    clearError();

    if (t.name === 'rxSource') { state.rxSource = t.value; fireClarity('step_voorschrift'); }
    if (t.type === 'file' && t.name === 'properties[Voorschrift]') {
      state.file = (t.files && t.files[0]) ? t.files[0] : null;
      __juDone = false;
      initUploadUI();
      updateUploadUI(state.file);
    }
    if (t.name === 'rxTiming') {
      state.rxSource = (t.value === 'Later') ? 'Later' : 'Handmatig';
      updateRxTimingUI();
      fireClarity('step_voorschrift');
    }
    if (t.name === 'opt_index')   { state.indexChoice = t.value; setSub(); fireClarity('step_lensdikte'); }
    if (t.name === 'glastype') { state.glasType = t.value; syncGlastypeExpand(); setSub(); fireClarity('step_glastype'); }

    if (t.name === 'od_sph' || t.name === 'od_cyl' || t.name === 'od_ax' || t.name === 'od_add'){
    if (t.value && t.value !== '-') clearFieldError(t.name);
    const key = t.name.split('_')[1];
    state.od[key] = t.value;

    if (key === 'sph') updateIndexAvailability();

    if (state.samePower){
    const peer = Q(`select[name="os_${key}"]`);
    if (peer) peer.value = t.value;
    state.os[key] = t.value;
    if (key === 'sph') updateIndexAvailability();
   }

    if (key === 'sph') {
      state.mixedSignConfirmed = false;
      updateCopyEyeVisibility();
    }
    if (key === 'cyl') updateAxisRequirementAll();
}


if (t.name === 'os_sph' || t.name === 'os_cyl' || t.name === 'os_ax' || t.name === 'os_add'){
  if (t.value && t.value !== '-') clearFieldError(t.name);
  const key = t.name.split('_')[1];
  state.os[key] = t.value;

  if (key === 'sph') updateIndexAvailability();

  if (state.samePower){
    const peer = Q(`select[name="od_${key}"]`);
    if (peer) peer.value = t.value;
    state.od[key] = t.value;
    if (key === 'sph') updateIndexAvailability();
  }

  if (key === 'sph') state.mixedSignConfirmed = false;
  if (key === 'cyl') updateAxisRequirementAll();
}
    if (t.name === 'pd_single') state.pd.single=t.value;
    if (t.name === 'pd_od')     state.pd.od=t.value;
    if (t.name === 'pd_os')     state.pd.os=t.value;

    if (t.name === 'mode') {
      state.mode = t.value;
      fireClarity('step_glazen');

      if (t.value === 'Zonder sterkte' || t.value === 'Leesbril') {
        // Geen recept nodig
        state.rxSource = null;
        state.manualConfirmed = false;
        state.file = null;
        // Voorkom dat stale DOM-radios later opgepikt worden door addToCartCompound
        QA('input[name="rxSource"]').forEach(r => r.checked = false);
      } else {
        // Default bron = Upload (maar behoud keuze als die al gezet is)
        if (!state.rxSource || state.rxSource === 'Later') state.rxSource = 'Upload';
        state.manualConfirmed = false;
      }

      setSub();
      updateRxTimingUI();
    }

        if (t.name === 'prism_enabled'){
      state.prismEnabled = !!t.checked;
      updateExtraRxVisibility();
    }

    if (t.name === 'od_prism_h') state.prismH.od = t.value;
    if (t.name === 'os_prism_h') state.prismH.os = t.value;
    if (t.name === 'od_prism_v') state.prismV.od = t.value;
    if (t.name === 'os_prism_v') state.prismV.os = t.value;

    if (t.name === 'od_prism_h_base') state.prismBaseH.od = t.value;
if (t.name === 'os_prism_h_base') state.prismBaseH.os = t.value;
if (t.name === 'od_prism_v_base') state.prismBaseV.od = t.value;
if (t.name === 'os_prism_v_base') state.prismBaseV.os = t.value;

  

  });

  const _samePowerEl = Q('#samePower');
  if (_samePowerEl) _samePowerEl.addEventListener('change', ()=>{
    state.samePower = _samePowerEl.checked;
    if (state.samePower){
      ['sph','cyl','ax','add'].forEach(k=>{
        const _od = Q(`select[name="od_${k}"]`);
        const v = (_od && _od.value) || '-';
        const peer = Q(`select[name="os_${k}"]`);
        if (peer) peer.value = v;
        state.os[k] = v;
      });
    }
    updateAxisRequirementAll();
    state.mixedSignConfirmed = false;
  });

  // ===== "Kopieer rechteroog" link =====
  function updateCopyEyeVisibility() {
    var copyBtn = Q('#jacq-copy-eye');
    if (!copyBtn) return;
    copyBtn.hidden = (state.od.sph === '-');
  }

  var _copyEyeBtn = Q('#jacq-copy-eye');
  if (_copyEyeBtn) {
    _copyEyeBtn.addEventListener('click', function() {
      ['sph','cyl','ax','add'].forEach(function(k) {
        var val = state.od[k];
        state.os[k] = val;
        var osSel = Q('select[name="os_' + k + '"]');
        if (osSel) {
          osSel.value = val;
          osSel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      updateAxisRequirementAll();
      updateIndexAvailability();
    });
  }

  // ===== Escape hatch: switch to upload =====
  var _escapeBtn = Q('#jacq-escape-to-upload');
  if (_escapeBtn) {
    _escapeBtn.addEventListener('click', function() {
      state.rxSource = 'Upload';
      state.manualConfirmed = false;
      state.view = 3;
      refresh();
    });
  }

  // ===== Leesbril -> Bril op sterkte switch =====
  var _switchToRxBtn = Q('#jacq-switch-to-rx');
  if (_switchToRxBtn) {
    _switchToRxBtn.addEventListener('click', function() {
      state.mode = 'Bril op sterkte';
      QA('input[name="mode"]').forEach(function(r){ r.checked = (r.value === 'Bril op sterkte'); });
      if (!state.rxSource || state.rxSource === 'Later') state.rxSource = 'Upload';
      state.manualConfirmed = false;
      state.view = 2;
      setSub();
      refresh();
    });
  }

  // ===== Navigatie =====
  BTN_BACK.addEventListener('click', ()=>{
    if (state.stage === 3){
      // Zonder sterkte has no index step
      if (state.mode === 'Zonder sterkte') {
        state.stage = 1; state.view = 'glastype';
      } else {
        state.stage = 2;
      }
      refresh(); return;
    }
    if (state.stage === 2){
      state.stage = 1;
      if (state.mode === 'Leesbril') {
        state.view = 'reading';
      } else if (state.mode && state.mode !== 'Zonder sterkte') {
        state.view = (state.rxSource === 'Later' ? 2 : 3);
      } else {
        state.view = 'glastype';
      }
      refresh();
      return;
    }
    if (state.stage === 1){
      if (state.view === 'reading'){
        state.view = 'glastype';
      } else if (state.view === 3){
        state.view = 2;
      } else if (state.view === 2){
        state.view = 'glastype';
      } else if (state.view === 'glastype'){
        state.view = 1;
      } else {
        state.view = 1;
      }
      refresh();
    }
  });

  BTN_NEXT.addEventListener('click', async function(){
    clearError();

    // STAP 1
    if (state.stage === 1){

      // View 1: glazen-keuze -> naar glastype
      if (state.view === 1){
        if (!state.mode){ showError('Kies een optie'); return; }
        state.view = 'glastype';
        refresh();
        return;
      }

      // View glastype: glastype gekozen -> volgende stap
      if (state.view === 'glastype'){
        if (!state.glasType){ showError('Kies een glastype'); return; }
        // Validatie: gepolariseerd en meekleurend vereisen kleurkeuze
        if ((state.glasType === 'Meekleurend' || state.glasType === 'Gepolariseerd') && !state.meekleurendKleur){
          var swatchErr = Q('.jacq-gt-expand[data-gt="' + state.glasType + '"] .jacq-swatch-error');
          if (swatchErr) swatchErr.hidden = false;
          showError('Kies een kleur');
          return;
        }

        if (state.mode === 'Zonder sterkte'){
          // Geen voorschrift of lensdikte nodig -> direct naar review
          state.stage = 3;
          refresh();
          return;
        }

        if (state.mode === 'Leesbril'){
          state.view = 'reading';
          refresh();
          return;
        }

        // Met sterkte -> kies hoe je het voorschrift aanlevert
        if (!state.rxSource || state.rxSource === 'Later') state.rxSource = 'Upload';
        state.manualConfirmed = false;
        state.view = 2;
        refresh();
        return;
      }

      // View reading: leesbril sterkte gekozen -> naar Opties (stap 2)
      if (state.view === 'reading'){
        state.stage = 2;
        state.view  = 1;
        refresh();
        return;
      }

      // View 2: bronkeuze (Upload / Handmatig / Later)
if (state.view === 2){
  // ✅ extra safety: pak de actuele keuze uit de DOM
  const picked = Q('input[name="rxSource"]:checked');
  if (picked) state.rxSource = picked.value;

  if (!state.rxSource){ showError('Kies hoe je je voorschrift wilt delen'); return; }

  // "Later" keuze: sla het invullen over en ga direct naar Opties (stap 2)
  if (state.rxSource === 'Later') {
    state.manualConfirmed = false;
    state.stage = 2;
    state.view  = 1;
    refresh();
    return;
  }

  state.view = 3;
  refresh();
  return;
}

      // View 3: upload óf handmatig invullen
      if (state.view === 3){

        if (state.rxSource === 'Upload'){
          const fileEl = Q('input[type="file"][name="properties[Voorschrift]"]');
          const f = state.file || (fileEl && fileEl.files && fileEl.files[0]) || null;
          if (!f){ showError('Upload een foto of PDF van je brilrecept'); return; }
          state.file = f;
          state.manualConfirmed = false;

          state.stage = 2;
          state.view  = 1;
          refresh();
          return;
        }

        // Handmatig invullen (valideren)
        const _okWarnings = await runManualRxWarnings();
        if (!_okWarnings) return;
        if (!validateManualRx(state)) return;

        // ✅ Vanaf nu is dit officieel "Handmatig ingevuld"
        state.rxSource = 'Handmatig';
        state.manualConfirmed = true;

        state.stage = 2;
        state.view  = 1;
        refresh();
        return;
      }

      return;
    }

    if (state.stage === 2){
      // Index keuze -> direct naar review
      if (!state.indexChoice){
        showError('Kies een lensindex optie');
        return;
      }
      state.stage = 3; // naar review
      refresh();
      return;
    }

    // STAP 3 (toevoegen / opslaan)
    if (state.stage === 3){
      // ✅ 1x klikken (desktop + mobile): voorkom dubbele submits
      if (state.isSubmittingStage3) return;
      state.isSubmittingStage3 = true;

      // Clarity funnel: wizard completed (fires once per session)
      fireClarity('wizard_completed');

      // 🎉 Confetti eerst (zodat je ’m ziet vóór de loading overlay verschijnt)
      fireJacqConfettiFrom(BTN_NEXT);

      // direct feedback
      BTN_NEXT.disabled = true;
      // laat confetti een frame "pakken" voordat overlay erop komt
      let _loadingRafId = window.requestAnimationFrame(() => {
        _loadingRafId = null;
        showWizardLoading('Toevoegen aan winkelwagen\u2026');
      });

      try{
        const __jacqStage3StartTs = Date.now();
        if (editCtx){ await saveEditCompound(); }
        else { await addToCartCompound(); }

        // Zorg dat bag-entree klaar is voor success-animatie start
        const minLoadingShow = 600;
        const elapsedSinceOverlay = Date.now() - __jacqStage3StartTs;
        const waitBeforeSuccess = Math.max(0, minLoadingShow - elapsedSinceOverlay);

        await new Promise(function(r){ setTimeout(r, waitBeforeSuccess); });
        showWizardSuccess();

        // Vaste wachttijd na success-animatie zodat vinkje volledig zichtbaar is
        await new Promise(function(r){ setTimeout(r, 1000); });
        window.location.assign('/cart');
      } catch(err){
        console.error(err);
        // Voorkom race condition: als de rAF nog niet gefired is, annuleer hem
        if (_loadingRafId) { cancelAnimationFrame(_loadingRafId); _loadingRafId = null; }
        hideWizardLoading();
        state.isSubmittingStage3 = false;
        BTN_NEXT.disabled = false;
        showError('Opslaan mislukt. Probeer opnieuw.\n' + (err && err.message ? String(err.message) : ''));
      }
      return;
    }
  });

  // init
  setSub();

  // Check of er daadwerkelijk handmatig een sterkte is ingevuld
  function hasManualRxData(){
    // Alleen relevant als er glazen op sterkte zijn gekozen
    if (!state.mode || state.mode === 'Zonder sterkte' || state.mode === 'Leesbril') return false;

    const hasOd = state.od && state.od.sph && state.od.sph !== '-';
    const hasOs = state.os && state.os.sph && state.os.sph !== '-';

    return hasOd || hasOs;
  }

  // ===== Review (stap 3) =====
  function buildReview(){
    const wrap = Q('#jacq-review');
    if (!wrap) return;
    const moneyFmt = (v) => v > 0 ? `+${money(v).replace(' ', '')}` : 'Gratis';
    const modePrice = ({'Zonder sterkte':0,'Leesbril':0,'Bril op sterkte':0,'Multifocaal':95})[state.mode] || 0;
    const glastypePrice = GLASTYPE_PRICE[state.glasType] || 0;
    const blfPrice = state.blauwlichtFilter ? ADDON_PRICE : 0;
    const indexPrice = (INDEX_PRICE && INDEX_PRICE[state.indexChoice]) || 0;

    const rows = [];

    rows.push(`
      <div class="jacq-review">
        <div class="jacq-review__head">
          <div class="jacq-review__title">Glazen</div>
          <div class="jacq-review__price">${moneyFmt(modePrice)}</div>
        </div>
        <div class="jacq-review__desc">${state.mode || '-'}</div>
        <button type="button" class="jacq-review__edit js-edit" data-target="1">Bewerk</button>
      </div>`);

    // Glastype (2e plek, direct na Glazen)
    let glastypeDesc = state.glasType || '-';
    if ((state.glasType === 'Meekleurend' || state.glasType === 'Gepolariseerd') && state.meekleurendKleur) {
      glastypeDesc += `, ${state.meekleurendKleur}`;
    }
    rows.push(`
      <div class="jacq-review">
        <div class="jacq-review__head">
          <div class="jacq-review__title">Glastype</div>
          <div class="jacq-review__price">${moneyFmt(glastypePrice)}</div>
        </div>
        <div class="jacq-review__desc">${glastypeDesc}</div>
        <button type="button" class="jacq-review__edit js-edit" data-target="glastype">Bewerk</button>
      </div>`);

    // Blauwlichtfilter
    if (state.blauwlichtFilter) {
      rows.push(`
        <div class="jacq-review">
          <div class="jacq-review__head">
            <div class="jacq-review__title">Blauwlichtfilter</div>
            <div class="jacq-review__price">${moneyFmt(blfPrice)}</div>
          </div>
          <div class="jacq-review__desc">Ja</div>
          <button type="button" class="jacq-review__edit js-edit" data-target="glastype">Bewerk</button>
        </div>`);
    }

    // Leesbril: toon sterkte-samenvatting
    if (state.mode === 'Leesbril') {
      let sterkteDesc;
      if (state.readingSame) {
        sterkteDesc = `Sterkte: ${state.readingSph} (beide ogen)`;
      } else {
        sterkteDesc = `Rechteroog: ${state.readingSphOd}<br>Linkeroog: ${state.readingSphOs}`;
      }
      rows.push(`
        <div class="jacq-review">
          <div class="jacq-review__head">
            <div class="jacq-review__title">Leessterkte</div>
            <div class="jacq-review__price">Gratis</div>
          </div>
          <div class="jacq-review__desc">${sterkteDesc}</div>
          <a class="jacq-review__edit js-edit" data-target="reading">Bewerk</a>
        </div>`);
    }

    // Alleen tonen als er glazen mét recept gekozen zijn (niet Leesbril, niet Zonder sterkte)
    if (state.mode && state.mode !== 'Zonder sterkte' && state.mode !== 'Leesbril') {
      let rxLabel = '-';

      if (state.manualConfirmed) {
        rxLabel = 'Handmatig ingevuld';
      } else if (state.rxSource === 'Later') {
        rxLabel = 'Achteraf sterkte doorgeven';
      } else if (state.rxSource === 'Upload') {
        rxLabel = state.file ? `Recept geüpload (${state.file.name})` : 'Recept geüpload';
      } else if (state.rxSource === 'Handmatig') {
        rxLabel = 'Handmatig ingevuld';
      }

      rows.push(`
        <div class="jacq-review">
          <div class="jacq-review__head">
            <div class="jacq-review__title">Voorschrift</div>
            <div class="jacq-review__price">Gratis</div>
          </div>
          <div class="jacq-review__desc">${rxLabel}</div>
          <a class="jacq-review__edit js-edit" data-target="rx">Bewerk</a>
        </div>`);
    }
    if (state.mode && state.mode !== 'Zonder sterkte') {
      rows.push(`
        <div class="jacq-review">
          <div class="jacq-review__head">
            <div class="jacq-review__title">Lensindex</div>
            <div class="jacq-review__price">${moneyFmt(indexPrice)}</div>
          </div>
          <div class="jacq-review__desc">${state.indexChoice || '-'}</div>
          <a class="jacq-review__edit js-edit" data-target="index">Bewerk</a>
        </div>`);
    }

    wrap.innerHTML = rows.join('');
  }

  Q('.jacq-drawer__panel').addEventListener('click', (e)=>{
    const a = e.target.closest('.js-edit');
    if (!a) return;
    e.preventDefault();

    const t = a.dataset.target;

    switch (t) {
      case '1': // Glazen
        state.stage = 1;
        state.view  = 1;
        break;

      case 'glastype': // Glastype
        state.stage = 1;
        state.view  = 'glastype';
        break;

      case 'index': // Lensindex
        state.stage = 2;
        state.view  = 1;
        break;

      case 'reading': // Leessterkte bewerken
        state.stage = 1;
        state.view  = 'reading';
        break;

      case 'rx': // Voorschrift
      default:
        state.stage = 1;
        if (state.mode && state.mode !== 'Zonder sterkte') {
  if (!state.rxSource || state.rxSource === 'Later') {
    // Als er handmatige data is bevestigd/ingevuld, ga uit van Handmatig
    state.rxSource = (state.manualConfirmed || hasManualRxData()) ? 'Handmatig' : 'Upload';
  }
  state.view = 2; // bron kiezen
} else {
          state.view = 1;               // zonder sterkte terug naar eerste keuze
        }
        break;
    }

    refresh();
  });

  // ===== Add to cart (parent + add-ons) =====
  async function addToCartCompound(){
    const frameId = getFrameVariantId();
    if (!frameId) throw new Error('Geen geldige variant geselecteerd');

    const bundleKey = 'JACQ-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7);

    const chosenMode    = state.mode     || (Q('input[name="mode"]:checked') ? Q('input[name="mode"]:checked').value : '-');

    // Wat er in state staat (Upload / Handmatig / Later)
    let rawRxSource = state.rxSource || (Q('input[name="rxSource"]:checked') ? Q('input[name="rxSource"]:checked').value : '-');

    // Bij "Zonder sterkte" is er geen recept nodig — voorkom dat een stale DOM-waarde
    // (bijv. "Upload" van een eerder gekozen flow) opgepikt wordt
    if (chosenMode === 'Zonder sterkte') {
      rawRxSource = '-';
    }

    // Leesbril: eigen rx-bron en SPH-waarden
    if (chosenMode === 'Leesbril') {
      rawRxSource = '-';
    }

    // ✅ Alleen als het recept echt bevestigd is (via "Verder" op het handmatig scherm)
    // behandelen we het als handmatig. Anders mag "Later" ook echt "Later" blijven.
    if (state.manualConfirmed) {
      rawRxSource = 'Handmatig';
    }

    // Wat je in de order wilt zien
    const rxSourceLabel = (rawRxSource === 'Later') ? 'Achteraf invullen' : rawRxSource;

    const rxProps = { 'Voorschrift bron': rxSourceLabel };

    // Leesbril: sla SPH-waarden op
    if (chosenMode === 'Leesbril') {
      const odSph = state.readingSame ? state.readingSph : state.readingSphOd;
      const osSph = state.readingSame ? state.readingSph : state.readingSphOs;
      rxProps['Glastype'] = 'Leesbril';
      rxProps['OD SPH'] = odSph;
      rxProps['OS SPH'] = osSph;
      rxProps['Voorschrift bron'] = 'Leesbril';
    }

    // ✅ Alleen RX-waarden meesturen als het handmatig recept bevestigd is
    if (state.manualConfirmed && chosenMode !== 'Leesbril') {
      // OD = Rechteroog, OS = Linkeroog — rechttoe rechtaan mapping
      rxProps['OD SPH'] = state.od.sph;
      rxProps['OD CYL'] = state.od.cyl;
      rxProps['OD AX']  = state.od.ax;
      rxProps['OS SPH'] = state.os.sph;
      rxProps['OS CYL'] = state.os.cyl;
      rxProps['OS AX']  = state.os.ax;

      if (state.mode === 'Multifocaal') {
        rxProps['OD ADD'] = state.od.add || '-';
        rxProps['OS ADD'] = state.os.add || '-';
      }

      if (state.twoPds) {
        rxProps['PD (OD)'] = state.pd.od;
        rxProps['PD (OS)'] = state.pd.os;
      } else {
        rxProps['PD'] = state.pd.single;
      }

      // Prisma (horizontaal/verticaal) + basis per oog
      if (state.prismEnabled){
        rxProps['Prisma horizontaal (OD)'] = state.prismH.od || '-';
        rxProps['Prisma basis horizontaal (OD)'] = state.prismBaseH.od || '-';
        rxProps['Prisma verticaal (OD)'] = state.prismV.od || '-';
        rxProps['Prisma basis verticaal (OD)'] = state.prismBaseV.od || '-';

        rxProps['Prisma horizontaal (OS)'] = state.prismH.os || '-';
        rxProps['Prisma basis horizontaal (OS)'] = state.prismBaseH.os || '-';
        rxProps['Prisma verticaal (OS)'] = state.prismV.os || '-';
        rxProps['Prisma basis verticaal (OS)'] = state.prismBaseV.os || '-';
      }
}

    // Lensindex als property bewaren (alleen bij sterkte)
    if (state.mode && state.mode !== 'Zonder sterkte') {
      rxProps['Lensindex'] = state.indexChoice || 'Basis';
    }

    const parentProps = Object.assign(
      { Glastype: state.glasType || '-', Glazen: chosenMode, _jacq_bundle: bundleKey },
      rxProps
    );

    if (state.blauwlichtFilter) {
      parentProps['Blauwlichtfilter'] = 'Ja';
    }

    if ((state.glasType === 'Meekleurend' || state.glasType === 'Gepolariseerd') && state.meekleurendKleur) {
      parentProps['Kleur'] = state.meekleurendKleur;
    }

    if (IS_SUNGLASSES && state.tintColor) {
      parentProps['Tintkleur'] = state.tintColor;
    }

    // Items die als "child" in dezelfde bundel worden toegevoegd
    const items = [];

    const parentItem = { id: frameId, quantity: 1, properties: parentProps };

    // Extra child voor betaalde lensindex (Comfort/Premium/Luxe)
    if (state.mode && state.mode !== 'Zonder sterkte') {
      const indexVariantId = INDEX_VARIANTS[state.indexChoice] || 0;
      if (indexVariantId) {
        items.push({
          id: indexVariantId,
          quantity: 1,
          properties: {
            _jacq_child: '1',
            _jacq_bundle: bundleKey,
            _title: `Lensindex ${state.indexChoice}`
          }
        });
      }
    }

   
    // Extra child voor multifocale glazen
    if (state.mode === 'Multifocaal' && MULTI_VARIANT) {
      items.push({
        id: MULTI_VARIANT,
        quantity: 1,
        properties: {
          _jacq_child: '1',
          _jacq_bundle: bundleKey,
          _title: 'Multifocale glazen'
        }
      });
    }

    // Extra child voor Blauwlicht
    if (state.blauwlichtFilter && ADDON_VARIANT) {
      items.push({
        id: ADDON_VARIANT,
        quantity: 1,
        properties: {
          _jacq_child:'1',
          _jacq_bundle: bundleKey,
          _title:'Blauwlicht filter'
        }
      });
    }

    // Extra child voor Gepolariseerde glazen
    if (state.glasType === 'Gepolariseerd' && POLARISED_VARIANT) {
      items.push({
        id: POLARISED_VARIANT,
        quantity: 1,
        properties: {
          _jacq_child:'1',
          _jacq_bundle: bundleKey,
          _title:'Gepolariseerde glazen'
        }
      });
    }

    // Extra child voor Meekleurende glazen
    if (state.glasType === 'Meekleurend' && PHOTOCHROMIC_VARIANT) {
      items.push({
        id: PHOTOCHROMIC_VARIANT,
        quantity: 1,
        properties: {
          _jacq_child:'1',
          _jacq_bundle: bundleKey,
          _title:'Meekleurende glazen'
        }
      });
    }

    // Upload: parent via multipart (/cart/add) zodat Shopify het bestand als line item property opslaat
    if (rawRxSource === 'Upload') {
      const fileEl = Q('input[type="file"][name="properties[Voorschrift]"]');
      const f = state.file || (fileEl && fileEl.files && fileEl.files[0]) || null;

      if (f) {
        const fd = new FormData();
        fd.append('id', String(frameId));
        fd.append('quantity', '1');
        Object.entries(parentProps).forEach(([k,v]) => {
          if (v == null) return;
          fd.append(`properties[${k}]`, String(v));
        });
        // key "Voorschrift" is de file-property
        fd.append('properties[Voorschrift]', f, f.name);

        const res = await fetch('/cart/add', { method:'POST', body: fd, headers: { 'Accept':'application/json' } });
        if (!res.ok) {
          let msg = `${res.status} ${res.statusText}`;
          try { const j = await res.json(); msg = (j && (j.description || j.message)) || msg; } catch(_){}
          throw new Error(msg);
        }

        // Sla child-items op voor toevoeging op cart-pagina (voorkomt dubbele ATC events)
        if (items.length) {
          try {
            sessionStorage.setItem('jacq_pending_children', JSON.stringify(items));
          } catch(e) {
            // Fallback: voeg ze toch direct toe (liever dubbele ATC dan missende items)
            await shopifyRequest('/cart/add.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ items })
            });
          }
        }
        return {};
      }

      // Fail-safe: normaal al afgevangen in stap 1
      throw new Error('Geen bestand geüpload');
    }

    // Handmatig/Later → alleen parent via JSON (voorkomt dubbele ATC events)
    const childItems = items.slice(); // kopie van children

    const result = await shopifyRequest('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: [parentItem] })
    });

    // Sla child-items op voor toevoeging op cart-pagina
    if (childItems.length) {
      try {
        sessionStorage.setItem('jacq_pending_children', JSON.stringify(childItems));
      } catch(e) {
        // Fallback: voeg ze toch direct toe (liever dubbele ATC dan missende items)
        await shopifyRequest('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ items: childItems })
        });
      }
    }

    return result;
  }

  // ===== Update bestaande bundel bij bewerken =====
  async function saveEditCompound(){
    if (!editCtx || !editCtx.parentKey) throw new Error('Geen edit-context');

    // bron + RX-properties
    var rawRxSource = state.rxSource || (Q('input[name="rxSource"]:checked') ? Q('input[name="rxSource"]:checked').value : '-');

    // Als er handmatig sterkte is ingevuld, behandel het als "Handmatig"
    if (hasManualRxData() && rawRxSource === 'Later') {
      rawRxSource = 'Handmatig';
    }

    // Leesbril: eigen rx-bron
    if (state.mode === 'Leesbril') {
      rawRxSource = '-';
    }

    var rxSourceLabel = (rawRxSource === 'Later') ? 'Achteraf invullen' : rawRxSource;
    var rxProps       = { 'Voorschrift bron': rxSourceLabel };

    // Leesbril: sla SPH-waarden op
    if (state.mode === 'Leesbril') {
      const odSph = state.readingSame ? state.readingSph : state.readingSphOd;
      const osSph = state.readingSame ? state.readingSph : state.readingSphOs;
      rxProps['Glastype'] = 'Leesbril';
      rxProps['OD SPH'] = odSph;
      rxProps['OS SPH'] = osSph;
      rxProps['Voorschrift bron'] = 'Leesbril';
    }

    // Upload: bewaar bestaand geüpload bestand bij bewerken (change.js kan geen nieuwe file uploaden)
    if (rawRxSource === 'Upload' && editCtx && editCtx.parentProps && editCtx.parentProps['Voorschrift']){
      rxProps['Voorschrift'] = editCtx.parentProps['Voorschrift'];
    }

    if (rawRxSource === 'Handmatig' && state.mode !== 'Leesbril'){
      // OD = Rechteroog, OS = Linkeroog — rechttoe rechtaan mapping
      rxProps['OD SPH'] = state.od.sph;
      rxProps['OD CYL'] = state.od.cyl;
      rxProps['OD AX']  = state.od.ax;
      rxProps['OS SPH'] = state.os.sph;
      rxProps['OS CYL'] = state.os.cyl;
      rxProps['OS AX']  = state.os.ax;
      rxProps['OD ADD'] = state.od.add;
      rxProps['OS ADD'] = state.os.add;

      const _half = !!state.twoPds;
if (_half){
  rxProps['PD (OD)'] = state.pd.od;
  rxProps['PD (OS)'] = state.pd.os;
} else {
  rxProps['PD'] = state.pd.single;
}
      // Prisma (horizontaal/verticaal) + basis per oog
      if (state.prismEnabled){
        rxProps['Prisma horizontaal (OD)'] = state.prismH.od || '-';
        rxProps['Prisma basis horizontaal (OD)'] = state.prismBaseH.od || '-';
        rxProps['Prisma verticaal (OD)'] = state.prismV.od || '-';
        rxProps['Prisma basis verticaal (OD)'] = state.prismBaseV.od || '-';

        rxProps['Prisma horizontaal (OS)'] = state.prismH.os || '-';
        rxProps['Prisma basis horizontaal (OS)'] = state.prismBaseH.os || '-';
        rxProps['Prisma verticaal (OS)'] = state.prismV.os || '-';
        rxProps['Prisma basis verticaal (OS)'] = state.prismBaseV.os || '-';
      }
}

    // Parent bijwerken (incl. Glastype + Glazen)
    var parentProps = Object.assign(
      { Glastype: (state.glasType || 'Helder'), Glazen: (state.mode || '-'), _jacq_bundle: editCtx.bundle },
      rxProps
    );
    if (state.blauwlichtFilter) {
      parentProps['Blauwlichtfilter'] = 'Ja';
    }
    if ((state.glasType === 'Meekleurend' || state.glasType === 'Gepolariseerd') && state.meekleurendKleur) {
      parentProps['Kleur'] = state.meekleurendKleur;
    }
    if (state.mode && state.mode !== 'Zonder sterkte') {
      parentProps['Lensindex'] = state.indexChoice || 'Basis';
    }
    if (IS_SUNGLASSES && state.tintColor) {
      parentProps['Tintkleur'] = state.tintColor;
    }

    await shopifyRequest('/cart/change.js', {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify({ id: editCtx.parentKey, properties: parentProps })
    });

    // === Actuele children voor deze bundel ophalen ===
    let allKids = [];
    try {
      const res   = await fetch('/cart.js', { headers:{ 'Accept':'application/json' } });
      const cart  = await res.json();
      const items = cart.items || [];
      allKids = items.filter(it =>
        it.properties &&
        it.properties._jacq_child === '1' &&
        it.properties._jacq_bundle === editCtx.bundle
      );
    } catch(_) { /* laat allKids leeg */ }

    // Opsplitsen op type o.b.v. _title
    const blueKids   = allKids.filter(it => it.properties._title === 'Blauwlicht filter');
    const indexKids  = allKids.filter(it =>
      it.properties._title &&
      it.properties._title.indexOf('Lensindex') === 0
    );
    const multiKids  = allKids.filter(it => it.properties._title === 'Multifocale glazen');
    const singleKids = allKids.filter(it => it.properties._title === 'Glazen op sterkte');
    const polarKids  = allKids.filter(it => it.properties._title === 'Gepolariseerde glazen');
    const photoKids  = allKids.filter(it => it.properties._title === 'Meekleurende glazen');

    // Wat is er nodig?
    const needBlue   = state.blauwlichtFilter && ADDON_VARIANT;
    const indexVarId = INDEX_VARIANTS[state.indexChoice] || 0;
    const needIndex  = !!indexVarId;
    const needMulti  = (state.mode === 'Multifocaal') && MULTI_VARIANT;
    const needSingle  = false;
    const needPolar  = (state.glasType === 'Gepolariseerd') && POLARISED_VARIANT;
    const needPhoto  = (state.glasType === 'Meekleurend') && PHOTOCHROMIC_VARIANT;

    // --- Blauwlicht-child managen ---
    if (needBlue && blueKids.length === 0) {
      // toevoegen
      await shopifyRequest('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type':'application/json','Accept':'application/json' },
        body: JSON.stringify({
          items: [{
            id: ADDON_VARIANT,
            quantity: 1,
            properties: { _jacq_child:'1', _jacq_bundle: editCtx.bundle, _title:'Blauwlicht filter' }
          }]
        })
      });
    } else if (!needBlue && blueKids.length > 0) {
      // verwijderen
      for (const kid of blueKids) {
        await shopifyRequest('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type':'application/json','Accept':'application/json' },
          body: JSON.stringify({ id: kid.key, quantity: 0 })
        });
      }
    }

    // --- Multifocaal-child managen ---
    if (!needMulti && multiKids.length > 0) {
      // Niet meer multifocaal → alle multifocale children weg
      for (const kid of multiKids) {
        await shopifyRequest('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type':'application/json','Accept':'application/json' },
          body: JSON.stringify({ id: kid.key, quantity: 0 })
        });
      }
    }

    if (needMulti && multiKids.length === 0) {
      // Wel multifocaal, maar nog geen child → toevoegen
      await shopifyRequest('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type':'application/json','Accept':'application/json' },
        body: JSON.stringify({
          items: [{
            id: MULTI_VARIANT,
            quantity: 1,
            properties: {
              _jacq_child:'1',
              _jacq_bundle: editCtx.bundle,
              _title:'Multifocale glazen'
            }
          }]
        })
      });
    }

    // --- Glazen-op-sterkte-child managen ---
    if (!needSingle && singleKids.length > 0) {
      // Niet meer Glazen op sterkte → alle betreffende children weg
      for (const kid of singleKids) {
        await shopifyRequest('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type':'application/json','Accept':'application/json' },
          body: JSON.stringify({ id: kid.key, quantity: 0 })
        });
      }
    }

    // AIO: single kids mogen niet bestaan → altijd verwijderen als ze er zijn
if (singleKids.length > 0) {
  for (const kid of singleKids) {
    await shopifyRequest('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type':'application/json','Accept':'application/json' },
      body: JSON.stringify({ id: kid.key, quantity: 0 })
    });
  }
}

    // --- Lensindex-child managen ---
    if (!needIndex && indexKids.length > 0) {
      // Geen index meer nodig → alle index-children weg
      for (const kid of indexKids) {
        await shopifyRequest('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type':'application/json','Accept':'application/json' },
          body: JSON.stringify({ id: kid.key, quantity: 0 })
        });
      }
    }

    if (needIndex) {
      // check of er al een child met juiste variant is
      const correctKid = indexKids.find(kid => kid.id === indexVarId);

      // alle foute index-kids weg
      for (const kid of indexKids) {
        if (kid.id !== indexVarId) {
          await shopifyRequest('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type':'application/json','Accept':'application/json' },
            body: JSON.stringify({ id: kid.key, quantity: 0 })
          });
        }
      }

      if (!correctKid) {
        // nieuwe index-child toevoegen
        await shopifyRequest('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type':'application/json','Accept':'application/json' },
          body: JSON.stringify({
            items: [{
              id: indexVarId,
              quantity: 1,
              properties: {
                _jacq_child:'1',
                _jacq_bundle: editCtx.bundle,
                _title:`Lensindex ${state.indexChoice}`
              }
            }]
          })
        });
      }
    }

    // --- Gepolariseerd-child managen ---
    if (!needPolar && polarKids.length > 0) {
      for (const kid of polarKids) {
        await shopifyRequest('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type':'application/json','Accept':'application/json' },
          body: JSON.stringify({ id: kid.key, quantity: 0 })
        });
      }
    }
    if (needPolar && polarKids.length === 0) {
      await shopifyRequest('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type':'application/json','Accept':'application/json' },
        body: JSON.stringify({
          items: [{
            id: POLARISED_VARIANT,
            quantity: 1,
            properties: { _jacq_child:'1', _jacq_bundle: editCtx.bundle, _title:'Gepolariseerde glazen' }
          }]
        })
      });
    }

    // --- Meekleurend-child managen ---
    if (!needPhoto && photoKids.length > 0) {
      for (const kid of photoKids) {
        await shopifyRequest('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type':'application/json','Accept':'application/json' },
          body: JSON.stringify({ id: kid.key, quantity: 0 })
        });
      }
    }
    if (needPhoto && photoKids.length === 0) {
      await shopifyRequest('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type':'application/json','Accept':'application/json' },
        body: JSON.stringify({
          items: [{
            id: PHOTOCHROMIC_VARIANT,
            quantity: 1,
            properties: { _jacq_child:'1', _jacq_bundle: editCtx.bundle, _title:'Meekleurende glazen' }
          }]
        })
      });
    }
  }

  function hydrateStateFromProperties(p){
    if (!p) return;
    state.mode    = p['Glazen'] || state.mode;
    state.glasType = p['Glastype'] || state.glasType || null;
    state.blauwlichtFilter = (p['Blauwlichtfilter'] === 'Ja');
    state.meekleurendKleur = p['Kleur'] || p['Meekleurende kleur'] || null;
    // Backwards compat: old Coating property
    state.coating = p['Coating'] || state.coating;
    if (IS_SUNGLASSES && p['Tintkleur']) state.tintColor = p['Tintkleur'];

    // Leesbril hydrate
    if (state.mode === 'Leesbril') {
      const odSph = p['OD SPH'] || '+1.50';
      const osSph = p['OS SPH'] || '+1.50';
      if (odSph === osSph) {
        state.readingSame = true;
        state.readingSph = odSph;
      } else {
        state.readingSame = false;
        state.readingSphOd = odSph;
        state.readingSphOs = osSph;
      }
    }

    const sourceProp = p['Voorschrift bron'];

    if (sourceProp) {
      if (sourceProp === 'Later' || sourceProp === 'Achteraf invullen' || sourceProp === 'Achteraf sterkte doorgeven') {
        state.rxSource = 'Later';
      } else if (sourceProp === 'Handmatig' || sourceProp === 'Handmatig invullen') {
        state.rxSource = 'Handmatig';
      } else {
        state.rxSource = sourceProp;
      }
    }

    if (state.rxSource === 'Handmatig'){
  // Cart properties: OD=Rechteroog, OS=Linkeroog
  // UI: od_* = Rechteroog (links), os_* = Linkeroog (rechts) — rechttoe rechtaan
  state.od = {
    sph: p['OD SPH']  || '-',
    cyl: p['OD CYL']  || '-',
    ax:  p['OD AX']   || '-',
    add: p['OD ADD']  || '-'
  };

  state.os = {
    sph: p['OS SPH']  || '-',
    cyl: p['OS CYL']  || '-',
    ax:  p['OS AX']   || '-',
    add: p['OS ADD']  || '-'
  };

  // PD — rechttoe rechtaan
  const propPdOd = p['PD (OD)'] || '-';
  const propPdOs = p['PD (OS)'] || '-';
  const hasDual = (propPdOd !== '-') || (propPdOs !== '-');
  const single  = p['PD'] || '-';

  if (hasDual) {
    state.pd = { single:'-', od: propPdOd, os: propPdOs };
    state.twoPds = true;
  } else {
    state.pd = { single: single, od:'-', os:'-' };
    state.twoPds = false;
  }

  // Prisma — rechttoe rechtaan
  const hOd  = p['Prisma horizontaal (OD)'] || '-';
  const hOs  = p['Prisma horizontaal (OS)'] || '-';
  const hbOd = p['Prisma basis horizontaal (OD)'] || '-';
  const hbOs = p['Prisma basis horizontaal (OS)'] || '-';

  const vOd  = p['Prisma verticaal (OD)'] || '-';
  const vOs  = p['Prisma verticaal (OS)'] || '-';
  const vbOd = p['Prisma basis verticaal (OD)'] || '-';
  const vbOs = p['Prisma basis verticaal (OS)'] || '-';

  // Backwards compat (oude properties met graden)
  const oldPrismOd = p['Prisma (OD)'] || '-';
  const oldPrismOs = p['Prisma (OS)'] || '-';

  state.prismH = { od: (hOd !== '-' ? hOd : oldPrismOd), os: (hOs !== '-' ? hOs : oldPrismOs) };
  state.prismV = { od: vOd, os: vOs };
  state.prismBaseH = { od: hbOd, os: hbOs };
  state.prismBaseV = { od: vbOd, os: vbOs };

  state.prismEnabled = (
    state.prismH.od !== '-' || state.prismH.os !== '-' ||
    state.prismV.od !== '-' || state.prismV.os !== '-'
  );
}
  }

  async function startEdit(lineKey){
    try{
      const res=await fetch('/cart.js',{headers:{'Accept':'application/json'}});
      const cart=await res.json();
      const items=cart.items||[];
      const line=items.find(i=>i.key===lineKey);
      if(!line) return;
      const bundle=line.properties&&line.properties._jacq_bundle;
      const kids=items.filter(i=>i.properties&&i.properties._jacq_child=='1'&&i.properties._jacq_bundle===bundle).map(i=>i.key);
      editCtx={parentKey:line.key,bundle,childKeys:kids,parentUrl:line.url,parentProps:(line.properties||{})};
      hydrateStateFromProperties(line.properties);
      state.stage=1;
      state.view=1;
      refresh();
    } catch(e){ console.warn('[JACQ] startEdit failed',e);}
  }

  try{
    const qp=new URLSearchParams(location.search);
    const k=qp.get('jacq_edit');
    if(k){ startEdit(k); }
  } catch{}

  // === Auto-open wizard vanaf cart (Bewerken-knop) ===
  try{
    var _params = new URLSearchParams(window.location.search);
    if (OPEN_BTN && _params.get('jacq_wizard') === '1') {
      openDrawer();
      state.stage = 1;
      state.view  = 1;
      refresh();
    }
  }catch{}

  /* === Auto-open wizard vanaf cart (Bewerken) — robuust === */
  (function () {
    try {
      const qp = new URLSearchParams(location.search);
      const shouldOpen = qp.get('jacq_wizard') === '1' || location.hash.indexOf('jacq-open') !== -1;
      const editKey    = qp.get('jacq_edit');
      if (!shouldOpen) return;

      let tries = 0;
      const boot = () => {
        tries++;

        // Herpak referentie naar de drawer indien nodig
        if (!window.DRAWER || !document.body.contains(window.DRAWER)) {
          window.DRAWER = document.getElementById('jacq-lens-drawer') || document.querySelector('.jacq-drawer');
        }

        // Als de wizard klaar is: open en ga naar stap 1
        if (window.DRAWER && typeof openDrawer === 'function' && typeof refresh === 'function') {
          if (editKey && typeof startEdit === 'function') startEdit(editKey);
          openDrawer();
          if (window.state) { state.stage = 1; state.view = 1; } // forceer STAP 1
          refresh();
          return;
        }

        // Wacht nog even op DOM/JS (max ~1s)
        if (tries < 60) requestAnimationFrame(boot);
      };

      if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
      else window.addEventListener('DOMContentLoaded', boot, { once: true });

      // Fallback bij bfcache/instant navigatie
      window.addEventListener('pageshow', (ev) => { if (ev.persisted) boot(); }, { once: true });
    } catch (e) { /* noop */ }
  })

  // === Mobile fullscreen lock (alleen nog nodig buiten iOS) ===
  let __vvHandler = null, __winHandler = null;

  function lockDrawerHeightMobile() {
    // NIEUW: op iOS doen we geen JS-fullscreen-truc meer.
    // Daar zorgt de CSS + jacq-open al voor een nette fullscreen wizard
    // zonder dat Safari in een rare fixed/scroll state blijft hangen.
    const ua    = navigator.userAgent || '';
    const isIOS = /iP(hone|ad|od)/.test(ua);
    if (isIOS) return;

    // Alleen op small screens
    if (!window.matchMedia('(max-width:1024px)').matches) return;

    const doc = document.documentElement;
    const d   = window.DRAWER || document.querySelector('.jacq-drawer');

    // Lock alleen als de wizard echt open is
    if (!doc.classList.contains('jacq-open') || !d || !d.classList.contains('is-open')) {
      unlockDrawerHeightMobile();
      return;
    }

    const H  = (window.visualViewport ? window.visualViewport.height : window.innerHeight);
    const px = Math.round(H) + 'px';

    Object.assign(d.style, {
      position: 'fixed',
      top: '0', right: '0', bottom: '0', left: '0',
      inset: '0',
      height: px,
      maxHeight: px,
      margin: '0',
      transform: 'none',
      zIndex: '2147483647',
      background: 'transparent'
    });

    // Alleen het rechter paneel tonen + intern scrollvlak
    const panel = document.querySelector('.jacq-drawer__panel');
    if (panel){
      Object.assign(panel.style, {
        height: '100%',
        minHeight: '0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#fff'
      });
    }
    const steps = document.querySelector('.jacq-steps');
    if (steps){
      Object.assign(steps.style, {
        flex: '1 1 auto',
        minHeight: '0',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      });
    }

    // live bij hoogte-verandering (adresbalk, keyboard, rotate)
    if (!__vvHandler) {
      __vvHandler = () => lockDrawerHeightMobile();
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', __vvHandler);
      }
    }
    if (!__winHandler) {
      __winHandler = () => lockDrawerHeightMobile();
      window.addEventListener('resize', __winHandler);
      window.addEventListener('orientationchange', __winHandler);
    }
  }

  function unlockDrawerHeightMobile() {
    if (window.visualViewport && __vvHandler) {
      window.visualViewport.removeEventListener('resize', __vvHandler);
    }
    if (__winHandler) {
      window.removeEventListener('resize', __winHandler);
      window.removeEventListener('orientationchange', __winHandler);
    }
    __vvHandler = __winHandler = null;

    const d = window.DRAWER || document.querySelector('.jacq-drawer');
    if (d){
      ['position','top','right','bottom','left','inset','height','maxHeight','margin','transform','zIndex','background']
        .forEach(p => d.style.removeProperty(p));
    }

    // *** NIEUW: panel + steps ook resetten ***
    const panel = document.querySelector('.jacq-drawer__panel');
    if (panel){
      ['height','minHeight','display','flexDirection','overflow','background']
        .forEach(p => panel.style.removeProperty(p));
    }

    const steps = document.querySelector('.jacq-steps');
    if (steps){
      ['flex','minHeight','overflowY','WebkitOverflowScrolling']
        .forEach(p => steps.style.removeProperty(p));
    }
  }
  

})();
document.addEventListener("DOMContentLoaded", () => {
  const roots = document.querySelectorAll("#jacq-lens-wizard-section, #jacq-lens-drawer");

  roots.forEach((root) => {
    const header = root.querySelector(".jacq-drawer__header");
    if (!header) return;

    const center = header.querySelector(".jacq-header-center") || header;

    // 1) verwijder titel node(s) (scheelt witruimte)
    root.querySelectorAll(".jacq-title").forEach((n) => n.remove());

    // 2) verplaats progress/tabs naar header-center (plek van titel)
    const progress = root.querySelector(".jacq-progress");
    if (progress && !center.contains(progress)) {
      center.appendChild(progress);
    }

    // 3) kill dubbele iconen (zeker weten)
    const backs = header.querySelectorAll(".jacq-back");
    backs.forEach((el, i) => { if (i > 0) el.remove(); });

    const closes = header.querySelectorAll(".jacq-close");
    closes.forEach((el, i) => { if (i > 0) el.remove(); });

    // 4) als er per ongeluk back/close in progress zitten: weghalen
    if (progress) {
      progress.querySelectorAll(".jacq-back, .jacq-close").forEach((el) => el.remove());
    }
  });
});
(() => {
  if (window.__jacqStepAnimInit) return;
  window.__jacqStepAnimInit = true;

  function init() {
    const root =
      document.querySelector("#jacq-lens-drawer") ||
      document.querySelector("#jacq-lens-wizard-section");
    if (!root) return;

    const steps = root.querySelector(".jacq-steps");
    const views = Array.from(root.querySelectorAll(".jacq-view"));
    if (!steps || !views.length) return;

    const getVisibleIndex = () => views.findIndex(v => !v.hasAttribute("hidden"));
    let currentIndex = Math.max(0, getVisibleIndex());

    const runEnter = (view, direction) => {
      // reset
      view.classList.remove("jacq-view-enter", "is-back");
      // force reflow
      void view.offsetWidth;

      if (direction === "back") view.classList.add("is-back");
      view.classList.add("jacq-view-enter");

      steps.classList.add("is-transitioning");
      window.setTimeout(() => {
        view.classList.remove("jacq-view-enter", "is-back");
        steps.classList.remove("is-transitioning");
      }, 260);
    };

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type !== "attributes" || m.attributeName !== "hidden") continue;
        const v = m.target;

        // Alleen wanneer view zichtbaar wordt
        if (!v.hasAttribute("hidden")) {
          const newIndex = views.indexOf(v);
          const direction = newIndex < currentIndex ? "back" : "forward";
          currentIndex = newIndex;
          runEnter(v, direction);
        }
      }
    });

    views.forEach(v => obs.observe(v, { attributes: true, attributeFilter: ["hidden"] }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
(() => {
  // voorkom dubbele init
  if (window.__jacqStepAnimInitV3) return;
  window.__jacqStepAnimInitV3 = true;

  function init() {
    const root =
      document.querySelector("#jacq-lens-drawer") ||
      document.querySelector("#jacq-lens-wizard-section");
    if (!root) return;

    const views = Array.from(root.querySelectorAll(".jacq-view"));
    if (!views.length) return;

    // als er nog een oude observer hangt: weg ermee
    if (window.__jacqStepAnimObserver) {
      try { window.__jacqStepAnimObserver.disconnect(); } catch(e) {}
      window.__jacqStepAnimObserver = null;
    }

    const isVisible = (el) =>
      el &&
      !el.hasAttribute("hidden") &&
      el.getAttribute("aria-hidden") !== "true";

    // onthoud huidige visible state per view (zodat we alleen op “hidden -> visible” reageren)
    const visState = new WeakMap();
    views.forEach(v => visState.set(v, isVisible(v)));

    // laatste zichtbare index om forward/back te bepalen
    let lastIndex = Math.max(0, views.findIndex(isVisible));
    if (lastIndex < 0) lastIndex = 0;

    function animateEnter(view, dir) {
      if (!view) return;

      // classes resetten (maar niet op class-mutations luisteren)
      view.classList.remove("jacq-view-enter", "is-back");
      // force reflow (1x)
      void view.offsetWidth;

      if (dir === "back") view.classList.add("is-back");
      view.classList.add("jacq-view-enter");

      // cleanup precies op animationend (geen timeouts = geen “stutter”)
      const onEnd = () => {
        view.classList.remove("jacq-view-enter", "is-back");
        view.removeEventListener("animationend", onEnd);
      };
      view.addEventListener("animationend", onEnd);
    }

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type !== "attributes") continue;

        const el = m.target;
        if (!el.classList || !el.classList.contains("jacq-view")) continue;

        const was = visState.get(el);
        const now = isVisible(el);
        if (was === now) continue;

        visState.set(el, now);

        // Alleen animeren als iets NET zichtbaar wordt
        if (now) {
          const newIndex = views.indexOf(el);
          const dir = newIndex < lastIndex ? "back" : "forward";
          lastIndex = newIndex >= 0 ? newIndex : lastIndex;
          animateEnter(el, dir);
        }
      }
    });

    // luister ALLEEN naar hidden/aria-hidden (niet naar class), anders trigger je jezelf
    views.forEach((v) => {
      obs.observe(v, {
        attributes: true,
        attributeFilter: ["hidden", "aria-hidden"]
      });
    });

    window.__jacqStepAnimObserver = obs;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

/* === iOS scroll lock fix (voorkomt scrollen van de site achter de wizard) === */
(() => {
  const drawer = document.getElementById("jacq-lens-drawer");
  if (!drawer) return;

  const root = document.documentElement;

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  let locked = false;
  let scrollY = 0;

  function isOpen() {
    // Wizard open via jouw JS = html class jacq-open
    if (root.classList.contains("jacq-open")) return true;

    // Fallback: drawer zichtbaar
    const hidden = drawer.hasAttribute("hidden");
    const displayNone = (drawer.style && drawer.style.display === "none");
    return !hidden && !displayNone;
  }

  function lockScrollIOS() {
    if (locked) return;
    scrollY = window.scrollY || window.pageYOffset || 0;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    locked = true;
  }

  function unlockScrollIOS() {
    if (!locked) return;

    const top = document.body.style.top;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    const y = top ? Math.abs(parseInt(top, 10)) : scrollY;
    window.scrollTo(0, y);

    locked = false;
  }

  function sync() {
    if (!isIOS) return;

    if (isOpen()) lockScrollIOS();
    else unlockScrollIOS();
  }

  // Voorkom “rubber band” scroll via overlay/achtergrond, maar laat panel wél scrollen
  function preventBackgroundScroll(e) {
    if (!locked) return;
    const panel = drawer.querySelector(".jacq-drawer__panel");
    if (panel && (panel === e.target || panel.contains(e.target))) return; // panel mag scrollen
    e.preventDefault();
  }

  drawer.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

  // Reageer op open/close (class changes + hidden/style changes)
  const mo = new MutationObserver(() => sync());
  mo.observe(root, { attributes: true, attributeFilter: ["class"] });
  mo.observe(drawer, { attributes: true, attributeFilter: ["hidden", "style"] });

  // Ook na clicks meteen syncen (zekerheid)
  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("#jacq-lens-open,[data-close]")) {
        setTimeout(sync, 0);
      }
    },
    true
  );

  window.addEventListener("resize", sync);
  sync();
})();
(function () {
  const mapEl = document.getElementById('jacq-variant-image-map');
  let imgMap = {};
  try { imgMap = mapEl ? JSON.parse(mapEl.textContent) : {}; } catch (e) {}

  const reviewImg = document.getElementById('jacq-review-variant-image');
  if (!reviewImg) return;

  function getCurrentVariantId() {
    // 1) Shopify add-to-cart variant input (meest betrouwbaar)
    const idInput = document.querySelector('form[action^="/cart/add"] [name="id"]');
    if (idInput && idInput.value) return idInput.value;

    // 2) fallback: opener button dataset
    const openBtn = document.getElementById('jacq-lens-open');
    if (openBtn && openBtn.dataset.frameVariantId) return openBtn.dataset.frameVariantId;

    return null;
  }

  function setReviewImageByVariantId(variantId) {
    if (!variantId) return;
    const url = imgMap[String(variantId)];
    if (!url) return;

    // voorkom “flash” als dezelfde url
    if (reviewImg.getAttribute('src') !== url) {
      reviewImg.setAttribute('src', url);
    }
  }

  // 1) set bij openen wizard (als jouw code html.jacq-open zet)
  const obs = new MutationObserver(() => {
    if (document.documentElement.classList.contains('jacq-open')) {
      setReviewImageByVariantId(getCurrentVariantId());
    }
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // 2) set bij variant change (Dawn/veel themes dispatchen variant:change)
  document.addEventListener('variant:change', (e) => {
    const id = e?.detail?.variant?.id;
    if (id) setReviewImageByVariantId(id);
  });

  // 3) extra fallback: als input[name="id"] verandert
  document.addEventListener('change', (e) => {
    if (e.target && e.target.name === 'id') {
      setReviewImageByVariantId(e.target.value);
    }
  });

  // eerste init
  setReviewImageByVariantId(getCurrentVariantId());
})();
// ===== JACQ: keep review image in sync with selected FRAME variant (product page) =====
(() => {
  const cache = { product: null, inflight: null };

  function getHandleFromPath() {
    const m = String(window.location.pathname).match(/\/products\/([^\/\?#]+)/);
    return m ? m[1] : null;
  }

  function withWidth(src, w) {
    if (!src) return src;
    // Shopify CDN supports ?width=
    const hasQ = src.includes("?");
    return src + (hasQ ? "&" : "?") + "width=" + encodeURIComponent(String(w || 600));
  }

  async function fetchProduct() {
    if (cache.product) return cache.product;
    if (cache.inflight) return cache.inflight;

    const handle = getHandleFromPath();
    if (!handle) return null;

    cache.inflight = fetch(`/products/${handle}.js`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((p) => {
        cache.product = p;
        cache.inflight = null;
        return p;
      });

    return cache.inflight;
  }

  function getSelectedVariantId() {
    // 1) hidden input name="id" (meest betrouwbaar)
    const idInput =
      document.querySelector('form[action*="/cart/add"] input[name="id"]') ||
      document.querySelector('input[name="id"]');
    const v1 = idInput?.value;
    if (v1 && /^\d+$/.test(v1)) return String(v1);

    // 2) URL ?variant=
    try {
      const u = new URL(window.location.href);
      const v2 = u.searchParams.get("variant");
      if (v2 && /^\d+$/.test(v2)) return String(v2);
    } catch (_) {}

    // 3) fallback: opener button dataset
    const openBtn = document.getElementById("jacq-lens-open");
    const v3 = openBtn?.dataset?.frameVariantId;
    if (v3 && /^\d+$/.test(v3)) return String(v3);

    return null;
  }

  function setImg(el, src) {
    if (!el || !src) return;
    el.setAttribute("src", src);
    if (el.hasAttribute("srcset")) el.setAttribute("srcset", src);
    if (el.dataset) {
      if ("src" in el.dataset) el.dataset.src = src;
      if ("srcset" in el.dataset) el.dataset.srcset = src;
    }
  }

  async function updateWizardImages() {
    const drawer = document.getElementById("jacq-lens-drawer");
    if (!drawer) return;

    // only run when drawer is open/visible (prevents useless work)
    const isOpen =
      !drawer.hasAttribute("hidden") &&
      drawer.getAttribute("aria-hidden") !== "true" &&
      drawer.style.display !== "none";
    if (!isOpen) return;

    const product = await fetchProduct();
    if (!product?.variants?.length) return;

    const variantId = getSelectedVariantId();
    const variant = variantId
      ? product.variants.find((v) => String(v.id) === String(variantId))
      : null;

    const raw =
      variant?.featured_image?.src ||
      product.featured_image ||
      product.images?.[0] ||
      null;

    if (!raw) return;

    const src600 = withWidth(raw, 600);

    // Review image (step 3)
    const reviewImg = drawer.querySelector("#jacq-review-frame-img");
    setImg(reviewImg, src600);

    // Left panel image (optioneel maar nice: consistent)
    const leftImg = drawer.querySelector(".jacq-drawer__left img");
    if (leftImg) setImg(leftImg, src600);
  }

  function observeStep3() {
    const drawer = document.getElementById("jacq-lens-drawer");
    if (!drawer) return;

    const step3 = drawer.querySelector('.jacq-steps[data-stage="3"]');
    if (!step3) return;

    const mo = new MutationObserver(() => {
      // Als stap 3 zichtbaar wordt -> update image
      const visible = !step3.hasAttribute("hidden");
      if (visible) updateWizardImages();
    });

    mo.observe(step3, { attributes: true, attributeFilter: ["hidden"] });
  }

  function bindVariantListeners() {
    // Shopify themes dispatchen vaak een custom event bij variant change
    document.addEventListener("variant:change", () => {
      updateWizardImages();
    });

    // Fallback: luister naar changes in variant picker (select/radio)
    document.addEventListener(
      "change",
      (e) => {
        const t = e.target;
        if (!t) return;

        const isVariantIdInput = t.matches?.('input[name="id"], select[name="id"]');
        const isOptions = t.matches?.('select[name^="options["], input[type="radio"][name^="options["], input[type="radio"][name^="option"]');

        if (isVariantIdInput || isOptions) {
          // kleine delay zodat theme eerst hidden input name="id" update
          setTimeout(updateWizardImages, 50);
        }
      },
      true
    );
  }

  function bindOpen() {
    // Als drawer open gaat: meteen syncen
    const btn = document.getElementById("jacq-lens-open");
    if (!btn) return;
    btn.addEventListener("click", () => {
      // wacht 1 frame zodat drawer zichtbaar is
      requestAnimationFrame(() => {
        updateWizardImages();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindOpen();
    observeStep3();
    bindVariantListeners();

    // Safety: als iemand de drawer op een andere manier opent
    setTimeout(updateWizardImages, 400);
  });
})();
/* =========================================================
   JACQ – Smooth page transitions + back button behavior
   ========================================================= */
(function(){
  const drawer = document.getElementById('jacq-lens-drawer');
  if (!drawer) return;

  const panel   = drawer.querySelector('.jacq-drawer__panel');
  const backBtn = drawer.querySelector('.jacq-back');
  const closeBtn = drawer.querySelector('.jacq-close');

  const DURATION_IN  = 420; // iets langer, “Apple” feeling
  const DURATION_OUT = 280;
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  function prefersReducedMotion(){
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function getActiveStage(){
    return drawer.querySelector('.jacq-steps:not([hidden])');
  }

  function getActiveView(){
    const stage = getActiveStage();
    if (!stage) return null;
    return stage.querySelector('.jacq-view:not([hidden])');
  }

  function isFirstPage(){
    const stage = getActiveStage();
    const view  = getActiveView();
    return !!(stage && stage.dataset.stage === '1' && view && view.dataset.viewId === '1');
  }

  function closeDrawer(){
    // gebruik je bestaande close gedrag
    if (closeBtn) closeBtn.click();
    else {
      drawer.setAttribute('hidden','');
      document.documentElement.classList.remove('jacq-open','jacq-no-scroll');
    }
  }

  function updateBackButton(){
    if (!backBtn) return;
    // altijd zichtbaar, maar op eerste pagina fungeert hij als “sluiten”
    backBtn.hidden = false;
    backBtn.setAttribute('aria-label', isFirstPage() ? 'Sluiten' : 'Terug');
  }

  // ✅ Deze functie gebruik je i.p.v. direct hidden=true/false
  window.jacqSwapViews = function(fromEl, toEl){
    if (!fromEl || !toEl || fromEl === toEl) return;

    // Reduced motion: direct switch
    if (prefersReducedMotion()){
      fromEl.hidden = true;
      toEl.hidden = false;
      updateBackButton();
      return;
    }

    // Zorg dat target zichtbaar is voordat we animeren
    toEl.hidden = false;

    // Begin states
    toEl.style.opacity = '0';
    toEl.style.transform = 'translateY(10px)';
    toEl.style.transition = `opacity ${DURATION_IN}ms ${EASE}, transform ${DURATION_IN}ms ${EASE}`;

    fromEl.style.opacity = '1';
    fromEl.style.transform = 'translateY(0)';
    fromEl.style.transition = `opacity ${DURATION_OUT}ms ${EASE}, transform ${DURATION_OUT}ms ${EASE}`;

    // Force reflow zodat transitions altijd pakken (geen “haper/refresh”)
    void toEl.offsetWidth;

    requestAnimationFrame(() => {
      // in
      toEl.style.opacity = '1';
      toEl.style.transform = 'translateY(0)';

      // out
      fromEl.style.opacity = '0';
      fromEl.style.transform = 'translateY(-6px)';
    });

    // Cleanup na animatie
    window.setTimeout(() => {
      fromEl.hidden = true;

      [fromEl, toEl].forEach(el => {
        el.style.opacity = '';
        el.style.transform = '';
        el.style.transition = '';
      });

      updateBackButton();
    }, Math.max(DURATION_IN, DURATION_OUT) + 30);
  };

  // ✅ Back button: eerste page = sluiten, anders “normaal terug”
  if (backBtn){
    backBtn.addEventListener('click', function(e){
      if (isFirstPage()){
        e.preventDefault();
        e.stopPropagation();
        closeDrawer();
        return;
      }
      // anders: laat je bestaande wizard “terug” logica werken
      // (als jij daar een handler voor hebt, blijft die gewoon werken)
    }, true);
  }

  // Houd label/zichtbaarheid goed bij als je navigeert
  // (als views hidden togglen via je wizard code)
  const obs = new MutationObserver(() => updateBackButton());
  obs.observe(drawer, { attributes:true, subtree:true, attributeFilter:['hidden'] });

  updateBackButton();
})();
;(() => {
  const scopeOk = (el) => el && el.closest && el.closest('#jacq-lens-drawer, #jacq-lens-wizard-section');
  const isTouch = () =>
    (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches) ||
    window.matchMedia('(max-width: 767px)').matches;

  let pop, card, titleEl, bodyEl, closeBtn, overlayEl;
  let openBtn = null;
  let hideTimer = null;
let closeAnimTimer = null;


  function ensurePop() {
    if (pop) return pop;

    pop = document.createElement('div');
    pop.id = 'jacq-info-pop';
    pop.hidden = true;
    pop.innerHTML = `
      <div class="jacq-info-pop__overlay" data-info-close></div>
      <div class="jacq-info-pop__card" role="dialog" aria-modal="false" aria-hidden="true">
        <div class="jacq-info-pop__head">
          <div class="jacq-info-pop__title"></div>
          <button type="button" class="jacq-info-pop__close" aria-label="Sluit">×</button>
        </div>
        <div class="jacq-info-pop__body"></div>
      </div>
    `;
    document.body.appendChild(pop);

    card = pop.querySelector('.jacq-info-pop__card');
    titleEl = pop.querySelector('.jacq-info-pop__title');
    bodyEl = pop.querySelector('.jacq-info-pop__body');
    closeBtn = pop.querySelector('.jacq-info-pop__close');
    overlayEl = pop.querySelector('.jacq-info-pop__overlay');

    overlayEl.addEventListener('click', close);
    closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // click-outside close (voor desktop)
    document.addEventListener(
      'click',
      (e) => {
        if (!pop || pop.hidden) return;
        if (!openBtn) return;
        if (pop.contains(e.target) || openBtn.contains(e.target)) return;
        close();
      },
      true
    );

    // Als drawer dichtgaat: popover ook dicht
    const drawer = document.getElementById('jacq-lens-drawer');
    if (drawer) {
      const mo = new MutationObserver(() => {
        const closed =
          drawer.hidden ||
          drawer.hasAttribute('hidden') ||
          drawer.getAttribute('aria-hidden') === 'true' ||
          !drawer.classList.contains('is-open');
        if (closed) close();
      });
      mo.observe(drawer, { attributes: true, attributeFilter: ['class', 'hidden', 'aria-hidden'] });
    }

    return pop;
  }

  function getContent(btn) {
    const label = btn.closest('label.jacq-card');
    let src = label ? label.querySelector('.jacq-info-src') : null;
    // Fallback: search in parent element (for rx-labels that aren't .jacq-card)
    if (!src && btn.parentElement) {
      src = btn.parentElement.querySelector('.jacq-info-src');
    }
    return {
      title: (src && src.dataset && src.dataset.title) ? src.dataset.title : 'Meer info',
      html: src ? src.innerHTML : ''
    };
  }

  function positionNear(btn) {
    const pad = 12;
    const r = btn.getBoundingClientRect();

    // eerst even "onzichtbaar" renderen zodat we kunnen meten
    card.style.left = '0px';
    card.style.top = '0px';
    card.style.visibility = 'hidden';

    requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      let left = r.left + r.width / 2 - rect.width / 2;
      left = Math.max(pad, Math.min(left, window.innerWidth - rect.width - pad));

      let top = r.bottom + 10;
      if (top + rect.height > window.innerHeight - pad) {
        top = r.top - rect.height - 10;
      }
      top = Math.max(pad, Math.min(top, window.innerHeight - rect.height - pad));

      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      card.style.visibility = 'visible';
    });
  }

  function open(btn, reason) {
  ensurePop();
  clearTimeout(hideTimer);
  clearTimeout(closeAnimTimer);

  openBtn = btn;

  const c = getContent(btn);
  titleEl.textContent = c.title;
  bodyEl.innerHTML = c.html;

  const sheet = isTouch();
  pop.classList.toggle('is-sheet', sheet);

  // reset state zodat CSS transition altijd afgaat
  pop.hidden = false;
  pop.classList.remove('is-open');

  card.setAttribute('aria-hidden', 'false');
  btn.setAttribute('aria-expanded', 'true');

  if (!sheet) positionNear(btn);

  // next frame -> animate in
  requestAnimationFrame(() => {
    if (!pop || pop.hidden) return;
    pop.classList.add('is-open');
  });
}

function close() {
  if (!pop || pop.hidden) return;

  clearTimeout(hideTimer);
  clearTimeout(closeAnimTimer);

  // start closing animatie
  pop.classList.remove('is-open');
  card.setAttribute('aria-hidden', 'true');
  if (openBtn) openBtn.setAttribute('aria-expanded', 'false');

  const finish = () => {
    if (!pop) return;
    pop.hidden = true;
    pop.classList.remove('is-sheet');
    openBtn = null;
  };

  const reduce =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) {
    finish();
    return;
  }

  // match CSS duration + kleine buffer
  const dur = pop.classList.contains('is-sheet') ? 320 : 220;
  closeAnimTimer = setTimeout(finish, dur + 40);
}

  function scheduleClose(delay = 140) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(close, delay);
  }

  // Click (mobile/touch + ook handig desktop)
  document.addEventListener(
    'click',
    (e) => {
      const btn = e.target.closest('.jacq-info-btn');
      if (!btn || !scopeOk(btn)) return;

      // voorkom dat de card geselecteerd wordt (label click)
      e.preventDefault();
      e.stopPropagation();

      if (pop && !pop.hidden && openBtn === btn) {
        close();
      } else {
        open(btn, 'click');
      }
    },
    true
  );

  // Hover/focus (alleen desktop)
  document.addEventListener(
    'pointerover',
    (e) => {
      if (isTouch()) return;
      const btn = e.target.closest('.jacq-info-btn');
      if (!btn || !scopeOk(btn)) return;
      clearTimeout(hideTimer);
      open(btn, 'hover');
    },
    true
  );

  document.addEventListener(
    'pointerout',
    (e) => {
      if (isTouch()) return;

      const btn = e.target.closest('.jacq-info-btn');
      if (!btn || !scopeOk(btn)) return;

      const rel = e.relatedTarget;
      if (rel && (btn.contains(rel) || (pop && pop.contains(rel)))) return;
      scheduleClose(140);
    },
    true
  );

  // Als je van knop naar popover gaat, niet sluiten
  document.addEventListener(
    'pointerover',
    (e) => {
      if (isTouch()) return;
      if (!pop || pop.hidden) return;
      if (e.target.closest('#jacq-info-pop')) clearTimeout(hideTimer);
    },
    true
  );
  document.addEventListener(
    'pointerout',
    (e) => {
      if (isTouch()) return;
      if (!pop || pop.hidden) return;
      if (e.target.closest('#jacq-info-pop')) scheduleClose(140);
    },
    true
  );

  // Reposition bij resize/scroll (desktop)
  window.addEventListener('resize', () => {
    if (openBtn && pop && !pop.hidden && !pop.classList.contains('is-sheet')) positionNear(openBtn);
  });
  window.addEventListener(
    'scroll',
    () => {
      if (openBtn && pop && !pop.hidden && !pop.classList.contains('is-sheet')) positionNear(openBtn);
    },
    true
  );
})();

/* =========================================================
   JACQ – Liquid gradient wave in "Selecteer glazen" knop
   Zachte blobs die vloeien + muis-reactief via CSS vars
   ========================================================= */
(function(){
  var btn = document.getElementById('jacq-lens-open');
  if (!btn) return;
  var wave = btn.querySelector('.jacq-btn__wave');
  if (!wave) return;

  var mouse = {x:0.5, y:0.5};
  var cur   = {x:0.5, y:0.5};
  var active = false;
  var t0 = Date.now();

  function tick(){
    cur.x += (mouse.x - cur.x) * 0.07;
    cur.y += (mouse.y - cur.y) * 0.07;
    var t = (Date.now() - t0) / 1000;

    wave.style.setProperty('--mx',  (cur.x * 100) + '%');
    wave.style.setProperty('--my',  (cur.y * 100) + '%');
    wave.style.setProperty('--bx1', (50 + 35 * Math.sin(t * 0.6)) + '%');
    wave.style.setProperty('--by1', (50 + 40 * Math.cos(t * 0.4)) + '%');
    wave.style.setProperty('--bx2', (50 + 30 * Math.cos(t * 0.5)) + '%');
    wave.style.setProperty('--by2', (50 + 35 * Math.sin(t * 0.7)) + '%');

    if (active) requestAnimationFrame(tick);
  }

  btn.addEventListener('mouseenter', function(e){
    var rect = btn.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / rect.width;
    mouse.y = (e.clientY - rect.top) / rect.height;
    cur.x = mouse.x; cur.y = mouse.y;
    active = true;
    tick();
  });

  btn.addEventListener('mousemove', function(e){
    var rect = btn.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / rect.width;
    mouse.y = (e.clientY - rect.top) / rect.height;
  });

  btn.addEventListener('mouseleave', function(){
    active = false;
  });
})();

/* =========================================================
   JACQ – Spotlight glow op kaarten
   Volgt de cursor met een blauwe gloed op ::before / ::after
   ========================================================= */
(function(){
  document.addEventListener('pointermove', function(e){
    var cards = document.querySelectorAll('.jacq-card');
    for (var i = 0; i < cards.length; i++) {
      var rect = cards[i].getBoundingClientRect();
      cards[i].style.setProperty('--spot-x', (e.clientX - rect.left).toFixed(1));
      cards[i].style.setProperty('--spot-y', (e.clientY - rect.top).toFixed(1));
    }
  });
})();