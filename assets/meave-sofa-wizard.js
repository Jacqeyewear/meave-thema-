/* ============================================================
   Meave Sofa-cover Wizard — same shell as the lamp wizard.
   1 Colour  : pick the cover colour (a de-duplicated colour option)
   2 Size    : add a cover per part of the sofa (bundle multiple sizes)
   3 Overview: cart-style summary, then checkout
   Every chosen size is added to the cart as its own line item.
   ============================================================ */
(function () {
  'use strict';

  if (window.customElements && customElements.get('meave-sofa-wizard')) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escAttr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }

  class MeaveSofaWizard extends HTMLElement {
    connectedCallback() {
      if (this.dataset.mswInit === '1') return;
      this.dataset.mswInit = '1';

      try { this.variants = JSON.parse(this.querySelector('[data-msw-variants]').textContent); }
      catch (e) { this.variants = []; }
      this.variants = (this.variants || []).filter(function (v) { return v && v.id; });

      this.afterAdd = this.getAttribute('data-after-add') || 'checkout';
      var m = this.getAttribute('data-mode');
      this.mode = (m === 'bundle' || m === 'hybrid') ? m : 'single';

      this.root       = this.querySelector('[data-msw-root]');
      this.panel      = this.querySelector('.mlw-panel');
      this.trigger    = this.querySelector('[data-msw-open]');
      this.body       = this.querySelector('.mlw-body');
      this.backBtn    = this.querySelector('[data-msw-back]');
      this.nextBtn    = this.querySelector('[data-msw-next]');
      this.addBtn     = this.querySelector('[data-msw-add]');
      this.trustEl    = this.querySelector('[data-msw-trust]');
      this.paypalEl   = this.querySelector('[data-msw-paypal]');
      this.errorEl    = this.querySelector('[data-msw-error]');
      this.previewImg = this.querySelector('[data-msw-preview]');
      this.coloursEl  = this.querySelector('[data-msw-colors]');
      this.sizesEl    = this.querySelector('[data-msw-sizes]');
      this.colourLbl  = this.querySelector('[data-msw-colour-label]');
      this.subEl      = this.querySelector('[data-msw-sub]');
      this.linesEl    = this.querySelector('[data-msw-lines]');
      this.totalEl    = this.querySelector('[data-msw-total]');
      this.addLabelEl = this.querySelector('.mlw-add__label');
      this.tabs       = Array.prototype.slice.call(this.querySelectorAll('[data-msw-tab]'));
      this.steps      = Array.prototype.slice.call(this.querySelectorAll('[data-msw-step]'));

      this.step = 1;
      this.totalSteps = this.steps.length || 3;
      this.lastFocus = null;
      this.addLabelBase = this.addLabelEl ? this.addLabelEl.textContent.trim() : 'Checkout';

      // Money format from a sample price.
      var sample = (this.variants[0] && this.variants[0].pf) || '£0.00';
      this.moneySymbol = (sample.match(/^[^\d\-]+/) || ['£'])[0];
      this.useComma = sample.lastIndexOf(',') > sample.lastIndexOf('.');

      // De-duplicated colours, in first-seen order, with a representative image.
      this.colours = [];
      var seen = {}, self = this;
      this.variants.forEach(function (v) {
        var key = v.c || '';
        if (!seen[key]) { seen[key] = { name: key, img: v.img || '' }; self.colours.push(seen[key]); }
        if (!seen[key].img && v.img) seen[key].img = v.img;
      });

      this.selColour = this.colours.length ? this.colours[0].name : null;
      this.bundle = [];

      if (this.subEl) {
        this.subEl.textContent =
          this.mode === 'bundle' ? 'Add a cover for each part you want — they’re bundled together and checked out in one go.' :
          this.mode === 'hybrid' ? 'Pick the size that fits your sofa, then add matching cushion covers if you like.' :
          'Choose the size that fits your sofa. Not sure? Use the guide above to measure.';
      }
      var ovTitle = this.querySelector('[data-msw-ovtitle]');
      if (ovTitle) ovTitle.textContent =
        this.mode === 'bundle' ? 'Your bundle' :
        this.mode === 'hybrid' ? 'Your set' : 'Your cover';

      if (this.root && this.root.parentNode !== document.body) document.body.appendChild(this.root);

      this.renderColours();
      this.bind();
      this.render();
    }

    money(pence) {
      var val = (pence / 100).toFixed(2);
      if (this.useComma) val = val.replace('.', ',');
      return this.moneySymbol + val;
    }

    bind() {
      var self = this;
      if (this.trigger) this.trigger.addEventListener('click', function () { self.open(); });
      this.querySelectorAll('[data-msw-close]').forEach(function (b) { b.addEventListener('click', function () { self.close(); }); });
      if (this.backBtn) this.backBtn.addEventListener('click', function () { self.goTo(self.step - 1); });
      if (this.nextBtn) this.nextBtn.addEventListener('click', function () { self.next(); });
      if (this.addBtn) this.addBtn.addEventListener('click', function () { self.checkout(); });

      this.tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          var n = parseInt(tab.getAttribute('data-msw-tab'), 10);
          if (n === 2 && !self.selColour) return;
          if (n === 3 && !self.bundle.length) return;
          self.goTo(n);
        });
      });

      this._onKey = function (e) { if (e.key === 'Escape' && self.root && self.root.classList.contains('is-open')) self.close(); };
      document.addEventListener('keydown', this._onKey);
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
      this.goTo(1, true);
      var self = this;
      window.setTimeout(function () { var f = self.panel && self.panel.querySelector('.mlw-close'); if (f) f.focus(); }, 60);
    }
    close() {
      if (!this.root) return;
      this.root.classList.remove('is-open');
      document.documentElement.classList.remove('mlw-no-scroll');
      var self = this;
      var done = function () { self.root.hidden = true; self.root.setAttribute('aria-hidden', 'true'); if (self.panel) self.panel.removeEventListener('transitionend', onEnd); };
      var onEnd = function (e) { if (e.target === self.panel && e.propertyName === 'transform') done(); };
      if (this.panel) this.panel.addEventListener('transitionend', onEnd);
      window.setTimeout(done, 400);
      if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus();
    }

    /* ---------- navigation ---------- */
    next() {
      if (this.step === 1) { if (!this.selColour) { this.showError('Please choose a colour first.'); return; } this.goTo(2); return; }
      if (this.step === 2) {
        if (!this.canProceed()) {
          this.showError(this.mode === 'bundle' ? 'Add at least one size to continue.' : 'Please choose your sofa size first.');
          return;
        }
        this.goTo(3); return;
      }
    }
    goTo(step, silent) {
      step = Math.min(this.totalSteps, Math.max(1, step));
      this.step = step;
      this.render();
      if (this.body) this.body.scrollTop = 0;
      if (!silent) this.clearError();
    }
    render() {
      var self = this;
      this.steps.forEach(function (sec) {
        var n = parseInt(sec.getAttribute('data-msw-step'), 10);
        var active = n === self.step;
        sec.classList.toggle('is-active', active);
        sec.hidden = !active;
      });
      this.tabs.forEach(function (tab) {
        var n = parseInt(tab.getAttribute('data-msw-tab'), 10);
        tab.classList.toggle('is-active', n === self.step);
        tab.classList.toggle('is-done', n < self.step);
      });

      if (this.step === 2) this.renderSizes();
      if (this.step === 3) this.renderOverview();
      if (this.colourLbl) this.colourLbl.textContent = this.selColour || '';
      this.updatePreview();

      var onLast = this.step === this.totalSteps;
      if (this.backBtn) this.backBtn.hidden = this.step === 1;
      if (this.nextBtn) this.nextBtn.hidden = onLast;
      if (this.addBtn) { this.addBtn.hidden = !onLast; this.addBtn.disabled = !this.canProceed(); }
      if (this.trustEl) this.trustEl.hidden = onLast;
      if (this.paypalEl) this.paypalEl.hidden = !onLast;
      this.clearError();
    }

    /* ---------- step 1: colours ---------- */
    renderColours() {
      if (!this.coloursEl) return;
      var self = this;
      this.coloursEl.innerHTML = '';
      var frag = document.createDocumentFragment();
      this.colours.forEach(function (c) {
        var label = document.createElement('label');
        label.className = 'mlw-color';
        var input = document.createElement('input');
        input.type = 'radio'; input.className = 'mlw-color__input'; input.name = 'msw-color';
        input.value = c.name;
        if (c.name === self.selColour) input.checked = true;
        input.addEventListener('change', function () { self.selColour = c.name; self.updatePreview(); });
        var media = document.createElement('span'); media.className = 'mlw-color__media';
        if (c.img) { var img = document.createElement('img'); img.className = 'mlw-color__img'; img.loading = 'lazy'; img.alt = c.name; img.src = c.img; media.appendChild(img); }
        var name = document.createElement('span'); name.className = 'mlw-color__name'; name.textContent = c.name;
        label.appendChild(input); label.appendChild(media); label.appendChild(name);
        frag.appendChild(label);
      });
      this.coloursEl.appendChild(frag);
    }
    colourImage(name) {
      for (var i = 0; i < this.colours.length; i++) if (this.colours[i].name === name) return this.colours[i].img;
      return this.colours[0] ? this.colours[0].img : '';
    }
    updatePreview() {
      if (!this.previewImg) return;
      var src = this.colourImage(this.selColour);
      if (src) { this.previewImg.src = src; this.previewImg.style.visibility = 'visible'; }
      else { this.previewImg.removeAttribute('src'); this.previewImg.style.visibility = 'hidden'; }
    }

    /* ---------- step 2: sizes ---------- */
    sizesForColour(c) {
      var out = [], seen = {};
      this.variants.forEach(function (v) {
        if (v.c !== c || seen[v.s]) return;
        seen[v.s] = 1;
        out.push(v);
      });
      return out;
    }
    inBundle(id) { for (var i = 0; i < this.bundle.length; i++) if (this.bundle[i].id === id) return this.bundle[i]; return null; }

    isExtra(v) { return /cushion/i.test(v.s); }
    hasMain() { return this.bundle.some(function (b) { return b.main; }); }
    isMainSelected(id) { return this.bundle.some(function (b) { return b.main && b.id === id; }); }
    canProceed() { return this.mode === 'bundle' ? this.bundle.length > 0 : this.hasMain(); }

    subHead(label, tag) {
      var d = document.createElement('div');
      d.className = 'msw-sizes-sub';
      d.innerHTML = esc(label) + (tag ? '<span>' + esc(tag) + '</span>' : '');
      return d;
    }
    pickRow(v) {
      var self = this;
      var on = this.isMainSelected(v.id);
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'msw-size msw-size--pick' + (v.av ? '' : ' is-out') + (on ? ' is-on' : '');
      if (!v.av) row.disabled = true;
      row.innerHTML =
        '<span class="msw-size__radio" aria-hidden="true"></span>' +
        '<span class="msw-size__name">' + esc(v.s) + '</span>' +
        '<span class="msw-size__price">' + (v.av ? esc(v.pf) : 'Sold out') + '</span>';
      if (v.av) row.addEventListener('click', function () { self.selectMain(v); });
      return row;
    }
    addRow(v) {
      var self = this;
      var row = document.createElement('div');
      row.className = 'msw-size' + (v.av ? '' : ' is-out');
      var line = this.inBundle(v.id);
      var right;
      if (!v.av) {
        right = '<span class="msw-size__price">Sold out</span>';
      } else if (line) {
        right =
          '<span class="msw-size__price">' + esc(v.pf) + '</span>' +
          '<span class="msw-size__qty"><button type="button" class="msw-size__qtybtn" data-dec aria-label="Remove one">−</button>' +
          '<span class="msw-size__qtynum">' + line.qty + '</span>' +
          '<button type="button" class="msw-size__qtybtn" data-inc aria-label="Add one">+</button></span>';
      } else {
        right =
          '<span class="msw-size__price">' + esc(v.pf) + '</span>' +
          '<button type="button" class="msw-size__add" data-add><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add</button>';
      }
      row.innerHTML = '<span class="msw-size__name">' + esc(v.s) + '</span>' + right;
      if (v.av) {
        var add = row.querySelector('[data-add]');
        if (add) add.addEventListener('click', function () { self.addItem(v); });
        var inc = row.querySelector('[data-inc]');
        if (inc) inc.addEventListener('click', function () { self.setQty(v.id, 1); });
        var dec = row.querySelector('[data-dec]');
        if (dec) dec.addEventListener('click', function () { self.setQty(v.id, -1); });
      }
      return row;
    }

    renderSizes() {
      if (!this.sizesEl) return;
      var self = this;
      this.sizesEl.innerHTML = '';
      var sizes = this.sizesForColour(this.selColour);

      if (this.mode === 'single') {
        sizes.forEach(function (v) { self.sizesEl.appendChild(self.pickRow(v)); });
        return;
      }

      if (this.mode === 'hybrid') {
        var mains = sizes.filter(function (v) { return !self.isExtra(v); });
        var extras = sizes.filter(function (v) { return self.isExtra(v); });
        if (mains.length) {
          self.sizesEl.appendChild(self.subHead('Your sofa size'));
          mains.forEach(function (v) { self.sizesEl.appendChild(self.pickRow(v)); });
        }
        if (extras.length) {
          self.sizesEl.appendChild(self.subHead('Add cushion covers', 'Optional'));
          extras.forEach(function (v) { self.sizesEl.appendChild(self.addRow(v)); });
        }
        return;
      }

      // bundle
      sizes.forEach(function (v) { self.sizesEl.appendChild(self.addRow(v)); });
    }

    selectMain(v) {
      this.bundle = this.bundle.filter(function (b) { return !b.main; });
      this.bundle.unshift({ id: v.id, c: v.c, s: v.s, price: v.price, pf: v.pf, img: v.img || '', qty: 1, main: true });
      this.renderSizes();
      this.syncFooter();
    }
    addItem(v) {
      var line = this.inBundle(v.id);
      if (line) line.qty += 1;
      else this.bundle.push({ id: v.id, c: v.c, s: v.s, price: v.price, pf: v.pf, img: v.img || '', qty: 1, main: false });
      this.renderSizes();
      this.syncFooter();
    }
    setQty(id, delta) {
      var line = this.inBundle(id);
      if (!line) return;
      line.qty += delta;
      if (line.qty <= 0) this.bundle = this.bundle.filter(function (b) { return b.id !== id; });
      if (this.step === 2) this.renderSizes();
      if (this.step === 3) this.renderOverview();
      this.syncFooter();
    }
    syncFooter() {
      var onLast = this.step === this.totalSteps;
      if (this.addBtn && onLast) this.addBtn.disabled = !this.canProceed();
    }

    /* ---------- step 3: overview ---------- */
    renderOverview() {
      if (!this.linesEl) return;
      var self = this;
      if (!this.bundle.length) {
        this.linesEl.innerHTML = '<div class="msw-cart-empty">' +
          (this.mode === 'bundle' ? 'No parts added yet. Go back to add a size.' : 'No size selected yet. Go back to choose one.') +
          '</div>';
        if (this.totalEl) this.totalEl.textContent = this.money(0);
        if (this.addLabelEl) this.addLabelEl.textContent = this.addLabelBase;
        return;
      }
      var total = 0, html = '';
      this.bundle.forEach(function (b) {
        total += b.price * b.qty;
        var sub = esc(b.c) + (b.qty > 1 ? ' · ' + b.qty + ' ×' : '');
        html +=
          '<div class="mlw-line">' +
            '<span class="mlw-line__media">' + (b.img ? '<img loading="lazy" alt="" src="' + escAttr(b.img) + '">' : '') + '</span>' +
            '<span class="mlw-line__info">' +
              '<span class="mlw-line__name">' + esc(b.s) + '</span>' +
              '<span class="mlw-line__sub">' + sub + '</span>' +
              (b.main ? '' : '<button type="button" class="mlw-line__rm" data-rm="' + b.id + '">Remove</button>') +
            '</span>' +
            '<span class="mlw-line__price">' + self.money(b.price * b.qty) + '</span>' +
          '</div>';
      });
      this.linesEl.innerHTML = html;
      this.linesEl.querySelectorAll('[data-rm]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = parseInt(btn.getAttribute('data-rm'), 10);
          var line = self.inBundle(id);
          if (line) self.setQty(id, -line.qty);
        });
      });
      if (this.totalEl) this.totalEl.textContent = this.money(total);
      if (this.addLabelEl) this.addLabelEl.textContent = this.addLabelBase + ' · ' + this.money(total);
    }

    /* ---------- checkout ---------- */
    checkout() {
      var self = this;
      if (!this.bundle.length) return;
      this.clearError();
      this.addBtn.classList.add('is-loading');
      var items = this.bundle.map(function (b) { return { id: b.id, quantity: b.qty }; });
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ items: items })
      })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d && d.description ? d.description : 'Could not add to cart.'); return d; }); })
        .then(function () { window.location.assign(self.afterAdd === 'cart' ? '/cart' : '/checkout'); })
        .catch(function (err) { self.addBtn.classList.remove('is-loading'); self.showError(err && err.message ? err.message : 'Something went wrong. Please try again.'); });
    }

    showError(m) { if (this.errorEl) { this.errorEl.textContent = m; this.errorEl.hidden = false; } }
    clearError() { if (this.errorEl) { this.errorEl.hidden = true; this.errorEl.textContent = ''; } }

    disconnectedCallback() { if (this._onKey) document.removeEventListener('keydown', this._onKey); }
  }

  customElements.define('meave-sofa-wizard', MeaveSofaWizard);
})();
