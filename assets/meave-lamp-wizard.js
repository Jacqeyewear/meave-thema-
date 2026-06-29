/* ============================================================
   Meave Lamp Wizard (3 steps)
   1 Kleur  : choose the staaf colour (a COLOR variant of THIS product)
   2 Kap    : choose the kap (a product in the chosen colour) + live preview
   3 Overzicht: summary + upsells, then checkout
   One configured lamp variant (+ any chosen upsells) is added to the cart.
   ============================================================ */
(function () {
  'use strict';

  if (window.customElements && customElements.get('meave-lamp-wizard')) return;

  var TOTAL_STEPS = 3;

  function cleanColor(title) {
    if (!title) return '';
    var t = String(title).split('/')[0];
    t = t.replace(/\(.*?\)/g, '');
    t = t.trim().toLowerCase();
    return t.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  function isDefaultTitle(t) { return !t || /default\s*title/i.test(t); }
  function hasRealColorOption(p) {
    var name = (p.options && p.options[0]) ? String(p.options[0]).toLowerCase() : '';
    if (name === 'title' || name === '') return false;
    var vs = p.variants || [];
    if (vs.length === 1 && isDefaultTitle(vs[0].title)) return false;
    return true;
  }
  function moneyFmt(cents, sample) {
    var sym = ''; var m = String(sample || '').match(/^[^\d]+/); if (m) sym = m[0];
    var useComma = String(sample).lastIndexOf(',') > String(sample).lastIndexOf('.');
    var val = (cents / 100).toFixed(2);
    if (useComma) val = val.replace('.', ',');
    return sym + val;
  }

  class MeaveLampWizard extends HTMLElement {
    connectedCallback() {
      if (this.dataset.mlwInit === '1') return;
      this.dataset.mlwInit = '1';

      this.root      = this.querySelector('[data-mlw-root]');
      this.panel     = this.querySelector('.mlw-panel');
      this.trigger   = this.querySelector('[data-mlw-open]');
      this.body      = this.querySelector('.mlw-body');
      this.backBtn   = this.querySelector('[data-mlw-back]');
      this.nextBtn   = this.querySelector('[data-mlw-next]');
      this.addBtn    = this.querySelector('[data-mlw-add]');
      this.paypalEl  = this.querySelector('[data-mlw-paypal]');
      this.errorEl   = this.querySelector('[data-mlw-error]');
      this.colorsEl  = this.querySelector('[data-mlw-colors]');
      this.kapsEl    = this.querySelector('[data-mlw-kaps]');
      this.previewImg = this.querySelector('[data-mlw-preview]');
      this.previewKap = this.querySelector('[data-mlw-preview-kap]');
      this.previewReview = this.querySelector('[data-mlw-preview-review]');
      this.rvColor   = this.querySelector('[data-mlw-rv-color]');
      this.rvKap     = this.querySelector('[data-mlw-rv-kap]');
      this.rvTotal   = this.querySelector('[data-mlw-rv-total]');
      this.upsellWrap = this.querySelector('[data-mlw-upsell-wrap]');
      this.upsellGrid = this.querySelector('[data-mlw-upsell]');
      this.linesEl   = this.querySelector('[data-mlw-lines]');
      this.bundleEl  = this.querySelector('[data-mlw-bundle]');
      this.bundleOpts = Array.prototype.slice.call(this.querySelectorAll('[data-mlw-qty]'));
      this.discountRow = this.querySelector('[data-mlw-discount-row]');
      this.discountEl = this.querySelector('[data-mlw-discount]');
      this.trustEl   = this.querySelector('[data-mlw-trust]');
      this.addLabelEl = this.querySelector('.mlw-add__label');
      this.lcEl = this.querySelector('[data-mlw-lc]');
      this.lcImg = this.querySelector('[data-mlw-lc-img]');
      this.lcName = this.querySelector('[data-mlw-lc-name]');
      this.lcWas = this.querySelector('[data-mlw-lc-was]');
      this.lcNow = this.querySelector('[data-mlw-lc-now]');
      this.lcAddBtn = this.querySelector('[data-mlw-lc-add]');
      this.lcSkipBtn = this.querySelector('[data-mlw-lc-skip]');
      this.sticky = this.querySelector('[data-mlw-sticky]');
      this.stickyBtn = this.querySelector('[data-mlw-sticky-open]');
      this.bulbDisc = this.lcEl ? (parseFloat(this.lcEl.getAttribute('data-bulb-disc')) || 0.5) : 0.5;
      this.bulbCode = this.lcEl ? (this.lcEl.getAttribute('data-bulb-code') || '') : '';
      this.sumColor  = this.querySelector('[data-mlw-sum-color]');
      this.sumKap    = this.querySelector('[data-mlw-sum-kap]');
      this.summaryEl = this.querySelector('.mlw-summary');
      this.continueBtn = this.querySelector('[data-mlw-continue]');
      this.tabs      = Array.prototype.slice.call(this.querySelectorAll('[data-mlw-tab]'));
      this.steps     = Array.prototype.slice.call(this.querySelectorAll('[data-mlw-step]'));

      this.step = 1;
      this.mode = this.dataset.mode || 'full';
      this.totalSteps = this.steps.length || TOTAL_STEPS;
      this.lastFocus = null;
      this.afterAdd = this.dataset.afterAdd || 'cart';
      this.selectedUpsells = [];
      this.qty = 1;
      this.disc = 0;
      this.discCode = '';
      this._bulbOfferTaken = false;
      this._pendingBtn = null;
      this.addLabelBase = this.addLabelEl ? this.addLabelEl.textContent.trim() : 'Checkout';

      if (this.root && this.root.parentNode !== document.body) {
        document.body.appendChild(this.root);
      }
      if (this.sticky && this.sticky.parentNode !== document.body) {
        document.body.appendChild(this.sticky);
      }

      this.upsells  = this.readJSON('[data-mlw-upsell-data]', []);
      this.selfProduct = this.readJSON('[data-mlw-self]', null);

      if ((this.mode === 'colour' || this.mode === 'summary') && this.selfProduct) {
        // Colour-only / summary-only: the current product IS the single lamp; no shade products.
        this.products = [this.selfProduct];
      } else {
        this.products = this.readJSON('[data-mlw-products]', []).filter(hasRealColorOption);
      }
      this.productById = {};
      var self = this;
      this.products.forEach(function (p) { self.productById[String(p.id)] = p; });

      this.colors = this.buildColors();

      this.bind();
      if (this.mode !== 'summary') this.renderColorStep(this.currentColorKey());
      if (this.mode === 'full') this.renderKapStep(this.dataset.currentProductId);
      this.renderUpsells();
      this.updatePreview();
      this.updateCombo();
      this.refreshSummary();
      this.updateReview();
      this.render();
    }

    readJSON(sel, fallback) {
      var el = this.querySelector(sel);
      if (!el) return fallback;
      try { return JSON.parse(el.textContent) || fallback; } catch (e) { return fallback; }
    }
    readStem() {
      var el = this.querySelector('[data-mlw-stem]');
      if (!el) return { variants: [] };
      try { return JSON.parse(el.textContent) || { variants: [] }; } catch (e) { return { variants: [] }; }
    }

    buildColors() {
      var seen = {}, list = [];
      function add(v, pimg) {
        if (isDefaultTitle(v.title) || seen[v.title]) return;
        seen[v.title] = true;
        list.push({ key: v.title, label: cleanColor(v.title), image: v.image || pimg });
      }
      var stem = this.readStem();
      (stem.variants || []).forEach(function (v) { add(v, stem.image); });
      this.products.forEach(function (p) {
        (p.variants || []).forEach(function (v) { add(v, p.image); });
      });
      return list;
    }

    currentColorKey() {
      var cur = this.productById[String(this.dataset.currentProductId)];
      if (!cur) return '';
      var vid = String(this.dataset.currentVariantId || '');
      var v = (cur.variants || []).filter(function (x) { return String(x.id) === vid; })[0];
      return v ? v.title : '';
    }

    bind() {
      var self = this;
      if (this.trigger) this.trigger.addEventListener('click', function () { self.open(); });
      this.root.querySelectorAll('[data-mlw-close]').forEach(function (el) {
        el.addEventListener('click', function () { self.close(); });
      });
      if (this.backBtn) this.backBtn.addEventListener('click', function () { self.goTo(self.step - 1); });
      if (this.nextBtn) this.nextBtn.addEventListener('click', function () { self.next(); });
      if (this.addBtn)  this.addBtn.addEventListener('click', function () { self.addToCart({ btn: self.addBtn }); });
      if (this.continueBtn) this.continueBtn.addEventListener('click', function () { self.addToCart({ stay: true, btn: self.continueBtn }); });

      if (this.lcAddBtn) this.lcAddBtn.addEventListener('click', function () { self.acceptBulbOffer(); });
      if (this.lcSkipBtn) this.lcSkipBtn.addEventListener('click', function () { self.declineBulbOffer(); });

      if (this.stickyBtn) this.stickyBtn.addEventListener('click', function () { self.open(); });
      this.setupSticky();

      this.bundleOpts.forEach(function (opt) {
        opt.addEventListener('click', function () {
          self.qty = parseInt(opt.getAttribute('data-mlw-qty'), 10) || 1;
          self.disc = parseFloat(opt.getAttribute('data-mlw-disc')) || 0;
          self.discCode = (opt.getAttribute('data-mlw-code') || '').trim();
          self.bundleOpts.forEach(function (o) { o.classList.remove('is-on'); o.setAttribute('aria-pressed', 'false'); });
          opt.classList.add('is-on'); opt.setAttribute('aria-pressed', 'true');
          self.updateReview();
        });
      });

      this.tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          var target = parseInt(tab.getAttribute('data-mlw-tab'), 10);
          if (target <= self.step || self.validateUpTo(target - 1)) self.goTo(target);
        });
      });

      this.root.addEventListener('change', function (e) {
        if (!e.target) return;
        if (e.target.matches('[data-mlw-color]')) {
          self.clearError();
          self.updatePreview();
          self.renderKapStep(self.getKapId());
          self.updateCombo();
          self.refreshSummary();
          self.updateReview();
        } else if (e.target.matches('[data-mlw-kap]')) {
          self.clearError();
          self.updateCombo();
          self.refreshSummary();
          self.updateReview();
        }
      });

      this._onKey = function (e) {
        if (e.key === 'Escape' && self.root && self.root.classList.contains('is-open')) self.close();
      };
      document.addEventListener('keydown', this._onKey);
    }

    /* ---------- step 1: colours ---------- */
    renderColorStep(preselectKey) {
      if (!this.colorsEl) return;
      this.colorsEl.innerHTML = '';
      var frag = document.createDocumentFragment();
      this.colors.forEach(function (c, i) {
        var label = document.createElement('label');
        label.className = 'mlw-color';
        var input = document.createElement('input');
        input.type = 'radio'; input.className = 'mlw-color__input'; input.name = 'mlw-color';
        input.value = c.key; input.setAttribute('data-mlw-color', ''); input.setAttribute('data-label', c.label);
        if (preselectKey ? c.key === preselectKey : i === 0) input.checked = true;
        var media = document.createElement('span'); media.className = 'mlw-color__media';
        if (c.image) { var img = document.createElement('img'); img.className = 'mlw-color__img'; img.loading = 'lazy'; img.alt = c.label; img.src = c.image; media.appendChild(img); }
        var name = document.createElement('span'); name.className = 'mlw-color__name'; name.textContent = c.label;
        label.appendChild(input); label.appendChild(media); label.appendChild(name);
        frag.appendChild(label);
      });
      this.colorsEl.appendChild(frag);
    }

    /* ---------- step 2: kappen ---------- */
    renderKapStep(preferProductId) {
      if (!this.kapsEl) return;
      var colorKey = this.getColorKey();
      this.kapsEl.innerHTML = '';
      var frag = document.createDocumentFragment();
      var self = this;
      var shown = this.products.filter(function (p) { return !!self.variantFor(p, colorKey); });
      var validIds = shown.filter(function (p) { var v = self.variantFor(p, colorKey); return v && v.available; }).map(function (p) { return String(p.id); });
      var preselectId = (preferProductId && validIds.indexOf(String(preferProductId)) !== -1) ? String(preferProductId) : (validIds[0] || null);

      shown.forEach(function (p) {
        var variant = self.variantFor(p, colorKey);
        var available = variant && variant.available;
        var thumb = (variant && variant.image) || p.image;
        var label = document.createElement('label');
        label.className = 'mlw-option' + (available ? '' : ' is-disabled');
        var input = document.createElement('input');
        input.type = 'radio'; input.className = 'mlw-option__input'; input.name = 'mlw-kap';
        input.value = String(p.id); input.setAttribute('data-mlw-kap', ''); input.setAttribute('data-title', p.title);
        if (!available) input.disabled = true;
        if (available && String(p.id) === preselectId) input.checked = true;
        var media = document.createElement('span'); media.className = 'mlw-option__media';
        if (thumb) { var img = document.createElement('img'); img.className = 'mlw-option__img'; img.loading = 'lazy'; img.alt = p.title; img.src = thumb; media.appendChild(img); }
        var check = document.createElement('span'); check.className = 'mlw-option__check'; check.setAttribute('aria-hidden', 'true');
        check.innerHTML = '<svg viewBox="0 0 20 20" fill="none"><path d="m5.2 10.2 3 3.1 6.7-7" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        media.appendChild(check);
        if (!available) { var note = document.createElement('span'); note.className = 'mlw-option__note'; note.textContent = 'Sold out'; media.appendChild(note); }
        label.appendChild(input); label.appendChild(media);
        frag.appendChild(label);
      });
      if (!shown.length) { var empty = document.createElement('p'); empty.className = 'mlw-empty'; empty.textContent = 'No shades available in this colour.'; frag.appendChild(empty); }
      this.kapsEl.appendChild(frag);
    }

    variantFor(product, colorKey) {
      if (!product) return null;
      var vs = product.variants || [];
      if (!colorKey) return vs[0] || null;
      return vs.filter(function (v) { return v.title === colorKey; })[0] || null;
    }

    /* ---------- step 3: upsells ---------- */
    renderUpsells() {
      if (!this.upsellGrid) return;
      if (!this.upsells.length) { if (this.upsellWrap) this.upsellWrap.hidden = true; return; }
      if (this.upsellWrap) this.upsellWrap.hidden = false;
      var frag = document.createDocumentFragment();
      var self = this;
      this.upsells.forEach(function (u, idx) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'mlw-up' + (self.selectedUpsells.indexOf(String(u.variantId)) >= 0 ? ' is-on' : '');
        card.setAttribute('data-mlw-up', String(u.variantId));
        card.innerHTML =
          '<span class="mlw-up__media">' + (u.image ? '<img loading="lazy" alt="" src="' + u.image + '">' : '') + '</span>' +
          '<span class="mlw-up__info">' +
            (idx === 0 ? '<span class="mlw-up__rec">Recommended</span>' : '') +
            '<span class="mlw-up__name">' + (u.title || '') + '</span>' +
            (u.price ? '<span class="mlw-up__price">' + u.price + '</span>' : '') +
          '</span>' +
          '<span class="mlw-up__badge" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>';
        card.addEventListener('click', function () {
          var id = String(u.variantId);
          var i = self.selectedUpsells.indexOf(id);
          if (i >= 0) self.selectedUpsells.splice(i, 1); else self.selectedUpsells.push(id);
          card.classList.toggle('is-on');
          self.updateReview();
        });
        frag.appendChild(card);
      });
      this.upsellGrid.innerHTML = '';
      this.upsellGrid.appendChild(frag);
    }

    /* ---------- previews ---------- */
    colorImage() {
      var key = this.getColorKey();
      var c = this.colors.filter(function (x) { return x.key === key; })[0] || this.colors[0];
      return c ? c.image : '';
    }
    setImg(img, src) {
      if (!img) return;
      if (src) { img.src = src; img.style.visibility = 'visible'; }
      else { img.removeAttribute('src'); img.style.visibility = 'hidden'; }
    }
    updatePreview() { this.setImg(this.previewImg, this.colorImage()); }
    updateCombo() {
      var p = this.productById[String(this.getKapId())];
      var v = this.variantFor(p, this.getColorKey());
      var src = (v && v.image) || (p && p.image) || this.colorImage();
      this.setImg(this.previewKap, src);
      this.setImg(this.previewReview, src);
    }

    /* ---------- open / close ---------- */
    open() {
      if (!this.root) return;
      this.lastFocus = document.activeElement;
      this.root.hidden = false;
      this.root.setAttribute('aria-hidden', 'false');
      void this.root.offsetWidth;
      this.root.classList.add('is-open');
      document.documentElement.classList.add('mlw-no-scroll');
      if (this.sticky) this.sticky.classList.add('mlw-sticky--suppressed');
      this.goTo(1, true);
      var self = this;
      window.setTimeout(function () { var f = self.panel && self.panel.querySelector('.mlw-close'); if (f) f.focus(); }, 60);
    }
    close() {
      if (!this.root) return;
      this.root.classList.remove('is-open');
      document.documentElement.classList.remove('mlw-no-scroll');
      if (this.sticky) this.sticky.classList.remove('mlw-sticky--suppressed');
      var self = this;
      var done = function () { self.root.hidden = true; self.root.setAttribute('aria-hidden', 'true'); if (self.panel) self.panel.removeEventListener('transitionend', onEnd); };
      var onEnd = function (e) { if (e.target === self.panel && e.propertyName === 'transform') done(); };
      if (this.panel) this.panel.addEventListener('transitionend', onEnd);
      window.setTimeout(done, 380);
      if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus();
    }

    /* ---------- sticky CTA (shows once the main button scrolls away) ---------- */
    setupSticky() {
      var self = this;
      if (!this.trigger || !this.sticky) return;
      function toggle(show) {
        self.sticky.classList.toggle('is-visible', show);
        self.sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
      }
      if ('IntersectionObserver' in window) {
        this._stickyObs = new IntersectionObserver(function (entries) {
          var e = entries[0];
          // Reveal only after the real button has scrolled up past the top.
          toggle(!e.isIntersecting && e.boundingClientRect.top < 0);
        }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
        this._stickyObs.observe(this.trigger);
      }
    }

    /* ---------- navigation ---------- */
    next() { if (this.step < this.totalSteps && this.validate(this.step)) this.goTo(this.step + 1); }
    validateUpTo(step) { for (var i = 1; i <= step; i++) { if (!this.validate(i, true)) return false; } return true; }
    goTo(step, silent) {
      step = Math.min(this.totalSteps, Math.max(1, step));
      this.step = step; this.render();
      if (step === this.totalSteps) this.updateReview();
      if (this.body) this.body.scrollTop = 0;
      if (!silent) this.clearError();
    }
    render() {
      var self = this;
      this.steps.forEach(function (sec) {
        var n = parseInt(sec.getAttribute('data-mlw-step'), 10);
        var active = n === self.step;
        sec.classList.toggle('is-active', active);
        sec.hidden = !active;
      });
      this.tabs.forEach(function (tab) {
        var n = parseInt(tab.getAttribute('data-mlw-tab'), 10);
        tab.classList.toggle('is-active', n === self.step);
        tab.classList.toggle('is-done', n < self.step);
      });
      if (this.backBtn) this.backBtn.hidden = this.step === 1;
      var onLast = this.step === this.totalSteps;
      if (this.nextBtn) this.nextBtn.hidden = onLast;
      if (this.addBtn)  this.addBtn.hidden = !onLast;
      if (this.continueBtn) this.continueBtn.hidden = !onLast;
      if (this.summaryEl) this.summaryEl.style.display = onLast ? 'none' : '';
      if (this.trustEl) this.trustEl.hidden = onLast;
      if (this.paypalEl) this.paypalEl.hidden = !onLast;
    }

    /* ---------- selection / summary ---------- */
    getColorKey() { var el = this.root.querySelector('[data-mlw-color]:checked'); return el ? el.value : ''; }
    getColorLabel() { var el = this.root.querySelector('[data-mlw-color]:checked'); return el ? (el.getAttribute('data-label') || '') : ''; }
    getKapId() {
      if (this.mode === 'colour' || this.mode === 'summary') return this.selfProduct ? String(this.selfProduct.id) : '';
      var el = this.root.querySelector('[data-mlw-kap]:checked'); return el ? el.value : '';
    }
    getKapTitle() { var p = this.productById[String(this.getKapId())]; return p ? p.title : ''; }
    resolvedVariantId() { var p = this.productById[String(this.getKapId())]; var v = this.variantFor(p, this.getColorKey()); return v ? v.id : ''; }

    refreshSummary() {
      if (this.sumColor) this.sumColor.textContent = this.getColorLabel() || '—';
      if (this.sumKap) this.sumKap.textContent = this.getKapTitle() || '—';
    }
    sampleMoney() {
      var p = this.productById[String(this.getKapId())];
      return (p && p.price) || (this.products[0] && this.products[0].price) || '';
    }
    upsellQty(id) {
      var bulb = this.bulbUpsell();
      return (bulb && String(bulb.variantId) === String(id)) ? this.qty : 1;
    }
    amounts() {
      var p = this.productById[String(this.getKapId())];
      var unit = p ? (p.priceRaw || 0) : 0;
      var lampSub = unit * this.qty;
      var disc = Math.round(lampSub * this.disc);
      var upsell = 0;
      var self = this;
      this.upsells.forEach(function (u) { if (self.selectedUpsells.indexOf(String(u.variantId)) >= 0) upsell += (u.priceRaw || 0) * self.upsellQty(u.variantId); });
      return { p: p, unit: unit, lampSub: lampSub, disc: disc, upsell: upsell, total: lampSub - disc + upsell };
    }
    updateReview() {
      var a = this.amounts();
      var sample = this.sampleMoney();
      if (this.discountRow) this.discountRow.hidden = a.disc <= 0;
      if (this.discountEl) this.discountEl.textContent = '−' + moneyFmt(a.disc, sample);
      if (this.rvTotal) this.rvTotal.textContent = moneyFmt(a.total, sample);
      if (this.addLabelEl && a.p) this.addLabelEl.textContent = this.addLabelBase + ' · ' + moneyFmt(a.total, sample);
      this.updateBundlePrices(a, sample);
      this.renderLines(a, sample);
    }
    updateBundlePrices(a, sample) {
      a = a || this.amounts(); sample = sample || this.sampleMoney();
      var unit = a.unit;
      this.bundleOpts.forEach(function (opt) {
        var q = parseInt(opt.getAttribute('data-mlw-qty'), 10) || 1;
        var d = parseFloat(opt.getAttribute('data-mlw-disc')) || 0;
        var full = unit * q;
        var priceEl = opt.querySelector('[data-mlw-bundle-price]');
        var wasEl = opt.querySelector('[data-mlw-bundle-was]');
        if (priceEl) priceEl.textContent = moneyFmt(Math.round(full * (1 - d)), sample);
        if (wasEl) wasEl.textContent = d > 0 ? moneyFmt(full, sample) : '';
      });
    }
    escAttr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }
    escHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    lineHTML(img, title, sub, price) {
      return '<div class="mlw-line">' +
        '<span class="mlw-line__media">' + (img ? '<img loading="lazy" alt="" src="' + this.escAttr(img) + '">' : '') + '</span>' +
        '<span class="mlw-line__info">' +
          '<span class="mlw-line__name">' + this.escHtml(title) + '</span>' +
          (sub ? '<span class="mlw-line__sub">' + this.escHtml(sub) + '</span>' : '') +
        '</span>' +
        '<span class="mlw-line__price">' + this.escHtml(price) + '</span>' +
      '</div>';
    }
    renderLines(a, sample) {
      if (!this.linesEl) return;
      a = a || this.amounts(); sample = sample || this.sampleMoney();
      var html = '';
      var p = a.p;
      if (p) {
        var v = this.variantFor(p, this.getColorKey());
        var img = (v && v.image) || p.image || this.colorImage();
        var colorLabel = this.getColorLabel();
        var sub = this.qty > 1 ? (this.qty + ' × ' + p.price) : (colorLabel || '');
        html += this.lineHTML(img, p.title, sub, moneyFmt(a.lampSub, sample));
      }
      var self = this;
      this.upsells.forEach(function (u) {
        if (self.selectedUpsells.indexOf(String(u.variantId)) >= 0) {
          var uq = self.upsellQty(u.variantId);
          var usub = uq > 1 ? (uq + ' × ' + u.price) : '';
          html += self.lineHTML(u.image, u.title, usub, moneyFmt((u.priceRaw || 0) * uq, sample));
        }
      });
      this.linesEl.innerHTML = html;
    }

    validate(step, quiet) {
      var ok = true, msg = '';
      if (step === 1 && this.mode !== 'summary' && this.colors.length && !this.getColorKey()) { ok = false; msg = 'Please choose a colour first.'; }
      if (step === 2 && this.mode === 'full' && !this.getKapId()) { ok = false; msg = 'Please choose a shade first.'; }
      if (!ok && !quiet) this.showError(msg);
      return ok;
    }
    showError(msg) { if (this.errorEl) { this.errorEl.textContent = msg; this.errorEl.hidden = false; } }
    clearError() { if (this.errorEl) { this.errorEl.hidden = true; this.errorEl.textContent = ''; } }

    /* ---------- add to cart ---------- */
    addToCart(opts) {
      opts = opts || {};
      this.clearError();
      if (!this.validate(1)) { this.goTo(1); return; }
      if (this.mode === 'full' && !this.validate(2)) { this.goTo(2); return; }
      var variantId = this.resolvedVariantId();
      if (!variantId) { this.showError('This combination is not available. Choose a different colour or shade.'); return; }

      // Last-chance: checking out without the recommended bulbs -> offer them at a discount.
      // Only on the full sconces funnel; simpler lamps (colour/summary) skip the bulb pop-up.
      var bulb = this.bulbUpsell();
      if (this.mode === 'full' && !opts.skipLastChance && !opts.stay && bulb && this.selectedUpsells.indexOf(String(bulb.variantId)) < 0) {
        this._pendingBtn = opts.btn || this.addBtn;
        this.showLastChance(bulb);
        return;
      }

      var self0 = this;
      var items = [{ id: variantId, quantity: this.qty }];
      this.selectedUpsells.forEach(function (id) { items.push({ id: id, quantity: self0.upsellQty(id) }); });

      var self = this;
      var btn = opts.btn || this.addBtn;
      var mode = opts.stay ? 'stay' : this.afterAdd;
      if (btn) btn.classList.add('is-loading');
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ items: items })
      })
        .then(function (res) { return res.json().then(function (data) { if (!res.ok) throw new Error(data && data.description ? data.description : 'Could not add to cart.'); return data; }); })
        .then(function () { self.onAdded(mode); })
        .catch(function (err) { if (btn) btn.classList.remove('is-loading'); self.showError(err && err.message ? err.message : 'Something went wrong. Please try again.'); });
    }
    bulbUpsell() {
      if (!this.upsells || !this.upsells.length) return null;
      var bulb = this.upsells.filter(function (u) { return /bulb/i.test(u.title || ''); })[0];
      return bulb || this.upsells[0];
    }
    showLastChance(bulb) {
      if (!this.lcEl) return;
      var sample = this.sampleMoney() || bulb.price;
      var qty = this.qty;
      var full = (bulb.priceRaw || 0) * qty;
      var now = Math.round(full * (1 - this.bulbDisc));
      if (this.lcImg && bulb.image) this.lcImg.src = bulb.image;
      if (this.lcName) this.lcName.textContent = (bulb.title || '') + (qty > 1 ? ' × ' + qty : '');
      if (this.lcWas) this.lcWas.textContent = moneyFmt(full, sample);
      if (this.lcNow) this.lcNow.textContent = moneyFmt(now, sample);
      this.lcEl.hidden = false;
      void this.lcEl.offsetWidth;
      this.lcEl.classList.add('is-open');
    }
    hideLastChance() {
      if (!this.lcEl) return;
      this.lcEl.classList.remove('is-open');
      var el = this.lcEl;
      window.setTimeout(function () { el.hidden = true; }, 220);
    }
    acceptBulbOffer() {
      var bulb = this.bulbUpsell();
      if (bulb && this.selectedUpsells.indexOf(String(bulb.variantId)) < 0) this.selectedUpsells.push(String(bulb.variantId));
      this._bulbOfferTaken = true;
      this.hideLastChance();
      this.addToCart({ btn: this._pendingBtn || this.addBtn, skipLastChance: true });
    }
    declineBulbOffer() {
      this.hideLastChance();
      this.addToCart({ btn: this._pendingBtn || this.addBtn, skipLastChance: true });
    }
    onAdded(mode) {
      mode = mode || this.afterAdd;
      // Collect discount codes to apply: bundle tier (2/3 sets) + optional bulb offer.
      var codes = [];
      if (this.disc > 0 && this.discCode) codes.push(this.discCode);
      if (this._bulbOfferTaken && this.bulbCode) codes.push(this.bulbCode);
      if (mode === 'checkout') { window.location.assign(this.discountUrl(codes, '/checkout')); return; }
      if (mode === 'cart') { window.location.assign(this.discountUrl(codes, '/cart')); return; }
      var self = this;
      if (this.addBtn) this.addBtn.classList.remove('is-loading');
      if (this.continueBtn) this.continueBtn.classList.remove('is-loading');
      fetch('/cart.js', { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true, detail: { cart: cart } }));
          document.dispatchEvent(new CustomEvent('cart:change', { bubbles: true, detail: { cart: cart } }));
          self.close();
          self.tryOpenCartDrawer();
        })
        .catch(function () { window.location.assign('/cart'); });
    }
    // Build a URL that applies one or more discount codes, then lands on `target`.
    // Shopify's /discount/CODE?redirect=… applies the code; nesting redirects stacks
    // multiple codes (each must be set to combine in Shopify for both to hold).
    discountUrl(codes, target) {
      codes = (codes || []).filter(Boolean);
      if (!codes.length) return target;
      var url = target;
      for (var i = codes.length - 1; i >= 0; i--) {
        url = '/discount/' + encodeURIComponent(codes[i]) + '?redirect=' + encodeURIComponent(url);
      }
      return url;
    }
    tryOpenCartDrawer() {
      var opener = document.querySelector('[aria-controls="cart-drawer"], [aria-controls="CartDrawer"], .header__cart-toggle');
      if (opener && typeof opener.click === 'function') opener.click();
    }

    disconnectedCallback() {
      if (this._onKey) document.removeEventListener('keydown', this._onKey);
      if (this._stickyObs) this._stickyObs.disconnect();
    }
  }

  customElements.define('meave-lamp-wizard', MeaveLampWizard);
})();
